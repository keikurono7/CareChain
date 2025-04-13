from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
import uvicorn
from typing import Optional
import requests
import json
import uuid
import os
import shutil
from datetime import datetime

# Create FastAPI app
app = FastAPI(title="CareChain API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# MultiChain connection settings
RPC_USER = "multichainrpc"
RPC_PASSWORD = "56fEieK5oGZxdKToXewJeJkju7q9fLXXo2SzqEHfp23u"
RPC_PORT = "4360"
RPC_HOST = "127.0.0.1"
CHAIN_NAME = "Health"
STREAM_NAME = "users"
RPC_URL = f"http://{RPC_USER}:{RPC_PASSWORD}@{RPC_HOST}:{RPC_PORT}"

# Pinata IPFS API settings
PINATA_API_KEY = "c2df8585ba5b6dfa4b73"
PINATA_SECRET_API_KEY = "d26d593e1de3a897f9d76d1ce48cff42974cc28bb5437f16e7fe3cd6d296f90a"
PINATA_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"

# Create a temporary directory for file uploads
TEMP_UPLOAD_DIR = "temp_uploads"
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

# Pydantic models for request validation
class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    age: str
    gender: str
    bloodGroup: str
    medicalIssues: Optional[str] = ""

class UserLogin(BaseModel):
    email: EmailStr
    password: str

def multichain_request(method, params=None):
    """Make a request to the MultiChain API"""
    if params is None:
        params = []
    
    headers = {'content-type': 'application/json'}
    payload = {
        "method": method,
        "params": params,
        "id": 1,
        "chain_name": CHAIN_NAME
    }
    
    try:
        response = requests.post(RPC_URL, json=payload, headers=headers)
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MultiChain error: {str(e)}")

async def upload_to_pinata(file_path, file_name):
    """Upload a file to Pinata IPFS"""
    try:
        # Check if file exists and is readable
        if not os.path.exists(file_path):
            return {
                'success': False,
                'error': f"File not found: {file_path}"
            }
            
        # Verify file size is within limits (10MB)
        file_size = os.path.getsize(file_path)
        if file_size > 10 * 1024 * 1024:  # 10MB
            return {
                'success': False,
                'error': f"File too large: {file_size/1024/1024:.2f}MB (max: 10MB)"
            }
            
        headers = {
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_API_KEY
        }
        
        # Create metadata for the file
        metadata = {
            'name': file_name,
            'keyvalues': {
                'app': 'CareChain',
                'type': 'prescription',
                'timestamp': str(datetime.now())
            }
        }
        
        with open(file_path, 'rb') as file:
            files = {
                'file': (file_name, file),
                'pinataMetadata': (None, json.dumps(metadata))
            }
            
            response = requests.post(
                PINATA_URL, 
                files=files,
                headers=headers
            )
            
            # Check for non-200 responses
            if response.status_code != 200:
                error_message = "IPFS upload failed"
                try:
                    error_data = response.json()
                    if isinstance(error_data, dict) and "error" in error_data:
                        error_message = f"IPFS error: {error_data['error']}"
                except:
                    error_message = f"IPFS error: {response.text[:100]}"
                
                print(f"IPFS upload failed: {response.status_code} - {error_message}")
                return {
                    'success': False,
                    'error': error_message
                }
            
            # Parse JSON response
            try:
                result = response.json()
                print(f"IPFS upload successful: {result}")
                return {
                    'success': True,
                    'ipfsHash': result['IpfsHash'],
                    'pinSize': result['PinSize'],
                    'timestamp': result['Timestamp']
                }
            except json.JSONDecodeError as json_error:
                print(f"Failed to parse IPFS response as JSON: {str(json_error)}")
                return {
                    'success': False,
                    'error': f"Invalid JSON response: {str(json_error)}"
                }
                
    except Exception as e:
        print(f"Exception in IPFS upload: {str(e)}")
        return {
            'success': False,
            'error': f"Exception during IPFS upload: {str(e)}"
        }

@app.post("/api/signup", status_code=201)
async def signup(user: UserSignup):
    """Register a new user and store details in MultiChain"""
    try:
        # Generate unique user ID
        user_id = str(uuid.uuid4())
        
        # Prepare data for blockchain
        # Note: In a production app, password should be hashed and not stored directly on blockchain
        blockchain_data = {
            "userId": user_id,
            "name": user.name,
            "email": user.email,
            "age": user.age,
            "gender": user.gender,
            "bloodGroup": user.bloodGroup,
            "medicalIssues": user.medicalIssues,
            "password": user.password  # In a real app, hash this password
        }
        
        # Convert to hex for MultiChain
        hex_data = json.dumps(blockchain_data).encode('utf-8').hex()
        
        # Create stream item with user email as the key
        result = multichain_request(
            "publish",
            [STREAM_NAME, user.email, hex_data]
        )
        
        if "result" in result:
            return {
                "success": True,
                "message": "User registered successfully",
                "userId": user_id
            }
        else:
            if "error" in result:
                raise HTTPException(status_code=500, detail=result["error"]["message"])
            else:
                raise HTTPException(status_code=500, detail="Unknown error occurred")
                
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/login")
async def login(credentials: UserLogin):
    """Authenticate a user"""
    try:
        # Retrieve user data from MultiChain
        result = multichain_request(
            "liststreamkeyitems",
            [STREAM_NAME, credentials.email]
        )
        
        if "result" in result and result["result"]:
            # Get the latest user data
            latest_data = result["result"][-1]
            
            # Decode data from hex
            user_data_hex = latest_data["data"]
            if user_data_hex:
                user_data = json.loads(bytes.fromhex(user_data_hex).decode('utf-8'))
                
                # In a real app, you would hash the password and compare to stored hash
                if user_data["password"] == credentials.password:
                    return {
                        "success": True,
                        "message": "Login successful",
                        "userId": user_data["userId"],
                        "name": user_data["name"],
                        "email": user_data["email"]
                    }
                else:
                    raise HTTPException(status_code=401, detail="Invalid credentials")
            else:
                raise HTTPException(status_code=401, detail="Invalid user data")
        else:
            raise HTTPException(status_code=404, detail="User not found")
            
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/user/{email}")
async def get_user_profile(email: str):
    """Get user profile data"""
    try:
        # Retrieve user data from MultiChain
        result = multichain_request(
            "liststreamkeyitems",
            [STREAM_NAME, email]
        )
        
        if "result" in result and result["result"]:
            # Get the latest user data
            latest_data = result["result"][-1]
            
            # Decode data from hex
            user_data_hex = latest_data["data"]
            if user_data_hex:
                user_data = json.loads(bytes.fromhex(user_data_hex).decode('utf-8'))
                
                # Remove sensitive information
                if "password" in user_data:
                    del user_data["password"]
                    
                return user_data
            else:
                raise HTTPException(status_code=400, detail="Invalid user data")
        else:
            raise HTTPException(status_code=404, detail="User not found")
            
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/status")
async def check_status():
    """Check if MultiChain is accessible"""
    try:
        result = multichain_request("getinfo")
        if "result" in result:
            return {
                "status": "connected",
                "chain": result["result"]["chainname"]
            }
        else:
            raise HTTPException(
                status_code=500, 
                detail="Could not connect to MultiChain"
            )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/prescriptions")
async def add_prescription(
    email: str = Form(...),
    doctor: str = Form(...),
    hospital: str = Form(...),
    condition: str = Form(...),
    date: str = Form(...),
    prescriptionFile: UploadFile = File(...)
):
    """Add a new prescription with PDF to a user's prescription stream, storing PDF in IPFS"""
    try:
        # Generate a unique ID for this prescription
        prescription_id = f"P{uuid.uuid4().hex[:6].upper()}"
        
        # Check if user exists
        user_exists = multichain_request(
            "liststreamkeyitems",
            [STREAM_NAME, email]
        )
        
        if "result" not in user_exists or not user_exists["result"]:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Save the PDF temporarily
        temp_file_path = f"{TEMP_UPLOAD_DIR}/{prescription_id}.pdf"
        with open(temp_file_path, "wb+") as file_object:
            shutil.copyfileobj(prescriptionFile.file, file_object)
        
        try:
            # Upload the PDF to Pinata IPFS
            print(f"Uploading to IPFS: {temp_file_path}")
            ipfs_result = await upload_to_pinata(temp_file_path, f"prescription_{prescription_id}.pdf")
            
            # Clean up the temporary file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            
            if not ipfs_result['success']:
                raise HTTPException(status_code=500, detail=f"Failed to upload to IPFS: {ipfs_result.get('error', 'Unknown error')}")
        except Exception as ipfs_error:
            # Clean up on error too
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            print(f"IPFS upload error: {str(ipfs_error)}")
            raise HTTPException(status_code=500, detail=f"IPFS upload error: {str(ipfs_error)}")
        
        # Create prescription data with IPFS hash
        prescription_data = {
            "email": email,
            "doctor": doctor,
            "hospital": hospital,
            "condition": condition,
            "date": date,
            "id": prescription_id,
            "ipfsHash": ipfs_result['ipfsHash'],  # Store the IPFS hash
            "ipfsUrl": f"https://gateway.pinata.cloud/ipfs/{ipfs_result['ipfsHash']}"  # URL to access the file
        }
        
        # Convert prescription data to hex for MultiChain
        hex_data = json.dumps(prescription_data).encode('utf-8').hex()
        
        # Create stream name based on email (safely handle different email domains)
        email_parts = email.split('@')
        email_safe = email_parts[0]  # Just use the username part before @
        prescription_stream = f"{email_safe}"
        print(f"Prescription stream: {prescription_stream}")
        
        # Check if stream exists, create if not
        stream_exists = multichain_request(
            "liststreams",
            [prescription_stream]
        )
        
        if "result" not in stream_exists or not any(s["name"] == prescription_stream for s in stream_exists["result"]):
            print(f"Stream {prescription_stream} does not exist, creating it")
            create_result = multichain_request(
                "create",
                ["stream", prescription_stream, True]  # True makes it an open stream
            )
            print(f"Create stream result: {create_result}")
            
            # Wait a moment for stream creation to be confirmed
            import time
            time.sleep(2)
        
        # Subscribe to the stream
        subscribe_result = multichain_request(
            "subscribe",
            [prescription_stream]
        )
        print(f"Subscribe result: {subscribe_result}")
        
        # Publish to the prescription stream
        print(f"Publishing to stream: {prescription_stream}, key: {prescription_id}, data length: {len(hex_data)}")
        result = multichain_request(
            "publish",
            [prescription_stream, prescription_id, hex_data]
        )
        print(f"Publish result: {result}")
        
        if result is None:
            raise HTTPException(status_code=500, detail="Failed to publish to stream - null response")
            
        if "result" in result:
            return {
                "success": True,
                "message": "Prescription added successfully",
                "prescriptionId": prescription_id,
                "ipfsHash": ipfs_result['ipfsHash'],
                "ipfsUrl": f"https://gateway.pinata.cloud/ipfs/{ipfs_result['ipfsHash']}"
            }
        else:
            error_msg = "Unknown error"
            if "error" in result and isinstance(result["error"], dict) and "message" in result["error"]:
                error_msg = result["error"]["message"]
            print(f"Error publishing: {error_msg}")
            raise HTTPException(status_code=500, detail=f"Publishing error: {error_msg}")
            
    except Exception as e:
        print(f"Overall exception: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/prescriptions/{email}")
async def get_prescriptions(email: str):
    """Get all prescriptions for a user, including IPFS links"""
    try:
        # Check if user exists
        user_exists = multichain_request(
            "liststreamkeyitems",
            [STREAM_NAME, email]
        )
        
        if "result" not in user_exists or not user_exists["result"]:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create stream name based on email
        email_parts = email.split('@')
        email_safe = email_parts[0]  # Just use the username part before @
        prescription_stream = f"{email_safe}"
        
        print(f"Loading prescriptions from stream: {prescription_stream}")
        
        # Check if stream exists
        stream_exists = multichain_request(
            "liststreams",
            [prescription_stream]
        )
        
        print(f"Stream exists response: {stream_exists}")
        
        if "result" not in stream_exists or not stream_exists["result"]:
            print(f"Stream {prescription_stream} not found, returning empty array")
            # Stream doesn't exist, return empty array
            return {"prescriptions": []}
            
        # Check if we need to subscribe to the stream first
        for stream in stream_exists["result"]:
            if stream["name"] == prescription_stream:
                if not stream.get("subscribed", False):
                    print(f"Stream {prescription_stream} exists but not subscribed, subscribing now")
                    subscribe_result = multichain_request(
                        "subscribe",
                        [prescription_stream]
                    )
                    print(f"Subscribe result: {subscribe_result}")
                break
        
        # Get all items from the prescription stream
        items = multichain_request(
            "liststreamitems",
            [prescription_stream]
        )
        
        print(f"Stream items response: {items}")
        
        if "result" not in items:
            print("No 'result' in items response, returning empty array")
            return {"prescriptions": []}
        
        # Parse prescription data from hex
        prescriptions = []
        for item in items["result"]:
            if "data" in item and item["data"]:
                try:
                    prescription = json.loads(bytes.fromhex(item["data"]).decode('utf-8'))
                    
                    # Ensure IPFS URL is present
                    if "ipfsHash" in prescription and not "ipfsUrl" in prescription:
                        prescription["ipfsUrl"] = f"https://gateway.pinata.cloud/ipfs/{prescription['ipfsHash']}"
                        
                    prescriptions.append(prescription)
                    print(f"Loaded prescription: {prescription['id']}")
                except Exception as e:
                    print(f"Error decoding prescription data: {str(e)}")
                    # Skip invalid data
                    continue
        
        # Sort prescriptions by date (newest first)
        prescriptions.sort(key=lambda x: x.get("date", ""), reverse=True)
        
        print(f"Returning {len(prescriptions)} prescriptions")
        
        return {"prescriptions": prescriptions}
            
    except Exception as e:
        print(f"Error in get_prescriptions: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

# Add a direct endpoint to download/view a prescription PDF by IPFS hash
@app.get("/api/prescription-pdf/{ipfs_hash}")
async def get_prescription_pdf(ipfs_hash: str):
    """Get a prescription PDF URL by IPFS hash"""
    try:
        ipfs_url = f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"
        return {"success": True, "ipfsUrl": ipfs_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving IPFS URL: {str(e)}")

if __name__ == "__main__":
    # Run the API with uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)