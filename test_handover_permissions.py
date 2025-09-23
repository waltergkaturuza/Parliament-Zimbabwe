import requests
import json

backend_url = "https://parliament-zimbabwe.onrender.com"

# Test handover acceptance with admin (SUPERUSER) credentials
print("Testing handover acceptance permissions...")

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
        
        # First, get the list of handovers
        print("\n📋 Fetching handovers...")
        handovers_response = requests.get(f"{backend_url}/api/handovers/", headers=headers, timeout=10)
        print(f"Handovers endpoint: {handovers_response.status_code}")
        
        if handovers_response.status_code == 200:
            handovers_data = handovers_response.json()
            handovers = handovers_data.get('results', [])
            print(f"Found {len(handovers)} handovers")
            
            if handovers:
                # Try to update the status of the first handover
                handover = handovers[0]
                handover_id = handover.get('id')
                current_status = handover.get('status', 'UNKNOWN')
                
                print(f"\n🎯 Testing handover #{handover_id} (current status: {current_status})")
                
                # Test status update (partial_update)
                test_statuses = ['RECEIVED', 'CONFIRMED']
                for test_status in test_statuses:
                    print(f"\n🔄 Attempting to update status to: {test_status}")
                    
                    patch_data = {
                        'status': test_status,
                        'notes': f'Updated to {test_status} via permission test'
                    }
                    
                    patch_response = requests.patch(
                        f"{backend_url}/api/handovers/{handover_id}/",
                        headers=headers,
                        json=patch_data,
                        timeout=10
                    )
                    
                    print(f"PATCH /api/handovers/{handover_id}/: {patch_response.status_code}")
                    
                    if patch_response.status_code == 200:
                        print("✅ Status update successful!")
                        result = patch_response.json()
                        print(f"   New status: {result.get('status')}")
                        break
                    elif patch_response.status_code == 403:
                        print("❌ Permission denied")
                        print(f"   Error: {patch_response.text}")
                    else:
                        print(f"⚠️  Other error: {patch_response.text}")
                
                # Test confirm_receipt action if handover is in HANDED_OVER status
                if current_status == 'HANDED_OVER':
                    print(f"\n🔄 Testing confirm_receipt action...")
                    
                    confirm_data = {
                        'signature_data': {
                            'signature': 'test_signature',
                            'timestamp': '2025-09-23T16:00:00Z'
                        }
                    }
                    
                    confirm_response = requests.post(
                        f"{backend_url}/api/handovers/{handover_id}/confirm_receipt/",
                        headers=headers,
                        json=confirm_data,
                        timeout=10
                    )
                    
                    print(f"POST /api/handovers/{handover_id}/confirm_receipt/: {confirm_response.status_code}")
                    
                    if confirm_response.status_code == 200:
                        print("✅ Confirm receipt successful!")
                        result = confirm_response.json()
                        print(f"   Message: {result.get('message')}")
                    elif confirm_response.status_code == 403:
                        print("❌ Permission denied for confirm_receipt")
                        print(f"   Error: {confirm_response.text}")
                    else:
                        print(f"⚠️  Confirm receipt error: {confirm_response.text}")
                
            else:
                print("⚠️  No handovers found to test")
                
        else:
            print(f"❌ Failed to fetch handovers: {handovers_response.status_code}")
            print(f"   Error: {handovers_response.text}")
            
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"   Error: {response.text}")
        
except Exception as e:
    print(f"❌ Test error: {e}")

print("\n🏁 Handover permission test complete!")