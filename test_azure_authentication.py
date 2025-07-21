#!/usr/bin/env python
"""
Azure AD Authentication Test Script
Parliament of Zimbabwe Fuel Coupon Management System

This script tests the Azure AD authentication using your app registration credentials.
"""

import os
import sys
import requests
import json
from datetime import datetime

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Your Azure AD App Registration Credentials
TENANT_ID = "086c4475-d0ef-4d2b-871c-4e078a083db5"
CLIENT_ID = "c26c60eb-f154-40eb-b02e-f3997e083316"
CLIENT_SECRET = "us18Q~TnKoQ5hYlKNtIAweLGoTdqX7kSdvFTIcI1"

# Authentication endpoints
AUTH_URL = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
BC_SCOPE = "https://api.businesscentral.dynamics.com/.default"

def test_azure_ad_authentication():
    """Test Azure AD authentication and get access token"""
    print("🔐 Testing Azure AD Authentication...")
    print(f"Tenant ID: {TENANT_ID}")
    print(f"Client ID: {CLIENT_ID}")
    print(f"Auth URL: {AUTH_URL}")
    print("-" * 60)
    
    # Prepare authentication request
    auth_data = {
        'grant_type': 'client_credentials',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'scope': BC_SCOPE
    }
    
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    try:
        print("📡 Requesting access token from Azure AD...")
        response = requests.post(AUTH_URL, data=auth_data, headers=headers)
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            
            print("✅ Authentication Successful!")
            print(f"Token Type: {token_data.get('token_type', 'N/A')}")
            print(f"Expires In: {token_data.get('expires_in', 'N/A')} seconds")
            print(f"Scope: {token_data.get('scope', 'N/A')}")
            
            # Show first and last 10 characters of token for verification
            access_token = token_data.get('access_token', '')
            if access_token:
                print(f"Access Token: {access_token[:10]}...{access_token[-10:]}")
                
                # Test token validity by calling a simple endpoint
                test_token_validity(access_token)
            
            return True
            
        else:
            print("❌ Authentication Failed!")
            print(f"Error: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network Error: {e}")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ JSON Decode Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return False

def test_token_validity(access_token):
    """Test if the access token is valid by making a simple API call"""
    print("\n🔍 Testing token validity...")
    
    # Try to access Business Central API discovery endpoint
    bc_discovery_url = f"https://api.businesscentral.dynamics.com/v2.0/{TENANT_ID}"
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json'
    }
    
    try:
        response = requests.get(bc_discovery_url, headers=headers)
        
        print(f"Discovery API Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Token is valid! Business Central API accessible.")
            data = response.json()
            
            # Show available environments
            if 'value' in data:
                print(f"Available environments: {len(data['value'])}")
                for env in data['value'][:3]:  # Show first 3 environments
                    print(f"  - {env.get('displayName', 'Unknown')} ({env.get('type', 'Unknown')})")
        else:
            print(f"⚠️  Token validation inconclusive. Status: {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            
    except Exception as e:
        print(f"⚠️  Token validation error: {e}")

def main():
    """Main test function"""
    print("=" * 60)
    print("🏛️  PARLIAMENT OF ZIMBABWE FUEL COUPON SYSTEM")
    print("🔗 Microsoft Dynamics 365 Business Central Integration")
    print("🧪 Azure AD Authentication Test")
    print("=" * 60)
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    success = test_azure_ad_authentication()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 AUTHENTICATION TEST PASSED!")
        print("✅ Your Azure AD app registration is working correctly.")
        print("✅ You can proceed with Business Central integration.")
        print("\nNext Steps:")
        print("1. Set up Business Central environment")
        print("2. Configure API permissions")
        print("3. Test Business Central API endpoints")
    else:
        print("❌ AUTHENTICATION TEST FAILED!")
        print("Please check your credentials and try again.")
    print("=" * 60)

if __name__ == "__main__":
    main()
