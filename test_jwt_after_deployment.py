#!/usr/bin/env python3
"""
Test JWT authentication after Azure deployment update
"""
import requests
import json
import time

# Backend URL
BACKEND_URL = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

def test_jwt_authentication():
    """Test JWT authentication after deployment"""
    print("🔍 TESTING JWT AUTHENTICATION AFTER DEPLOYMENT")
    print("=" * 60)
    
    login_data = {
        "username": "admin",
        "password": "Admin@123"
    }
    
    max_retries = 10
    retry_delay = 30  # seconds
    
    for attempt in range(1, max_retries + 1):
        print(f"\n🔄 Attempt {attempt}/{max_retries}")
        print(f"⏰ Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            # Step 1: Login
            print("📝 Testing login...")
            login_response = requests.post(
                f"{BACKEND_URL}/api/v1/auth/login/",
                json=login_data,
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if login_response.status_code != 200:
                print(f"❌ Login failed: {login_response.status_code}")
                print(f"   Response: {login_response.text[:200]}")
                if attempt < max_retries:
                    print(f"⏳ Waiting {retry_delay} seconds before retry...")
                    time.sleep(retry_delay)
                continue
            
            login_result = login_response.json()
            access_token = login_result.get('access')
            
            if not access_token:
                print("❌ No access token received")
                continue
            
            print("✅ Login successful!")
            
            # Step 2: Test dashboard with JWT token
            print("📊 Testing dashboard endpoint with JWT...")
            headers = {'Authorization': f'Bearer {access_token}'}
            
            dashboard_response = requests.get(
                f"{BACKEND_URL}/api/v1/dashboard/",
                headers=headers,
                timeout=15
            )
            
            print(f"📈 Dashboard Status: {dashboard_response.status_code}")
            
            if dashboard_response.status_code == 200:
                print("🎉 SUCCESS! JWT authentication is working!")
                print("✅ Dashboard flashing issue should now be resolved!")
                
                # Test a few more endpoints to confirm
                endpoints_to_test = [
                    "/api/v1/admin/dashboard/",
                    "/api/v1/statistics/",
                    "/api/v1/users/",
                ]
                
                all_working = True
                for endpoint in endpoints_to_test:
                    test_response = requests.get(
                        f"{BACKEND_URL}{endpoint}",
                        headers=headers,
                        timeout=10
                    )
                    status_icon = "✅" if test_response.status_code == 200 else "❌"
                    print(f"   {status_icon} {endpoint}: {test_response.status_code}")
                    if test_response.status_code != 200:
                        all_working = False
                
                if all_working:
                    print("\n🎯 ALL ENDPOINTS WORKING!")
                    print("🔧 SOLUTION SUMMARY:")
                    print("   - Fixed JWT authentication in production settings")
                    print("   - Changed from TokenAuthentication to JWTAuthentication")
                    print("   - Added SIMPLE_JWT configuration")
                    print("   - Frontend should now work properly with Bearer tokens")
                    return True
                else:
                    print("\n⚠️ Some endpoints still having issues")
                    
            elif dashboard_response.status_code == 401:
                print("❌ Still getting 401 - JWT not configured yet")
                print(f"   Response: {dashboard_response.text[:200]}")
            else:
                print(f"❌ Unexpected status: {dashboard_response.text[:200]}")
                
        except Exception as e:
            print(f"💥 Error: {str(e)}")
        
        if attempt < max_retries:
            print(f"⏳ Waiting {retry_delay} seconds for deployment to complete...")
            time.sleep(retry_delay)
    
    print(f"\n❌ Authentication still not working after {max_retries} attempts")
    print("🔍 Check Azure deployment logs for issues")
    return False

if __name__ == "__main__":
    test_jwt_authentication()
