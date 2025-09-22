import requests
import traceback

backend_url = "https://parliament-zimbabwe.onrender.com"

# Get authentication token
login_data = {
    "username": "admin",
    "password": "Parliament2024!"
}

try:
    response = requests.post(f"{backend_url}/api/auth/login/", json=login_data, timeout=10)
    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data.get('access_token')
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # Test dispatcher endpoint with detailed error handling
        print("Testing dispatcher endpoint...")
        try:
            response = requests.get(f"{backend_url}/api/dispatchers/", headers=headers, timeout=15)
            print(f"Status Code: {response.status_code}")
            print(f"Headers: {response.headers}")
            print(f"Response Text: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Data: {data}")
            
        except Exception as e:
            print(f"Request error: {e}")
            traceback.print_exc()
            
        # Test dispatch config endpoint
        print("\nTesting dispatch config endpoint...")
        try:
            response = requests.get(f"{backend_url}/api/dispatch-page-config/", headers=headers, timeout=15)
            print(f"Status Code: {response.status_code}")
            print(f"Response Text: {response.text}")
            
        except Exception as e:
            print(f"Config request error: {e}")
            
    else:
        print(f"Login failed: {response.status_code} - {response.text}")
        
except Exception as e:
    print(f"Overall error: {e}")
    traceback.print_exc()