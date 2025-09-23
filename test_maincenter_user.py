#!/usr/bin/env python
"""Test maincenter user login and subcenter data access."""

import requests
import os

# Avoid Django import conflicts
if 'DJANGO_SETTINGS_MODULE' in os.environ:
    del os.environ['DJANGO_SETTINGS_MODULE']

BASE_URL = 'http://127.0.0.1:8000/api'

def test_maincenter_user():
    """Test maincenter user login and subcenter data access."""
    print("🧪 Testing MAIN_CENTER User Data Access")
    print("=" * 50)
    
    # Login as maincenter
    login_data = {'username': 'maincenter', 'password': 'main@123'}
    response = requests.post(f'{BASE_URL}/auth/login/', json=login_data)
    
    if response.status_code != 200:
        print("❌ MAIN_CENTER login failed")
        print(f"   Status: {response.status_code}")
        try:
            error = response.json()
            print(f"   Error: {error}")
        except:
            print(f"   Raw response: {response.text}")
        return
    
    token = response.json()['access']
    headers = {'Authorization': f'Bearer {token}'}
    user_info = response.json()['user']
    print(f"✅ Logged in as: {user_info['username']}")
    print(f"   User Role: {user_info.get('role', 'N/A')}")
    print(f"   User ID: {user_info.get('id', 'N/A')}")
    print(f"   Center ID: {user_info.get('center_id', 'N/A')}")
    print(f"   Sub Center ID: {user_info.get('sub_center_id', 'N/A')}")
    
    # Test different endpoints
    endpoints_to_test = [
        ('subcenters', 'Sub Centers'),
        ('sub-centers', 'Sub Centers (alias)'),
        ('dispatches', 'Dispatches'),
        ('books', 'Books'),
        ('boxes', 'Boxes'),
        ('handovers', 'Handovers')
    ]
    
    for endpoint, description in endpoints_to_test:
        print(f"\n📡 Testing {description} endpoint: /api/{endpoint}/")
        response = requests.get(f'{BASE_URL}/{endpoint}/', headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, dict) and 'results' in data:
                    count = len(data['results'])
                    items = data['results'][:3]  # Show first 3 items
                elif isinstance(data, list):
                    count = len(data)
                    items = data[:3]  # Show first 3 items
                else:
                    count = 'unknown'
                    items = []
                
                print(f"   ✅ Found {count} records")
                
                # Show sample data for subcenters
                if endpoint in ['subcenters', 'sub-centers'] and items:
                    print("   📋 Sample subcenter data:")
                    for item in items:
                        print(f"      - ID: {item.get('id', 'N/A')}, Name: {item.get('name', 'N/A')}, Code: {item.get('code', 'N/A')}")
                        
            except Exception as e:
                print(f"   ⚠️ Response parsing error: {e}")
                
        elif response.status_code == 404:
            print("   ❌ Endpoint not found")
        elif response.status_code == 403:
            print("   ❌ Permission denied")
            try:
                error = response.json()
                print(f"   Error details: {error}")
            except:
                pass
        else:
            print(f"   ❌ Error response")
            try:
                error = response.json()
                print(f"   Error details: {error}")
            except:
                print(f"   Raw response: {response.text}")

if __name__ == "__main__":
    test_maincenter_user()