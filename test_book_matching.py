#!/usr/bin/env python
"""
Simple test to verify books are properly linked in dispatches.
"""

import os
import django
import sys

# Add the backend directory to the path
sys.path.append('/c/Users/Administrator/Documents/POZ/fuel_coupon_system/backend')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import Book, BookDispatch, Box, SubCenter, User

def test_book_data():
    """Test book data and simulate a dispatch."""
    
    print("🔍 TESTING BOOK DATA AND DISPATCH SIMULATION")
    print("=" * 60)
    
    # 1. Check what books we have
    books = Book.objects.all()
    print(f"📚 Total books in database: {books.count()}")
    
    for book in books:
        print(f"\n📖 Book: {book.book_number}")
        print(f"  - ID: {book.id}")
        print(f"  - First Coupon: {book.first_coupon_number}")
        print(f"  - Last Coupon: {book.last_coupon_number}")
        print(f"  - Initial Count: {book.initial_coupon_count}")
        print(f"  - Is Assigned: {book.is_assigned}")
        if book.box:
            print(f"  - Box: {book.box.box_code}")
            print(f"  - Fuel Type: {book.box.fuel_type}")
            print(f"  - Denomination: {book.box.denomination}")
    
    # 2. Check available books (not assigned)
    available_books = Book.objects.filter(is_assigned=False)
    print(f"\n📖 Available books (not assigned): {available_books.count()}")
    
    # 3. Simulate what the dispatch system should do
    if available_books.exists():
        book = available_books.first()
        
        print(f"\n🚀 SIMULATING DISPATCH for book: {book.book_number}")
        
        # Create a mock frontend payload like what the UI sends
        mock_payload = {
            'books': [{
                'id': str(book.id),
                'bookId': book.book_number,
                'boxId': book.box.box_code if book.box else 'Unknown',
                'fuelType': book.box.fuel_type if book.box else 'DIESEL',
                'couponAmount': book.box.denomination if book.box else 20,
                'firstCouponId': book.first_coupon_number,
                'lastCouponId': book.last_coupon_number,
                'numberOfCoupons': book.initial_coupon_count or 100,
                'value': 2000.0,  # Mock value
                'pricePerLitre': 1.45,
            }]
        }
        
        print(f"📦 Mock frontend payload:")
        print(f"  - Book ID: {mock_payload['books'][0]['bookId']}")
        print(f"  - Box ID: {mock_payload['books'][0]['boxId']}")
        print(f"  - First Coupon: {mock_payload['books'][0]['firstCouponId']}")
        print(f"  - Number of Coupons: {mock_payload['books'][0]['numberOfCoupons']}")
        
        # Test the matching logic from our dispatch create method
        book_data = mock_payload['books'][0]
        book_id = book_data.get('bookId')
        box_id = book_data.get('boxId')
        first_coupon = book_data.get('firstCouponId')
        
        # Find the actual book (using our dispatch logic)
        found_book = None
        if book_id:
            from django.db import models
            found_book = Book.objects.filter(
                models.Q(book_number=book_id) | 
                models.Q(id=book_id) if str(book_id).isdigit() else models.Q(book_number=book_id)
            ).first()
        
        if found_book:
            print(f"✅ MATCH FOUND: Book {found_book.book_number} matches payload book {book_id}")
            print(f"  - Database Book ID: {found_book.id}")
            print(f"  - Database Book Number: {found_book.book_number}")
            print(f"  - Database First Coupon: {found_book.first_coupon_number}")
            print(f"  - Frontend First Coupon: {first_coupon}")
            print(f"  - Serials Match: {found_book.first_coupon_number == first_coupon}")
        else:
            print(f"❌ NO MATCH: Could not find book with ID: {book_id}")
    
    else:
        print("⚠️  No available books to test dispatch with!")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    test_book_data()
