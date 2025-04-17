from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
import requests
import uuid

app = Flask(__name__)
CORS(app)

# MultiChain connection settings
RPC_USER = "multichainrpc"
RPC_PASSWORD = "56fEieK5oGZxdKToXewJeJkju7q9fLXXo2SzqEHfp23u"
RPC_PORT = "4360"
RPC_HOST = "127.0.0.1"
CHAIN_NAME = "Health"
STREAM_NAME = "users"
RPC_URL = f"http://{RPC_USER}:{RPC_PASSWORD}@{RPC_HOST}:{RPC_PORT}"

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
        return {"error": str(e)}

@app.route('/api/signup', methods=['POST'])
def signup():
    """Register a new user and store details in MultiChain"""
    try:
        # Get user data from request
        user_data = request.json
        
        # Basic validation
        required_fields = ['name', 'email', 'password', 'age', 'gender', 'bloodGroup']
        for field in required_fields:
            if field not in user_data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Generate unique user ID
        user_id = str(uuid.uuid4())
        
        # Prepare data for blockchain
        # Do not store password in plain text on blockchain - in real app, password would be stored separately
        blockchain_data = {
            "userId": user_id,
            "name": user_data["name"],
            "email": user_data["email"],
            "age": user_data["age"],
            "gender": user_data["gender"],
            "bloodGroup": user_data["bloodGroup"],
            "medicalIssues": user_data.get("medicalIssues", ""),
            "password": user_data["password"]  # In a real app, hash this password
        }
        
        # Convert to hex for MultiChain
        hex_data = json.dumps(blockchain_data).encode('utf-8').hex()
        
        # Create stream item with user email as the key
        result = multichain_request(
            "publish",
            [STREAM_NAME, user_data["email"], hex_data]
        )
        
        if "result" in result:
            return jsonify({
                "success": True,
                "message": "User registered successfully",
                "userId": user_id
            }), 201
        else:
            if "error" in result:
                return jsonify({"error": result["error"]["message"]}), 500
            else:
                return jsonify({"error": "Unknown error occurred"}), 500
                
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Authenticate a user"""
    try:
        # Get login credentials
        credentials = request.json
        email = credentials.get("email")
        password = credentials.get("password")
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
            
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
                
                # In a real app, you would hash the password and compare to stored hash
                # For demo purposes, we're just checking if the user exists
                
                return jsonify({
                    "success": True,
                    "message": "Login successful",
                    "userId": user_data["userId"],
                    "name": user_data["name"],
                    "email": user_data["email"]
                })
            else:
                return jsonify({"error": "Invalid user data"}), 401
        else:
            return jsonify({"error": "User not found"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/<email>', methods=['GET'])
def get_user_profile(email):
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
                    
                return jsonify(user_data)
            else:
                return jsonify({"error": "Invalid user data"}), 400
        else:
            return jsonify({"error": "User not found"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Check if MultiChain is accessible
@app.route('/api/status', methods=['GET'])
def check_status():
    try:
        result = multichain_request("getinfo")
        if "result" in result:
            return jsonify({
                "status": "connected",
                "chain": result["result"]["chainname"]
            })
        else:
            return jsonify({
                "status": "error",
                "message": "Could not connect to MultiChain"
            }), 500
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)