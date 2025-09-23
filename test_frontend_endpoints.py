#!/usr/bin/env python
"""Test all possible subcenter API endpoints that frontend might be calling."""

import requests
import os

# Avoid Django import conflicts
if 'DJANGO_SETTINGS_MODULE' in os.environ:
    del os.environ['DJANGO_SETTINGS_MODULE']

BASE_URL = 'http://127.0.0.1:8000/api'

def test_all_subcenter_endpoints():
    """Test all possible subcenter API endpoints."""
    print("🧪 Testing All Possible Subcenter API Endpoints")
    print("=" * 60)
    
    # Login as maincenter
    login_data = {'username': 'maincenter', 'password': 'main@123'}
    response = requests.post(f'{BASE_URL}/auth/login/', json=login_data)
    
    if response.status_code != 200:
        print("❌ MAIN_CENTER login failed")
        return
    
    token = response.json()['access']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test all possible endpoints the frontend might be calling
    possible_endpoints = [
        'subcenters',
        'sub-centers', 
        'subcenters?active=true',
        'sub-centers?active=true',
        'subcenters?is_active=true',
        'sub-centers?is_active=true',
        'subcenters/?active=true',
        'sub-centers/?active=true',
        'subcenters/active',
        'sub-centers/active',
        'dispatch/subcenters',  # Custom endpoint?
        'dispatches/subcenters',  # Custom endpoint?
        'centers',  # Alternative name?
    ]
    
    for endpoint in possible_endpoints:
        print(f"\n📡 Testing: /api/{endpoint}")
        response = requests.get(f'{BASE_URL}/{endpoint}', headers=headers)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, dict) and 'results' in data:
                    count = len(data['results'])
                elif isinstance(data, list):
                    count = len(data)
                else:
                    count = 'unknown format'
                print(f"   ✅ Success: {count} records")
            except Exception as e:
                print(f"   ⚠️ JSON parse error: {e}")
        elif response.status_code == 404:
            print("   ❌ Not found")
        elif response.status_code == 403:
            print("   ❌ Permission denied")
        else:
            print(f"   ❌ Error {response.status_code}")
    
    # Also test with different headers that frontend might use
    print(f"\n🔍 Testing with different header formats...")
    
    # Test without Bearer prefix (some frontends do this wrong)
    alt_headers = {'Authorization': token}
    response = requests.get(f'{BASE_URL}/subcenters', headers=alt_headers)
    print(f"   Without 'Bearer': Status {response.status_code}")
    
    # Test with different content type
    headers_with_content_type = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    response = requests.get(f'{BASE_URL}/subcenters', headers=headers_with_content_type)
    print(f"   With Content-Type: Status {response.status_code}")

if __name__ == "__main__":
    test_all_subcenter_endpoints()