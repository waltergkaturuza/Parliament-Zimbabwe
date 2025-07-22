#!/usr/bin/env python3
"""
🏛️ Parliament of Zimbabwe Fuel Coupon System
🔧 Permission Diagnosis and Alternative Auth Test
"""

import requests
from datetime import datetime

# Your actual credentials
TENANT_ID = "086c4475-d0ef-4d2b-871c-4e078a083db5"
CLIENT_ID = "c26c60eb-f154-40eb-b02e-f3997e083316"
CLIENT_SECRET = "us18Q~TnKoQ5hYlKNtIAweLGoTdqX7kSdvFTIcI1"

def test_permission_diagnosis():
    """Diagnose permission issues and test alternatives"""
    print("=" * 80)
    print("🏛️  PARLIAMENT OF ZIMBABWE")
    print("🔧 Permission Diagnosis and Alternative Authentication")
    print("=" * 80)
    
    # Test different token scopes
    scopes_to_test = [
        'https://api.businesscentral.dynamics.com/.default',
        f'https://api.businesscentral.dynamics.com/user_impersonation',
        f'https://dynamics.microsoft.com/.default',
    ]
    
    for scope in scopes_to_test:
        print(f"\n🔍 Testing scope: {scope}")
        
        token_url = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
        
        data = {
            'grant_type': 'client_credentials',
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'scope': scope
        }
        
        try:
            response = requests.post(token_url, data=data)
            if response.status_code == 200:
                token_data = response.json()
                token = token_data['access_token']
                print(f"✅ Token obtained for {scope}")
                
                # Test API access with this token
                headers = {
                    'Authorization': f'Bearer {token}',
                    'Accept': 'application/json'
                }
                
                test_url = f"https://api.businesscentral.dynamics.com/v2.0/{TENANT_ID}/Production/ODataV4/Company('CRONUS%20International%20Ltd.')/SalesDashboard?$top=1"
                
                api_response = requests.get(test_url, headers=headers, timeout=10)
                print(f"   API Test: {api_response.status_code}")
                
                if api_response.status_code == 200:
                    print(f"   🎉 SUCCESS! This scope works!")
                    data = api_response.json()
                    if 'value' in data:
                        print(f"   📊 Found {len(data['value'])} records")
                elif api_response.status_code == 401:
                    print(f"   🔐 Still authentication issue")
                else:
                    print(f"   ⚠️  Status: {api_response.status_code}")
                    
            else:
                print(f"❌ Failed to get token: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
    
    print(f"\n" + "=" * 80)
    print("💡 NEXT STEPS TO COMPLETE INTEGRATION:")
    print("1. In Business Central, search for 'Users'")
    print("2. Create new user with:")
    print(f"   - Authentication: Azure Active Directory") 
    print(f"   - User ID: {CLIENT_ID}")
    print(f"   - Assign appropriate permissions")
    print("3. OR search for 'Microsoft Entra applications'")
    print("4. Add your app registration there")
    print("=" * 80)

if __name__ == "__main__":
    test_permission_diagnosis()
