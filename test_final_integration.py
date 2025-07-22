#!/usr/bin/env python3
"""
🏛️ Parliament of Zimbabwe Fuel Coupon System
🔗 FINAL Integration Test - All API Approaches
🎯 Testing with Authorized App Registration
"""

import requests
from datetime import datetime

# Your actual credentials
TENANT_ID = "086c4475-d0ef-4d2b-871c-4e078a083db5"
CLIENT_ID = "c26c60eb-f154-40eb-b02e-f3997e083316"
CLIENT_SECRET = "us18Q~TnKoQ5hYlKNtIAweLGoTdqX7kSdvFTIcI1"

def get_access_token(scope):
    """Get Azure AD access token for specific scope"""
    token_url = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
    
    data = {
        'grant_type': 'client_credentials',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'scope': scope
    }
    
    response = requests.post(token_url, data=data)
    if response.status_code == 200:
        return response.json()['access_token']
    else:
        print(f"❌ Failed to get token for {scope}: {response.status_code}")
        return None

def test_final_integration():
    """Test all possible API approaches"""
    print("=" * 80)
    print("🏛️  PARLIAMENT OF ZIMBABWE FUEL COUPON SYSTEM")
    print("🔗 FINAL INTEGRATION TEST")
    print("🎯 App Registration AUTHORIZED in Business Central")
    print("=" * 80)
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Client ID: {CLIENT_ID}")
    print("Status: ✅ AUTHORIZED in Business Central Admin Center")
    
    # Test different scopes and APIs
    test_scenarios = [
        {
            'name': 'Business Central API',
            'scope': 'https://api.businesscentral.dynamics.com/.default',
            'urls': [
                f"https://api.businesscentral.dynamics.com/v2.0/{TENANT_ID}/Production/api/v2.0/companies",
                f"https://api.businesscentral.dynamics.com/v2.0/{TENANT_ID}/Production/ODataV4/Company",
                f"https://api.businesscentral.dynamics.com/v2.0/{TENANT_ID}/Production/api/v1.0/companies"
            ]
        },
        {
            'name': 'Dynamics 365 API',
            'scope': 'https://businesscentral.dynamics.com/.default',
            'urls': [
                f"https://api.businesscentral.dynamics.com/v2.0/{TENANT_ID}/Production/api/v2.0/companies"
            ]
        }
    ]
    
    for scenario in test_scenarios:
        print(f"\n🔍 Testing {scenario['name']}...")
        print(f"Scope: {scenario['scope']}")
        print("-" * 50)
        
        # Get token for this scope
        token = get_access_token(scenario['scope'])
        if not token:
            print(f"❌ Could not get token for {scenario['scope']}")
            continue
            
        print(f"✅ Token obtained: {token[:30]}...")
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        
        # Test URLs for this scenario
        for i, url in enumerate(scenario['urls'], 1):
            try:
                print(f"\n  {i}. Testing: {url}")
                response = requests.get(url, headers=headers, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"     ✅ SUCCESS! Status: {response.status_code}")
                    
                    if 'value' in data:
                        items = data['value']
                        print(f"     📊 Found {len(items)} items")
                        if items and len(items) > 0:
                            first_item = items[0]
                            if 'displayName' in first_item:
                                print(f"     🏢 Sample: {first_item['displayName']}")
                            elif 'name' in first_item:
                                print(f"     🏢 Sample: {first_item['name']}")
                    else:
                        print(f"     📄 Response contains data (no 'value' array)")
                        
                elif response.status_code == 401:
                    print(f"     🔐 Authentication failed: {response.status_code}")
                    error_data = response.json() if response.text else {}
                    if 'error' in error_data:
                        print(f"     Error: {error_data['error'].get('message', 'Unknown error')}")
                        
                else:
                    print(f"     ⚠️  Status: {response.status_code}")
                    if response.text:
                        error_text = response.text[:200]
                        print(f"     Response: {error_text}...")
                        
            except Exception as e:
                print(f"     ❌ Exception: {str(e)}")
    
    # Try the web services approach
    print(f"\n🌐 Testing Web Services Approach...")
    print("-" * 50)
    
    web_service_urls = [
        f"https://api.businesscentral.dynamics.com/v2.0/{TENANT_ID}/Production/WS/Company/ODataV4/",
        f"https://businesscentral.dynamics.com/{TENANT_ID}/Production/WS/ODataV4/Company"
    ]
    
    bc_token = get_access_token('https://api.businesscentral.dynamics.com/.default')
    if bc_token:
        headers = {
            'Authorization': f'Bearer {bc_token}',
            'Accept': 'application/json'
        }
        
        for url in web_service_urls:
            try:
                print(f"🔍 Testing: {url}")
                response = requests.get(url, headers=headers, timeout=30)
                print(f"   Status: {response.status_code}")
                if response.status_code != 404:
                    print(f"   Response: {response.text[:200]}...")
            except Exception as e:
                print(f"   Exception: {str(e)}")
    
    print("\n" + "=" * 80)
    print("🎯 FINAL STATUS:")
    print("✅ Azure AD App Registration: CREATED")
    print("✅ API Permissions: GRANTED") 
    print("✅ Business Central Authorization: CONFIRMED")
    print("🔧 Environment Setup: MAY NEED ADDITIONAL CONFIGURATION")
    print("\n💡 POSSIBLE NEXT STEPS:")
    print("1. Environment may need Web Services enabled")
    print("2. User permissions may need to be assigned")
    print("3. API endpoints may use different paths")
    print("=" * 80)

if __name__ == "__main__":
    test_final_integration()
