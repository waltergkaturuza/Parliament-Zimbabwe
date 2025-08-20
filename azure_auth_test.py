#!/usr/bin/env python3
"""
Azure Authentication Test - Test endpoints with proper authentication

This script tests if the 500 errors are related to authentication issues.
"""

import requests
import json
from datetime import datetime

def test_with_auth_headers(url, description=""):
    """Test endpoint with various authentication scenarios"""
    print(f"\n🧪 Testing: {description}")
    print(f"   URL: {url}")
    
    # Test 1: No authentication (baseline)
    try:
        response = requests.get(url, timeout=10)
        print(f"   No Auth: {response.status_code}")
    except Exception as e:
        print(f"   No Auth: Error - {e}")
    
    # Test 2: Invalid token (common frontend scenario)
    try:
        headers = {"Authorization": "Bearer invalid_token_123"}
        response = requests.get(url, headers=headers, timeout=10)
        print(f"   Invalid Token: {response.status_code}")
        
        if response.status_code == 500:
            print("   ❌ FOUND THE ISSUE! Invalid token causes 500 error")
            print(f"   Response: {response.text[:200]}...")
            
    except Exception as e:
        print(f"   Invalid Token: Error - {e}")
    
    # Test 3: Malformed authorization header
    try:
        headers = {"Authorization": "InvalidFormat"}
        response = requests.get(url, headers=headers, timeout=10)
        print(f"   Malformed Auth: {response.status_code}")
        
        if response.status_code == 500:
            print("   ❌ FOUND THE ISSUE! Malformed auth header causes 500 error")
            print(f"   Response: {response.text[:200]}...")
            
    except Exception as e:
        print(f"   Malformed Auth: Error - {e}")
    
    # Test 4: Empty authorization header
    try:
        headers = {"Authorization": ""}
        response = requests.get(url, headers=headers, timeout=10)
        print(f"   Empty Auth: {response.status_code}")
        
        if response.status_code == 500:
            print("   ❌ FOUND THE ISSUE! Empty auth header causes 500 error")
            print(f"   Response: {response.text[:200]}...")
            
    except Exception as e:
        print(f"   Empty Auth: Error - {e}")

def main():
    base_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    
    print("🔐 AZURE AUTHENTICATION ERROR DIAGNOSIS")
    print("=" * 60)
    print(f"Testing authentication scenarios at: {base_url}")
    print(f"Started at: {datetime.now()}")
    
    # Test the problematic endpoints with different auth scenarios
    endpoints = [
        ("/api/v1/analytics/received-breakdown/?period=month", "Analytics Received Breakdown"),
        ("/api/v1/boxes/", "Boxes API"),
    ]
    
    for endpoint, description in endpoints:
        test_with_auth_headers(f"{base_url}{endpoint}", description)
    
    print("\n" + "=" * 60)
    print("🎯 DIAGNOSIS RESULTS:")
    print("")
    print("If we found 500 errors with invalid tokens above, the issue is:")
    print("1. ❌ JWT token validation is failing and causing 500 errors")
    print("2. ❌ Authentication middleware not handling invalid tokens gracefully")
    print("3. ❌ Frontend is sending malformed or expired tokens")
    print("")
    print("🚀 SOLUTION:")
    print("1. Fix JWT authentication middleware to return 401 instead of 500")
    print("2. Add better error handling in authentication views")
    print("3. Check frontend token storage and refresh logic")

if __name__ == "__main__":
    main()
