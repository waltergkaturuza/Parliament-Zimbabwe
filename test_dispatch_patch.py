#!/usr/bin/env python
"""Test dispatch operations using PATCH instead of custom action."""

import requests
import os

# Avoid Django import conflicts
if 'DJANGO_SETTINGS_MODULE' in os.environ:
    del os.environ['DJANGO_SETTINGS_MODULE']

BASE_URL = 'http://127.0.0.1:8000/api'

def test_dispatch_patch():
    """Test dispatch acceptance using PATCH method."""
    print("🧪 Testing Dispatch Operations via PATCH")
    print("=" * 40)
    
    # Login as subcenter user
    login_data = {'username': 'subcenter', 'password': 'subc@123'}
    response = requests.post(f'{BASE_URL}/auth/login/', json=login_data)
    
    if response.status_code != 200:
        print("❌ Login failed")
        return
    
    token = response.json()['access']
    headers = {'Authorization': f'Bearer {token}'}
    user_info = response.json()['user']
    print(f"✅ Logged in as: {user_info['username']} | Role: {user_info.get('role', 'N/A')}")
    
    # Get dispatches first
    response = requests.get(f'{BASE_URL}/dispatches/', headers=headers)
    if response.status_code != 200:
        print("❌ Could not get dispatches")
        return
    
    data = response.json()
    dispatches = data['results'] if isinstance(data, dict) and 'results' in data else data
    print(f"📦 Found {len(dispatches)} dispatches")
    
    if not dispatches:
        print("ℹ️ No dispatches to test with")
        return
    
    # Test PATCH method on first dispatch
    first_dispatch = dispatches[0]
    dispatch_id = first_dispatch['id']
    current_status = first_dispatch.get('status', 'Unknown')
    
    print(f"\n🎯 Testing PATCH on dispatch {dispatch_id}")
    print(f"   Current status: {current_status}")
    print(f"   To center ID: {first_dispatch.get('to_center_id', 'None')}")
    
    # Try to update status to RECEIVED
    patch_data = {'status': 'RECEIVED'}
    response = requests.patch(f'{BASE_URL}/dispatches/{dispatch_id}/', 
                             json=patch_data, headers=headers)
    
    print(f"📡 PATCH response: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("✅ PATCH successful!")
        print(f"   New Status: {result.get('status', 'Unknown')}")
        print(f"   Response: {result}")
    else:
        print("❌ PATCH failed")
        try:
            error = response.json()
            print(f"   Error: {error}")
        except:
            print(f"   Raw response: {response.text}")

if __name__ == "__main__":
    test_dispatch_patch()