#!/usr/bin/env python
import os
import sys
import django

# Setup Django
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.append(backend_path)
os.chdir(backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import BookDispatch, SubCenter, Book, Box
from django.contrib.auth.models import User

# Check existing data
print("=== Current State ===")
dispatches = BookDispatch.objects.all()[:5]
for dispatch in dispatches:
    print(f"Dispatch {dispatch.id}: to_center={dispatch.to_center}, books={dispatch.books.count()}")

subcenters = SubCenter.objects.all()[:3]
print(f"\nAvailable SubCenters: {subcenters.count()}")
for sc in subcenters:
    print(f"  {sc.id}: {sc.name}")

books = Book.objects.all()[:3]
print(f"\nAvailable Books: {books.count()}")
for book in books:
    print(f"  {book.id}: {getattr(book, 'book_id', getattr(book, 'serial', 'no-id'))}")

# Try to fix the dispatch that's showing in the frontend (likely has ID 14 or similar)
print("\n=== Fixing Dispatch Data ===")

# Get or create a subcenter if none exists
if subcenters.exists():
    subcenter = subcenters.first()
    print(f"Using existing subcenter: {subcenter.name}")
else:
    # Create a test subcenter
    subcenter = SubCenter.objects.create(
        name="Test Sub-Center",
        location="Test Location",
        code="TSC-001"
    )
    print(f"Created new subcenter: {subcenter.name}")

# Get dispatches that need fixing (those without to_center)
dispatches_to_fix = BookDispatch.objects.filter(to_center=None)
print(f"Found {dispatches_to_fix.count()} dispatches without subcenter")

if dispatches_to_fix.exists():
    for dispatch in dispatches_to_fix:
        print(f"Updating dispatch {dispatch.id}")
        
        # Update the dispatch with subcenter
        dispatch.to_center = subcenter
        dispatch.save()
        
        # Add books if none exist
        if dispatch.books.count() == 0 and books.exists():
            book = books.first()
            dispatch.books.add(book)
            print(f"Added book {book.id} to dispatch")
        
        print(f"Dispatch {dispatch.id} updated: to_center={dispatch.to_center}, books={dispatch.books.count()}")
        
        # Test the properties
        try:
            print(f"  Total litres: {dispatch.total_litres}")
            print(f"  Total value USD: {dispatch.total_value_usd}")
            print(f"  Total value ZWG: {dispatch.total_value_zwg}")
        except Exception as e:
            print(f"  Error getting totals: {e}")

else:
    print("All dispatches already have subcenters")

print("\n=== Done ===")