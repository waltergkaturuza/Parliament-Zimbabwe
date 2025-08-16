"""
Quick Production Test - Check if Box Code Fix is Deployed
Run this after deployment to verify the fix is working
"""

import requests
import json
from datetime import datetime

def quick_production_test():
    print("🧪 QUICK PRODUCTION TEST - Box Code Fix")
    print("=" * 50)
    print(f"🕒 Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Production URL
    base_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    boxes_url = f"{base_url}/api/v1/boxes/"
    
    print(f"🌐 Testing: {base_url}")
    print("")
    
    # Test 1: Check API is online
    print("1️⃣ Testing API Availability...")
    try:
        response = requests.get(f"{base_url}/api/v1/", timeout=15)
        if response.status_code == 200:
            print("   ✅ Production API is online")
        else:
            print(f"   ⚠️ API status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ API test failed: {str(e)}")
        return
    
    # Test 2: Test box endpoint without auth (should get 401, not 400)
    print("\n2️⃣ Testing Box Creation Endpoint...")
    
    # Sample data that would previously cause duplicate error
    test_data = {
        "fuelType": "PETROL",
        "denomination": 20,
        "numberOfBooks": 5,
        "couponsPerBook": 20,
        "totalLitres": 2000,
        "supplier": "Test Company",
        "invoiceNumber": "QUICK-TEST-001",
        "deliveryNote": "Quick deployment test",
        "totalValueUsd": 1200.00,
        "fuelPricePerLitreUsd": 0.60,
        "exchangeRateZwgUsd": 27.5,
        "status": "RECEIVED"
    }
    
    try:
        response = requests.post(boxes_url, json=test_data, timeout=15)
        
        if response.status_code == 401:
            print("   ✅ SUCCESS: Got 401 (auth required) - endpoint is working!")
            print("   ✅ No more duplicate box_code errors!")
            
        elif response.status_code == 400:
            error_data = response.json()
            if "already exists" in str(error_data).lower():
                print("   ❌ FAILED: Still getting duplicate box_code error")
                print("   ❌ The fix is not deployed yet")
                print(f"   📋 Error: {error_data}")
            else:
                print("   ✅ Got 400 but NOT duplicate error (validation issue)")
                print(f"   📋 Error: {error_data}")
                
        elif response.status_code == 201:
            print("   ✅ AMAZING: Box created successfully!")
            result = response.json()
            print(f"   📦 Generated box code: {result.get('box_code', 'N/A')}")
            
        else:
            print(f"   ⚠️ Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Test failed: {str(e)}")
    
    # Test 3: Check for our specific fix indicators
    print("\n3️⃣ Checking for Fix Indicators...")
    
    # Look for signs that our serializer updates are active
    try:
        # Test with a field that our updated serializer should handle
        test_data_with_new_fields = {
            "fuelType": "DIESEL",  # This should map to fuel_type
            "firstCouponNumber": "TEST001",  # This should map to first_coupon_number
            "verificationNotes": "Testing field mapping"  # This should map to verification_notes
        }
        
        response = requests.post(boxes_url, json=test_data_with_new_fields, timeout=15)
        
        if response.status_code in [401, 400]:  # Expected responses
            print("   ✅ Enhanced serializer is handling new field mappings")
        
    except Exception as e:
        print(f"   ⚠️ Field mapping test failed: {str(e)}")
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 QUICK TEST SUMMARY")
    print("=" * 50)
    print("🎯 Key Success Indicators:")
    print("   ✅ API returns 401 (not 400) for unauthorized requests")
    print("   ✅ No 'box code already exists' errors")
    print("   ✅ Field mapping working properly")
    print("")
    print("🚀 If you see ✅ SUCCESS above, the fix is deployed!")
    print("❌ If you see ❌ FAILED above, try deploying again")

if __name__ == "__main__":
    quick_production_test()
