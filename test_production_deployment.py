"""
Production Test Script - Verify Box Code Fix Deployment
Test the deployed fix on Azure production environment
"""

import requests
import json
import time
from datetime import datetime

# Production configuration
PRODUCTION_URL = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
API_BASE = f"{PRODUCTION_URL}/api/v1"
LOGIN_URL = f"{API_BASE}/auth/login/"
BOXES_URL = f"{API_BASE}/boxes/"

def test_production_deployment():
    print("🧪 Testing Production Deployment - Box Code Fix")
    print("=" * 60)
    print(f"🌐 Testing: {PRODUCTION_URL}")
    print(f"📅 Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("")
    
    # Test 1: Check API availability
    print("1️⃣ Testing API Availability...")
    try:
        response = requests.get(f"{API_BASE}/", timeout=30)
        if response.status_code == 200:
            print("   ✅ Production API is online and responding")
        else:
            print(f"   ⚠️ API returned status: {response.status_code}")
    except requests.exceptions.Timeout:
        print("   ❌ API request timed out (>30s)")
        return
    except requests.exceptions.ConnectionError:
        print("   ❌ Cannot connect to production API")
        return
    except Exception as e:
        print(f"   ❌ API test failed: {str(e)}")
        return
    
    # Test 2: Authentication
    print("\n2️⃣ Testing Authentication...")
    
    # Use production credentials (you'll need to update these)
    login_data = {
        "username": "admin",  # Update with your production admin username
        "password": "your_production_password"  # Update with your production password
    }
    
    print("   ⚠️ Please update login credentials in this script for production testing")
    print("   For security, don't hardcode production passwords")
    print("   Skipping login test for now...")
    
    # Test 3: Test box creation without authentication (will fail but shows field mapping)
    print("\n3️⃣ Testing Box Creation Endpoint...")
    
    # Sample data that should work with our field mapping
    test_data = {
        "fuelType": "PETROL",
        "denomination": 20,
        "numberOfBooks": 5,
        "couponsPerBook": 20,
        "totalLitres": 2000,
        "supplier": "Production Test Company",
        "invoiceNumber": f"TEST-PROD-{int(time.time())}",
        "deliveryNote": "Production deployment test",
        "totalValueUsd": 1200.00,
        "fuelPricePerLitreUsd": 0.60,
        "exchangeRateZwgUsd": 27.5,
        "status": "RECEIVED",
        "notes": "Production test - comprehensive field mapping validation",
        "verificationNotes": "Testing deployed fix for box_code duplication"
    }
    
    try:
        # This will likely return 401 (unauthorized) but shows the endpoint is working
        response = requests.post(BOXES_URL, json=test_data, timeout=30)
        
        if response.status_code == 401:
            print("   ✅ Box endpoint is working (401 - authentication required)")
            print("   ✅ This confirms the endpoint is accessible")
        elif response.status_code == 201:
            print("   ✅ Box created successfully! (unexpected - no auth provided)")
            result = response.json()
            print(f"   📦 Generated box code: {result.get('box_code', 'N/A')}")
        elif response.status_code == 400:
            print("   ⚠️ Got 400 error - checking if it's the old duplicate error...")
            error_detail = response.json()
            if "already exists" in str(error_detail):
                print("   ❌ Still getting duplicate box_code error!")
                print("   ❌ The fix may not be deployed yet")
            else:
                print("   ✅ No duplicate error - likely validation issue")
                print(f"   📋 Error details: {error_detail}")
        else:
            print(f"   ⚠️ Unexpected status: {response.status_code}")
            print(f"   📋 Response: {response.text[:200]}...")
            
    except requests.exceptions.Timeout:
        print("   ❌ Box creation request timed out")
    except Exception as e:
        print(f"   ❌ Box creation test failed: {str(e)}")
    
    # Test 4: Check deployment timestamp
    print("\n4️⃣ Checking Deployment Status...")
    try:
        # Try to get any API response that might include version info
        response = requests.get(f"{API_BASE}/", timeout=15)
        print(f"   📊 API Response Headers:")
        for header, value in response.headers.items():
            if any(keyword in header.lower() for keyword in ['date', 'server', 'version']):
                print(f"      {header}: {value}")
    except Exception as e:
        print(f"   ⚠️ Could not check deployment headers: {str(e)}")
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 PRODUCTION TEST SUMMARY")
    print("=" * 60)
    print("✅ Completed basic connectivity tests")
    print("⚠️ For complete testing, you need to:")
    print("   1. Update login credentials in this script")
    print("   2. Login with valid production user")
    print("   3. Test actual box creation")
    print("   4. Verify unique box codes are generated")
    print("")
    print("🎯 Key Success Indicators:")
    print("   ✅ No '400 - box code already exists' errors")
    print("   ✅ Unique box codes like 'FCB-2025-AUTO-MMDDHHMMSS'")
    print("   ✅ All frontend fields saving correctly")
    print("")
    print(f"🌐 Manual Test URL: {PRODUCTION_URL}")

def test_field_mapping_with_auth():
    """
    Use this function if you have valid production credentials
    """
    print("\n🔐 AUTHENTICATED TESTING")
    print("To test with authentication, update the credentials and run this section")
    
    # Example of what authenticated testing would look like:
    example_code = '''
    # Login
    login_response = requests.post(LOGIN_URL, json={
        "username": "your_username",
        "password": "your_password"
    })
    
    if login_response.status_code == 200:
        token = login_response.json()['access']
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        # Test box creation with all field mappings
        response = requests.post(BOXES_URL, json=test_data, headers=headers)
        
        if response.status_code == 201:
            print("✅ SUCCESS: Box created with comprehensive field mapping!")
            box_data = response.json()
            print(f"📦 Box Code: {box_data.get('box_code')}")
            # Verify all fields mapped correctly...
    '''
    
    print("Example authenticated test code:")
    print(example_code)

if __name__ == "__main__":
    test_production_deployment()
    print("\n" + "=" * 60)
    print("🚀 Ready to test? Run this after deployment!")
    print("📝 Update credentials and test thoroughly")
    print("=" * 60)
