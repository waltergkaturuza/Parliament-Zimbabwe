#!/usr/bin/env python3
"""
Comprehensive test for Box Code field functionality
Tests both auto-generation and manual entry scenarios
"""

import os
import sys
import django

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fuel_coupon_system.settings')
django.setup()

from fuel.models import Box
from fuel.serializers import BoxReceiptSerializer
from django.test import TestCase
from django.utils import timezone
import json

def test_box_code_scenarios():
    """Test various box code scenarios"""
    print("🧪 Testing Box Code Functionality\n")
    
    # Test 1: Auto-generation via serializer
    print("1️⃣ Testing auto-generation via BoxReceiptSerializer")
    data_auto = {
        'barcode': '234567890123456',
        'fuel_type': 'DIESEL',
        'denomination': 20,
        'number_of_books': 5,
        'coupons_per_book': 50,
        'received_by': 'test_user',
        'notes': 'Test box - auto generated code'
    }
    
    serializer_auto = BoxReceiptSerializer(data=data_auto)
    if serializer_auto.is_valid():
        box_auto = serializer_auto.save()
        print(f"   ✅ Auto-generated box_code: {box_auto.box_code}")
        print(f"   📊 Box ID: {box_auto.id}")
        print(f"   📦 Total litres: {box_auto.total_litres}")
    else:
        print(f"   ❌ Validation errors: {serializer_auto.errors}")
    
    # Test 2: Manual entry via serializer
    print("\n2️⃣ Testing manual entry via BoxReceiptSerializer")
    data_manual = {
        'box_code': 'PTZ-2025-TEST1',  # Manual box code
        'barcode': '345678901234567',
        'fuel_type': 'PETROL',
        'denomination': 5,
        'number_of_books': 3,
        'coupons_per_book': 100,
        'received_by': 'test_user',
        'notes': 'Test box - manual code'
    }
    
    serializer_manual = BoxReceiptSerializer(data=data_manual)
    if serializer_manual.is_valid():
        box_manual = serializer_manual.save()
        print(f"   ✅ Manual box_code: {box_manual.box_code}")
        print(f"   📊 Box ID: {box_manual.id}")
        print(f"   📦 Total litres: {box_manual.total_litres}")
    else:
        print(f"   ❌ Validation errors: {serializer_manual.errors}")
    
    # Test 3: Frontend camelCase mapping
    print("\n3️⃣ Testing frontend camelCase field mapping")
    data_camel = {
        'boxCode': 'FCB-2025-CAMEL',  # camelCase version
        'barcode': '456789012345678',
        'fuelType': 'DIESEL',
        'couponAmount': 50,  # denomination
        'numberOfBooks': 2,
        'couponsPerBook': 25,
        'notes': 'Test box - camelCase mapping'
    }
    
    serializer_camel = BoxReceiptSerializer(data=data_camel)
    if serializer_camel.is_valid():
        box_camel = serializer_camel.save()
        print(f"   ✅ CamelCase mapped box_code: {box_camel.box_code}")
        print(f"   📊 Box ID: {box_camel.id}")
        print(f"   ⛽ Fuel type: {box_camel.fuel_type}")
        print(f"   💧 Denomination: {box_camel.denomination}")
    else:
        print(f"   ❌ Validation errors: {serializer_camel.errors}")
    
    # Test 4: Empty box_code - should auto-generate
    print("\n4️⃣ Testing empty box_code (should auto-generate)")
    data_empty = {
        'box_code': '',  # Empty - should trigger auto-generation
        'barcode': '567890123456789',
        'fuel_type': 'DIESEL',
        'denomination': 20,
        'number_of_books': 1,
        'coupons_per_book': 50,
        'notes': 'Test box - empty code'
    }
    
    serializer_empty = BoxReceiptSerializer(data=data_empty)
    if serializer_empty.is_valid():
        box_empty = serializer_empty.save()
        print(f"   ✅ Auto-generated from empty: {box_empty.box_code}")
        print(f"   📊 Box ID: {box_empty.id}")
    else:
        print(f"   ❌ Validation errors: {serializer_empty.errors}")
    
    # Test 5: Model level auto-generation
    print("\n5️⃣ Testing model-level auto-generation (direct creation)")
    box_direct = Box(
        barcode='678901234567890',
        fuel_type='PETROL',
        denomination=10,
        number_of_books=4,
        coupons_per_book=25,
        notes='Test box - direct model creation'
    )
    box_direct.save()  # Should trigger model's save() method auto-generation
    print(f"   ✅ Model-level auto-generated: {box_direct.box_code}")
    print(f"   📊 Box ID: {box_direct.id}")
    
    # Test 6: Validation patterns
    print("\n6️⃣ Testing validation patterns")
    invalid_patterns = [
        {'box_code': 'INVALID', 'error_expected': 'Invalid format'},
        {'box_code': 'AB-2025-123', 'error_expected': 'Prefix too short'},
        {'box_code': 'ABCDE-2025-123', 'error_expected': 'Prefix too long'},
        {'box_code': 'FCB-25-123', 'error_expected': 'Year too short'},
        {'box_code': 'FCB-2025-12', 'error_expected': 'Number too short'},
    ]
    
    for test_data in invalid_patterns:
        data_invalid = {
            'box_code': test_data['box_code'],
            'barcode': f'TEST{hash(test_data["box_code"]) % 1000000}',
            'fuel_type': 'DIESEL',
            'denomination': 20,
            'number_of_books': 1,
            'coupons_per_book': 50,
        }
        
        serializer_invalid = BoxReceiptSerializer(data=data_invalid)
        if not serializer_invalid.is_valid():
            print(f"   ✅ Correctly rejected '{test_data['box_code']}': {list(serializer_invalid.errors.get('box_code', ['No error']))}")
        else:
            print(f"   ⚠️ Unexpectedly accepted '{test_data['box_code']}'")
    
    print("\n📈 Summary Report")
    total_boxes = Box.objects.count()
    print(f"   📦 Total boxes in database: {total_boxes}")
    
    # Show recent boxes
    recent_boxes = Box.objects.order_by('-id')[:5]
    print("   🕒 Recent boxes:")
    for box in recent_boxes:
        print(f"      • {box.box_code} ({box.fuel_type} {box.denomination}L)")
    
    print("\n✅ Box Code functionality test completed!")
    print("\n🔗 Frontend Integration Notes:")
    print("   • Box Code field now supports both auto-generation and manual entry")
    print("   • Toggle switch allows users to choose between modes")
    print("   • Validation ensures proper format for manual entries")
    print("   • Verification step includes Box Code confirmation")
    print("   • Reports will show the Box Code prominently")


if __name__ == '__main__':
    test_box_code_scenarios()
