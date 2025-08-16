#!/usr/bin/env python3
"""
Simple test script to verify the BoxSerializer and authentication work locally
without starting the full Django server
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from django.contrib.auth import authenticate
from fuel.serializers import BoxSerializer
from fuel.models import Box
import json

def test_authentication():
    """Test admin authentication"""
    print("=== Testing Authentication ===")
    auth_result = authenticate(username='admin', password='pass@123')
    if auth_result:
        print("✅ Authentication successful")
        print(f"User: {auth_result.username}, Active: {auth_result.is_active}")
        return auth_result
    else:
        print("❌ Authentication failed")
        return None

def test_box_serializer():
    """Test BoxSerializer with comprehensive field mapping"""
    print("\n=== Testing BoxSerializer ===")
    
    # Test data matching frontend form
    test_data = {
        'receiptNumber': 'TEST-LOCAL-001',
        'totalValueUsd': 150.75,
        'fuelPricePerLitreUsd': 1.35,
        'firstCouponNumber': 3001,
        'lastCouponNumber': 3020,
        'verificationNotes': 'Local test box creation',
        'exchangeRateZwgUsd': 27.5
    }
    
    print(f"Test data: {json.dumps(test_data, indent=2)}")
    
    # Create serializer instance
    serializer = BoxSerializer(data=test_data)
    
    # Check validation
    if serializer.is_valid():
        print("✅ Serializer validation passed")
        print(f"Validated data: {json.dumps(serializer.validated_data, indent=2, default=str)}")
        
        # Save the box
        try:
            box = serializer.save()
            print(f"✅ Box created successfully!")
            print(f"Box ID: {box.id}")
            print(f"Box Code: {box.box_code}")
            print(f"Receipt Number: {box.receipt_number}")
            print(f"Total Value USD: {box.total_value_usd}")
            return box
        except Exception as e:
            print(f"❌ Error saving box: {e}")
            return None
    else:
        print("❌ Serializer validation failed")
        print(f"Errors: {json.dumps(serializer.errors, indent=2)}")
        return None

def test_existing_boxes():
    """Check existing boxes"""
    print("\n=== Existing Boxes ===")
    boxes = Box.objects.all()
    print(f"Total boxes in database: {boxes.count()}")
    for box in boxes[:5]:  # Show first 5
        print(f"- {box.box_code}: {box.receipt_number} (${box.total_value_usd})")

if __name__ == "__main__":
    print("🧪 Local Django Testing")
    print("=" * 50)
    
    # Test authentication
    user = test_authentication()
    
    # Test serializer
    box = test_box_serializer()
    
    # Show existing boxes
    test_existing_boxes()
    
    print("\n" + "=" * 50)
    if user and box:
        print("🎉 All tests passed! Authentication and BoxSerializer working locally.")
        print("\nNow you can:")
        print("1. Start frontend: cd fuel-coupon-frontend && npm run dev")
        print("2. Update frontend to point to localhost API")
        print("3. Test login with admin/pass@123")
        print("4. Test box creation through the form")
    else:
        print("❌ Some tests failed. Check the errors above.")
