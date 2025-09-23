#!/usr/bin/env python
"""Direct Django database fix for dispatch data issues."""

import os
import sys

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from fuel.models import BookDispatch, SubCenter, Book

def check_and_fix_dispatch_data():
    """Check and fix dispatch data issues."""
    print("🔧 Checking and Fixing Dispatch Data Issues")
    print("=" * 60)
    
    # Get all dispatches
    dispatches = BookDispatch.objects.all()
    print(f"📦 Found {dispatches.count()} dispatches")
    
    # Get all subcenters
    subcenters = SubCenter.objects.all()
    print(f"🏢 Available SubCenters:")
    for sc in subcenters:
        print(f"   ID: {sc.id}, Name: {sc.name}, Code: {sc.code}")
    
    if not subcenters.exists():
        print("❌ No subcenters found! Cannot fix dispatches.")
        return
    
    default_subcenter = subcenters.first()
    
    print(f"\n🔧 Fixing dispatch data issues...")
    
    fixed_count = 0
    for dispatch in dispatches:
        needs_fix = False
        changes = []
        
        print(f"\n📦 Checking Dispatch {dispatch.dispatch_id} (ID: {dispatch.id})")
        
        # Fix 1: Missing to_center_id
        if not dispatch.to_center_id:
            dispatch.to_center_id = default_subcenter.id
            needs_fix = True
            changes.append(f"Set to_center_id to {default_subcenter.id} ({default_subcenter.name})")
        
        # Fix 2: Missing books - assign some default books
        if dispatch.total_books == 0:
            # Try to get some available books
            available_books = Book.objects.filter(status='AVAILABLE')[:1]
            if available_books.exists():
                book = available_books.first()
                dispatch.books.add(book)
                dispatch.total_books = 1
                dispatch.total_coupons = book.pages_per_book * book.coupons_per_page if hasattr(book, 'pages_per_book') and hasattr(book, 'coupons_per_page') else 100
                needs_fix = True
                changes.append(f"Added book {book.book_id}, total_books=1, total_coupons={dispatch.total_coupons}")
        
        # Fix 3: Missing created timestamp
        if not dispatch.created:
            dispatch.created = dispatch.dispatch_date if dispatch.dispatch_date else django.utils.timezone.now()
            needs_fix = True
            changes.append(f"Set created timestamp")
        
        # Fix 4: Missing dispatched_at timestamp
        if not dispatch.dispatched_at and dispatch.status in ['DISPATCHED', 'DELIVERED']:
            dispatch.dispatched_at = dispatch.dispatch_date if dispatch.dispatch_date else django.utils.timezone.now()
            needs_fix = True
            changes.append(f"Set dispatched_at timestamp")
        
        # Fix 5: Calculate values if missing
        if dispatch.total_value_usd == 0 and dispatch.total_coupons > 0:
            # Assume $0.50 per coupon (adjust as needed)
            dispatch.total_value_usd = dispatch.total_coupons * 0.50
            needs_fix = True
            changes.append(f"Calculated total_value_usd = ${dispatch.total_value_usd}")
        
        if needs_fix:
            try:
                dispatch.save()
                fixed_count += 1
                print(f"   ✅ FIXED: {', '.join(changes)}")
            except Exception as e:
                print(f"   ❌ ERROR fixing dispatch {dispatch.id}: {e}")
        else:
            print(f"   ✅ No fixes needed")
    
    print(f"\n🎉 Summary: Fixed {fixed_count} out of {dispatches.count()} dispatches")
    
    # Show updated dispatch data
    print(f"\n📊 Updated Dispatch Summary:")
    for dispatch in dispatches:
        subcenter_name = dispatch.to_center.name if dispatch.to_center else "No SubCenter"
        print(f"   {dispatch.dispatch_id}: {subcenter_name}, {dispatch.total_books} books, {dispatch.total_coupons} coupons, ${dispatch.total_value_usd}")

if __name__ == "__main__":
    check_and_fix_dispatch_data()