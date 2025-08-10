#!/usr/bin/env python3
"""
Simple authentication debug test
"""
import requests
import json

def test_auth_debug():
    base_url = "http://127.0.0.1:8000"
    
    print("🔍 AUTHENTICATION DEBUG TEST")
    print("=" * 50)
    
    # Step 1: Login
    login_data = {
        "username": "admin",
        "password": "password123"
    }
    
    try:
        login_response = requests.post(f"{base_url}/api/v1/auth/login/", json=login_data)
        print(f"1. Login Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_json = login_response.json()
            access_token = login_json.get('access')
            print(f"   ✅ Token obtained (first 50 chars): {access_token[:50]}...")
            
            # Step 2: Test API endpoint with token
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Test simple authenticated endpoint
            me_response = requests.get(f"{base_url}/api/v1/users/me/", headers=headers)
            print(f"2. /users/me/ Status: {me_response.status_code}")
            
            if me_response.status_code == 200:
                print(f"   ✅ /users/me/ works!")
                print(f"   User data: {me_response.json()}")
            else:
                print(f"   ❌ /users/me/ failed")
                print(f"   Response: {me_response.text}")
                
            # Test list users endpoint
            users_response = requests.get(f"{base_url}/api/v1/users/", headers=headers)
            print(f"3. /users/ Status: {users_response.status_code}")
            
            if users_response.status_code == 200:
                print(f"   ✅ /users/ works!")
                users_data = users_response.json()
                print(f"   Found {len(users_data)} users")
            else:
                print(f"   ❌ /users/ failed")
                print(f"   Response: {users_response.text}")
                
            # Test token validation endpoint
            verify_response = requests.post(f"{base_url}/api/token/verify/", 
                                          json={"token": access_token})
            print(f"4. Token Verify Status: {verify_response.status_code}")
            
            if verify_response.status_code == 200:
                print("   ✅ Token is valid")
            else:
                print("   ❌ Token validation failed")
                print(f"   Response: {verify_response.text}")
                
        else:
            print(f"   ❌ Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")

if __name__ == "__main__":
    test_auth_debug()
