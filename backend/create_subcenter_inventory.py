#!/usr/bin/env python
"""
Create test inventory data for subcenter management
"""
import os
import django
from decimal import Decimal
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from fuel.models import (
    Box, Book, Coupon, SubCenter, BeneficiaryCategory, 
    CouponAllocation, BookDispatch
)

User = get_user_model()

def create_subcenter_inventory():
    print("Creating subcenter inventory test data...")
    
    # Get or create a subcenter
    subcenter, created = SubCenter.objects.get_or_create(
        code='SUB001',
        defaults={
            'name': 'Harare Sub Center',
            'location': '123 Main Street, Harare',
            'contact_number': '+263771234567',
            'email': 'harare@subcenter.zw',
            'is_active': True,
            'capacity': 100
        }
    )
    print(f"SubCenter: {subcenter.name} ({'created' if created else 'exists'})")
    
    # Get or create a main center user
    main_user, created = User.objects.get_or_create(
        username='main_center_admin',
        defaults={
            'email': 'main@admin.com',
            'first_name': 'Main Center',
            'last_name': 'Admin',
            'role': 'MAIN_CENTER',
            'is_active': True
        }
    )
    if created:
        main_user.set_password('admin123')
        main_user.save()
    print(f"Main center user: {main_user.username} ({'created' if created else 'exists'})")
    
    # Get or create a subcenter user
    sub_user, created = User.objects.get_or_create(
        username='sub_center_admin',
        defaults={
            'email': 'sub@admin.com',
            'first_name': 'Sub Center',
            'last_name': 'Admin',
            'role': 'SUB_CENTER',
            'sub_center': subcenter,
            'is_active': True
        }
    )
    if created:
        sub_user.set_password('admin123')
        sub_user.save()
    print(f"Sub center user: {sub_user.username} ({'created' if created else 'exists'})")
    
    # Create boxes for the subcenter
    for i in range(3):
        box_code = f"FCB-2025-0829{str(i+1).zfill(3)}"
        
        # Check if box already exists
        if Box.objects.filter(box_code=box_code).exists():
            print(f"Box {box_code} already exists, skipping...")
            continue
            
        box = Box.objects.create(
            box_code=box_code,
            first_coupon_number=f"FC{100000 + (i * 1000)}",
            last_coupon_number=f"FC{100000 + (i * 1000) + 999}",
            total_litres=20000,  # 1000 coupons * 20L each
            assigned_to=subcenter,
            received_by=main_user,
            received_at=timezone.now() - timedelta(days=i+1),
            status='RECEIVED',
            fuel_type='PETROL',
            denomination=20,
            number_of_books=10,
            coupons_per_book=100,
            total_coupons_calculated=1000,
            books_dispatched=0,
            coupons_used=0,
            litres_used=Decimal('0.00'),
            total_value_zwg=Decimal('2000000.00'),  # ZWG 2M
            total_value_usd=Decimal('1000.00'),     # USD 1000
            fuel_price_per_litre_usd=Decimal('1.00'),
            exchange_rate_zwg_usd=Decimal('2000.00'),
            is_received=True
        )
        print(f"Created box: {box.box_code}")
        
        # Create books for each box
        for book_num in range(1, 11):  # 10 books per box
            book_number = f"{box.box_code}-B{str(book_num).zfill(2)}"
            
            # Calculate coupon range for this book
            first_coupon_num = 100000 + (i * 1000) + ((book_num - 1) * 100)
            last_coupon_num = first_coupon_num + 99
            
            book = Book.objects.create(
                book_number=book_number,
                box=box,
                first_coupon_number=f"FC{first_coupon_num}",
                last_coupon_number=f"FC{last_coupon_num}",
                initial_coupon_count=100,
                is_assigned=False,
                generated_at=timezone.now() - timedelta(days=i+1),
                generated_by=main_user,
                book_code=f"{box_code}-{book_number}"
            )
            print(f"  Created book: {book.book_number} ({book.first_coupon_number}-{book.last_coupon_number})")
            
            # Create some coupons for the first book of first box to demonstrate usage
            if i == 0 and book_num == 1:
                for coupon_num in range(first_coupon_num, first_coupon_num + 100):
                    Coupon.objects.create(
                        serial_number=f"FC{coupon_num}",
                        book=book,
                        litres=20,
                        value_zwg=Decimal('2000.00'),
                        value_usd=Decimal('1.00'),
                        status='AVAILABLE'
                    )
                print(f"    Created 100 coupons for {book.book_number}")
    
    # Create a dispatch record to show books received by subcenter
    try:
        dispatch = BookDispatch.objects.create(
            dispatch_id=f"DSP-{timezone.now().strftime('%Y%m%d')}-001",
            subcenter=subcenter,
            dispatched_by=main_user,
            received_by=sub_user,
            dispatch_date=timezone.now() - timedelta(days=1),
            total_books=10,
            total_coupons=1000,
            total_value_zwg=Decimal('2000000.00'),
            status='COMPLETED',
            notes='Initial inventory dispatch for subcenter testing'
        )
        print(f"Created dispatch: {dispatch.dispatch_id}")
    except Exception as e:
        print(f"Note: Could not create dispatch (may not be required): {e}")
    
    # Create some test beneficiaries for allocation
    try:
        mp_category, _ = BeneficiaryCategory.objects.get_or_create(
            name='MP',
            defaults={'description': 'Member of Parliament'}
        )
        
        # Sample beneficiary for testing allocations
        beneficiary_user, created = User.objects.get_or_create(
            username='test_mp',
            defaults={
                'email': 'test.mp@parliament.zw',
                'first_name': 'Test',
                'last_name': 'MP',
                'role': 'BENEFICIARY',
                'is_active': True
            }
        )
        if created:
            beneficiary_user.set_password('test123')
            beneficiary_user.save()
            print(f"Created test beneficiary: {beneficiary_user.username}")
    except Exception as e:
        print(f"Note: Could not create test beneficiary: {e}")
    
    print("\n" + "="*50)
    print("SUBCENTER INVENTORY CREATION COMPLETE")
    print("="*50)
    print(f"Created:")
    print(f"- SubCenter: {subcenter.name}")
    print(f"- Boxes: {Box.objects.count()}")
    print(f"- Books: {Book.objects.count()}")
    print(f"- Coupons: {Coupon.objects.count()}")
    print(f"- Users: Main Center Admin, Sub Center Admin")
    print("\nAPI endpoints should now return data:")
    print("- GET /api/boxes/ - List all boxes")
    print("- GET /api/books/ - List all books")  
    print("- GET /api/books/received/ - Books received by subcenter")
    print("- GET /api/allocations/ - Coupon allocations")

if __name__ == "__main__":
    create_subcenter_inventory()
