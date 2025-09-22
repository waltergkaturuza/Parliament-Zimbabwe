#!/usr/bin/env python
import os
import sys
import django

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from fuel.models import BookDispatch, Book, Box

print("=== BookDispatch Records ===")
for d in BookDispatch.objects.all():
    print(f"Dispatch ID: {d.id}")
    print(f"  Status: {d.status}")
    print(f"  To Center: {d.to_center.name if d.to_center else 'None'}")
    print(f"  Books linked: {d.books.count()}")
    print(f"  Total coupons (field): {d.total_coupons}")
    print(f"  Created: {d.dispatch_date}")
    if d.books.exists():
        print("  Linked books:")
        for book in d.books.all():
            print(f"    - Book {book.id}: {book.book_number}, Coupons: {book.initial_coupon_count}")
    print()

print("=== Available Books Sample ===")
print(f"Total books in DB: {Book.objects.count()}")
if Book.objects.exists():
    print("First 5 books:")
    for b in Book.objects.all()[:5]:
        print(f"  Book ID: {b.id}")
        print(f"    book_number: {b.book_number}")
        print(f"    first_coupon_number: {b.first_coupon_number}")
        print(f"    initial_coupon_count: {b.initial_coupon_count}")
        print(f"    box: {b.box.box_code if b.box else 'None'}")
        print(f"    is_assigned: {getattr(b, 'is_assigned', 'Field not exists')}")
        print()
else:
    print("No books found in database!")

print("=== Box Sample ===")
print(f"Total boxes: {Box.objects.count()}")
for box in Box.objects.all()[:3]:
    print(f"Box {box.id}: {box.box_code}, Books: {box.books.count()}")