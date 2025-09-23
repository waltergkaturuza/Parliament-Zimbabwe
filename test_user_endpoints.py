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
        
        # Test all user-related endpoints that might be causing the issue
        endpoints_to_test = [
            ("/api/users/me/", "User Profile"),
            ("/api/user-profile/", "User Profile Alt"),
            ("/api/auth/user/", "Auth User"),
            ("/api/dispatchers/", "Dispatchers"),
            ("/api/dispatch-page-config/", "Dispatch Config"),
            ("/api/subcenters/", "Subcenters"),
            ("/api/handovers/", "Handovers")
        ]
        
        print("Testing all user-related endpoints...\n")
        for endpoint, name in endpoints_to_test:
            try:
                response = requests.get(f"{backend_url}{endpoint}", headers=headers, timeout=10)
                print(f"{name:<20}: {response.status_code}")
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        if isinstance(data, dict):
                            if 'user' in data or 'username' in data or 'dispatchers' in data or 'results' in data:
                                print(f"  ✅ Contains user data")
                            else:
                                print(f"  ⚠️  No obvious user data in response")
                        elif isinstance(data, list):
                            print(f"  📝 List with {len(data)} items")
                    except:
                        print(f"  📄 Non-JSON response")
                        
                elif response.status_code in [401, 403]:
                    print(f"  🔒 Authentication/Permission issue")
                elif response.status_code == 404:
                    print(f"  ❌ Endpoint not found")
                elif response.status_code >= 500:
                    print(f"  💥 Server error: {response.text[:100]}")
                else:
                    print(f"  ❓ Other status")
                    
            except Exception as e:
                print(f"{name:<20}: ERROR - {e}")
                
        print(f"\nLogin response user data:")
        user_data = token_data.get('user', {})
        print(f"  Username: {user_data.get('username')}")
        print(f"  Role: {user_data.get('role')}")
        print(f"  Name: {user_data.get('name')}")
        print(f"  Center ID: {user_data.get('centerId')}")
        print(f"  Is Superuser: {user_data.get('is_superuser')}")
        
    else:
        print(f"Login failed: {response.status_code} - {response.text}")
        
except Exception as e:
    print(f"Overall error: {e}")
    traceback.print_exc()