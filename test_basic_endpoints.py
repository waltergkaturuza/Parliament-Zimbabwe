#!/usr/bin/env python
"""Simple test to check if the dispatches endpoint exists."""

import requests

BASE_URL = 'http://127.0.0.1:8000/api'

def test_basic_endpoints():
    """Test basic endpoint availability."""
    print("🧪 Testing Basic API Endpoints")
    print("=" * 40)
    
    # Test login first
    login_data = {'username': 'subcenter', 'password': 'subc@123'}
    response = requests.post(f'{BASE_URL}/auth/login/', json=login_data)
    
    if response.status_code != 200:
        print("❌ Login failed")
        return
    
    token = response.json()['access']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test different dispatch endpoints
    endpoints = [
        'dispatches',
        'coupon-dispatches', 
        'fuel-dispatches'
    ]
    
    for endpoint in endpoints:
        print(f"\n📡 Testing {endpoint} endpoint...")
        response = requests.get(f'{BASE_URL}/{endpoint}/', headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, dict) and 'results' in data:
                    count = len(data['results'])
                elif isinstance(data, list):
                    count = len(data)
                else:
                    count = 'unknown'
                print(f"   Found {count} records")
            except:
                print("   Response not JSON")
        elif response.status_code == 404:
            print("   ❌ Not found")
        else:
            print(f"   ❌ Error response")

if __name__ == "__main__":
    test_basic_endpoints()