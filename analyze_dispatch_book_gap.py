#!/usr/bin/env python3
"""
Dispatch-Book Relationship Analysis
Check why dispatches have no books but we have coupons
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import BookDispatch, Book, Coupon, Box, SubCenter
from django.db import connection

def analyze_dispatch_book_gap():
    """Analyze the gap between dispatches, books, and coupons"""
    print("🔍 DISPATCH-BOOK RELATIONSHIP ANALYSIS")
    print("=" * 50)
    
    # Count everything
    total_dispatches = BookDispatch.objects.count()
    total_books = Book.objects.count()
    total_coupons = Coupon.objects.count()
    total_boxes = Box.objects.count()
    
    print(f"📊 INVENTORY SUMMARY:")
    print(f"   Dispatches: {total_dispatches}")
    print(f"   Books: {total_books}")
    print(f"   Coupons: {total_coupons}")
    print(f"   Boxes: {total_boxes}")
    
    print(f"\n📦 DISPATCH ANALYSIS:")
    for dispatch in BookDispatch.objects.all():
        book_count = dispatch.books.count()
        print(f"   {dispatch.main_center_dispatch_number}: {book_count} books, to {dispatch.to_center.name if dispatch.to_center else 'None'}")
    
    print(f"\n📚 BOOK ANALYSIS:")
    for book in Book.objects.all()[:10]:  # Show first 10
        coupon_count = book.coupons.count()
        dispatch_count = book.dispatches.count()
        print(f"   Book {book.pk}: {coupon_count} coupons, {dispatch_count} dispatches, box: {book.box}")
    
    if Book.objects.count() > 10:
        print(f"   ... and {Book.objects.count() - 10} more books")
    
    print(f"\n🎫 COUPON ANALYSIS:")
    if Coupon.objects.exists():
        first_coupon = Coupon.objects.first()
        last_coupon = Coupon.objects.last()
        print(f"   First coupon: {first_coupon.coupon_number} (Book {first_coupon.book.pk})")
        print(f"   Last coupon: {last_coupon.coupon_number} (Book {last_coupon.book.pk})")
        
        # Check which books have coupons
        books_with_coupons = Book.objects.filter(coupons__isnull=False).distinct()
        print(f"   Books with coupons: {books_with_coupons.count()}")
    
    print(f"\n🔗 MISSING RELATIONSHIPS:")
    
    # Books not in any dispatch
    unassigned_books = Book.objects.filter(dispatches__isnull=True)
    print(f"   Books not in dispatches: {unassigned_books.count()}")
    
    # Dispatches with no books
    empty_dispatches = BookDispatch.objects.filter(books__isnull=True)
    print(f"   Dispatches with no books: {empty_dispatches.count()}")
    
    # Books with coupons but not dispatched
    books_with_coupons_not_dispatched = Book.objects.filter(
        coupons__isnull=False, 
        dispatches__isnull=True
    ).distinct()
    print(f"   Books with coupons but not dispatched: {books_with_coupons_not_dispatched.count()}")
    
    print(f"\n💡 SUGGESTED FIXES:")
    
    if unassigned_books.exists() and empty_dispatches.exists():
        print(f"   1. Link {unassigned_books.count()} unassigned books to {empty_dispatches.count()} empty dispatches")
        
        # Show specific recommendations
        print(f"\n📋 SPECIFIC LINKING RECOMMENDATIONS:")
        for i, dispatch in enumerate(empty_dispatches[:5]):  # Show first 5
            available_books = unassigned_books[i:i+3]  # 3 books per dispatch
            if available_books:
                book_list = ", ".join([f"Book {b.pk}" for b in available_books])
                print(f"   {dispatch.main_center_dispatch_number} ← {book_list}")
    
    # Check database constraints
    print(f"\n🔍 DATABASE CONSTRAINTS:")
    with connection.cursor() as cursor:
        # Check many-to-many table
        cursor.execute("SELECT COUNT(*) FROM fuel_bookdispatch_books")
        m2m_count = cursor.fetchone()[0]
        print(f"   Dispatch-Book M2M relationships: {m2m_count}")
        
        # Check if there are orphaned records
        cursor.execute("""
            SELECT bd.main_center_dispatch_number, COUNT(bdb.book_id) as book_count
            FROM fuel_bookdispatch bd 
            LEFT JOIN fuel_bookdispatch_books bdb ON bd.id = bdb.bookdispatch_id
            GROUP BY bd.id, bd.main_center_dispatch_number
            ORDER BY bd.main_center_dispatch_number
        """)
        
        print(f"   Dispatch → Book relationships:")
        for row in cursor.fetchall():
            dispatch_num, book_count = row
            print(f"     {dispatch_num}: {book_count} books")

if __name__ == "__main__":
    analyze_dispatch_book_gap()