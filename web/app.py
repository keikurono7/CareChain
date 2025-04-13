from fastapi import FastAPI, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
import uvicorn
from typing import Optional, List, Dict, Any
import requests
import json
import uuid
import pandas as pd
from pathlib import Path
import re
import numpy as np
from collections import defaultdict
import os
from typing import List, Dict, Tuple

# Create FastAPI app
app = FastAPI(title="CareChain API")

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173", 
    "http://127.0.0.1:5173",
    "https://busy-onions-see.loca.lt",
    # Add any other origins your frontend might use
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Use specific origins instead of "*"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MultiChain connection settings
RPC_USER = "multichainrpc"
RPC_PASSWORD = "DJwS8MKqFZTTe3nbdU3Co8fQxE6MhhTEqi2di3RYDcUx"
RPC_PORT = "4360"
RPC_HOST = "127.0.0.1"
CHAIN_NAME = "Health"
STREAM_NAME = "users"
DOCTOR_STREAM = "doctors"
RPC_URL = f"http://{RPC_USER}:{RPC_PASSWORD}@{RPC_HOST}:{RPC_PORT}"

# Add these global variables after your existing ones
DRUG_INTERACTIONS_FILE = "public/drug_interactions.csv"
interaction_df = None 
drug_lookup = None

# Initialize the drug interaction database
@app.on_event("startup")
async def initialize_drug_data():
    global interaction_df, drug_lookup
    
    try:
        # Load the drug interactions dataset
        if os.path.exists(DRUG_INTERACTIONS_FILE):
            interaction_df = pd.read_csv(DRUG_INTERACTIONS_FILE)
            print(f"Loaded {len(interaction_df)} drug interactions")
            
            # Create a lookup dictionary for faster searches
            drug_lookup = defaultdict(list)
            for _, row in interaction_df.iterrows():
                drug1 = row['Drug 1'].lower()
                drug2 = row['Drug 2'].lower()
                drug_lookup[drug1].append((drug2, row['Interaction Description']))
                drug_lookup[drug2].append((drug1, row['Interaction Description']))
            
            print(f"Drug lookup table created with {len(drug_lookup)} entries")
        else:
            print(f"Warning: Drug interactions file not found at {DRUG_INTERACTIONS_FILE}")
            # Create a minimal mock dataset for testing
            interaction_df = pd.DataFrame({
                'Drug 1': ['Metformin', 'Aspirin', 'Warfarin'],
                'Drug 2': ['Lisinopril', 'Warfarin', 'Digoxin'],
                'Interaction Description': [
                    'Minimal risk of interaction. Monitor blood pressure.',
                    'Increased risk of bleeding when used together.',
                    'May increase risk of bleeding and alter Digoxin levels.'
                ]
            })
            
            # Create a lookup dictionary for the mock data
            drug_lookup = defaultdict(list)
            for _, row in interaction_df.iterrows():
                drug1 = row['Drug 1'].lower()
                drug2 = row['Drug 2'].lower()
                drug_lookup[drug1].append((drug2, row['Interaction Description']))
                drug_lookup[drug2].append((drug1, row['Interaction Description']))
    except Exception as e:
        print(f"Error initializing drug interaction database: {e}")
        interaction_df = None
        drug_lookup = None

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

class DoctorSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    specialization: str
    licenseNumber: str
    hospital: str
    phone: str
    experience: Optional[str] = ""

class DoctorLogin(BaseModel):
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

