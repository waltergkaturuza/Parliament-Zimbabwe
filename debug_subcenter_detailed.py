import requests
import traceback

backend_url = "https://parliament-zimbabwe.onrender.com"

# Test with subcenter user credentials  
login_data = {
    "username": "subcenter", 
    "password": "subc@123"
}

try:
    response = requests.post(f"{backend_url}/api/auth/login/", json=login_data, timeout=15)
    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data.get('access_token')
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        print("🔍 Detailed handover endpoint debugging:")
        
        # Test handovers endpoint with detailed error
        try:
            response = requests.get(f"{backend_url}/api/handovers/", headers=headers, timeout=15)
            print(f"   Status: {response.status_code}")
            print(f"   Headers: {dict(response.headers)}")
            print(f"   Response: {response.text}")
            
        except Exception as e:
            print(f"   Request Error: {e}")
            
        print(f"\n🔍 Detailed dispatch debugging:")
        
        # Get more details about dispatches
        try:
            response = requests.get(f"{backend_url}/api/dispatches/", headers=headers, timeout=15)
            if response.status_code == 200:
                data = response.json()
                dispatches = data.get('results', data) if isinstance(data, dict) else data
                
                print(f"   Found {len(dispatches)} dispatches")
                
                for i, dispatch in enumerate(dispatches[:3]):
                    dispatch_id = dispatch.get('id')
                    status = dispatch.get('status')
                    to_center = dispatch.get('to_center', {})
                    to_center_id = dispatch.get('to_center_id')
                    
                    print(f"   Dispatch {i+1}:")
                    print(f"      ID: {dispatch_id}")
                    print(f"      Status: {status}")
                    print(f"      to_center_id: {to_center_id}")
                    print(f"      to_center: {to_center}")
                    
                    # Try to accept dispatch with detailed error
                    if status == 'DISPATCHED':
                        try:
                            response = requests.post(f"{backend_url}/api/dispatches/{dispatch_id}/accept/", 
                                                   headers=headers, timeout=10)
                            print(f"      Accept Status: {response.status_code}")
                            print(f"      Accept Response: {response.text}")
                        except Exception as e:
                            print(f"      Accept Error: {e}")
                        break
                            
        except Exception as e:
            print(f"   Dispatch Error: {e}")
            
        print(f"\n🔍 User details from login:")
        user_info = token_data.get('user', {})
        print(f"   Username: {user_info.get('username')}")
        print(f"   Role: {user_info.get('role')}")
        print(f"   Center ID: {user_info.get('centerId')}")
        print(f"   Center Name: {user_info.get('centerName')}")
        print(f"   Is Approved: {user_info.get('is_approved')}")
        
    else:
        print(f"Login failed: {response.status_code} - {response.text}")
        
except Exception as e:
    print(f"Error: {e}")
    traceback.print_exc()