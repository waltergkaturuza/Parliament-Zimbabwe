import requests
import os

# Test the dispatch form endpoints with authentication
backend_url = "https://parliament-zimbabwe.onrender.com"

# Get authentication token first
print("Getting authentication token...")
try:
    # Try to login with test credentials
    login_data = {
        "username": "admin",
        "password": "Parliament2024!"
    }
    response = requests.post(f"{backend_url}/api/auth/login/", json=login_data, timeout=10)
    print(f"Login response: {response.status_code}")
    
    if response.status_code == 200:
        token_data = response.json()
        print(f"Token data: {token_data}")
        access_token = token_data.get('access_token')
        if access_token:
            print(f"Got access token: {access_token[:20]}...")
        else:
            print("No access token found in response")
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # Test handovers endpoint with authentication
        try:
            response = requests.get(f"{backend_url}/api/handovers/", headers=headers, timeout=10)
            print(f"Handovers endpoint: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"  Handovers response: {data}")
            else:
                print(f"  Handovers error response: {response.text}")
        except Exception as e:
            print(f"Handovers endpoint error: {e}")
            
        # Test other dispatch endpoints
        endpoints_to_test = [
            ("/api/subcenters/", "Subcenters"),
            ("/api/books/available_for_dispatch/", "Available Books"),
            ("/api/fuel-dispatches/", "Fuel Dispatches"),
            ("/api/coupon-dispatches/", "Coupon Dispatches"),
            ("/api/dispatchers/", "Dispatchers"),
            ("/api/dispatch-page-config/", "Dispatch Page Config")
        ]
        
        for endpoint, name in endpoints_to_test:
            try:
                response = requests.get(f"{backend_url}{endpoint}", headers=headers, timeout=10)
                print(f"{name} endpoint: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    count = len(data.get('results', data)) if isinstance(data, dict) else len(data)
                    print(f"  Found {count} items")
            except Exception as e:
                print(f"{name} endpoint error: {e}")
    else:
        print(f"Login failed: {response.text}")
        
except Exception as e:
    print(f"Authentication error: {e}")

print("\nTesting complete!")