@app.post("/api/doctor/signup", status_code=201)
async def doctor_signup(doctor: DoctorSignup):
    """Register a new doctor and store details in MultiChain"""
    try:
        # Generate unique doctor ID
        doctor_id = str(uuid.uuid4())
        
        # Ensure the doctors stream exists
        create_stream_result = multichain_request(
            "create", 
            ["stream", DOCTOR_STREAM, True]
        )
        print(f"Stream creation: {create_stream_result}")
        
        # Check if a doctor with this email already exists
        check_result = multichain_request(
            "liststreamkeyitems",
            [DOCTOR_STREAM, doctor.email]
        )
        
        if "result" in check_result and check_result["result"]:
            raise HTTPException(status_code=400, detail="A doctor with this email already exists")
        
        # Prepare data for blockchain
        blockchain_data = {
            "doctorId": doctor_id,
            "name": doctor.name,
            "email": doctor.email,
            "specialization": doctor.specialization,
            "licenseNumber": doctor.licenseNumber,
            "hospital": doctor.hospital,
            "phone": doctor.phone,
            "experience": doctor.experience,
            "password": doctor.password,  # In a real app, hash this password
            "role": "doctor"
        }
        
        # Convert to hex for MultiChain
        hex_data = json.dumps(blockchain_data).encode('utf-8').hex()
        
        # Create stream item with doctor email as the key
        result = multichain_request(
            "publish",
            [DOCTOR_STREAM, doctor.email, hex_data]
        )
        
        if "result" in result:
            # Subscribe to the doctors stream
            subscribe_result = multichain_request(
                "subscribe",
                [DOCTOR_STREAM]
            )
            
            return {
                "success": True,
                "message": "Doctor registered successfully",
                "doctorId": doctor_id
            }
        else:
            if "error" in result:
                raise HTTPException(status_code=500, detail=result["error"]["message"])
            else:
                raise HTTPException(status_code=500, detail="Unknown error occurred")
                
    except Exception as e:
        print(f"Doctor signup error: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/doctor/login")
async def doctor_login(credentials: DoctorLogin):
    """Authenticate a doctor using blockchain credentials"""
    try:
        # Retrieve doctor data from MultiChain
        result = multichain_request(
            "liststreamkeyitems",
            [DOCTOR_STREAM, credentials.email]  # Use DOCTOR_STREAM constant
        )
        
        if "result" in result and result["result"]:
            # Get the latest doctor data
            latest_data = result["result"][-1]
            
            # Decode data from hex
            doctor_data_hex = latest_data["data"]
            if doctor_data_hex:
                doctor_data = json.loads(bytes.fromhex(doctor_data_hex).decode('utf-8'))
                
                # In a real app, you would hash the password and compare to stored hash
                if doctor_data["password"] == credentials.password:
                    return {
                        "success": True,
                        "message": "Login successful",
                        "doctorId": doctor_data["doctorId"],
                        "name": doctor_data["name"],
                        "email": doctor_data["email"],
                        "specialization": doctor_data["specialization"],
                        "hospital": doctor_data["hospital"],
                        "role": "doctor"
                    }
                else:
                    raise HTTPException(status_code=401, detail="Invalid credentials")
            else:
                raise HTTPException(status_code=401, detail="Invalid doctor data")
        else:
            raise HTTPException(status_code=404, detail="Doctor not found")
            
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

