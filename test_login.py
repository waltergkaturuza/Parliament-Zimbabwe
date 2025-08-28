import requests
import json

# Test the login endpoint
url = "http://127.0.0.1:8000/api/auth/login/"
data = {
    "username": "admin",
    "password": "admin"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body: {response.text}")
    
    if response.status_code == 200:
        json_response = response.json()
        print("\n=== Parsed JSON Response ===")
        print(json.dumps(json_response, indent=2))
        
        # Check if user data includes role
        if 'user' in json_response and 'role' in json_response['user']:
            print(f"\n✅ SUCCESS: User role is '{json_response['user']['role']}'")
        else:
            print(f"\n❌ ISSUE: User role is missing or undefined")
    else:
        print(f"\n❌ LOGIN FAILED: Status {response.status_code}")
        
except Exception as e:
    print(f"Error making request: {e}")
