#!/usr/bin/env python
"""Test the accept action on dispatch endpoint."""

import requests
import os

# Avoid Django import conflicts
if 'DJANGO_SETTINGS_MODULE' in os.environ:
    del os.environ['DJANGO_SETTINGS_MODULE']

BASE_URL = 'http://127.0.0.1:8000/api'

def test_accept_action():
    """Test the accept action."""
    print("🧪 Testing Dispatch Accept Action")
    print("=" * 40)
    
    # Login as subcenter
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
    
    # Test accept action on first dispatch
    first_dispatch = dispatches[0]
    dispatch_id = first_dispatch['id']
    
    print(f"\n🎯 Testing accept action on dispatch {dispatch_id}")
    print(f"   Current status: {first_dispatch.get('status', 'Unknown')}")
    print(f"   To center ID: {first_dispatch.get('to_center_id', 'None')}")
    
    # Call accept action
    response = requests.post(f'{BASE_URL}/dispatches/{dispatch_id}/accept/', headers=headers)
    
    print(f"📡 Accept action response: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Accept action successful!")
        print(f"   Response: {result}")
    else:
        print("❌ Accept action failed")
        try:
            error = response.json()
            print(f"   Error: {error}")
        except:
            print(f"   Raw response: {response.text}")

if __name__ == "__main__":
    test_accept_action()