#!/usr/bin/env python
"""
Test script to debug the available_for_dispatch endpoint issue
"""

import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import Book, User
from rest_framework.response import Response
from rest_framework import status
from django.test import RequestFactory

def test_available_for_dispatch():
    """Test the available_for_dispatch logic step by step"""
    
    print("🔍 TESTING AVAILABLE_FOR_DISPATCH LOGIC")
    print("=" * 50)
    
    try:
        # Step 1: Test basic query
        print("Step 1: Testing basic query...")
        available_books = Book.objects.filter(
            box__is_received=True,
            is_assigned=False,
        ).select_related('box', 'box__assigned_to').order_by('-generated_at')
        
        print(f"Available books found: {available_books.count()}")
        
        # Step 2: Test dispatches field check
        print("\nStep 2: Testing dispatches field...")
        try:
            Book._meta.get_field('dispatches')
            available_books = available_books.filter(dispatches__isnull=True)
            print(f"After dispatches filter: {available_books.count()}")
        except Exception as e:
            print(f"No dispatches field (expected): {e}")
        
        # Step 3: Test book data construction
        print("\nStep 3: Testing book data construction...")
        books_data = []
        
        for book in available_books[:2]:  # Test first 2 books only
            print(f"Processing book {book.id}...")
            
            # Get coupon count
            try:
                coupon_count = getattr(book, 'available_coupons_count', None)
                coupon_count = coupon_count() if callable(coupon_count) else coupon_count
            except Exception:
                coupon_count = None
                
            if not coupon_count:
                coupon_count = book.initial_coupon_count or getattr(book.box, 'coupons_per_book', 100)

            estimated_value = (coupon_count or 0) * (book.box.denomination or 0)
            
            book_data = {
                'id': book.id,
                'bookId': book.id,
                'bookCode': book.book_code or f"BOOK-{book.id}",
                'boxId': book.box.box_code,
                'fuelType': book.box.fuel_type,
                'denomination': book.box.denomination,
                'firstCouponNumber': getattr(book, 'first_coupon_number', None),
                'lastCouponNumber': getattr(book, 'last_coupon_number', None),
                'numberOfCoupons': coupon_count,
                'estimatedValue': estimated_value,
                'pricePerLitre': float(book.box.fuel_price_per_litre_usd or 1.45),
                'generatedAt': book.generated_at.isoformat() if book.generated_at else None,
                'boxReceiveDate': book.box.received_at.isoformat() if book.box.received_at else None,
                'isSelected': False,
                'status': 'AVAILABLE_FOR_DISPATCH'
            }
            
            books_data.append(book_data)
            print(f"  ✅ Book {book.id} data constructed successfully")
        
        # Step 4: Test summary calculation
        print("\nStep 4: Testing summary calculation...")
        total_books = len(books_data)
        total_coupons = sum(book['numberOfCoupons'] for book in books_data)
        total_value = sum(book['estimatedValue'] for book in books_data)
        
        print(f"Summary: {total_books} books, {total_coupons} coupons, {total_value} value")
        
        # Step 5: Test response construction
        print("\nStep 5: Testing response construction...")
        response_data = {
            'results': books_data,
            'summary': {
                'total_books': total_books,
                'total_coupons': total_coupons,
                'total_value': total_value,
                'by_type': []
            },
            'filters_applied': {
                'fuel_type': None,
                'denomination': None,
                'subcenter': None
            },
            'message': f'Found {total_books} books available for dispatch'
        }
        
        print("✅ Response data constructed successfully")
        print(f"Response keys: {list(response_data.keys())}")
        print(f"Results count: {len(response_data['results'])}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error occurred: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_available_for_dispatch()
    print(f"\nTest {'PASSED' if success else 'FAILED'}")
