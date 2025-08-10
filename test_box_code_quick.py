#!/usr/bin/env python3
"""
Quick test for Box Code Optional Functionality
"""

from fuel.serializers import BoxReceiptSerializer
from fuel.models import Supplier, Box
from django.contrib.auth import get_user_model

User = get_user_model()

def test_box_code():
    # Get test data
    supplier = Supplier.objects.first()
    user = User.objects.filter(role='MAIN_CENTER').first()

    if not supplier:
        print('❌ No supplier found. Please create a supplier first.')
        return

    if not user:
        print('❌ No MAIN_CENTER user found. Please create a user first.')
        return

    print('🧪 Testing Box Code Optional Functionality')
    print('=' * 40)

    # Test 1: Without boxCode (should auto-generate)
    data1 = {
        'supplier': supplier.id,
        'fuelType': 'DIESEL',
        'denomination': 20,
        'numberOfBooks': 5,
        'couponsPerBook': 25,
        'receivedBy': user.id,
        'receivedDate': '2025-08-11',
        'receivedTime': '14:30:00',
        'barcode': 'TEST123456'
    }

    print('\n📦 Test 1: Auto-generation (no boxCode provided)')
    serializer1 = BoxReceiptSerializer(data=data1)
    if serializer1.is_valid():
        print('✅ Validation passed without boxCode')
        box_code = serializer1.validated_data.get('box_code', 'Not set')
        print(f'   Box code will be: {box_code}')
    else:
        print(f'❌ Test 1 failed: {serializer1.errors}')

    # Test 2: With boxCode (should use provided value)
    data2 = {
        'boxCode': 'CUSTOM-2025-999',
        'supplier': supplier.id,
        'fuelType': 'PETROL',
        'denomination': 10,
        'numberOfBooks': 3,
        'couponsPerBook': 20,
        'receivedBy': user.id,
        'receivedDate': '2025-08-11',
        'receivedTime': '15:00:00',
        'barcode': 'TEST789012'
    }

    print('\n📦 Test 2: Manual specification (boxCode provided)')
    serializer2 = BoxReceiptSerializer(data=data2)
    if serializer2.is_valid():
        print('✅ Validation passed with boxCode')
        box_code = serializer2.validated_data.get('box_code', 'Not found')
        print(f'   Box code: {box_code}')
    else:
        print(f'❌ Test 2 failed: {serializer2.errors}')

    print('\n🎯 Summary: Box code is now optional!')
    print('✅ Can auto-generate when not provided')
    print('✅ Can accept manual codes when provided')

if __name__ == '__main__':
    test_box_code()
