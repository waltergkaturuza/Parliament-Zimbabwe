#!/usr/bin/env python3
"""
Authentication Status Checker

This script checks the authentication status and helps diagnose
why the frontend might be getting 500 errors.
"""

import requests
import json
from datetime import datetime

def check_auth_endpoints():
    """Check if authentication endpoints are working"""
    base_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    
    print("🔐 AUTHENTICATION ENDPOINT CHECK")
    print("=" * 50)
    
    # Test auth endpoints
    auth_endpoints = [
        ("/api/v1/auth/login/", "Login Endpoint"),
        ("/api/v1/auth/refresh/", "Token Refresh Endpoint"),
        ("/api/v1/test-login/", "Test Login Endpoint"),
    ]
    
    for endpoint, description in auth_endpoints:
        print(f"\n🧪 Testing: {description}")
        print(f"   URL: {base_url}{endpoint}")
        
        try:
            # Test with OPTIONS to check CORS
            options_response = requests.options(f"{base_url}{endpoint}", timeout=10)
            print(f"   OPTIONS: {options_response.status_code}")
            
            # Test with POST (empty body)
            post_response = requests.post(f"{base_url}{endpoint}", 
                                        json={}, 
                                        timeout=10)
            print(f"   POST (empty): {post_response.status_code}")
            
            if post_response.status_code == 400:
                print("   ✅ Endpoint exists (400 = bad request expected)")
            elif post_response.status_code == 404:
                print("   ❌ Endpoint not found")
            elif post_response.status_code == 500:
                print("   ❌ Server error on endpoint")
                print(f"   Response: {post_response.text[:200]}...")
            
        except Exception as e:
            print(f"   💥 Error: {str(e)}")

def test_login_flow():
    """Test the complete login flow"""
    base_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    
    print("\n🔄 LOGIN FLOW TEST")
    print("=" * 50)
    
    # Test with dummy credentials (should fail gracefully)
    login_data = {
        "username": "test_user",
        "password": "test_password"
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/v1/test-login/",
            json=login_data,
            timeout=10,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Login attempt status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Login endpoint working (unexpected with test credentials)")
        elif response.status_code == 401:
            print("✅ Login endpoint working (401 expected for invalid credentials)")
        elif response.status_code == 400:
            print("✅ Login endpoint working (400 = validation error)")
        elif response.status_code == 500:
            print("❌ Login endpoint returning 500 error")
            print(f"Response: {response.text[:300]}...")
        else:
            print(f"ℹ️  Unexpected status: {response.status_code}")
            
        try:
            data = response.json()
            print(f"Response data: {json.dumps(data, indent=2)}")
        except:
            print(f"Response text: {response.text[:200]}...")
            
    except Exception as e:
        print(f"💥 Login test error: {str(e)}")

def main():
    print("🔍 FRONTEND AUTHENTICATION DIAGNOSIS")
    print("=" * 60)
    print(f"Started at: {datetime.now()}")
    
    check_auth_endpoints()
    test_login_flow()
    
    print("\n" + "=" * 60)
    print("🎯 ANALYSIS:")
    print("")
    print("Based on the results above:")
    print("1. If auth endpoints return 500 → Backend authentication issue")
    print("2. If auth endpoints work → Frontend token handling issue")
    print("3. If login works → Check frontend token storage/refresh logic")
    print("")
    print("💡 LIKELY CAUSE OF 500 ERRORS:")
    print("Frontend is making requests without valid auth tokens,")
    print("causing the authentication middleware to fail.")
    print("")
    print("🚀 SOLUTION:")
    print("1. Clear browser localStorage/sessionStorage")
    print("2. Ensure user logs in properly before accessing protected pages")
    print("3. Fix token refresh logic in frontend")

if __name__ == "__main__":
    main()
