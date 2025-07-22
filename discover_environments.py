#!/usr/bin/env python3
"""
🏛️ Parliament of Zimbabwe Fuel Coupon System
🔍 Business Central Environment Discovery
"""

import requests
from datetime import datetime

# Your actual credentials
TENANT_ID = "086c4475-d0ef-4d2b-871c-4e078a083db5"
CLIENT_ID = "c26c60eb-f154-40eb-b02e-f3997e083316"
CLIENT_SECRET = "us18Q~TnKoQ5hYlKNtIAweLGoTdqX7kSdvFTIcI1"

def get_access_token():
    """Get Azure AD access token for Business Central"""
    token_url = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
    
    data = {
        'grant_type': 'client_credentials',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'scope': 'https://api.businesscentral.dynamics.com/.default'
    }
    
    response = requests.post(token_url, data=data)
    if response.status_code == 200:
        return response.json()['access_token']
    else:
        print(f"❌ Failed to get token: {response.status_code}")
        print(response.text)
        return None

def discover_environments():
    """Discover available Business Central environments"""
    print("=" * 80)
    print("🏛️  PARLIAMENT OF ZIMBABWE FUEL COUPON SYSTEM")
    print("🔍 Business Central Environment Discovery")
    print("=" * 80)
    print(f"Discovery Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Get access token
    print("🔗 Getting Azure AD access token...")
    token = get_access_token()
    if not token:
        return
    
    print(f"✅ Access token obtained: {token[:30]}...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
    
    # Try different API approaches
    base_urls = [
        f"https://api.businesscentral.dynamics.com/v2.0/{TENANT_ID}",
        f"https://api.businesscentral.dynamics.com/v2.0",
        f"https://api.businesscentral.dynamics.com/admin/v2.1/applications/BusinessCentral/environments"
    ]
    
    print("\n🔍 Discovering environments...")
    print("-" * 50)
    
    for i, url in enumerate(base_urls, 1):
        try:
            print(f"\n{i}. Testing: {url}")
            response = requests.get(url, headers=headers, timeout=30)
            
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"   ✅ Success! Found data:")
                    if isinstance(data, dict):
                        for key, value in data.items():
                            if isinstance(value, list):
                                print(f"      {key}: {len(value)} items")
                            else:
                                print(f"      {key}: {str(value)[:100]}...")
                    else:
                        print(f"      Data type: {type(data)}")
                except:
                    print(f"   Response text: {response.text[:200]}...")
            else:
                print(f"   ❌ Error: {response.text[:200]}...")
                
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
    
    # Try to access the admin center
    print("\n🔧 Trying Business Central Admin Center API...")
    admin_headers = headers.copy()
    admin_headers['Api-Version'] = '2.1'
    
    admin_url = f"https://api.businesscentral.dynamics.com/admin/v2.1/applications/businesscentral/environments"
    
    try:
        print(f"Admin URL: {admin_url}")
        response = requests.get(admin_url, headers=admin_headers, timeout=30)
        print(f"Admin API Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Available Environments:")
            if 'value' in data:
                for env in data['value']:
                    print(f"   🌍 Environment: {env.get('name', 'N/A')}")
                    print(f"      Type: {env.get('type', 'N/A')}")
                    print(f"      Status: {env.get('status', 'N/A')}")
                    print(f"      Version: {env.get('applicationVersion', 'N/A')}")
                    print()
        else:
            print(f"Admin API Error: {response.text[:200]}...")
            
    except Exception as e:
        print(f"Admin API Exception: {str(e)}")
    
    print("\n" + "=" * 80)
    print("💡 NEXT STEPS:")
    print("1. Check environments in Business Central Admin Center")
    print("2. Ensure environment is properly configured")
    print("3. Verify API permissions are correctly assigned")
    print("=" * 80)

if __name__ == "__main__":
    discover_environments()