@app.get("/api/doctor/{email}")
async def get_doctor_profile(email: str):
    """Get doctor profile data from blockchain"""
    try:
        # Retrieve doctor data from MultiChain
        result = multichain_request(
            "liststreamkeyitems",
            [DOCTOR_STREAM, email]
        )
        
        if "result" in result and result["result"]:
            # Get the latest doctor data
            latest_data = result["result"][-1]
            
            # Decode data from hex
            doctor_data_hex = latest_data["data"]
            if doctor_data_hex:
                doctor_data = json.loads(bytes.fromhex(doctor_data_hex).decode('utf-8'))
                
                # Remove sensitive information
                if "password" in doctor_data:
                    del doctor_data["password"]
                    
                return doctor_data
            else:
                raise HTTPException(status_code=400, detail="Invalid doctor data")
        else:
            raise HTTPException(status_code=404, detail="Doctor not found")
            
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/doctors")
async def get_all_doctors():
    """Get a list of all doctors"""
    try:
        # Retrieve all items from the doctors stream
        result = multichain_request(
            "liststreamitems",
            [DOCTOR_STREAM]
        )
        
        if "result" in result and result["result"]:
            doctors = []
            for item in result["result"]:
                if "data" in item and item["data"]:
                    doctor_data = json.loads(bytes.fromhex(item["data"]).decode('utf-8'))
                    
                    # Remove sensitive information
                    if "password" in doctor_data:
                        del doctor_data["password"]
                        
                    doctors.append(doctor_data)
            
            return {"doctors": doctors}
        else:
            return {"doctors": []}
            
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/patients")
async def get_all_patients():
    """Get a list of all patients from the blockchain with prescription data"""
    try:
        # Retrieve all items from the users stream
        result = multichain_request(
            "liststreamitems",
            [STREAM_NAME]
        )
        
        if "result" in result and result["result"]:
            # Parse each patient and extract prescription data
            for patient in result["result"]:
                if "data" in patient:
                    try:
                        # Convert hex to utf-8 and parse as JSON
                        patient_data = json.loads(bytes.fromhex(patient["data"]).decode('utf-8'))
                        
                        # Check if prescription data exists as a string and parse it
                        if "prescription" in patient_data and isinstance(patient_data["prescription"], str):
                            try:
                                # Try to parse prescription string as JSON
                                patient_data["prescription"] = json.loads(patient_data["prescription"])
                            except json.JSONDecodeError:
                                # If not valid JSON, keep as string but mark it
                                patient_data["prescription"] = {
                                    "raw": patient_data["prescription"],
                                    "is_structured": False
                                }
                        
                        # Replace the hex data with the parsed JSON data
                        # This keeps the original data but makes it easier to work with on the client
                        patient["parsed_data"] = patient_data
                        
                    except Exception as e:
                        # If there's an error parsing, just continue
                        print(f"Error parsing patient data: {e}")
                        continue
            
            return result["result"]
        else:
            return []
            
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

@app.get("/api/debug")
async def debug_endpoint():
    """Test endpoint to verify API is working"""
    return {
        "status": "ok",
        "message": "API is working properly",
        "timestamp": str(uuid.uuid4())
    }

def generate_complementary_strand(dna_strand):
    """Generate the complementary DNA strand"""
    complement_dict = {'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C'}
    complementary_strand = ''
    
    for base in dna_strand:
        complementary_strand += complement_dict.get(base, base)
    
    return complementary_strand[::-1]

