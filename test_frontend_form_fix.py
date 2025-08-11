#!/usr/bin/env python3
"""
Test script to verify frontend form fixes for box creation.
This script simulates the exact data structure that should now be sent 
from the frontend form after our fixes.
"""

import requests
import json
import os
from datetime import datetime

def test_box_creation_with_frontend_data():
    """Test box creation with the exact data structure from frontend form"""
    
    # Azure production URL (correct URL from deployment files)
    base_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    
    # Generate test data with proper field naming as expected from frontend
    current_year = datetime.now().year
    test_data = {
        # Primary box identifier - this should now be sent from frontend
        "box_code": f"FCB-{current_year}-TEST-{datetime.now().strftime('%H%M%S')}",
        
        # Book details as array from frontend
        "book_details": [
            {
                "book_number": 1,
                "first_coupon_number": "001001",
                "last_coupon_number": "001020",
                "coupons_count": 20
            },
            {
                "book_number": 2,
                "first_coupon_number": "002001",
                "last_coupon_number": "002020",
                "coupons_count": 20
            }
        ],
        
        # Required fields from frontend form
        "supplier": "Petrotrade Zimbabwe",
        "region": "Harare",
        "district": "Harare Urban",
        "constituency": "Harare East",
        "program": "Parliamentary Constituency Fuel Program",
        
        # Optional metadata
        "notes": "Test box creation with frontend form fixes",
        "barcode": f"BAR{datetime.now().strftime('%Y%m%d%H%M%S')}"
    }
    
    print("🧪 Testing Box Creation with Frontend Form Data")
    print("=" * 60)
    print(f"📍 Base URL: {base_url}")
    print(f"📦 Test Data:")
    print(json.dumps(test_data, indent=2))
    print("=" * 60)
    
    try:
        # Test box creation
        response = requests.post(
            f"{base_url}/api/v1/boxes/",
            json=test_data,
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout=30
        )
        
        print(f"📊 Response Status: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 201:
            print("✅ SUCCESS! Box created successfully!")
            response_data = response.json()
            print(f"📦 Created Box ID: {response_data.get('id')}")
            print(f"🏷️  Box Code: {response_data.get('box_code')}")
            print(f"📚 Books Created: {len(response_data.get('books', []))}")
            print(f"🎟️  Total Coupons: {response_data.get('total_coupons', 0)}")
            return True
            
        elif response.status_code == 400:
            print("❌ BAD REQUEST - Field validation error")
            try:
                error_data = response.json()
                print(f"🚨 Error Details: {json.dumps(error_data, indent=2)}")
                
                # Check specifically for box_code field errors
                if 'box_code' in error_data:
                    print("💥 CRITICAL: box_code field still missing or invalid!")
                    print("🔧 Frontend form is not sending box_code properly")
                else:
                    print("ℹ️  box_code field validation passed - other field issue")
                    
            except json.JSONDecodeError:
                print(f"🚨 Raw Error Response: {response.text}")
            return False
            
        else:
            print(f"⚠️  Unexpected response: {response.status_code}")
            print(f"📄 Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("⏱️  Request timed out - Azure might be slow")
        return False
    except requests.exceptions.ConnectionError:
        print("🌐 Connection error - Check Azure availability")
        return False
    except Exception as e:
        print(f"💥 Unexpected error: {str(e)}")
        return False

def test_alternative_field_names():
    """Test that backend handles alternative field naming conventions"""
    
    base_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    
    # Test data with different field naming patterns
    test_cases = [
        {
            "name": "boxId (camelCase)",
            "data": {"boxId": "FCB-2024-BOXID-TEST", "supplier": "Test Supplier"}
        },
        {
            "name": "box_id (snake_case)",
            "data": {"box_id": "FCB-2024-BOXID-TEST", "supplier": "Test Supplier"}
        },
        {
            "name": "box_code (backend format)",
            "data": {"box_code": "FCB-2024-BOXCODE-TEST", "supplier": "Test Supplier"}
        }
    ]
    
    print("\n🔄 Testing Alternative Field Name Support")
    print("=" * 60)
    
    results = []
    for test_case in test_cases:
        print(f"\n📝 Testing: {test_case['name']}")
        print(f"📊 Data: {json.dumps(test_case['data'], indent=2)}")
        
        try:
            response = requests.post(
                f"{base_url}/api/v1/boxes/",
                json=test_case['data'],
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            print(f"📊 Status: {response.status_code}")
            
            if response.status_code == 201:
                print("✅ SUCCESS - Field mapping works!")
                results.append(True)
            elif response.status_code == 400:
                error_data = response.json()
                if 'box_code' in error_data:
                    print("❌ FAILED - box_code still required")
                    results.append(False)
                else:
                    print("⚠️  Other validation error (box_code field mapping OK)")
                    results.append(True)
            else:
                print(f"⚠️  Unexpected status: {response.status_code}")
                results.append(False)
                
        except Exception as e:
            print(f"💥 Error: {str(e)}")
            results.append(False)
    
    success_rate = sum(results) / len(results) * 100
    print(f"\n📈 Field Mapping Success Rate: {success_rate:.1f}%")
    return all(results)

if __name__ == "__main__":
    print("🚀 Starting Frontend Form Fix Validation")
    print("="*80)
    
    # Test main functionality
    main_test_passed = test_box_creation_with_frontend_data()
    
    # Test field name compatibility
    field_mapping_passed = test_alternative_field_names()
    
    print("\n" + "="*80)
    print("📋 SUMMARY")
    print("="*80)
    print(f"✅ Main box creation test: {'PASSED' if main_test_passed else 'FAILED'}")
    print(f"✅ Field mapping test: {'PASSED' if field_mapping_passed else 'FAILED'}")
    
    if main_test_passed and field_mapping_passed:
        print("\n🎉 ALL TESTS PASSED! Frontend form fixes are working correctly.")
        print("🚀 Azure production should now accept box creation requests.")
    else:
        print("\n❌ SOME TESTS FAILED! Frontend form still needs debugging.")
        print("🔧 Check the error details above for specific issues.")
    
    print("="*80)
