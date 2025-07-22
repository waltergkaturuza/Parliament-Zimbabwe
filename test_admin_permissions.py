#!/usr/bin/env python3
"""
🏛️ Parliament of Zimbabwe Fuel Coupon System
🔍 Admin API Permissions Test
🎯 Testing Admin Center API Access
"""

import requests
from datetime import datetime

# Your actual credentials
TENANT_ID = "086c4475-d0ef-4d2b-871c-4e078a083db5"
CLIENT_ID = "c26c60eb-f154-40eb-b02e-f3997e083316"
CLIENT_SECRET = "us18Q~TnKoQ5hYlKNtIAweLGoTdqX7kSdvFTIcI1"

def get_admin_token():
    """Get Azure AD access token for Business Central Admin"""
    token_url = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
    
    # Try different scopes
    scopes = [
        'https://api.businesscentral.dynamics.com/.default',
        'https://graph.microsoft.com/.default',
        'https://api.businesscentral.dynamics.com/Financials.ReadWrite.All'
    ]
    
    for scope in scopes:
        print(f"🔍 Trying scope: {scope}")
        data = {
            'grant_type': 'client_credentials',
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'scope': scope
        }
        
        response = requests.post(token_url, data=data)
        if response.status_code == 200:
            token_data = response.json()
            print(f"✅ Success with scope: {scope}")
            return token_data['access_token'], scope
        else:
            print(f"❌ Failed with scope: {scope} - {response.status_code}")
    
    return None, None

def test_admin_permissions():
    """Test admin permissions and environment access"""
    print("=" * 80)
    print("🏛️  PARLIAMENT OF ZIMBABWE FUEL COUPON SYSTEM")
    print("🔍 Admin API Permissions Test")
    print("=" * 80)
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Get access token
    print("🔗 Getting Azure AD access token...")
    token, used_scope = get_admin_token()
    if not token:
        print("❌ Could not get any valid token")
        return
    
    print(f"✅ Access token obtained with scope: {used_scope}")
    print(f"Token: {token[:30]}...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
    
    # Test admin endpoints
    admin_tests = [
        ("Environments", "https://api.businesscentral.dynamics.com/admin/v2.1/applications/businesscentral/environments"),
        ("Apps", f"https://api.businesscentral.dynamics.com/admin/v2.1/applications/businesscentral/environments/Production/apps"),
        ("Permissions", f"https://api.businesscentral.dynamics.com/admin/v2.1/applications/businesscentral/environments/Production/settings"),
    ]
    
    print(f"\n📊 Testing Admin API Endpoints:")
    print("-" * 50)
    
    for name, url in admin_tests:
        try:
            print(f"🔍 Testing {name}...")
            print(f"   URL: {url}")
            
            admin_headers = headers.copy()
            admin_headers['Api-Version'] = '2.1'
            
            response = requests.get(url, headers=admin_headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {name}: SUCCESS")
                
                if name == "Environments" and 'value' in data:
                    print(f"   📊 Found {len(data['value'])} environments:")
                    for env in data['value']:
                        print(f"      🌍 {env.get('name', 'N/A')} ({env.get('type', 'N/A')}) - {env.get('status', 'N/A')}")
                        
                elif name == "Apps" and 'value' in data:
                    print(f"   📦 Found {len(data['value'])} apps")
                    
            else:
                print(f"⚠️  {name}: {response.status_code}")
                print(f"   Error: {response.text[:200]}...")
                
        except Exception as e:
            print(f"❌ {name}: Exception - {str(e)}")
    
    # Test direct data access with different approaches
    print(f"\n🔧 Testing Direct Data Access...")
    
    data_urls = [
        f"https://api.businesscentral.dynamics.com/v2.0/{TENANT_ID}/Production/api/v2.0/companies",
        f"https://api.businesscentral.dynamics.com/v2.0/{TENANT_ID}/Production/OData/Company",
        f"https://businesscentral.api.dynamics.com/v1.0/{TENANT_ID}/Production/api/v1.0/companies"
    ]
    
    for i, url in enumerate(data_urls, 1):
        try:
            print(f"🔍 Testing approach {i}...")
            print(f"   URL: {url}")
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Approach {i}: SUCCESS!")
                if 'value' in data:
                    print(f"   📊 Found {len(data['value'])} items")
            else:
                print(f"⚠️  Approach {i}: {response.status_code}")
                if response.status_code == 401:
                    print("   🔐 Authentication issue - need more permissions")
                elif response.status_code == 403:
                    print("   🚫 Access denied - check app registration")
                    
        except Exception as e:
            print(f"❌ Approach {i}: {str(e)}")
    
    print("\n" + "=" * 80)
    print("💡 NEXT STEPS:")
    print("1. In Business Central Admin Center:")
    print("   - Click on 'Production' environment")
    print("   - Look for 'Applications' or 'API Access'")
    print("   - Add your app registration")
    print("2. Or we may need to use different API endpoints")
    print("=" * 80)

if __name__ == "__main__":
    test_admin_permissions()
