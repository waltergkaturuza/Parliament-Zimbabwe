#!/usr/bin/env python
"""
Test script to verify book dispatch linking is working correctly.
This tests that dispatches link to actual books instead of creating fake ones.
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

def test_book_dispatch_linking():
    """Test that book dispatch properly links to actual books."""
    
    print("🔍 TESTING BOOK DISPATCH LINKING")
    print("=" * 50)
    
    # Check existing books
    total_books = Book.objects.count()
    available_books = Book.objects.filter(is_assigned=False)
    print(f"📚 Total books in database: {total_books}")
    print(f"📖 Available books (not assigned): {available_books.count()}")
    
    if available_books.exists():
        # Show first few available books
        for book in available_books[:3]:
            print(f"  - Book {book.book_number}: {book.first_coupon_number} - {book.last_coupon_number} ({book.initial_coupon_count or 'unknown'} coupons)")
            if book.box:
                print(f"    Box: {book.box.box_code}, Fuel: {book.box.fuel_type}, Denomination: {book.box.denomination}")
    
    # Check existing dispatches
    total_dispatches = BookDispatch.objects.count()
    print(f"\n📦 Total dispatches: {total_dispatches}")
    
    if total_dispatches > 0:
        latest_dispatch = BookDispatch.objects.order_by('-dispatch_date').first()
        linked_books = latest_dispatch.books.count()
        print(f"📦 Latest dispatch (ID: {latest_dispatch.id}):")
        print(f"  - Status: {latest_dispatch.status}")
        print(f"  - Linked books: {linked_books}")
        print(f"  - Total coupons: {latest_dispatch.total_coupons}")
        
        if linked_books > 0:
            print("  - Books in dispatch:")
            for book in latest_dispatch.books.all():
                print(f"    * {book.book_number}: {book.first_coupon_number} - {book.last_coupon_number}")
        else:
            print("  ⚠️  WARNING: No books linked to this dispatch!")
    
    # Check for boxes
    total_boxes = Box.objects.count()
    print(f"\n📦 Total boxes: {total_boxes}")
    
    if total_boxes > 0:
        verified_boxes = Box.objects.filter(status='VERIFIED')
        print(f"📦 Verified boxes: {verified_boxes.count()}")
        
        for box in verified_boxes[:2]:
            books_in_box = box.books.count()
            print(f"  - Box {box.box_code}: {books_in_box} books")
            if books_in_box > 0:
                for book in box.books.all()[:2]:
                    assigned_status = "DISPATCHED" if book.is_assigned else "AVAILABLE"
                    print(f"    * Book {book.book_number}: {assigned_status}")
    
    print("\n" + "=" * 50)
    print("✅ Test completed. Check above for any warnings.")

if __name__ == "__main__":
    test_book_dispatch_linking()
