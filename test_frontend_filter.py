#!/usr/bin/env python
"""Test the exact frontend API call with parameters."""

import requests
import os

# Avoid Django import conflicts
if 'DJANGO_SETTINGS_MODULE' in os.environ:
    del os.environ['DJANGO_SETTINGS_MODULE']

BASE_URL = 'http://127.0.0.1:8000/api'

def test_frontend_api_call():
    """Test the exact API call the frontend makes."""
    print("🧪 Testing Frontend Subcenter API Call")
    print("=" * 50)
    
    # Login as maincenter
    login_data = {'username': 'maincenter', 'password': 'main@123'}
    response = requests.post(f'{BASE_URL}/auth/login/', json=login_data)
    
    if response.status_code != 200:
        print("❌ MAIN_CENTER login failed")
        return
    
    token = response.json()['access']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test the exact call the frontend makes
    print("📡 Testing frontend API call: /api/subcenters/")
    print("   Parameters: ordering=name, page_size=200, status=ACTIVE")
    
    response = requests.get(f'{BASE_URL}/subcenters/', 
        headers=headers,
        params={
            'ordering': 'name',
            'page_size': 200,
            'status': 'ACTIVE'  # This might be filtering out results!
        }
    )
    
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        try:
            data = response.json()
            results = data.get('results', data) if isinstance(data, dict) else data
            
            print(f"   ✅ Success: {len(results)} records with status=ACTIVE filter")
            
            for subcenter in results:
                print(f"      - ID: {subcenter.get('id')}, Name: {subcenter.get('name')}, Status: {subcenter.get('status', 'N/A')}")
        except Exception as e:
            print(f"   ⚠️ Error parsing response: {e}")
    else:
        print(f"   ❌ Failed with status {response.status_code}")
        print(f"   Response: {response.text}")
    
    # Now test WITHOUT the status filter
    print("\n📡 Testing WITHOUT status filter:")
    response = requests.get(f'{BASE_URL}/subcenters/', 
        headers=headers,
        params={
            'ordering': 'name',
            'page_size': 200
            # No status filter
        }
    )
    
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        try:
            data = response.json()
            results = data.get('results', data) if isinstance(data, dict) else data
            
            print(f"   ✅ Success: {len(results)} records WITHOUT status filter")
            
            for subcenter in results:
                print(f"      - ID: {subcenter.get('id')}, Name: {subcenter.get('name')}, Status: {subcenter.get('status', 'N/A')}")
        except Exception as e:
            print(f"   ⚠️ Error parsing response: {e}")
    else:
        print(f"   ❌ Failed with status {response.status_code}")

if __name__ == "__main__":
    test_frontend_api_call()