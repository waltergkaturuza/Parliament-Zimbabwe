#!/usr/bin/env python
"""
Production Deployment Verification Script
Verifies that the deployed system matches the local working state
"""

import requests
import time
import json

# Render Production URLs
BACKEND_URL = "https://parliament-zimbabwe-backend.onrender.com"
FRONTEND_URL = "https://parliament-zimbabwe-frontend.onrender.com"

def test_production_deployment():
    print("🚀 PRODUCTION DEPLOYMENT VERIFICATION")
    print("="*50)
    
    # Test 1: Backend Health Check
    print("\n1. Testing Backend Health...")
    try:
        health_response = requests.get(f"{BACKEND_URL}/api/v1/home/health/", timeout=30)
        print(f"   ✅ Backend Health: {health_response.status_code}")
        if health_response.status_code == 200:
            health_data = health_response.json()
            print(f"   📊 Health Status: {health_data.get('status', 'Unknown')}")
        else:
            print(f"   ❌ Health Check Failed: {health_response.text[:100]}")
    except Exception as e:
        print(f"   ❌ Backend Health Error: {e}")
    
    # Test 2: Backend Authentication Endpoint
    print("\n2. Testing Authentication Endpoint...")
    try:
        # Test login with admin credentials
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        login_response = requests.post(f"{BACKEND_URL}/api/v1/auth/login/", 
                                     json=login_data, timeout=30)
        print(f"   ✅ Login Endpoint: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            access_token = login_result.get('access_token')
            print(f"   🔑 Token Received: {'Yes' if access_token else 'No'}")
            
            # Test 3: Roles API with Authentication
            if access_token:
                print("\n3. Testing Roles API...")
                headers = {'Authorization': f'Bearer {access_token}'}
                roles_response = requests.get(f"{BACKEND_URL}/api/v1/auth/roles/", 
                                            headers=headers, timeout=30)
                print(f"   ✅ Roles API: {roles_response.status_code}")
                
                if roles_response.status_code == 200:
                    roles_data = roles_response.json()
                    roles = roles_data.get('roles', [])
                    print(f"   📋 Roles Count: {len(roles)}")
                    
                    # Check for SERGEANT_OF_ARMS specifically
                    sergeant_found = any(role['code'] == 'SERGEANT_OF_ARMS' for role in roles)
                    print(f"   🎯 SERGEANT_OF_ARMS: {'✅ Found' if sergeant_found else '❌ Missing'}")
                    
                    if sergeant_found:
                        print("   📝 All Roles:")
                        for role in roles:
                            marker = "🎯" if role['code'] == 'SERGEANT_OF_ARMS' else "   "
                            print(f"     {marker} {role['code']} -> {role['name']}")
                else:
                    print(f"   ❌ Roles API Failed: {roles_response.text[:100]}")
        else:
            print(f"   ❌ Login Failed: {login_response.text[:100]}")
    except Exception as e:
        print(f"   ❌ Authentication Error: {e}")
    
    # Test 4: Frontend Accessibility
    print("\n4. Testing Frontend...")
    try:
        frontend_response = requests.get(FRONTEND_URL, timeout=30)
        print(f"   ✅ Frontend: {frontend_response.status_code}")
        if frontend_response.status_code == 200:
            content_length = len(frontend_response.content)
            print(f"   📄 Content Size: {content_length} bytes")
            has_react = b"react" in frontend_response.content.lower()
            print(f"   ⚛️  React Detected: {'Yes' if has_react else 'No'}")
        else:
            print(f"   ❌ Frontend Failed: {frontend_response.text[:100]}")
    except Exception as e:
        print(f"   ❌ Frontend Error: {e}")
    
    # Test 5: CORS Configuration
    print("\n5. Testing CORS Configuration...")
    try:
        cors_headers = {
            'Origin': FRONTEND_URL,
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Authorization'
        }
        cors_response = requests.options(f"{BACKEND_URL}/api/v1/auth/roles/", 
                                       headers=cors_headers, timeout=30)
        print(f"   ✅ CORS Preflight: {cors_response.status_code}")
        
        cors_allow_origin = cors_response.headers.get('Access-Control-Allow-Origin', 'Not Set')
        print(f"   🌐 CORS Allow Origin: {cors_allow_origin}")
        
        if FRONTEND_URL in cors_allow_origin or cors_allow_origin == '*':
            print(f"   ✅ CORS Properly Configured")
        else:
            print(f"   ⚠️  CORS May Need Adjustment")
            
    except Exception as e:
        print(f"   ❌ CORS Test Error: {e}")
    
    print("\n" + "="*50)
    print("🎯 DEPLOYMENT VERIFICATION COMPLETE")
    print("\n💡 Next Steps:")
    print(f"1. Visit Frontend: {FRONTEND_URL}")
    print(f"2. Login with: admin / admin123")
    print(f"3. Go to: Admin → User Management")
    print(f"4. Verify: SERGEANT_OF_ARMS role appears in dropdowns")
    print(f"5. Test: All sergeant features accessible")
    print("\n🚀 Production URLs:")
    print(f"   Frontend: {FRONTEND_URL}")
    print(f"   Backend:  {BACKEND_URL}")

if __name__ == "__main__":
    test_production_deployment()
