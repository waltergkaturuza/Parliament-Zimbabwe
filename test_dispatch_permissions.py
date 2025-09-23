import requests
import json

backend_url = "https://parliament-zimbabwe.onrender.com"

# Test dispatch acceptance (which might be what the user was actually trying to do)
print("Testing dispatch acceptance permissions...")

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
        user_info = token_data.get('user', {})
        
        print(f"✅ Logged in as: {user_info.get('username')} (Role: {user_info.get('role')})")
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # Test dispatches endpoint
        print("\n📋 Fetching dispatches...")
        dispatches_response = requests.get(f"{backend_url}/api/dispatches/", headers=headers, timeout=10)
        print(f"Dispatches endpoint: {dispatches_response.status_code}")
        
        if dispatches_response.status_code == 200:
            dispatches_data = dispatches_response.json()
            dispatches = dispatches_data.get('results', [])
            print(f"Found {len(dispatches)} dispatches")
            
            if dispatches:
                # Try to update the status of the first dispatch
                dispatch = dispatches[0]
                dispatch_id = dispatch.get('id')
                current_status = dispatch.get('status', 'UNKNOWN')
                
                print(f"\n🎯 Testing dispatch #{dispatch_id} (current status: {current_status})")
                
                # Test status update (partial_update) - try to mark as RECEIVED
                print(f"\n🔄 Attempting to update status to: RECEIVED")
                
                patch_data = {
                    'status': 'RECEIVED',
                    'notes': 'Accepted via permission test'
                }
                
                patch_response = requests.patch(
                    f"{backend_url}/api/dispatches/{dispatch_id}/",
                    headers=headers,
                    json=patch_data,
                    timeout=10
                )
                
                print(f"PATCH /api/dispatches/{dispatch_id}/: {patch_response.status_code}")
                
                if patch_response.status_code == 200:
                    print("✅ Dispatch status update successful!")
                    result = patch_response.json()
                    print(f"   New status: {result.get('status')}")
                elif patch_response.status_code == 403:
                    print("❌ Permission denied")
                    print(f"   Error: {patch_response.text}")
                    
                    # Try the dedicated accept endpoint
                    print(f"\n🔄 Trying dedicated accept endpoint...")
                    
                    accept_response = requests.post(
                        f"{backend_url}/api/dispatches/{dispatch_id}/accept/",
                        headers=headers,
                        json={},
                        timeout=10
                    )
                    
                    print(f"POST /api/dispatches/{dispatch_id}/accept/: {accept_response.status_code}")
                    
                    if accept_response.status_code == 200:
                        print("✅ Dispatch accept successful!")
                        result = accept_response.json()
                        print(f"   New status: {result.get('status')}")
                    elif accept_response.status_code == 403:
                        print("❌ Permission denied for accept endpoint too")
                        print(f"   Error: {accept_response.text}")
                    else:
                        print(f"⚠️  Accept error: {accept_response.text}")
                        
                else:
                    print(f"⚠️  Other error: {patch_response.text}")
                
            else:
                print("⚠️  No dispatches found to test")
                
        else:
            print(f"❌ Failed to fetch dispatches: {dispatches_response.status_code}")
            print(f"   Error: {dispatches_response.text}")
            
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"   Error: {response.text}")
        
except Exception as e:
    print(f"❌ Test error: {e}")

print("\n🏁 Dispatch permission test complete!")