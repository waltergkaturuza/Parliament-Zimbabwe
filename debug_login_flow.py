#!/usr/bin/env python3
"""
Debug login flow to identify dashboard flashing issue
"""
import requests
import json

# Backend URL
BACKEND_URL = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

def test_login_flow():
    """Test the complete login flow"""
    print("🔍 TESTING LOGIN FLOW")
    print("=" * 50)
    
    # Test login with sample credentials
    login_data = {
        "username": "admin",  # Change to your test username
        "password": "Admin@123"  # Change to your test password
    }
    
    print(f"📝 Attempting login with username: {login_data['username']}")
    
    try:
        # Step 1: Login
        login_response = requests.post(
            f"{BACKEND_URL}/api/v1/auth/login/",
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"🔐 Login Response Status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            print("✅ Login successful!")
            print(f"🔑 Access Token: {login_result.get('access', 'NOT FOUND')[:50]}...")
            print(f"🔄 Refresh Token: {login_result.get('refresh', 'NOT FOUND')[:50]}...")
            
            access_token = login_result.get('access')
            if not access_token:
                print("❌ ERROR: No access token in login response!")
                return
            
            # Step 2: Test dashboard endpoints with token
            headers = {'Authorization': f'Bearer {access_token}'}
            
            print(f"\n📊 Testing dashboard endpoints with token...")
            
            # Test main dashboard
            dashboard_response = requests.get(
                f"{BACKEND_URL}/api/v1/dashboard/",
                headers=headers,
                timeout=10
            )
            print(f"📈 Dashboard endpoint: {dashboard_response.status_code}")
            if dashboard_response.status_code == 200:
                print("✅ Dashboard data retrieved successfully")
            else:
                print(f"❌ Dashboard failed: {dashboard_response.text[:200]}")
            
            # Test admin dashboard
            admin_dashboard_response = requests.get(
                f"{BACKEND_URL}/api/v1/admin/dashboard/",
                headers=headers,
                timeout=10
            )
            print(f"👑 Admin Dashboard endpoint: {admin_dashboard_response.status_code}")
            if admin_dashboard_response.status_code == 200:
                print("✅ Admin dashboard data retrieved successfully")
            else:
                print(f"❌ Admin dashboard failed: {admin_dashboard_response.text[:200]}")
            
            # Test statistics endpoint
            stats_response = requests.get(
                f"{BACKEND_URL}/api/v1/statistics/",
                headers=headers,
                timeout=10
            )
            print(f"📊 Statistics endpoint: {stats_response.status_code}")
            if stats_response.status_code == 200:
                print("✅ Statistics data retrieved successfully")
            else:
                print(f"❌ Statistics failed: {stats_response.text[:200]}")
                
            print(f"\n🔍 DIAGNOSIS:")
            if (dashboard_response.status_code == 200 and 
                admin_dashboard_response.status_code == 200 and 
                stats_response.status_code == 200):
                print("✅ Backend authentication and data retrieval working correctly!")
                print("🤔 Dashboard flashing issue is likely on the frontend side:")
                print("   - Check AuthContext token handling")
                print("   - Check React Router navigation logic")
                print("   - Check useEffect dependencies in dashboard components")
                print("   - Check for rapid logout/login cycles")
            else:
                print("❌ Backend issues detected - API calls failing with valid token")
                
        else:
            error_text = login_response.text
            print(f"❌ Login failed: {error_text}")
            
    except Exception as e:
        print(f"💥 Error during login test: {str(e)}")

if __name__ == "__main__":
    test_login_flow()
