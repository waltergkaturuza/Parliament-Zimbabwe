#!/usr/bin/env python3
"""
Test script for the fixed API endpoints
Tests the three main problematic endpoints:
1. /api/v1/parliament-sessions/
2. /api/v1/users/?role=MAIN_CENTER,SUB_CENTER  
3. /api/v1/beneficiary-profiles/
"""

import requests
import json
import sys

# Configuration
BASE_URL = "http://127.0.0.1:8000"
LOGIN_URL = f"{BASE_URL}/api/v1/auth/login/"
TEST_ENDPOINTS = [
    "/api/v1/parliament-sessions/",
    "/api/v1/users/?role=MAIN_CENTER,SUB_CENTER",
    "/api/v1/beneficiary-profiles/",
    "/api/v1/admin/dashboard/",
    "/api/v1/fuel-stats/"
]

# Test credentials
USERNAME = "admin"
PASSWORD = "admin"

def get_auth_token():
    """Get authentication token"""
    print(f"🔐 Getting authentication token for user: {USERNAME}")
    
    response = requests.post(LOGIN_URL, json={
        "username": USERNAME,
        "password": PASSWORD
    })
    
    if response.status_code == 200:
        token_data = response.json()
        print(f"✅ Authentication successful")
        return token_data.get('access')
    else:
        print(f"❌ Authentication failed: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def test_endpoint(endpoint, token):
    """Test a single endpoint"""
    print(f"\n🧪 Testing endpoint: {endpoint}")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"✅ Success! Response contains {len(data) if isinstance(data, list) else 'object'}")
                if isinstance(data, dict) and 'results' in data:
                    print(f"   📄 Results: {len(data['results'])} items")
                elif isinstance(data, list):
                    print(f"   📄 Items: {len(data)}")
                else:
                    print(f"   📄 Response type: {type(data)}")
            except json.JSONDecodeError:
                print(f"✅ Success! Non-JSON response: {response.text[:100]}...")
        else:
            print(f"❌ Error response:")
            try:
                error_data = response.json()
                print(f"   {json.dumps(error_data, indent=2)}")
            except:
                print(f"   {response.text}")
                
    except Exception as e:
        print(f"❌ Request failed: {str(e)}")

def main():
    """Main test function"""
    print("🚀 Starting API endpoint tests...")
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        print("❌ Cannot proceed without authentication token")
        sys.exit(1)
    
    # Test each endpoint
    print(f"\n📋 Testing {len(TEST_ENDPOINTS)} endpoints...")
    
    success_count = 0
    for endpoint in TEST_ENDPOINTS:
        test_endpoint(endpoint, token)
        # Simple success check based on response
        headers = {"Authorization": f"Bearer {token}"}
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            if response.status_code == 200:
                success_count += 1
        except:
            pass
    
    print(f"\n📈 Summary:")
    print(f"   ✅ Successful: {success_count}/{len(TEST_ENDPOINTS)}")
    print(f"   ❌ Failed: {len(TEST_ENDPOINTS) - success_count}/{len(TEST_ENDPOINTS)}")
    
    if success_count == len(TEST_ENDPOINTS):
        print("🎉 All endpoints working correctly!")
    else:
        print("⚠️  Some endpoints still have issues")

if __name__ == "__main__":
    main()
