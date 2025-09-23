#!/usr/bin/env python
"""Test the updated dispatch acceptance logic via API only."""

import requests
import json

BASE_URL = 'http://127.0.0.1:8000/api'

def test_dispatch_acceptance():
    """Test dispatch acceptance with updated permission logic."""
    print("🧪 Testing Updated Dispatch Acceptance Logic")
    print("=" * 60)
    
    # Test with subcenter user
    print("\n1️⃣ Testing SUBCENTER user login and dispatch access...")
    
    # Login as subcenter
    login_data = {'username': 'subcenter', 'password': 'subc@123'}
    response = requests.post(f'{BASE_URL}/auth/login/', json=login_data)
    
    if response.status_code == 200:
        subcenter_token = response.json()['access']
        user_info = response.json()['user']
        print(f"✅ Subcenter login successful")
        print(f"   User: {user_info['username']} | Role: {user_info.get('role', 'N/A')}")
        print(f"   Center: {user_info.get('sub_center_name', 'N/A')} (ID: {user_info.get('sub_center_id', 'N/A')})")
        
        # Test dispatches endpoint
        headers = {'Authorization': f'Bearer {subcenter_token}'}
        response = requests.get(f'{BASE_URL}/dispatches/', headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            # Handle paginated response
            if isinstance(data, dict) and 'results' in data:
                dispatches = data['results']
            else:
                dispatches = data if isinstance(data, list) else []
                
            print(f"✅ Dispatches endpoint accessible - Found {len(dispatches)} dispatches")
            
            # Show first few dispatches for debugging
            for i, dispatch in enumerate(dispatches[:3]):
                print(f"   Dispatch {i+1}: ID={dispatch['id']}, to_center_id={dispatch.get('to_center_id', 'None')}, status={dispatch.get('status', 'Unknown')}")
            
            # Try to accept first dispatch if any
            if dispatches:
                first_dispatch = dispatches[0]
                dispatch_id = first_dispatch['id']
                print(f"\n2️⃣ Testing dispatch acceptance for dispatch ID {dispatch_id}...")
                print(f"   To Center ID: {first_dispatch.get('to_center_id', 'None')}")
                print(f"   Status: {first_dispatch.get('status', 'Unknown')}")
                
                # Try to accept the dispatch
                response = requests.post(f'{BASE_URL}/dispatches/{dispatch_id}/accept/', headers=headers)
                
                if response.status_code == 200:
                    print("✅ Dispatch acceptance successful!")
                    result = response.json()
                    print(f"   New Status: {result.get('status', 'Unknown')}")
                    print(f"   Message: {result.get('message', 'No message')}")
                else:
                    print(f"❌ Dispatch acceptance failed: {response.status_code}")
                    try:
                        error_detail = response.json()
                        print(f"   Error: {error_detail}")
                    except:
                        print(f"   Raw response: {response.text}")
            else:
                print("ℹ️ No dispatches found for subcenter user")
        else:
            print(f"❌ Dispatches endpoint failed: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"   Error: {error_detail}")
            except:
                print(f"   Raw response: {response.text}")
    else:
        print(f"❌ Subcenter login failed: {response.status_code}")
        print(f"   Response: {response.text}")
    
    print("\n" + "=" * 60)
    
    # Test with admin user for comparison
    print("\n3️⃣ Testing ADMIN user for comparison...")
    
    login_data = {'username': 'admin', 'password': 'admin123'}
    response = requests.post(f'{BASE_URL}/auth/login/', json=login_data)
    
    if response.status_code == 200:
        admin_token = response.json()['access']
        user_info = response.json()['user']
        print(f"✅ Admin login successful")
        print(f"   User: {user_info['username']} | Role: {user_info.get('role', 'N/A')}")
        
        # Test dispatches endpoint
        headers = {'Authorization': f'Bearer {admin_token}'}
        response = requests.get(f'{BASE_URL}/dispatches/', headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            # Handle paginated response
            if isinstance(data, dict) and 'results' in data:
                dispatches = data['results']
            else:
                dispatches = data if isinstance(data, list) else []
                
            print(f"✅ Admin sees {len(dispatches)} dispatches")
            
            # Show first dispatch details for admin
            if dispatches:
                first_dispatch = dispatches[0]
                print(f"   First dispatch: ID={first_dispatch['id']}, to_center_id={first_dispatch.get('to_center_id', 'None')}")
        else:
            print(f"❌ Admin dispatches endpoint failed: {response.status_code}")
    
    print("\n" + "=" * 60)
    print("Test completed! 🎯")

if __name__ == "__main__":
    test_dispatch_acceptance()