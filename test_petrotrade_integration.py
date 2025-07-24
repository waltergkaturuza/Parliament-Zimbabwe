#!/usr/bin/env python3
"""
PetroTrade Integration Testing Script
Tests all components of the PetroTrade coupon automation system
"""

import os
import sys
import django
from django.conf import settings

# Setup Django environment
sys.path.append('c:/Users/Administrator/Documents/POZ/fuel_coupon_system')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.utils.petrotrade_serials import PetroTradeSerial
from fuel.models import Box, Book, Coupon
from fuel.validators import validate_petrotrade_serial
from django.core.exceptions import ValidationError

def test_serial_parsing():
    """Test PetroTrade serial number parsing"""
    print("=" * 60)
    print("TESTING PETROTRADE SERIAL PARSING")
    print("=" * 60)
    
    test_cases = [
        ('PU006H355101', True, 'PU006H', 355101),
        ('ABC123456789', True, 'ABC123456', 789),
        ('INVALID123', False, '', 0),
        ('TOO_SHORT', False, '', 0),
        ('PU006H35510A', False, '', 0),  # Non-numeric ending
    ]
    
    for serial, expected_valid, expected_prefix, expected_number in test_cases:
        try:
            result = PetroTradeSerial.parse_serial(serial)
            status = "✅ PASS" if result['is_valid'] == expected_valid else "❌ FAIL"
            print(f"{status} {serial}: Valid={result['is_valid']}, Prefix='{result['prefix']}', Number={result['number']}")
            
            if expected_valid and result['is_valid']:
                assert result['prefix'] == expected_prefix, f"Expected prefix {expected_prefix}, got {result['prefix']}"
                assert result['number'] == expected_number, f"Expected number {expected_number}, got {result['number']}"
        
        except Exception as e:
            print(f"❌ ERROR {serial}: {e}")

def test_serial_range_generation():
    """Test serial range generation"""
    print("\n" + "=" * 60)
    print("TESTING SERIAL RANGE GENERATION")
    print("=" * 60)
    
    try:
        serials = PetroTradeSerial.generate_range('PU006H355101', 'PU006H355110')
        expected_count = 10
        
        if len(serials) == expected_count:
            print(f"✅ PASS: Generated {len(serials)} serials")
            print(f"  First: {serials[0]}")
            print(f"  Last: {serials[-1]}")
        else:
            print(f"❌ FAIL: Expected {expected_count} serials, got {len(serials)}")
    
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_book_splitting():
    """Test splitting serials into books"""
    print("\n" + "=" * 60)
    print("TESTING BOOK SPLITTING")
    print("=" * 60)
    
    try:
        books = PetroTradeSerial.split_into_books('PU006H355101', 'PU006H355250', 100)
        expected_books = 2  # 150 coupons = 2 books of 100 + 50
        
        if len(books) == expected_books:
            print(f"✅ PASS: Split into {len(books)} books")
            for i, book in enumerate(books, 1):
                print(f"  Book {i}: {book['first_serial']} - {book['last_serial']} ({book['coupon_count']} coupons)")
        else:
            print(f"❌ FAIL: Expected {expected_books} books, got {len(books)}")
    
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_django_validation():
    """Test Django model validation"""
    print("\n" + "=" * 60)
    print("TESTING DJANGO MODEL VALIDATION")
    print("=" * 60)
    
    test_serials = [
        ('PU006H355101', True),
        ('INVALID', False),
        ('ABC123456789', True),
    ]
    
    for serial, should_be_valid in test_serials:
        try:
            validate_petrotrade_serial(serial)
            if should_be_valid:
                print(f"✅ PASS: {serial} validated successfully")
            else:
                print(f"❌ FAIL: {serial} should have failed validation")
        except ValidationError as e:
            if not should_be_valid:
                print(f"✅ PASS: {serial} correctly failed validation - {e}")
            else:
                print(f"❌ FAIL: {serial} should have passed validation - {e}")

def test_box_creation():
    """Test PetroTrade box creation"""
    print("\n" + "=" * 60)
    print("TESTING PETROTRADE BOX CREATION")
    print("=" * 60)
    
    try:
        # Clean up any existing test data
        Box.objects.filter(box_code__startswith='TEST-PT-').delete()
        
        # Create a test box
        from fuel.management.commands.create_petrotrade_box import Command
        cmd = Command()
        
        # Simulate command execution
        box_code = f"TEST-PT-{PetroTradeSerial.parse_serial('PU006H355301')['number']}"
        
        print(f"Creating test box: {box_code}")
        print("  Range: PU006H355301 - PU006H355310 (10 coupons)")
        
        # Manual box creation for testing
        box = Box.objects.create(
            box_code=box_code,
            fuel_type='DIESEL',
            denomination=20,
            first_coupon_number='PU006H355301',
            last_coupon_number='PU006H355310',
            number_of_books=1,
            coupons_per_book=10
        )
        
        # Create book using our new method
        book = Book.create_from_petrotrade_serials(
            box=box,
            book_number='Book 01',
            first_serial='PU006H355301',
            last_serial='PU006H355310'
        )
        
        # Generate coupons
        coupons = book.generate_petrotrade_coupons()
        
        print(f"✅ PASS: Created box {box.box_code}")
        print(f"  Books: {box.books.count()}")
        print(f"  Coupons: {len(coupons)}")
        print(f"  First coupon: {coupons[0].coupon_number if coupons else 'None'}")
        print(f"  Last coupon: {coupons[-1].coupon_number if coupons else 'None'}")
        
        # Validate range
        is_valid, msg = book.validate_petrotrade_range()
        print(f"  Range validation: {'✅ PASS' if is_valid else '❌ FAIL'} - {msg}")
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Run all tests"""
    print("🚀 STARTING PETROTRADE INTEGRATION TESTS")
    print(f"Django version: {django.get_version()}")
    print(f"Settings module: {settings.SETTINGS_MODULE}")
    
    test_serial_parsing()
    test_serial_range_generation()
    test_book_splitting()
    test_django_validation()
    test_box_creation()
    
    print("\n" + "=" * 60)
    print("🎉 TESTING COMPLETED")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Test the frontend component at: fuel-coupon-frontend/src/components/PetroTradeSerialGenerator.tsx")
    print("2. Deploy the Business Central enhancements from: BusinessCentral/PetroTradeEnhancements.al")
    print("3. Test the API endpoint: POST /api/v1/boxes/create_petrotrade_box/")
    print("4. Use the management command: python manage.py create_petrotrade_box --first-coupon PU006H355101 --last-coupon PU006H355200")

if __name__ == '__main__':
    main()
