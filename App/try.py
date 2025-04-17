from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        return jsonify({"message": "Hello, World! Here's your customized diet plan."})
    return jsonify({"message": "Use POST to get your diet plan"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')