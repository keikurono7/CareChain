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
    
# Import the required libraries for Gemini 1.5 Pro
import google.generativeai as genai
import os
from datetime import datetime

# Set up Gemini API (replace with your actual API key)
GEMINI_API_KEY = ""
genai.configure(api_key=GEMINI_API_KEY)

# Configure the Gemini model
gemini_model = genai.GenerativeModel('gemini-1.5-pro')

# Define the medical report structure
class MedicalReport(BaseModel):
    email: str
    summary: str
    insights: list
    recommendations: list
    medications: Optional[list] = None
    generatedAt: str

# Database for storing generated reports
medical_reports = {}

@app.post("/api/generate-report")
async def generate_report(request_data: dict):
    """Generate a medical report using Gemini 1.5 Pro based on user's health data"""
    try:
        email = request_data.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        # Fetch user profile data
        user_data = await get_user_profile_data(email)
        if not user_data:
            raise HTTPException(status_code=404, detail="User data not found")
        
        # Fetch user prescriptions
        prescriptions_data = await get_user_prescriptions(email)
        
        # Build the prompt for Gemini
        prompt = build_medical_report_prompt(user_data, prescriptions_data)
        
        print(f"Sending prompt to Gemini: {prompt[:100]}...")
        
        # Generate the report with Gemini 1.5 Pro
        response = gemini_model.generate_content(prompt)
        
        # Process the response
        report_data = process_gemini_response(response.text)
        
        # Store the report
        report = MedicalReport(
            email=email,
            summary=report_data["summary"],
            insights=report_data["insights"],
            recommendations=report_data["recommendations"],
            medications=report_data.get("medications", []),
            generatedAt=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        
        # Store in our simple DB (in a production app, this would go to a real database)
        medical_reports[email] = report.dict()
        
        # You might also want to store this in the blockchain for permanent record
        # (code for blockchain storage would go here)
        
        return {
            "success": True,
            "report": report.dict()
        }
        
    except Exception as e:
        print(f"Error generating medical report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

@app.get("/api/medical-report/{email}")
async def get_medical_report(email: str):
    """Get the most recent medical report for a user"""
    try:
        if email in medical_reports:
            return {
                "success": True,
                "report": medical_reports[email]
            }
        return {
            "success": False,
            "message": "No report found"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_user_profile_data(email: str):
    """Get user profile data from multichain"""
    result = multichain_request(
        "liststreamkeyitems", 
        [STREAM_NAME, email]
    )
    
    if "result" not in result or not result["result"]:
        return None
        
    try:
        for item in result["result"]:
            if "data" in item and item["data"]:
                user_data = json.loads(bytes.fromhex(item["data"]).decode('utf-8'))
                return user_data
    except Exception as e:
        print(f"Error parsing user data: {str(e)}")
        
    return None

async def get_user_prescriptions(email: str):
    """Get user prescriptions from multichain"""
    email_parts = email.split('@')
    email_safe = email_parts[0]
    prescription_stream = f"{email_safe}"
    
    # Check if stream exists
    stream_exists = multichain_request(
        "liststreams",
        [prescription_stream]
    )
    
    if "result" not in stream_exists or not stream_exists["result"]:
        return []
        
    # Get all items from the prescription stream
    items = multichain_request(
        "liststreamitems",
        [prescription_stream]
    )
    
    if "result" not in items:
        return []
    
    prescriptions = []
    for item in items["result"]:
        if "data" in item and item["data"]:
            try:
                prescription = json.loads(bytes.fromhex(item["data"]).decode('utf-8'))
                prescriptions.append(prescription)
            except Exception as e:
                print(f"Error decoding prescription data: {str(e)}")
                continue
    
    return prescriptions

def build_medical_report_prompt(user_data, prescriptions):
    """Build a prompt for Gemini to generate a medical report"""
    name = user_data.get("name", "Patient")
    age = user_data.get("age", "Unknown")
    gender = user_data.get("gender", "Unknown")
    blood_group = user_data.get("bloodGroup", "Unknown")
    medical_issues = user_data.get("medicalIssues", "None reported")
    
    # Format prescription data
    prescription_text = ""
    if prescriptions:
        for i, p in enumerate(prescriptions):
            prescription_text += f"\nPrescription {i+1}:\n"
            prescription_text += f"- Date: {p.get('date', 'Unknown')}\n"
            prescription_text += f"- Doctor: {p.get('doctor', 'Unknown')}\n"
            prescription_text += f"- Hospital: {p.get('hospital', 'Unknown')}\n"
            prescription_text += f"- Condition: {p.get('condition', 'Unknown')}\n"
    else:
        prescription_text = "No prescription records available."
    
    # Build the prompt
    prompt = f"""
    As a medical AI assistant, generate a comprehensive health report for the following patient:
    
    Patient Information:
    - Name: {name}
    - Age: {age}
    - Gender: {gender}
    - Blood Group: {blood_group}
    - Medical Issues: {medical_issues}
    
    Prescription History:
    {prescription_text}
    
    Based on the above information, generate a medical report with the following sections:
    1. Summary: A brief overview of the patient's health status (100-150 words)
    2. Health Insights: 3-5 key observations about the patient's health
    3. Recommendations: 3-5 recommendations for improving or maintaining the patient's health
    4. Medications (if applicable): List any medications mentioned in prescriptions
    
    Format your response as a structured JSON with the following keys:
    {{
        "summary": "comprehensive summary text",
        "insights": ["insight 1", "insight 2", "insight 3"],
        "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
        "medications": ["medication 1", "medication 2"]
    }}
    
    The medications field is optional and should only be included if medications are mentioned.
    
    Keep your response focused on the medical data provided. Do not make up additional conditions or diagnoses.
    Include a disclaimer that this is AI-generated information and not a substitute for professional medical advice.
    """
    
    return prompt

def process_gemini_response(response_text):
    """Process the response from Gemini into a structured report format"""
    try:
        # Try to extract JSON from the response
        import re
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            json_str = json_match.group(0)
            return json.loads(json_str)
        
        # If JSON extraction fails, create a structured report manually
        summary = "Based on the available medical information, a comprehensive health report could not be generated automatically. Please consult with your healthcare provider for an accurate assessment."
        
        return {
            "summary": summary,
            "insights": [
                "The system was unable to generate specific insights based on the provided data.",
                "Medical data may be incomplete or require professional interpretation."
            ],
            "recommendations": [
                "Schedule a consultation with your healthcare provider for a thorough evaluation.",
                "Maintain regular healthcare check-ups and follow your doctor's advice.",
                "Keep your medical records up to date for better health management."
            ]
        }
    except Exception as e:
        print(f"Error processing Gemini response: {str(e)}")
        # Return fallback report
        return {
            "summary": "An error occurred while generating your medical report. Please try again later or consult with your healthcare provider.",
            "insights": ["Report generation encountered an error.", "Your health information requires professional medical review."],
            "recommendations": ["Consult with your healthcare provider for accurate medical advice."]
        }

# Define the diet plan structure
class DietPlan(BaseModel):
    email: str
    overview: str
    mealPlan: list
    recommendations: list
    notes: str
    generatedAt: str

# Database for storing generated diet plans
diet_plans = {}

@app.post("/api/generate-diet-plan")
async def generate_diet_plan(request_data: dict):
    """Generate a personalized diet plan using Gemini 1.5 Pro based on user's health data"""
    try:
        email = request_data.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        # Fetch user profile data
        user_data = await get_user_profile_data(email)
        if not user_data:
            raise HTTPException(status_code=404, detail="User data not found")
        
        # Fetch user prescriptions for medical context
        prescriptions_data = await get_user_prescriptions(email)
        
        # Check if there's an existing medical report to incorporate
        medical_report = None
        if email in medical_reports:
            medical_report = medical_reports[email]
        
        # Build the prompt for Gemini
        prompt = build_diet_plan_prompt(user_data, prescriptions_data, medical_report)
        
        print(f"Sending diet plan prompt to Gemini: {prompt[:100]}...")
        
        # Generate the diet plan with Gemini 1.5 Pro
        response = gemini_model.generate_content(prompt)
        
        # Process the response
        plan_data = process_gemini_diet_response(response.text)
        
        # Store the diet plan
        plan = DietPlan(
            email=email,
            overview=plan_data["overview"],
            mealPlan=plan_data["mealPlan"],
            recommendations=plan_data["recommendations"],
            notes=plan_data["notes"],
            generatedAt=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
        
        # Store in our simple DB (in a production app, this would go to a real database)
        diet_plans[email] = plan.dict()
        
        # You might also want to store this in the blockchain for permanent record
        # (code for blockchain storage would go here)
        
        return {
            "success": True,
            "plan": plan.dict()
        }
        
    except Exception as e:
        print(f"Error generating diet plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating diet plan: {str(e)}")

@app.get("/api/diet-plan/{email}")
async def get_diet_plan(email: str):
    """Get the most recent diet plan for a user"""
    try:
        if email in diet_plans:
            return {
                "success": True,
                "plan": diet_plans[email]
            }
        return {
            "success": False,
            "message": "No diet plan found"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def build_diet_plan_prompt(user_data, prescriptions, medical_report=None):
    """Build a prompt for Gemini to generate a personalized diet plan"""
    name = user_data.get("name", "Patient")
    age = user_data.get("age", "Unknown")
    gender = user_data.get("gender", "Unknown")
    blood_group = user_data.get("bloodGroup", "Unknown")
    medical_issues = user_data.get("medicalIssues", "None reported")
    height = user_data.get("height", "Unknown")
    weight = user_data.get("weight", "Unknown")
    
    # Format prescription data for context
    prescription_text = ""
    if prescriptions:
        for i, p in enumerate(prescriptions[:3]):  # Limit to 3 most recent prescriptions
            prescription_text += f"\nCondition: {p.get('condition', 'Unknown')}\n"
    else:
        prescription_text = "No prescription records available."
    
    # Add medical report data if available
    report_text = ""
    if medical_report:
        report_text = f"""
        Medical Report Summary: {medical_report.get('summary', 'Not available')}
        
        Key Insights:
        {' '.join(['- ' + insight for insight in medical_report.get('insights', [])])}
        """
    
    # Build the prompt
    prompt = f"""
    As a nutrition specialist AI assistant, generate a personalized diet plan for the following patient:
    
    Patient Information:
    - Name: {name}
    - Age: {age}
    - Gender: {gender}
    - Blood Group: {blood_group}
    - Height: {height}
    - Weight: {weight}
    - Medical Issues: {medical_issues}
    
    Medical Context:
    {prescription_text}
    
    {report_text}
    
    Based on the above information, create a personalized diet plan with the following sections:
    1. Overview: A brief explanation of the diet approach and goals for this patient (100-150 words)
    2. Daily Meal Plan: Suggested meal structure with examples
    3. Dietary Recommendations: 5-7 specific recommendations based on the patient's health data
    4. Notes: Additional guidance or precautions
    
    Format your response as a structured JSON with the following keys:
    {{
        "overview": "text explaining the approach and goals",
        "mealPlan": [
            {{
                "meal": "Breakfast",
                "description": "brief description of what breakfast should include",
                "suggestions": ["food item 1", "food item 2", "food item 3"]
            }},
            {{
                "meal": "Lunch",
                "description": "brief description of what lunch should include",
                "suggestions": ["food item 1", "food item 2", "food item 3"]
            }},
            ... and so on for all meals
        ],
        "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3", "recommendation 4", "recommendation 5"],
        "notes": "additional guidance or precautions"
    }}
    
    Keep your response focused on the patient data provided. Consider any medical conditions when proposing dietary suggestions.
    Include a disclaimer that this is AI-generated information and not a substitute for professional dietary advice.
    """
    
    return prompt

def process_gemini_diet_response(response_text):
    """Process the diet plan response from Gemini into a structured format"""
    try:
        # Extract the JSON part of the response
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}') + 1
        
        if start_idx >= 0 and end_idx > start_idx:
            json_str = response_text[start_idx:end_idx]
            plan_data = json.loads(json_str)
            return plan_data
        else:
            # If no valid JSON found, create a structured error response
            return {
                "overview": "Unable to generate a proper diet plan. Please try again later.",
                "mealPlan": [
                    {
                        "meal": "Error",
                        "description": "Diet plan generation failed",
                        "suggestions": ["Please try again"]
                    }
                ],
                "recommendations": ["Please regenerate the diet plan"],
                "notes": "There was an error processing the AI response."
            }
    except json.JSONDecodeError as e:
        print(f"Error decoding diet plan JSON response: {str(e)}")
        print(f"Raw response: {response_text}")
        # Return a structured error response
        return {
            "overview": "Error processing the diet plan data.",
            "mealPlan": [
                {
                    "meal": "Error",
                    "description": "Diet plan generation failed due to JSON parsing error",
                    "suggestions": ["Please try again"]
                }
            ],
            "recommendations": ["Please regenerate the diet plan"],
            "notes": "There was an error processing the AI response."
        }

if __name__ == "__main__":
    # Run the API with uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
