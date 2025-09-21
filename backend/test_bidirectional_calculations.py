#!/usr/bin/env python3
"""
Test script for bidirectional batch/box calculations
Tests the enhanced Box model calculation methods
"""

import os
import sys
import django
from decimal import Decimal

# Setup Django environment
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import Box


def test_first_last_serial_calculation():
    """Test calculating books and coupons from first and last serials"""
    print("=== Test 1: Calculate from First and Last Serials ===")
    
    box = Box(
        denomination=20,
        coupons_per_book=100  # This will be recalculated
    )
    
    # Test case: 1000 coupons total
    first_serial = "PU006H1355101"
    last_serial = "PU006H1356100"
    
    result = box.calculate_from_first_last_serials(first_serial, last_serial)
    print(f"First Serial: {first_serial}")
    print(f"Last Serial: {last_serial}")
    print(f"Result: {result}")
    
    expected_total = 1000  # 1356100 - 1355101 + 1
    assert result['total_coupons'] == expected_total, f"Expected {expected_total}, got {result['total_coupons']}"
    
    # With 100 coupons per book, should be 10 books
    assert result['number_of_books'] == 10, f"Expected 10 books, got {result['number_of_books']}"
    assert result['coupons_per_book'] == 100, f"Expected 100 coupons per book, got {result['coupons_per_book']}"
    
    print("✅ Test 1 passed!")


def test_first_serial_books_calculation():
    """Test calculating last serial from first serial and book structure"""
    print("\n=== Test 2: Calculate Last Serial from First Serial and Books ===")
    
    box = Box(denomination=20)
    
    first_serial = "PU006H1355101"
    number_of_books = 10
    coupons_per_book = 100
    
    result = box.calculate_from_first_and_books(first_serial, number_of_books, coupons_per_book)
    print(f"First Serial: {first_serial}")
    print(f"Number of Books: {number_of_books}")
    print(f"Coupons per Book: {coupons_per_book}")
    print(f"Result: {result}")
    
    expected_last_serial = "PU006H1356100"  # 1355101 + 1000 - 1
    assert result['last_serial'] == expected_last_serial, f"Expected {expected_last_serial}, got {result['last_serial']}"
    assert result['total_coupons'] == 1000, f"Expected 1000 coupons, got {result['total_coupons']}"
    
    print("✅ Test 2 passed!")


def test_book_breakdown_generation():
    """Test generating detailed book breakdown"""
    print("\n=== Test 3: Generate Book Breakdown ===")
    
    box = Box(denomination=20)
    
    first_serial = "PU006H1355101"
    last_serial = "PU006H1356100"
    number_of_books = 10
    coupons_per_book = 100
    
    breakdown = box.generate_book_breakdown(first_serial, last_serial, number_of_books, coupons_per_book)
    print(f"Generated {len(breakdown)} books")
    
    # Check first book
    first_book = breakdown[0]
    print(f"First Book: {first_book}")
    assert first_book['book_number'] == 1
    assert first_book['first_coupon_serial'] == "PU006H1355101"
    assert first_book['last_coupon_serial'] == "PU006H1355200"
    assert first_book['number_of_coupons'] == 100
    
    # Check last book
    last_book = breakdown[-1]
    print(f"Last Book: {last_book}")
    assert last_book['book_number'] == 10
    assert last_book['first_coupon_serial'] == "PU006H1356001"
    assert last_book['last_coupon_serial'] == "PU006H1356100"
    
    print("✅ Test 3 passed!")


def test_smart_calculate():
    """Test the smart calculate method with different modes"""
    print("\n=== Test 4: Smart Calculate Method ===")
    
    box = Box(denomination=20, coupons_per_book=100, number_of_books=10)
    
    # Mode 1: first-and-last
    result1 = box.smart_calculate(
        first_serial="PU006H1355101",
        last_serial="PU006H1356100"
    )
    print(f"Mode 1 (first-and-last): {result1['calculation_mode']}")
    print(f"Calculations: {result1['calculations']}")
    assert result1['calculation_mode'] == 'first-and-last'
    assert len(result1['errors']) == 0
    
    # Mode 2: first-and-count
    result2 = box.smart_calculate(
        first_serial="PU006H1355101",
        number_of_books=10,
        coupons_per_book=100
    )
    print(f"Mode 2 (first-and-count): {result2['calculation_mode']}")
    print(f"Calculations: {result2['calculations']}")
    assert result2['calculation_mode'] == 'first-and-count'
    assert len(result2['errors']) == 0
    
    print("✅ Test 4 passed!")


def test_edge_cases():
    """Test edge cases and error handling"""
    print("\n=== Test 5: Edge Cases ===")
    
    box = Box(denomination=20)
    
    # Test invalid serial format
    result = box.calculate_from_first_last_serials("invalid", "also_invalid")
    print(f"Invalid serials result: {result}")
    assert 'error' in result
    
    # Test first >= last
    result = box.calculate_from_first_last_serials("PU006H1356100", "PU006H1355101")
    print(f"First >= Last result: {result}")
    assert 'error' in result
    
    # Test uneven division (1001 coupons with 100 per book)
    result = box.calculate_from_first_last_serials("PU006H1355101", "PU006H1356101")
    print(f"Uneven division result: {result}")
    # Should create 11 books with adjusted coupons per book
    assert result['number_of_books'] == 11
    assert result['total_coupons'] == 1001
    
    print("✅ Test 5 passed!")


def test_full_integration():
    """Test full integration with Box model save"""
    print("\n=== Test 6: Full Integration ===")
    
    box = Box(
        box_code="TEST-2025-0001",
        fuel_type="DIESEL",
        denomination=20,
        first_coupon_serial="PU006H1355101",
        last_coupon_serial="PU006H1356100",
        fuel_price_per_litre_usd=Decimal('1.40'),
        exchange_rate_zwg_usd=Decimal('27.50')
    )
    
    # This should trigger calculate_totals which uses smart_calculate
    box.calculate_totals()
    
    print(f"Box calculations:")
    print(f"  Total Coupons: {box.total_coupons_calculated}")
    print(f"  Number of Books: {box.number_of_books}")
    print(f"  Coupons per Book: {box.coupons_per_book}")
    print(f"  Total Litres: {box.total_litres}")
    print(f"  Total Value USD: {box.total_value_usd}")
    print(f"  Calculation Mode: {box.calculation_mode}")
    
    assert box.total_coupons_calculated == 1000
    assert box.number_of_books == 10
    assert box.coupons_per_book == 100
    assert box.total_litres == Decimal('20000')  # 1000 * 20
    assert box.calculation_mode == 'first-and-last'
    
    print("✅ Test 6 passed!")


if __name__ == "__main__":
    print("Testing Bidirectional Box/Batch Calculations...")
    
    try:
        test_first_last_serial_calculation()
        test_first_serial_books_calculation()
        test_book_breakdown_generation()
        test_smart_calculate()
        test_edge_cases()
        test_full_integration()
        
        print("\n🎉 All tests passed! Bidirectional calculations are working correctly.")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)