#!/usr/bin/env python
"""
Business Central API Test with Full Permissions
Parliament of Zimbabwe Fuel Coupon Management System
"""

import requests
import json
from datetime import datetime

# Your credentials with GRANTED permissions
TENANT_ID = "086c4475-d0ef-4d2b-871c-4e078a083db5"
CLIENT_ID = "c26c60eb-f154-40eb-b02e-f3997e083316"
CLIENT_SECRET = "us18Q~TnKoQ5hYlKNtIAweLGoTdqX7kSdvFTIcI1"

def test_business_central_api():
    """Test Business Central API with granted permissions"""
    print("🔗 Testing Business Central API with GRANTED permissions...")
    
    # Get access token
    auth_url = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
    auth_data = {
        'grant_type': 'client_credentials',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'scope': 'https://api.businesscentral.dynamics.com/.default'
    }
    
    try:
        # Get token
        response = requests.post(auth_url, data=auth_data)
        if response.status_code != 200:
            print(f"❌ Token request failed: {response.text}")
            return False
            
        token_data = response.json()
        access_token = token_data.get('access_token')
        print(f"✅ Access token obtained: {access_token[:20]}...")
        
        # Test Business Central environments
        bc_url = f"https://api.businesscentral.dynamics.com/v2.0/{TENANT_ID}"
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/json'
        }
        
        print(f"📡 Testing Business Central API: {bc_url}")
        response = requests.get(bc_url, headers=headers)
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            print("🎉 SUCCESS! Business Central API is accessible!")
            data = response.json()
            
            if 'value' in data:
                print(f"📊 Available environments: {len(data['value'])}")
                for i, env in enumerate(data['value']):
                    print(f"  {i+1}. {env.get('displayName', 'Unknown')} ({env.get('type', 'Unknown')})")
                    if env.get('type') == 'Production':
                        print(f"     🏭 Production Environment URL: {env.get('webServiceUrl', 'N/A')}")
            
            return True
        else:
            print(f"⚠️  API Response: {response.status_code}")
            print(f"Content: {response.text[:500]}...")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("=" * 80)
    print("🏛️  PARLIAMENT OF ZIMBABWE FUEL COUPON SYSTEM")
    print("🔗 Business Central API Integration Test")
    print("🎯 WITH GRANTED ADMIN PERMISSIONS")
    print("=" * 80)
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    success = test_business_central_api()
    
    print("\n" + "=" * 80)
    if success:
        print("🎉 BUSINESS CENTRAL INTEGRATION READY!")
        print("✅ API permissions working correctly")
        print("✅ Your fuel coupon system can now sync with Business Central!")
        print("\n🚀 NEXT: Start your Django server and begin real-time sync!")
        print("   python manage.py runserver")
    else:
        print("⚠️  Business Central environment setup needed")
        print("   Go to: https://businesscentral.dynamics.com")
        print("   Sign in and set up your environment")
    print("=" * 80)

if __name__ == "__main__":
    main()
