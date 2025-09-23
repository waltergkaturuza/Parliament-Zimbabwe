import requests
import traceback

backend_url = "https://parliament-zimbabwe.onrender.com"

# Test with subcenter user credentials
login_data = {
    "username": "subcenter",
    "password": "subc@123"
}

try:
    print("Testing with SUB_CENTER user credentials...")
    response = requests.post(f"{backend_url}/api/auth/login/", json=login_data, timeout=15)
    print(f"Login Status: {response.status_code}")
    
    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data.get('access_token')
        user_info = token_data.get('user', {})
        
        print(f"✅ Login successful!")
        print(f"   Username: {user_info.get('username')}")
        print(f"   Role: {user_info.get('role')}")  
        print(f"   Center ID: {user_info.get('centerId')}")
        print(f"   Center Name: {user_info.get('centerName')}")
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # Test key endpoints for subcenter users
        print(f"\n📋 Testing API endpoints for SUB_CENTER user:")
        
        endpoints_to_test = [
            ("/api/handovers/", "GET", "Handovers List"),
            ("/api/dispatches/", "GET", "Dispatches List"), 
            ("/api/subcenters/", "GET", "Subcenters"),
            ("/api/users/me/", "GET", "User Profile")
        ]
        
        for endpoint, method, name in endpoints_to_test:
            try:
                if method == "GET":
                    response = requests.get(f"{backend_url}{endpoint}", headers=headers, timeout=10)
                
                print(f"   {name:<20}: {response.status_code}")
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        if isinstance(data, dict):
                            count = data.get('count', len(data.get('results', [])) if 'results' in data else 'N/A')
                            print(f"      📊 Data count: {count}")
                        elif isinstance(data, list):
                            print(f"      📊 List items: {len(data)}")
                    except:
                        print(f"      📄 Non-JSON response")
                elif response.status_code == 403:
                    print(f"      🔒 Permission denied")
                elif response.status_code == 404:
                    print(f"      ❌ Not found")
                else:
                    print(f"      ⚠️  Status: {response.status_code}")
                    
            except Exception as e:
                print(f"   {name:<20}: ERROR - {e}")
        
        # Test handover operations specifically
        print(f"\n🔄 Testing handover operations:")
        
        # First get handovers to see if any exist
        try:
            response = requests.get(f"{backend_url}/api/handovers/", headers=headers, timeout=10)
            if response.status_code == 200:
                handovers_data = response.json()
                handovers = handovers_data.get('results', handovers_data) if isinstance(handovers_data, dict) else handovers_data
                
                print(f"   📦 Found {len(handovers)} handovers")
                
                if len(handovers) > 0:
                    # Try to test handover acceptance on first handover
                    handover = handovers[0]
                    handover_id = handover.get('id')
                    current_status = handover.get('status', 'UNKNOWN')
                    
                    print(f"   🎯 Testing handover {handover_id} (current status: {current_status})")
                    
                    # Test partial update (status change)
                    if current_status in ['PENDING', 'CONFIGURED', 'VERIFIED']:
                        test_data = {"status": "HANDED_OVER"}
                        response = requests.patch(f"{backend_url}/api/handovers/{handover_id}/", 
                                                json=test_data, headers=headers, timeout=10)
                        print(f"   📝 PATCH handover status: {response.status_code}")
                        if response.status_code != 200:
                            print(f"      Error: {response.text[:100]}")
                    
                    # Test confirm receipt action
                    if current_status == 'HANDED_OVER':
                        response = requests.post(f"{backend_url}/api/handovers/{handover_id}/confirm_receipt/", 
                                               json={"signature_data": {}}, headers=headers, timeout=10)
                        print(f"   ✅ POST confirm_receipt: {response.status_code}")
                        if response.status_code != 200:
                            print(f"      Error: {response.text[:100]}")
                            
                else:
                    print(f"   ℹ️  No handovers available to test with")
                    
            else:
                print(f"   ❌ Could not fetch handovers: {response.status_code}")
                
        except Exception as e:
            print(f"   💥 Handover test error: {e}")
        
        # Test dispatch operations 
        print(f"\n📦 Testing dispatch operations:")
        
        try:
            response = requests.get(f"{backend_url}/api/dispatches/", headers=headers, timeout=10)
            if response.status_code == 200:
                dispatches_data = response.json()
                dispatches = dispatches_data.get('results', dispatches_data) if isinstance(dispatches_data, dict) else dispatches_data
                
                print(f"   📦 Found {len(dispatches)} dispatches")
                
                # Look for dispatches that can be accepted
                for dispatch in dispatches[:3]:  # Test first 3
                    dispatch_id = dispatch.get('id')
                    status = dispatch.get('status', 'UNKNOWN')
                    to_center = dispatch.get('to_center', {})
                    
                    print(f"   🎯 Dispatch {dispatch_id}: {status} -> {to_center.get('name', 'Unknown')}")
                    
                    if status == 'DISPATCHED':
                        # Try to accept this dispatch
                        response = requests.post(f"{backend_url}/api/dispatches/{dispatch_id}/accept/", 
                                               headers=headers, timeout=10)
                        print(f"      ✅ Accept dispatch: {response.status_code}")
                        if response.status_code != 200:
                            print(f"         Error: {response.text[:100]}")
                        break
                        
            else:
                print(f"   ❌ Could not fetch dispatches: {response.status_code}")
                
        except Exception as e:
            print(f"   💥 Dispatch test error: {e}")
        
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"   Response: {response.text}")
        
except Exception as e:
    print(f"💥 Overall error: {e}")
    traceback.print_exc()