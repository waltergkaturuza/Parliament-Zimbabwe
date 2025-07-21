#!/usr/bin/env python
"""
Simple script to check dispatch status and verify system works
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import User, Book, BookDispatch, SubCenter

def check_system_status():
    """Check the current system status"""
    print("=== FUEL COUPON SYSTEM STATUS ===")
    print(f"Time: {django.utils.timezone.now()}")
    print()
    
    # Check users
    main_center_users = User.objects.filter(role='MAIN_CENTER')
    print(f"Main Center Users: {main_center_users.count()}")
    for user in main_center_users:
        print(f"  - {user.username} ({user.name})")
    print()
    
    # Check subcenters
    subcenters = SubCenter.objects.all()
    print(f"Sub Centers: {subcenters.count()}")
    for sc in subcenters[:3]:
        print(f"  - {sc.name}")
    print()
    
    # Check books
    total_books = Book.objects.count()
    assigned_books = Book.objects.filter(is_assigned=True).count()
    unassigned_books = Book.objects.filter(is_assigned=False).count()
    
    print(f"Books Total: {total_books}")
    print(f"Books Assigned: {assigned_books}")
    print(f"Books Unassigned: {unassigned_books}")
    print()
    
    # Check dispatches
    dispatches = BookDispatch.objects.all().order_by('-created')
    print(f"Total Dispatches: {dispatches.count()}")
    
    if dispatches.exists():
        print("\nRecent Dispatches:")
        for dispatch in dispatches[:5]:
            books_count = dispatch.books.count()
            print(f"  - ID: {dispatch.id}")
            print(f"    To: {dispatch.to_center.name}")
            print(f"    By: {dispatch.dispatched_by.name}")
            print(f"    Books: {books_count}")
            print(f"    Status: {dispatch.status}")
            print(f"    Date: {dispatch.created}")
            print(f"    Notes: {dispatch.notes}")
            print()
    else:
        print("No dispatches found")
    
    return {
        'users': main_center_users.count(),
        'subcenters': subcenters.count(),
        'total_books': total_books,
        'unassigned_books': unassigned_books,
        'dispatches': dispatches.count()
    }

def create_simple_dispatch():
    """Create a simple test dispatch"""
    try:
        user = User.objects.get(username='maincenter_test')
        subcenter = SubCenter.objects.first()
        books = Book.objects.filter(is_assigned=False)[:2]
        
        if not subcenter:
            print("❌ No subcenter available")
            return None
            
        if not books:
            print("❌ No unassigned books available")
            return None
        
        dispatch = BookDispatch.objects.create(
            to_center=subcenter,
            dispatched_by=user,
            book_count=len(books),
            notes=f"Simple test dispatch - {django.utils.timezone.now().strftime('%Y-%m-%d %H:%M')}"
        )
        
        for book in books:
            dispatch.books.add(book)
        
        print(f"✅ Created dispatch ID: {dispatch.id}")
        print(f"   Books: {dispatch.books.count()}")
        print(f"   To: {dispatch.to_center.name}")
        
        return dispatch
        
    except Exception as e:
        print(f"❌ Error creating dispatch: {e}")
        return None

if __name__ == "__main__":
    from django.utils import timezone
    
    # Check current status
    status = check_system_status()
    
    # Create a test dispatch if we have resources
    if status['unassigned_books'] > 0 and status['subcenters'] > 0:
        print("=== CREATING TEST DISPATCH ===")
        dispatch = create_simple_dispatch()
        
        if dispatch:
            print("\n=== UPDATED STATUS ===")
            check_system_status()
    else:
        print("⚠️  Insufficient resources to create test dispatch")
        print(f"   Unassigned books: {status['unassigned_books']}")
        print(f"   Subcenters: {status['subcenters']}")
