#!/usr/bin/env python3
"""
Test script to verify MainCenter alignment fields work correctly
"""
import os
import sys

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    import django
    django.setup()
    print("✅ Django setup successful")
except Exception as e:
    print(f"❌ Django setup failed: {e}")
    sys.exit(1)

from fuel.models import SubCenter, Box, User

def test_subcenter_fields():
    """Test that SubCenter model can use new fields"""
    try:
        # Try to create a SubCenter with new fields
        subcenter_data = {
            'code': 'TEST001',
            'name': 'Test SubCenter',
            'location': 'Test Location',
            'contact_number': '+263771234567',
            'email': 'test@subcenter.com',
            'is_active': True
        }
        
        # Create without saving to database (just validate model)
        subcenter = SubCenter(**subcenter_data)
        print("✅ SubCenter model accepts contact_number and email fields")
        
        # Check field access
        print(f"  📞 Contact: {subcenter.contact_number}")
        print(f"  📧 Email: {subcenter.email}")
        
        return True
    except Exception as e:
        print(f"❌ SubCenter field test failed: {e}")
        return False

def test_box_fields():
    """Test that Box model can use new is_received field"""
    try:
        # Try to create a Box with new field
        box_data = {
            'box_code': 'TEST-BOX-001',
            'fuel_type': 'DIESEL',
            'denomination': 20,
            'first_coupon_number': 'TEST001',
            'last_coupon_number': 'TEST100', 
            'number_of_books': 1,
            'coupons_per_book': 100,
            'total_coupons_calculated': 100,
            'total_litres': 2000,
            'is_received': True
        }
        
        # Create without saving to database (just validate model)
        box = Box(**box_data)
        print("✅ Box model accepts is_received field")
        print(f"  📦 Is Received: {box.is_received}")
        
        return True
    except Exception as e:
        print(f"❌ Box field test failed: {e}")
        return False

def main():
    print("🧪 MainCenter Alignment Field Testing")
    print("=" * 40)
    
    tests = [
        ("SubCenter Fields", test_subcenter_fields),
        ("Box Fields", test_box_fields),
    ]
    
    passed = 0
    for test_name, test_func in tests:
        print(f"\n🔍 Testing {test_name}:")
        if test_func():
            passed += 1
    
    print(f"\n📊 Results: {passed}/{len(tests)} tests passed")
    
    if passed == len(tests):
        print("🎉 All MainCenter alignment fields are working correctly!")
        return True
    else:
        print("❌ Some tests failed - check model definitions")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
