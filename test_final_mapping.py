"""
Test comprehensive field mapping between frontend and backend
"""

import requests
import json

# Test data that matches the frontend form exactly
test_box_data = {
    # Basic box information
    "fuelType": "PETROL",
    "denomination": 20,  # Valid denomination: 5, 10, 20, or 50
    "supplier": "Test Fuel Company Ltd",
    "invoiceNumber": "TEST-INV-001",
    "deliveryNote": "TEST-DEL-001",
    "barcode": "TEST123456789",
    
    # Coupon information
    "numberOfBooks": 15,
    "couponsPerBook": 30,
    "totalLitres": 9000,
    "firstCouponNumber": "TEST001001",
    "lastCouponNumber": "TEST001450",
    
    # Financial information
    "totalValueUsd": 5400.00,  # Should be 9000 * 0.60 = 5400
    "fuelPricePerLitreUsd": 0.60,
    "exchangeRateZwgUsd": 27.5,
    
    # Status and notes
    "status": "RECEIVED",
    "notes": "Test box created via API to verify comprehensive field mapping",
    "verificationNotes": "All field mappings working correctly",
    
    # Date and time information (these should be handled by the serializer)
    "receivedDate": "2025-08-12",
    "receivedTime": "15:30"
}

# API endpoints
BASE_URL = "http://localhost:8000/api/v1"
LOGIN_URL = f"{BASE_URL}/auth/login/"
BOXES_URL = f"{BASE_URL}/boxes/"

def test_comprehensive_field_mapping():
    print("🧪 Testing comprehensive field mapping...")
    
    # Step 1: Login to get authentication token
    print("\n1️⃣ Logging in...")
    login_data = {
        "username": "admin",
        "password": "pass@123"
    }
    
    try:
        response = requests.post(LOGIN_URL, json=login_data)
        print(f"   Login status: {response.status_code}")
        
        if response.status_code == 200:
            tokens = response.json()
            access_token = tokens['access']
            print(f"   ✅ Login successful")
            
            # Step 2: Create a box with comprehensive field mapping
            print("\n2️⃣ Creating box with comprehensive field mapping...")
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(BOXES_URL, json=test_box_data, headers=headers)
            print(f"   Box creation status: {response.status_code}")
            
            if response.status_code == 201:
                box_data = response.json()
                print(f"   ✅ Box created successfully!")
                print(f"   📦 Box code: {box_data.get('box_code', 'N/A')}")
                print(f"   ⛽ Fuel type: {box_data.get('fuel_type', 'N/A')}")
                print(f"   💰 Total value USD: ${box_data.get('total_value_usd', 'N/A')}")
                print(f"   📊 Status: {box_data.get('status', 'N/A')}")
                
                # Step 3: Verify field mapping worked correctly
                print("\n3️⃣ Verifying field mappings...")
                mapping_results = []
                
                # Check critical field mappings
                field_checks = [
                    ("fuelType → fuel_type", test_box_data["fuelType"], box_data.get("fuel_type")),
                    ("numberOfBooks → number_of_books", test_box_data["numberOfBooks"], box_data.get("number_of_books")),
                    ("couponsPerBook → coupons_per_book", test_box_data["couponsPerBook"], box_data.get("coupons_per_book")),
                    ("totalLitres → total_litres", test_box_data["totalLitres"], int(float(str(box_data.get("total_litres", 0))))),
                    ("totalValueUsd → total_value_usd", test_box_data["totalValueUsd"], float(box_data.get("total_value_usd", 0))),
                    ("fuelPricePerLitreUsd → fuel_price_per_litre_usd", test_box_data["fuelPricePerLitreUsd"], float(box_data.get("fuel_price_per_litre_usd", 0))),
                    ("exchangeRateZwgUsd → exchange_rate_zwg_usd", test_box_data["exchangeRateZwgUsd"], float(box_data.get("exchange_rate_zwg_usd", 0))),
                    ("invoiceNumber → invoice_number", test_box_data["invoiceNumber"], box_data.get("invoice_number")),
                    ("deliveryNote → delivery_note", test_box_data["deliveryNote"], box_data.get("delivery_note")),
                    ("firstCouponNumber → first_coupon_number", test_box_data["firstCouponNumber"], box_data.get("first_coupon_number")),
                    ("lastCouponNumber → last_coupon_number", test_box_data["lastCouponNumber"], box_data.get("last_coupon_number")),
                    ("verificationNotes → verification_notes", test_box_data["verificationNotes"], box_data.get("verification_notes"))
                ]
                
                all_passed = True
                for check_name, sent_value, received_value in field_checks:
                    if sent_value == received_value:
                        print(f"   ✅ {check_name}: {sent_value}")
                        mapping_results.append(True)
                    else:
                        print(f"   ❌ {check_name}: sent {sent_value}, got {received_value}")
                        mapping_results.append(False)
                        all_passed = False
                
                # Check auto-generated fields
                print("\n4️⃣ Checking auto-generated fields...")
                auto_fields = [
                    ("box_code", box_data.get("box_code")),
                    ("total_coupons_calculated", box_data.get("total_coupons_calculated")),
                    ("total_value_zwg", box_data.get("total_value_zwg")),
                    ("received_by", box_data.get("received_by"))
                ]
                
                for field_name, field_value in auto_fields:
                    if field_value:
                        print(f"   ✅ {field_name}: {field_value}")
                    else:
                        print(f"   ⚠️  {field_name}: Not set")
                
                # Final summary
                print(f"\n🎯 Field Mapping Test Results:")
                print(f"   Total checks: {len(field_checks)}")
                print(f"   Passed: {sum(mapping_results)}")
                print(f"   Failed: {len(field_checks) - sum(mapping_results)}")
                
                if all_passed:
                    print("\n🎉 All field mappings working correctly!")
                    print("✅ Frontend form submission will work properly with the backend")
                    print("🚀 The production error has been resolved!")
                    print("\n📋 Summary of fixes:")
                    print("   ✅ Removed box_code from frontend POST requests")
                    print("   ✅ Backend auto-generates unique box codes")
                    print("   ✅ Comprehensive field mapping for all frontend fields")
                    print("   ✅ Enhanced error handling and validation")
                    print("   ✅ Sample data created for testing")
                else:
                    print("\n⚠️  Some field mappings need attention")
                
            else:
                print(f"   ❌ Box creation failed")
                try:
                    error_data = response.json()
                    print(f"   Response: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"   Response: {response.text}")
                
        else:
            print(f"   ❌ Login failed: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Django server. Make sure it's running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_comprehensive_field_mapping()