def check_huntingtin_sequence(sequence):
    """Check for Huntington's Disease genetic markers"""
    cleaned_sequence = sequence.upper().replace(" ", "")
    cag_counts = [len(match.group(0)) // 3 for match in re.finditer(r'(CAG)+', cleaned_sequence)]
    c_count = max(cag_counts, default=0)
    return 1 if c_count > 35 else 0

def check_sickle_cell_sequence(genetic_sequence):
    """Check for Sickle Cell Anemia genetic markers"""
    start_index = genetic_sequence.find("ATG")
    if start_index != -1:
        target_position = start_index + 14
        if len(genetic_sequence) > target_position:
            return 1 if genetic_sequence[target_position] == 'T' else 0
    return 0

def check_dmd_sequence(sequence):
    """Check for Muscular Dystrophy genetic markers"""
    cleaned_sequence = sequence.upper().replace(" ", "")
    for i in range(0, len(cleaned_sequence), 3):
        codon = cleaned_sequence[i:i+3]
        if codon in ["TGA", "TAG", "TAA"]:
            return 1
    return 0 if "---" not in cleaned_sequence else 1

def generate_punnett_square(parent1, parent2):
    """Generate Punnett square for genetic inheritance"""
    punnett_square = []
    for gene1 in parent1:
        for gene2 in parent2:
            punnett_square.append(gene1 + gene2)
    return punnett_square

class GeneticAnalysisRequest(BaseModel):
    disease: str
    father_sequence: str
    mother_sequence: str
    paternal_grandfather_sequence: str
    paternal_grandmother_sequence: str
    maternal_grandfather_sequence: str
    maternal_grandmother_sequence: str

@app.post("/api/analyze")
async def analyze_genetics(request_data: GeneticAnalysisRequest):
    """Analyze genetic sequences for disease markers"""
    try:
        print("\n=== Starting Genetic Analysis ===")
        data = request_data.dict()
        print(f"Received data for analysis: {data['disease']}")
        
        # Generate complementary strands
        print("\nGenerating complementary strands...")
        sequences = {}
        for key in [
            'father_sequence', 
            'mother_sequence', 
            'paternal_grandfather_sequence', 
            'paternal_grandmother_sequence', 
            'maternal_grandfather_sequence', 
            'maternal_grandmother_sequence'
        ]:
            sequence = data[key]
            complement = generate_complementary_strand(sequence)
            sequences[key] = sequence
            sequences[f"{key}_complement"] = complement
            print(f"Generated complement for {key}: {complement[:10]}...")

        # Process based on disease type
        disease = data['disease']
        print(f"\nProcessing disease type: {disease}")
        if disease == "Huntington's Disease":
            check_function = check_huntingtin_sequence
            print("Using Huntington's Disease check function")
        elif disease == "Sickle Cell Anemia":
            check_function = check_sickle_cell_sequence
            print("Using Sickle Cell Anemia check function")
        elif disease == "Muscular Dystrophy":
            check_function = check_dmd_sequence
            print("Using Muscular Dystrophy check function")
        else:
            print(f"ERROR: Invalid disease type - {disease}")
            raise HTTPException(status_code=400, detail='Invalid disease type')

        # Generate results
        print("\nAnalyzing sequences...")
        results = []
        for key, sequence in sequences.items():
            result = str(check_function(sequence))
            results.append(result)
            print(f"Analysis result for {key}: {result}")
        results = ''.join(results)
        print(f"Combined results string: {results}")

        # Generate Punnett squares
        print("\nGenerating Punnett squares...")
        father_genotype = results[:2]
        mother_genotype = results[2:4]
        paternal_grandfather_genotype = results[4:6]
        paternal_grandmother_genotype = results[6:8]
        maternal_grandfather_genotype = results[8:10]
        maternal_grandmother_genotype = results[10:]

        print(f"Father genotype: {father_genotype}")
        print(f"Mother genotype: {mother_genotype}")
        print(f"Paternal grandparents genotypes: {paternal_grandfather_genotype}, {paternal_grandmother_genotype}")
        print(f"Maternal grandparents genotypes: {maternal_grandfather_genotype}, {maternal_grandmother_genotype}")

        punnett_squares = {
            'father_mother': generate_punnett_square(father_genotype, mother_genotype),
            'paternal_grandparents': generate_punnett_square(paternal_grandfather_genotype, paternal_grandmother_genotype),
            'maternal_grandparents': generate_punnett_square(maternal_grandfather_genotype, maternal_grandmother_genotype)
        }
        print("Punnett squares generated successfully")

        # Store results in CSV
        print("\nStoring results in CSV...")
        df = pd.DataFrame({
            "Disease": [disease],
            **{k: [v] for k, v in sequences.items()},
            "Results": [results]
        })

        csv_file_path = "genetic_data.csv"
        if Path(csv_file_path).is_file():
            print("Appending to existing CSV file")
            existing_df = pd.read_csv(csv_file_path)
            df = pd.concat([existing_df, df], ignore_index=True)
        df.to_csv(csv_file_path, index=False)
        print("Data saved successfully")

        print("\n=== Analysis Complete ===")
        return {
            'disease': disease,
            'sequences': sequences,
            'results': results,
            'punnett_squares': punnett_squares
        }

    except Exception as e:
        print(f"\nERROR: An exception occurred - {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/prescriptions/{email}")
async def get_prescriptions(email: str):
    """Get all prescriptions for a user, including IPFS links and drug interactions"""
    try:
        # Extract just the username part (before the @)
        if '@' in email:
            email_safe = email.split('@')[0]  # Get username part before @
        else:
            email_safe = email  # Already just the username
            
        print(f"Searching for prescriptions for username: {email_safe}")
        
        # Use username directly as the prescription stream name
        prescription_stream = f"{email_safe}"
        
        print(f"Loading prescriptions from stream: {prescription_stream}")
        
        # Check if stream exists
        stream_exists = multichain_request(
            "liststreams",
            [prescription_stream]
        )
        
        if "result" not in stream_exists or not stream_exists["result"]:
            print(f"Stream {prescription_stream} not found, returning empty array")
            # Stream doesn't exist, return empty array
            return {"prescriptions": [], "interactions": []}
            
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
        
        if "result" not in items:
            print("No 'result' in items response, returning empty array")
            return {"prescriptions": [], "interactions": []}
        
        # Parse prescription data from hex
        prescriptions = []
        medications = set()  # Track all medications for interaction checking
        
        for item in items["result"]:
            if "data" in item and item["data"]:
                try:
                    prescription = json.loads(bytes.fromhex(item["data"]).decode('utf-8'))
                    
                    # Ensure IPFS URL is present
                    if "ipfsHash" in prescription and not "ipfsUrl" in prescription:
                        prescription["ipfsUrl"] = f"https://gateway.pinata.cloud/ipfs/{prescription['ipfsHash']}"
                    
                    # Track medications for drug interaction checking
                    if "medication" in prescription:
                        medications.add(prescription["medication"])
                    
                    # If there's prescription text, extract medications from it
                    if "prescriptionText" in prescription:
                        extracted_meds = extract_medications_from_text(prescription["prescriptionText"])
                        for med in extracted_meds:
                            medications.add(med)
                        
                    prescriptions.append(prescription)
                    print(f"Loaded prescription: {prescription.get('id', 'unknown')}")
                except Exception as e:
                    print(f"Error decoding prescription data: {str(e)}")
                    # Skip invalid data
                    continue
        
        # Sort prescriptions by date (newest first)
        prescriptions.sort(key=lambda x: x.get("date", ""), reverse=True)
        
        # Check for interactions between all medications
        interactions = find_drug_interactions(list(medications))
        
        print(f"Returning {len(prescriptions)} prescriptions with {len(interactions)} interactions")
        
        return {
            "prescriptions": prescriptions,
            "interactions": interactions,
            "medications": list(medications)
        }
            
    except Exception as e:
        print(f"Error in get_prescriptions: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/prescription-pdf/{ipfs_hash}")
async def get_prescription_pdf(ipfs_hash: str):
    """Get a prescription PDF URL by IPFS hash"""
    try:
        ipfs_url = f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}"
        return {"success": True, "ipfsUrl": ipfs_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving IPFS URL: {str(e)}")

def extract_medications_from_text(text: str) -> List[str]:
    """Extract medication names from text using rule-based patterns"""
    # Common medicine name patterns
    medicine_patterns = [
        r'(?:Tab|Tablet|Cap|Capsule|Inj|Injection|Syp|Syrup|Sol|Solution)\s+([A-Za-z0-9\-]+)',
        r'([A-Za-z0-9\-]+)\s+(?:\d+\.?\d*)\s*(?:mg|mcg|g|ml)',
        r'([A-Za-z0-9\-]+)\s+(?:once|twice|three times|daily|bd|tid|qid)',
    ]
    
    medicines = set()
    for pattern in medicine_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            medicine = match.group(1).strip().title()
            if len(medicine) > 2:  # Avoid very short matches
                medicines.add(medicine)
    
    # Check the text for known drugs in our database
    if drug_lookup:
        for drug_name in drug_lookup.keys():
            # Check for the drug name as a whole word
            if re.search(r'\b' + re.escape(drug_name) + r'\b', text, re.IGNORECASE):
                medicines.add(drug_name.title())
    
    return list(medicines)

def find_drug_interactions(medications: List[str]) -> List[Dict]:
    """Find interactions between the provided medications using the database"""
    if not drug_lookup or not medications:
        return []
    
    interactions = []
    
    # Convert all medication names to lowercase for comparison
    meds_lower = [med.lower() for med in medications]
    
    # Check each pair of medications for interactions
    for i, drug1 in enumerate(meds_lower):
        for drug2 in meds_lower[i+1:]:
            # Skip if the same drug
            if drug1 == drug2:
                continue
                
            # Check if there's an interaction in either direction
            found_interaction = False
            
            # Check if drug1 has interactions with drug2
            for interaction_drug, description in drug_lookup.get(drug1, []):
                if interaction_drug.lower() == drug2.lower():
                    # Determine severity based on description text
                    severity = "Low"
                    if "high" in description.lower() or "severe" in description.lower():
                        severity = "High"
                    elif "moderate" in description.lower() or "significant" in description.lower():
                        severity = "Medium"
                    
                    # Extract recommendation if available
                    recommendation = ""
                    if "." in description:
                        parts = description.split(".", 1)
                        if len(parts) > 1:
                            recommendation = parts[1].strip()
                    
                    interactions.append({
                        "drugs": [drug1.title(), drug2.title()],
                        "severity": severity,
                        "description": description,
                        "recommendation": recommendation
                    })
                    found_interaction = True
                    break
            
            # If no interaction was found in the first direction, search in reverse
            if not found_interaction:
                for interaction_drug, description in drug_lookup.get(drug2, []):
                    if interaction_drug.lower() == drug1.lower():
                        # Determine severity based on description text
                        severity = "Low"
                        if "high" in description.lower() or "severe" in description.lower():
                            severity = "High"
                        elif "moderate" in description.lower() or "significant" in description.lower():
                            severity = "Medium"
                        
                        # Extract recommendation if available
                        recommendation = ""
                        if "." in description:
                            parts = description.split(".", 1)
                            if len(parts) > 1:
                                recommendation = parts[1].strip()
                        
                        interactions.append({
                            "drugs": [drug1.title(), drug2.title()],
                            "severity": severity,
                            "description": description,
                            "recommendation": recommendation
                        })
                        break
    
    return interactions

def analyze_text_like_llm(text: str) -> str:
    """Generate an LLM-like explanation about drug interactions - no real LLM used"""
    # Extract medications
    medications = extract_medications_from_text(text)
    if not medications:
        return "No medications detected in the provided text."
    
    # Find interactions
    interactions = find_drug_interactions(medications)
    if not interactions:
        return f"No significant interactions found between the detected medications: {', '.join(medications)}."
    
    # Generate a summary
    summary = f"Analysis of medication interactions:\n\n"
    summary += f"Detected medications: {', '.join(medications)}\n\n"
    summary += f"Potential interactions ({len(interactions)}):\n"
    
    for i, interaction in enumerate(interactions, 1):
        summary += f"{i}. {interaction['drugs'][0]} + {interaction['drugs'][1]}\n"
        summary += f"   Severity: {interaction['severity']}\n"
        summary += f"   {interaction['description']}\n"
        if interaction['recommendation']:
            summary += f"   Recommendation: {interaction['recommendation']}\n"
        summary += "\n"
    
    return summary

@app.get("/api/drug-interactions/{patient_username}")
async def get_drug_interactions(patient_username: str):
    """Analyze drug interactions for a patient's existing prescriptions"""
    try:
        # Extract just the username part (before the @)
        if '@' in patient_username:
            email_safe = patient_username.split('@')[0]  # Get username part before @
        else:
            email_safe = patient_username  # Already just the username
            
        print(f"Searching for medications for patient: {email_safe}")
        
        # Use username directly as the prescription stream name
        prescription_stream = f"{email_safe}"
        
        # Get all prescription items
        stream_exists = multichain_request(
            "liststreams",
            [prescription_stream]
        )
        
        if "result" not in stream_exists or not stream_exists["result"]:
            print(f"Stream {prescription_stream} not found, returning empty array")
            return {"interactions": [], "medicines": []}
        
        # Get prescription items
        items = multichain_request(
            "liststreamitems",
            [prescription_stream]
        )
        
        if "result" not in items:
            return {"interactions": [], "medicines": []}
        
        # Extract medicines from prescriptions
        medicines = set()
        for item in items["result"]:
            if "data" in item and item["data"]:
                try:
                    prescription = json.loads(bytes.fromhex(item["data"]).decode('utf-8'))
                    if "medication" in prescription:
                        medicines.add(prescription["medication"].strip())
                    # Also check if there's a text-based prescription field
                    if "prescriptionText" in prescription:
                        extracted_meds = extract_medications_from_text(prescription["prescriptionText"])
                        for med in extracted_meds:
                            medicines.add(med)
                except Exception as e:
                    print(f"Error processing prescription: {str(e)}")
                    continue
        
        medicines = list(medicines)
        print(f"Found medications for {patient_username}: {medicines}")
        
        # Check for interactions between medicines
        interaction_results = find_drug_interactions(medicines)
        
        # If we have real interactions, add explanations
        if interaction_results:
            for result in interaction_results:
                if not "explanation" in result or not result["explanation"]:
                    # Generate an explanation based on the description
                    drug1 = result["drugs"][0]
                    drug2 = result["drugs"][1]
                    severity = result["severity"]
                    description = result["description"]
                    
                    explanation = f"The combination of {drug1} and {drug2} presents a {severity.lower()}"
                    explanation += f" risk interaction. {description}"
                    
                    if "recommendation" in result and result["recommendation"]:
                        explanation += f" {result['recommendation']}"
                    
                    result["explanation"] = explanation
        
        # For demo purposes, add a sample interaction if none found and we have 2+ medications
        if not interaction_results and len(medicines) >= 2:
            interaction_results.append({
                "drugs": [medicines[0], medicines[1]],
                "severity": "Low",
                "description": "Potential interaction detected by the system.",
                "recommendation": "Monitor for side effects and consult healthcare provider.",
                "explanation": f"The combination of {medicines[0]} and {medicines[1]} may have interactions. This is a demonstration result as no specific interaction was found in the database."
            })
        
        return {
            "success": True,
            "medicines": medicines,
            "interactions": interaction_results
        }
        
    except Exception as e:
        print(f"Error analyzing drug interactions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing drug interactions: {str(e)}")

@app.post("/api/analyze-prescription")
async def analyze_prescription(
    prescription_text: str = Form(...),
    patient_id: str = Form(...)
):
    """
    Extract medicines from prescription text and analyze interactions
    """
    try:
        print(f"Analyzing prescription for patient: {patient_id}")
        print(f"Prescription text: {prescription_text[:100]}...")
        
        # 1. Extract medicines from the text
        medicines = extract_medications_from_text(prescription_text)
        print(f"Extracted medicines: {medicines}")
        
        # 2. Find interactions between the medicines
        interaction_results = find_drug_interactions(medicines)
        
        # 3. Generate explanations for the interactions
        for result in interaction_results:
            if not "explanation" in result or not result["explanation"]:
                # Generate an explanation based on the description
                drug1 = result["drugs"][0]
                drug2 = result["drugs"][1]
                severity = result["severity"]
                description = result["description"]
                
                explanation = f"The combination of {drug1} and {drug2} presents a {severity.lower()}"
                explanation += f" risk interaction. {description}"
                
                if "recommendation" in result and result["recommendation"]:
                    explanation += f" {result['recommendation']}"
                
                result["explanation"] = explanation
        
        # 4. Generate an LLM-like analysis - this simulates what a real LLM would return
        analysis = analyze_text_like_llm(prescription_text)
        
        return {
            "success": True,
            "patient_id": patient_id,
            "medicines": medicines,
            "interactions": interaction_results,
            "prescription_text": prescription_text[:500] + "..." if len(prescription_text) > 500 else prescription_text,
            "analysis": analysis
        }
        
    except Exception as e:
        print(f"Error analyzing prescription: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing prescription: {str(e)}")

if __name__ == "__main__":
    # Run the API with uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)