#!/usr/bin/env python3
"""
Debug token validation and API authentication
"""
import requests
import json
import base64

# Backend URL
BACKEND_URL = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

def decode_jwt_payload(token):
    """Decode JWT payload without verification (for debugging)"""
    try:
        # Split the token
        parts = token.split('.')
        if len(parts) != 3:
            return "Invalid JWT format"
        
        # Decode the payload (middle part)
        payload = parts[1]
        # Add padding if needed
        padding = 4 - len(payload) % 4
        if padding != 4:
            payload += '=' * padding
        
        decoded_bytes = base64.urlsafe_b64decode(payload)
        decoded_payload = json.loads(decoded_bytes.decode('utf-8'))
        return decoded_payload
    except Exception as e:
        return f"Error decoding: {str(e)}"

def test_token_validation():
    """Test token validation with detailed debugging"""
    print("🔍 TESTING TOKEN VALIDATION")
    print("=" * 50)
    
    # Login first
    login_data = {
        "username": "admin",
        "password": "Admin@123"
    }
    
    try:
        # Step 1: Login
        login_response = requests.post(
            f"{BACKEND_URL}/api/v1/auth/login/",
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.text}")
            return
        
        login_result = login_response.json()
        access_token = login_result.get('access')
        
        print("✅ Login successful!")
        print(f"🔑 Full Access Token: {access_token}")
        
        # Decode and examine the token
        payload = decode_jwt_payload(access_token)
        print(f"📋 Token Payload: {json.dumps(payload, indent=2)}")
        
        # Test different header formats
        test_cases = [
            {"Authorization": f"Bearer {access_token}"},
            {"Authorization": f"JWT {access_token}"},
            {"Authorization": f"Token {access_token}"},
            {"X-Authorization": f"Bearer {access_token}"},
        ]
        
        for i, headers in enumerate(test_cases, 1):
            print(f"\n🧪 Test Case {i}: {list(headers.keys())[0]} header")
            print(f"   Header: {list(headers.values())[0][:50]}...")
            
            try:
                response = requests.get(
                    f"{BACKEND_URL}/api/v1/dashboard/",
                    headers=headers,
                    timeout=10
                )
                print(f"   Status: {response.status_code}")
                if response.status_code != 200:
                    print(f"   Error: {response.text[:100]}")
                else:
                    print("   ✅ Success!")
                    
            except Exception as e:
                print(f"   💥 Request failed: {str(e)}")
        
        # Test with cookies (session auth)
        print(f"\n🍪 Testing with session cookies...")
        session = requests.Session()
        # First login to get session
        login_with_session = session.post(
            f"{BACKEND_URL}/api/v1/auth/login/",
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if login_with_session.status_code == 200:
            # Try dashboard with session cookies
            dashboard_with_session = session.get(
                f"{BACKEND_URL}/api/v1/dashboard/",
                timeout=10
            )
            print(f"   Session Status: {dashboard_with_session.status_code}")
            if dashboard_with_session.status_code != 200:
                print(f"   Session Error: {dashboard_with_session.text[:100]}")
            else:
                print("   ✅ Session Success!")
        
        # Test token refresh
        print(f"\n🔄 Testing token refresh...")
        refresh_token = login_result.get('refresh')
        if refresh_token:
            refresh_response = requests.post(
                f"{BACKEND_URL}/api/token/refresh/",
                json={"refresh": refresh_token},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            print(f"   Refresh Status: {refresh_response.status_code}")
            if refresh_response.status_code == 200:
                new_token = refresh_response.json().get('access')
                print(f"   New Token: {new_token[:50]}...")
            else:
                print(f"   Refresh Error: {refresh_response.text[:100]}")
                
    except Exception as e:
        print(f"💥 Error during token test: {str(e)}")

if __name__ == "__main__":
    test_token_validation()
