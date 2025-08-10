#!/usr/bin/env python
"""
Test BoxReceiptSerializer Field Mapping for Azure Production 
=============================================================

This script tests the enhanced BoxReceiptSerializer to ensure it handles
the exact field names that Azure production is expecting.
"""

import os
import sys
import django
import json

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.serializers import BoxReceiptSerializer

def test_azure_field_mapping():
    """Test the exact field structure that Azure is expecting"""
    print("🔍 Testing BoxReceiptSerializer with Azure production field structure...")
    
    # Test data similar to what frontend sends to Azure production
    azure_test_data = {
        # Required fields that Azure complained about
        'first_coupon_number': 'PU00GH355101',
        'last_coupon_number': 'PU00GH355200', 
        'notes': 'Test box for Azure deployment',
        'barcode': 'BOX123456789',
        
        # Additional fields that frontend might send
        'box_code': 'AZURE_TEST_001',
        'fuel_type': 'DIESEL',
        'denomination': 20,
        'number_of_books': 10,
        'coupons_per_book': 50,
        'assigned_to': 1  # This would be a valid SubCenter ID
    }
    
    print(f"📝 Test data: {json.dumps(azure_test_data, indent=2)}")
    
    # Test serializer validation
    serializer = BoxReceiptSerializer(data=azure_test_data)
    
    print(f"\n🔍 Testing serializer validation...")
    is_valid = serializer.is_valid()
    
    if is_valid:
        print("✅ BoxReceiptSerializer validation PASSED")
        print(f"📋 Validated data: {json.dumps(serializer.validated_data, indent=2, default=str)}")
        return True
    else:
        print("❌ BoxReceiptSerializer validation FAILED")
        print(f"💥 Errors: {json.dumps(serializer.errors, indent=2)}")
        return False

def test_camel_case_mapping():
    """Test camelCase field mapping that frontend typically sends"""
    print("\n🔍 Testing BoxReceiptSerializer with camelCase frontend data...")
    
    # Test camelCase data that frontend typically sends
    camel_case_data = {
        # Required fields (snake_case - what API expects)
        'first_coupon_number': 'PU00GH355101',
        'last_coupon_number': 'PU00GH355200',
        'notes': 'Test box with camelCase fields',
        'barcode': 'BOX987654321',
        
        # CamelCase fields (what frontend typically sends)
        'boxCode': 'CAMEL_TEST_001',
        'fuelType': 'DIESEL',
        'firstCouponNumber': 'PU00GH355101',  # This should override the snake_case version
        'lastCouponNumber': 'PU00GH355200',   # This should override the snake_case version
        'numberOfBooks': 5,
        'couponsPerBook': 100,
        'couponAmount': 20,  # Should map to denomination
        'subCenter': 1,      # Should map to assigned_to
        'monetaryValueUSD': 1500.00
    }
    
    print(f"📝 CamelCase test data: {json.dumps(camel_case_data, indent=2)}")
    
    # Test serializer validation
    serializer = BoxReceiptSerializer(data=camel_case_data)
    
    print(f"\n🔍 Testing camelCase serializer validation...")
    is_valid = serializer.is_valid()
    
    if is_valid:
        print("✅ CamelCase BoxReceiptSerializer validation PASSED")
        validated_data = serializer.validated_data
        
        # Check that camelCase fields were properly mapped
        mapping_checks = [
            ('box_code', 'CAMEL_TEST_001'),
            ('fuel_type', 'DIESEL'),
            ('number_of_books', 5),
            ('coupons_per_book', 100),
            ('denomination', 20),
            ('assigned_to', 1),
            ('monetary_value_usd', 1500.00)
        ]
        
        print("\n🔄 Checking field mappings:")
        all_mappings_correct = True
        for field, expected_value in mapping_checks:
            actual_value = validated_data.get(field)
            if actual_value == expected_value:
                print(f"  ✅ {field}: {actual_value}")
            else:
                print(f"  ❌ {field}: expected {expected_value}, got {actual_value}")
                all_mappings_correct = False
        
        return all_mappings_correct
    else:
        print("❌ CamelCase BoxReceiptSerializer validation FAILED")
        print(f"💥 Errors: {json.dumps(serializer.errors, indent=2)}")
        return False

def main():
    """Run all tests"""
    print("🚀 Azure Production Field Mapping Tests")
    print("=" * 50)
    
    try:
        # Test 1: Azure production field structure
        test1_passed = test_azure_field_mapping()
        
        # Test 2: CamelCase field mapping
        test2_passed = test_camel_case_mapping()
        
        # Results
        print(f"\n📊 TEST RESULTS")
        print("=" * 50)
        print(f"Azure Field Structure: {'✅ PASS' if test1_passed else '❌ FAIL'}")
        print(f"CamelCase Field Mapping: {'✅ PASS' if test2_passed else '❌ FAIL'}")
        
        if test1_passed and test2_passed:
            print(f"\n🎉 All tests PASSED!")
            print("BoxReceiptSerializer should now handle Azure production requirements:")
            print("- ✅ Required fields: first_coupon_number, last_coupon_number, notes, barcode")
            print("- ✅ CamelCase frontend field mapping")
            print("- ✅ Proper field validation and error handling")
            return True
        else:
            print(f"\n⚠️ Some tests FAILED - check field mappings")
            return False
            
    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
