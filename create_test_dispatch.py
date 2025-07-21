#!/usr/bin/env python
import os
import sys
import django
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import User, Book, BookDispatch, SubCenter

def create_test_dispatch():
    """Create a test dispatch for verification"""
    try:
        # Get main center user
        user = User.objects.get(username='maincenter_test')
        print(f"✓ Found user: {user.name} ({user.role})")
        
        # Get subcenter
        sub_center = SubCenter.objects.first()
        if not sub_center:
            print("✗ No subcenter found")
            return
        print(f"✓ Found subcenter: {sub_center.name}")
        
        # Get unassigned books
        books = Book.objects.filter(is_assigned=False)[:3]
        if not books:
            print("✗ No unassigned books found")
            return
        print(f"✓ Found {len(books)} unassigned books")
        
        # Create dispatch
        dispatch = BookDispatch.objects.create(
            from_center=None,  # Main center (null)
            to_center=sub_center,
            dispatched_by=user,
            book_count=len(books),
            notes=f"Test dispatch created on {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        )
        
        # Add books to dispatch
        for book in books:
            dispatch.books.add(book)
            print(f"  - Added Book ID: {book.id}, Book Number: {book.book_number}")
        
        print(f"✓ Created dispatch ID: {dispatch.id}")
        print(f"✓ Dispatch contains {dispatch.books.count()} books")
        print(f"✓ Dispatch status: {dispatch.status}")
        print(f"✓ Created at: {dispatch.created}")
        
        return dispatch
        
    except Exception as e:
        print(f"✗ Error creating dispatch: {e}")
        return None

def verify_dispatches():
    """Verify existing dispatches"""
    print("\n=== EXISTING DISPATCHES ===")
    dispatches = BookDispatch.objects.all().order_by('-created')[:5]
    
    if not dispatches:
        print("No dispatches found")
        return
    
    for dispatch in dispatches:
        print(f"Dispatch ID: {dispatch.id}")
        print(f"  From: {'Main Center' if dispatch.from_center is None else dispatch.from_center.name}")
        print(f"  To: {dispatch.to_center.name}")
        print(f"  By: {dispatch.dispatched_by.name}")
        print(f"  Books: {dispatch.books.count()}")
        print(f"  Status: {dispatch.status}")
        print(f"  Created: {dispatch.created}")
        print(f"  Notes: {dispatch.notes}")
        print("---")

if __name__ == "__main__":
    print("=== FUEL COUPON DISPATCH TEST ===")
    
    # Verify existing dispatches
    verify_dispatches()
    
    # Create new test dispatch
    print("\n=== CREATING NEW TEST DISPATCH ===")
    dispatch = create_test_dispatch()
    
    if dispatch:
        print("\n=== VERIFICATION ===")
        verify_dispatches()
        print("\n✓ Test dispatch created successfully!")
    else:
        print("\n✗ Failed to create test dispatch")
