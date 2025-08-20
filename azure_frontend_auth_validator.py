#!/usr/bin/env python3
"""
Frontend Auth Fix Validator

This script helps validate that the axios interceptor fix resolves
the authentication issues causing apparent 500 errors.
"""

import requests
import json
from datetime import datetime

def test_protected_endpoints_unauthenticated():
    """Test protected endpoints without authentication"""
    base_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    
    print("🔒 TESTING PROTECTED ENDPOINTS (No Auth)")
    print("=" * 50)
    
    # These are the endpoints user mentioned as having 500 errors
    endpoints = [
        "/api/v1/analytics/received-breakdown/",
        "/api/v1/analytics/available-by-center/", 
        "/api/v1/boxes/",
        "/api/v1/fuel-coupons/",
        "/api/v1/centers/"
    ]
    
    for endpoint in endpoints:
        print(f"\n🧪 Testing: {endpoint}")
        
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=10)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 401:
                print("   ✅ Correct behavior (401 = Authentication required)")
            elif response.status_code == 500:
                print("   ❌ Backend error (500 = Server issue)")
                print(f"   Error: {response.text[:200]}...")
            elif response.status_code == 200:
                print("   ⚠️  Unexpected success (should require auth)")
            else:
                print(f"   ℹ️  Status {response.status_code}: {response.text[:100]}...")
                
        except Exception as e:
            print(f"   💥 Request failed: {str(e)}")

def test_frontend_auth_flow():
    """Test the frontend authentication flow"""
    print("\n🔄 FRONTEND AUTH FLOW TEST")
    print("=" * 50)
    
    print("To test if the axios interceptor fix works:")
    print("")
    print("1. 🌐 Open browser and navigate to:")
    print("   https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net")
    print("")
    print("2. 🧹 Clear browser data:")
    print("   - Open DevTools (F12)")
    print("   - Go to Application/Storage tab")
    print("   - Clear localStorage and sessionStorage")
    print("   - Clear cookies for the site")
    print("")
    print("3. 🔐 Try to access main center pages:")
    print("   - Click on 'Analytics' or similar protected pages")
    print("   - Watch Network tab in DevTools")
    print("")
    print("4. 🔍 What to look for:")
    print("   ✅ Should see 401 responses (not 500)")
    print("   ✅ Should redirect to login page")
    print("   ❌ Should NOT see infinite requests")
    print("   ❌ Should NOT see 500 errors")
    print("")
    print("5. 🧪 Test login flow:")
    print("   - Log in with valid credentials")
    print("   - Try accessing protected pages again")
    print("   - Should work without errors")

def check_axios_interceptor_fix():
    """Check if the axios interceptor fix is properly deployed"""
    print("\n🔧 AXIOS INTERCEPTOR FIX VERIFICATION")
    print("=" * 50)
    
    # Read the current axios interceptor code
    frontend_api_file = "c:/Users/Administrator/Documents/POZ/fuel_coupon_system/fuel-coupon-frontend/src/api/index.ts"
    
    try:
        with open(frontend_api_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        print("✅ Checking axios interceptor implementation...")
        
        # Check for the fix
        if "fetch(refreshUrl" in content and "refreshing = true" in content:
            print("✅ Axios interceptor fix is present")
            print("   - Uses fetch() for token refresh (prevents recursion)")
            print("   - Has refreshing flag to prevent multiple refresh attempts")
        else:
            print("❌ Axios interceptor fix may not be applied properly")
            
        # Check for potential issues
        if "instance.post" in content and "refresh" in content:
            print("⚠️  Warning: Found axios instance being used for refresh")
            print("   This could still cause infinite recursion")
            
    except FileNotFoundError:
        print("❌ Frontend api file not found")
        print("   Make sure the frontend code is present")

def main():
    print("🔧 FRONTEND AUTHENTICATION FIX VALIDATOR")
    print("=" * 60)
    print(f"Started at: {datetime.now()}")
    
    # Test backend behavior
    test_protected_endpoints_unauthenticated()
    
    # Check the fix implementation
    check_axios_interceptor_fix()
    
    # Provide frontend testing instructions
    test_frontend_auth_flow()
    
    print("\n" + "=" * 60)
    print("🎯 SUMMARY:")
    print("")
    print("If backend returns 401 (not 500) for protected endpoints,")
    print("and the axios interceptor fix is present, then:")
    print("")
    print("✅ The apparent '500 errors' were frontend authentication issues")
    print("✅ The fix should resolve infinite recursion in token refresh")
    print("✅ Users should now see proper login redirects instead of errors")
    print("")
    print("🚀 NEXT STEPS:")
    print("1. Deploy the frontend changes")
    print("2. Test in browser with cleared storage")
    print("3. Verify login flow works properly")
    print("4. Monitor for any remaining authentication issues")

if __name__ == "__main__":
    main()
