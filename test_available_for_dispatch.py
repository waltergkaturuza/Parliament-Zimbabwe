#!/usr/bin/env python
"""
Test the available_for_dispatch endpoint to verify it returns actual books.
"""

import os
import django
import sys
import json

# Add the backend directory to the path
sys.path.append('/c/Users/Administrator/Documents/POZ/fuel_coupon_system/backend')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import Book, Box, SubCenter, User
from fuel.views_main import BookViewSet
from django.test import RequestFactory
from unittest.mock import Mock

def test_available_for_dispatch():
    """Test the available_for_dispatch endpoint"""
    
    print("🔍 TESTING AVAILABLE_FOR_DISPATCH ENDPOINT")
    print("=" * 50)
    
    # Create a mock request
    factory = RequestFactory()
    request = factory.get('/api/v1/books/available_for_dispatch/')
    request.user = User.objects.first() or Mock()
    
    # Create viewset instance and call the action
    viewset = BookViewSet()
    viewset.request = request
    
    try:
        response = viewset.available_for_dispatch(request)
        
        if hasattr(response, 'data'):
            data = response.data
        elif hasattr(response, 'content'):
            data = json.loads(response.content)
        else:
            data = response
        
        print(f"📊 Response status: {getattr(response, 'status_code', 'N/A')}")
        print(f"📚 Total books available: {data.get('total_available', 0)}")
        print(f"📖 Books returned: {len(data.get('results', []))}")
        
        # Show first few books
        books = data.get('results', [])
        for i, book in enumerate(books[:3]):
            print(f"\n📖 Book {i+1}:")
            print(f"  - ID: {book.get('id')}")
            print(f"  - Book Number: {book.get('bookId')}")
            print(f"  - Box: {book.get('boxId')}")
            print(f"  - Fuel Type: {book.get('fuelType')}")
            print(f"  - First Coupon: {book.get('firstCouponId')}")
            print(f"  - Last Coupon: {book.get('lastCouponId')}")
            print(f"  - Number of Coupons: {book.get('numberOfCoupons')}")
            print(f"  - Value: ${book.get('value', 0):.2f}")
            
            # Check if this looks like real data or mock data
            if book.get('firstCouponId', '').startswith('SC2-2025'):
                print("  ✅ This appears to be REAL book data!")
            elif book.get('firstCouponId', '').startswith('MOCK') or not book.get('firstCouponId'):
                print("  ⚠️  This appears to be MOCK data!")
            else:
                print("  ❓ Unknown data format")
        
    except Exception as e:
        print(f"❌ Error calling available_for_dispatch: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    test_available_for_dispatch()
