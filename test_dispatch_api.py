#!/usr/bin/env python
"""
Test script to verify the BookDispatch API endpoints work correctly
"""

import requests
import json
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:8000/api/v1"

def test_api_endpoints():
    print("Testing Fuel Coupon System API Endpoints")
    print("=" * 50)
    
    # Test 1: Get dispatches endpoint
    print("1. Testing /api/v1/dispatches/ endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/dispatches/")
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Found {len(data.get('results', data))} dispatches")
            if data.get('results') or isinstance(data, list):
                dispatches = data.get('results', data)
                if dispatches:
                    print(f"   Sample dispatch: {dispatches[0].get('dispatch_code', 'N/A')}")
        elif response.status_code == 401:
            print("   ❌ Authentication required - need to login first")
        else:
            print(f"   ❌ Error: {response.text}")
    except requests.exceptions.ConnectionError:
        print("   ❌ Connection error - server might not be running")
        return False
    except Exception as e:
        print(f"   ❌ Unexpected error: {e}")
    
    # Test 2: Get available books endpoint
    print("\n2. Testing /api/v1/books/available/ endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/books/available/")
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Found {len(data)} available books")
        elif response.status_code == 401:
            print("   ❌ Authentication required")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Get subcenters endpoint
    print("\n3. Testing /api/v1/subcenters/ endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/subcenters/")
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            results = data.get('results', data)
            print(f"   Found {len(results)} subcenters")
            if results:
                print(f"   Sample subcenter: {results[0].get('name', 'N/A')}")
        elif response.status_code == 401:
            print("   ❌ Authentication required")
        else:
            print(f"   ❌ Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 4: Test authentication endpoint
    print("\n4. Testing authentication...")
    try:
        # Try to get a token (assuming we have a test user)
        auth_data = {
            "username": "admin",  # Default superuser
            "password": "admin"   # You may need to adjust this
        }
        response = requests.post(f"{BASE_URL}/auth/login/", json=auth_data)
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            if 'access' in data:
                print("   ✅ Authentication successful")
                token = data['access']
                
                # Test authenticated request
                headers = {'Authorization': f'Bearer {token}'}
                response = requests.get(f"{BASE_URL}/dispatches/", headers=headers)
                print(f"   Authenticated dispatch request: {response.status_code}")
                if response.status_code == 200:
                    print("   ✅ Authenticated API access working")
                else:
                    print(f"   ❌ Authenticated request failed: {response.text}")
            else:
                print(f"   ❌ Login response missing token: {data}")
        else:
            print(f"   ❌ Login failed: {response.text}")
    except Exception as e:
        print(f"   ❌ Authentication error: {e}")
    
    print("\n" + "=" * 50)
    print("API Testing Complete")
    
    return True

if __name__ == "__main__":
    test_api_endpoints()
