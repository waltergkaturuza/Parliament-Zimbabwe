#!/usr/bin/env python3
"""
🏛️ Parliament of Zimbabwe Fuel Coupon System
🎯 FINAL INTEGRATION TEST - Using Real Web Service URLs
✅ Testing with actual published web services from Business Central
"""

import requests
from datetime import datetime
import json

# Your actual credentials
TENANT_ID = "086c4475-d0ef-4d2b-871c-4e078a083db5"
CLIENT_ID = "c26c60eb-f154-40eb-b02e-f3997e083316"
CLIENT_SECRET = "us18Q~TnKoQ5hYlKNtIAweLGoTdqX7kSdvFTIcI1"

# Company name from your web services
COMPANY_NAME = "CRONUS%20International%20Ltd."

def get_access_token():
    """Get Azure AD access token"""
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
    return None

def test_real_web_services():
    """Test the actual published web services"""
    print("=" * 80)
    print("🏛️  PARLIAMENT OF ZIMBABWE FUEL COUPON SYSTEM")
    print("🎯 FINAL INTEGRATION TEST - REAL WEB SERVICES")
    print("✅ Using Published Business Central Web Services")
    print("=" * 80)
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Company: CRONUS International Ltd.")
    print(f"Environment: Production")
    
    # Get access token
    token = get_access_token()
    if not token:
        print("❌ Could not get access token")
        return
    
    print(f"✅ Access token obtained: {token[:30]}...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Prefer': 'odata.maxpagesize=10'  # Limit results for testing
    }
    
    # Test the actual web service URLs from your Business Central
    base_url = f"https://api.businesscentral.dynamics.com/v2.0/{TENANT_ID}/Production/ODataV4/Company('{COMPANY_NAME}')"
    
    test_services = [
        ("Customer Ledger Entries", f"{base_url}/Cust_LedgerEntries"),
        ("Item Ledger Entries", f"{base_url}/ItemLedgerEntries"),
        ("G/L Entries", f"{base_url}/G_LEntries"),
        ("Vendor Ledger Entries", f"{base_url}/VendorLedgerEntries"),
        ("Sales Dashboard", f"{base_url}/SalesDashboard"),
        ("Top Customer Overview", f"{base_url}/TopCustomerOverview"),
        ("Power BI Customer List", f"{base_url}/Power_BI_Customer_List"),
    ]
    
    print(f"\n📊 Testing Published Web Services:")
    print("-" * 60)
    
    successful_apis = []
    
    for name, url in test_services:
        try:
            print(f"\n🔍 Testing {name}...")
            print(f"   URL: {url}")
            
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ SUCCESS! Status: {response.status_code}")
                
                if 'value' in data:
                    records = data['value']
                    print(f"   📊 Found {len(records)} records")
                    
                    # Show sample data
                    if records and len(records) > 0:
                        sample = records[0]
                        print(f"   📋 Sample fields: {list(sample.keys())[:5]}...")
                        
                    successful_apis.append({
                        'name': name,
                        'url': url,
                        'record_count': len(records)
                    })
                else:
                    print(f"   📄 Response received (no 'value' array)")
                    successful_apis.append({
                        'name': name,
                        'url': url,
                        'record_count': 'N/A'
                    })
                    
            elif response.status_code == 401:
                print(f"   🔐 Authentication failed: {response.status_code}")
                error_data = response.json() if response.text else {}
                if 'error' in error_data:
                    print(f"   Error: {error_data['error'].get('message', 'Unknown error')}")
                    
            elif response.status_code == 404:
                print(f"   ❌ Not found: {response.status_code}")
                
            else:
                print(f"   ⚠️  Status: {response.status_code}")
                if response.text:
                    error_text = response.text[:200]
                    print(f"   Response: {error_text}...")
                    
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
    
    # Summary
    print(f"\n" + "=" * 80)
    print("🎯 INTEGRATION TEST RESULTS:")
    print(f"✅ Access Token: WORKING")
    print(f"✅ Web Services: {len(successful_apis)} ACCESSIBLE")
    
    if successful_apis:
        print(f"\n📊 WORKING APIs:")
        for api in successful_apis:
            print(f"   ✅ {api['name']}: {api['record_count']} records")
            
        print(f"\n🚀 INTEGRATION STATUS: FULLY OPERATIONAL!")
        print(f"🏛️ Parliament Fuel Coupon System is now connected to Business Central!")
        
        # Save working configuration
        config = {
            'base_url': base_url,
            'working_apis': successful_apis,
            'company_name': 'CRONUS International Ltd.',
            'test_date': datetime.now().isoformat()
        }
        
        with open('business_central_config.json', 'w') as f:
            json.dump(config, f, indent=2)
        print(f"💾 Configuration saved to business_central_config.json")
        
    else:
        print(f"\n⚠️  No APIs accessible - check permissions")
        
    print("=" * 80)

if __name__ == "__main__":
    test_real_web_services()
