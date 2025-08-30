#!/usr/bin/env python
"""
Final test of the BookDispatch with book linking functionality.
This script creates a real dispatch with actual book linking.
"""

import os
import sys

# Add the backend directory to Python path
backend_path = r'C:\Users\Administrator\Documents\POZ\fuel_coupon_system\backend'
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

# Now import Django models
from fuel.models import Book, BookDispatch, SubCenter, User
from django.utils import timezone

def test_final_dispatch():
    """Final test of dispatch creation with book linking."""
    
    print("🎯 FINAL DISPATCH TEST - LINKING REAL BOOKS")
    print("=" * 60)
    
    # Reset book status first
    books = Book.objects.all()
    for book in books:
        book.is_assigned = False
        book.save()
    
    # Clear any existing dispatches
    BookDispatch.objects.all().delete()
    
    print(f"📚 Available books: {Book.objects.filter(is_assigned=False).count()}")
    
    if not Book.objects.filter(is_assigned=False).exists():
        print("❌ No books available for testing!")
        return
    
    # Get the test data
    book = Book.objects.filter(is_assigned=False).first()
    subcenter = SubCenter.objects.first()
    user = User.objects.filter(is_superuser=True).first()
    
    print(f"📖 Book to dispatch: {book.book_number}")
    print(f"📍 Target subcenter: {subcenter.name if subcenter else 'None'}")
    print(f"👤 Dispatcher: {user.username if user else 'None'}")
    
    # Create dispatch
    dispatch = BookDispatch.objects.create(
        to_center=subcenter,
        dispatched_by=user,
        status='DISPATCHED',
        dispatch_date=timezone.now(),
    )
    
    print(f"✅ Created dispatch ID: {dispatch.id}")
    
    # Test if books field exists and works
    try:
        print(f"🔍 Testing books field...")
        
        # Check if books attribute exists
        if hasattr(dispatch, 'books'):
            print(f"✅ dispatch.books exists: {type(dispatch.books)}")
            
            # Try to add the book
            dispatch.books.add(book)
            print(f"✅ Added book {book.book_number} to dispatch")
            
            # Mark book as assigned
            book.is_assigned = True
            book.save()
            
            # Verify the relationship
            linked_books = dispatch.books.count()
            print(f"📊 Books linked to dispatch: {linked_books}")
            
            if linked_books > 0:
                print(f"🎉 SUCCESS! Dispatch properly linked to {linked_books} book(s)")
                for linked_book in dispatch.books.all():
                    print(f"  - {linked_book.book_number}: {linked_book.first_coupon_number} - {linked_book.last_coupon_number}")
                
                # Check if book is no longer available
                available_count = Book.objects.filter(is_assigned=False).count()
                print(f"📖 Remaining available books: {available_count}")
                
                if available_count == 0:
                    print("✅ Perfect! Book properly removed from available inventory")
                else:
                    print("⚠️  Note: Other books still available")
            else:
                print("❌ No books linked to dispatch")
                
        else:
            print("❌ dispatch.books attribute does not exist!")
            
    except Exception as e:
        print(f"❌ Error testing books field: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("✅ Test completed")

if __name__ == "__main__":
    test_final_dispatch()
