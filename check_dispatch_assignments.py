import requests

backend_url = "https://parliament-zimbabwe.onrender.com"

# Login as admin to check and fix dispatch center assignments
login_data = {"username": "admin", "password": "Parliament2024!"}

try:
    response = requests.post(f"{backend_url}/api/auth/login/", json=login_data, timeout=10)
    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data.get('access_token')
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        print("🔧 Checking dispatch center assignments as admin...")
        
        # Get all dispatches to see their center assignments
        response = requests.get(f"{backend_url}/api/dispatches/", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            dispatches = data.get('results', data) if isinstance(data, dict) else data
            
            print(f"Found {len(dispatches)} dispatches:")
            for dispatch in dispatches:
                print(f"  ID {dispatch.get('id')}: status={dispatch.get('status')}, to_center_id={dispatch.get('to_center_id')}")
        
        # Get all subcenters to see their IDs
        response = requests.get(f"{backend_url}/api/subcenters/", headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            subcenters = data.get('results', data) if isinstance(data, dict) else data
            
            print(f"\nFound {len(subcenters)} subcenters:")
            for sc in subcenters:
                print(f"  ID {sc.get('id')}: {sc.get('name')} (code: {sc.get('code')})")
                
        print(f"\n💡 The issue is dispatches have to_center_id=None")
        print(f"   Subcenter user is in Center ID: 1 (Subcenter A)")
        print(f"   But dispatches don't have proper to_center_id assignments")
        
    else:
        print(f"Admin login failed: {response.status_code}")
        
except Exception as e:
    print(f"Error: {e}")