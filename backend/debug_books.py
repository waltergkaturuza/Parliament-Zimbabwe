#!/usr/bin/env python
import os
import sys
import django

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import Book

print("Available books for frontend matching:")
for book in Book.objects.all()[:5]:
    print(f"Book {book.id}:")
    print(f'  book_number: "{book.book_number}"')
    print(f'  first_coupon_number: "{book.first_coupon_number}"')  
    print(f'  initial_coupon_count: {book.initial_coupon_count}')
    if hasattr(book, 'box') and book.box:
        print(f'  box_code: "{book.box.box_code}"')
    print()

print("\nFrontend should send book objects like:")
print("""
{
  "bookId": "Book 1",  // matches book_number
  "boxId": "TEST-BOX-001", // matches box.box_code
  "firstCouponId": "PU006GH355001",  // matches first_coupon_number
  "numberOfCoupons": 100,
  "value": 2000
}
""")