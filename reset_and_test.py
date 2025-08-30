#!/usr/bin/env python
"""
Reset book assignment status and test dispatch creation.
"""

import os
import django
import sys

# Add the backend directory to the path
sys.path.append('/c/Users/Administrator/Documents/POZ\fuel_coupon_system\backend')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import Book, BookDispatch

def reset_and_test():
    """Reset book status and test dispatch creation."""
    
    print("🔄 RESETTING BOOK STATUS AND TESTING DISPATCH")
    print("=" * 60)
    
    # Reset all books to be available
    books = Book.objects.all()
    for book in books:
        book.is_assigned = False
        book.save()
        print(f"✅ Reset book {book.book_number} to available")
    
    # Clear any existing dispatches for clean test
    dispatches = BookDispatch.objects.all()
    dispatch_count = dispatches.count()
    if dispatch_count > 0:
        dispatches.delete()
        print(f"🗑️  Cleared {dispatch_count} existing dispatches")
    
    # Now test dispatch creation
    from test_dispatch_creation import test_dispatch_creation
    test_dispatch_creation()

if __name__ == "__main__":
    reset_and_test()
