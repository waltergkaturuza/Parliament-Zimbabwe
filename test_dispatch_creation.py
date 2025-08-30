#!/usr/bin/env python
"""
Test creating a real dispatch with actual book linking.
"""

import os
import django
import sys
import json

# Add the backend directory to the path
sys.path.append('/c/Users/Administrator/Documents/POZ\fuel_coupon_system\backend')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import Book, BookDispatch, Box, SubCenter, User
from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser

def test_dispatch_creation():
    """Test creating a dispatch with actual book linking."""
    
    print("🔍 TESTING DISPATCH CREATION WITH REAL BOOKS")
    print("=" * 60)
    
    # Get available books
    available_books = Book.objects.filter(is_assigned=False)
    if not available_books.exists():
        print("❌ No available books to test with!")
        return
    
    book = available_books.first()
    print(f"📖 Using book: {book.book_number} (ID: {book.id})")
    print(f"  - Serial range: {book.first_coupon_number} - {book.last_coupon_number}")
    print(f"  - Coupons: {book.initial_coupon_count}")
    
    # Get or create a subcenter
    subcenter = SubCenter.objects.first()
    if not subcenter:
        subcenter = SubCenter.objects.create(
            name="Test SubCenter",
            code="TSC001"
        )
        print(f"📍 Created test subcenter: {subcenter.name}")
    else:
        print(f"📍 Using subcenter: {subcenter.name}")
    
    # Get or create a user
    user = User.objects.filter(is_superuser=True).first()
    if not user:
        user = User.objects.create_user(
            username="test_dispatcher",
            password="test123",
            role="MAIN_CENTER"
        )
        print(f"👤 Created test user: {user.username}")
    else:
        print(f"👤 Using user: {user.username}")
    
    # Create mock request payload (similar to frontend)
    payload = {
        'subCenterId': str(subcenter.id),
        'subCenterName': subcenter.name,
        'books': [{
            'id': str(book.id),
            'bookId': book.book_number,
            'boxId': book.box.box_code if book.box else 'Unknown',
            'fuelType': book.box.fuel_type if book.box else 'DIESEL',
            'couponAmount': book.box.denomination if book.box else 20,
            'firstCouponId': book.first_coupon_number,
            'lastCouponId': book.last_coupon_number,
            'numberOfCoupons': book.initial_coupon_count or 100,
            'value': 2000.0,
            'pricePerLitre': 1.45,
        }],
        'totalBooks': 1,
        'totalCoupons': book.initial_coupon_count or 100,
        'totalValue': 2000.0,
        'status': 'DISPATCHED'
    }
    
    print(f"\n📦 Creating dispatch with payload:")
    print(f"  - Target SubCenter: {payload['subCenterName']}")
    print(f"  - Books: {payload['totalBooks']}")
    print(f"  - Total Coupons: {payload['totalCoupons']}")
    
    # Simulate the dispatch creation logic from BookDispatchViewSet.create()
    try:
        from django.utils import timezone
        from django.db import models
        
        # Create the dispatch
        dispatch = BookDispatch.objects.create(
            to_center=subcenter,
            dispatched_by=user,
            status=payload.get('status', 'DISPATCHED'),
            dispatch_date=timezone.now(),
        )
        
        print(f"\n✅ Created dispatch: ID {dispatch.id}")
        
        # Link actual books (our new logic)
        books_payload = payload.get('books', [])
        actual_books = []
        
        for book_data in books_payload:
            book_id = book_data.get('bookId') or book_data.get('id')
            box_id = book_data.get('boxId')
            first_coupon = book_data.get('firstCouponId')
            
            # Find the actual book in the database
            found_book = None
            if book_id:
                found_book = Book.objects.filter(
                    models.Q(book_number=book_id) | 
                    models.Q(id=book_id) if str(book_id).isdigit() else models.Q(book_number=book_id)
                ).first()
            
            if found_book:
                actual_books.append(found_book)
                # Mark book as dispatched
                found_book.is_assigned = True
                found_book.save()
                print(f"✅ Linked book {found_book.book_number} to dispatch")
                print(f"  - Marked book as assigned (is_assigned=True)")
            else:
                print(f"❌ Could not find book: {book_id}")
        
        # Set the books relationship
        if actual_books:
            dispatch.books.set(actual_books)
            
            # Update dispatch totals based on actual books
            total_coupons = sum(book.initial_coupon_count or 100 for book in actual_books)
            first_serials = [book.first_coupon_number for book in actual_books if book.first_coupon_number]
            last_serials = [book.last_coupon_number for book in actual_books if book.last_coupon_number]
            
            if first_serials:
                dispatch.first_serial = min(first_serials)
            if last_serials:
                dispatch.last_serial = max(last_serials)
            dispatch.total_coupons = total_coupons
            dispatch.save()
            
            print(f"✅ Updated dispatch with real book data:")
            print(f"  - First Serial: {dispatch.first_serial}")
            print(f"  - Last Serial: {dispatch.last_serial}")
            print(f"  - Total Coupons: {dispatch.total_coupons}")
        
        # Verify the linkage
        linked_books = dispatch.books.count()
        print(f"\n📊 VERIFICATION:")
        print(f"  - Dispatch ID: {dispatch.id}")
        print(f"  - Status: {dispatch.status}")
        print(f"  - To Center: {dispatch.to_center.name}")
        print(f"  - Linked Books: {linked_books}")
        
        if linked_books > 0:
            print(f"  ✅ SUCCESS: Dispatch is properly linked to {linked_books} actual book(s)")
            for book in dispatch.books.all():
                print(f"    - {book.book_number}: {book.first_coupon_number} - {book.last_coupon_number}")
        else:
            print(f"  ❌ FAILURE: No books linked to dispatch")
        
        # Check if book is no longer available
        still_available = Book.objects.filter(id=book.id, is_assigned=False).exists()
        if still_available:
            print(f"  ❌ PROBLEM: Book {book.book_number} is still available (should be assigned)")
        else:
            print(f"  ✅ SUCCESS: Book {book.book_number} is no longer available (properly assigned)")
    
    except Exception as e:
        print(f"❌ Error creating dispatch: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    test_dispatch_creation()
