#!/usr/bin/env python
"""
Django setup script to create test data for SubCenter dashboard
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import User, SubCenter, Coupon, Book, Box, AuditLog
from django.contrib.auth import get_user_model

def create_test_data():
    print("Creating test data for SubCenter dashboard...")
    
    # 1. Create or get the SubCenter
    subcenter, created = SubCenter.objects.get_or_create(
        code='SC002',
        defaults={
            'name': 'Test SubCenter for Dashboard',
            'location': 'Test Location, Harare',
            'is_active': True,
            'capacity': 500,
            'contact_number': '0123456789',  # Use contact_number instead of phone
            'email': 'test.subcenter@example.com'
        }
    )
    print(f"SubCenter: {subcenter.name}, ID: {subcenter.id}, Created: {created}")
    
    # 2. Get the test user and update their sub_center association
    try:
        user = User.objects.get(username='test_subcenter_user')
        user.sub_center = subcenter  # Use sub_center instead of centerId
        user.save()
        print(f"Updated user sub_center to: {user.sub_center.id}")
    except User.DoesNotExist:
        print("Test user not found, creating one...")
        user = User.objects.create_user(
            username='test_subcenter_user',
            password='admin123',
            role='SUB_CENTER',
            sub_center=subcenter,
            email='test@subcenter.com'
        )
        print(f"Created new user: {user.username}")
    
    # 3. Create a Box and Book to associate coupons with the subcenter
    box, created = Box.objects.get_or_create(
        box_code='BOX-SC002-001',  # Use box_code instead of box_number
        defaults={
            'assigned_to': subcenter,
            'first_coupon_number': 'SC2-2025-0001',
            'last_coupon_number': 'SC2-2025-0100',
            'fuel_type': 'DIESEL',
            'denomination': 20,
            'number_of_books': 10,
            'status': 'RECEIVED'
        }
    )
    print(f"Box: {box.box_code}, Created: {created}")
    
    book, created = Book.objects.get_or_create(
        book_number='BOOK-001',  # Keep book_number
        box=box,
        defaults={
            'first_coupon_number': 'SC2-2025-0001',
            'last_coupon_number': 'SC2-2025-0100'
        }
    )
    print(f"Book: {book.book_number}, Created: {created}")
    
    # 4. Create test coupons
    print("Creating test coupons...")
    for i in range(100):
        coupon_number = f'SC2-2025-{i+1:04d}'
        
        # Skip if coupon already exists
        if Coupon.objects.filter(coupon_number=coupon_number).exists():
            continue
            
        status = 'AVAILABLE' if i < 50 else 'USED'
        
        Coupon.objects.create(
            book=book,
            coupon_number=coupon_number,
            litres=20.0,  # 20 liters per coupon
            usd_value=25.0,  # $25 value
            status=status
        )
    
    # 5. Count the coupons
    total_coupons = Coupon.objects.filter(book__box__assigned_to=subcenter).count()
    available_coupons = Coupon.objects.filter(book__box__assigned_to=subcenter, status='AVAILABLE').count()
    used_coupons = Coupon.objects.filter(book__box__assigned_to=subcenter, status='USED').count()
    
    print(f"Total coupons: {total_coupons}")
    print(f"Available coupons: {available_coupons}")
    print(f"Used coupons: {used_coupons}")
    
    # 6. Create some audit log entries for recent activity
    print("Creating audit log entries for recent activity...")
    activities = [
        "Distributed 10 coupons to beneficiaries",
        "Received new batch of 50 coupons", 
        "Updated coupon allocation for Program A",
        "Completed daily inventory check",
        "Processed 5 coupon redemptions"
    ]
    
    from django.contrib.contenttypes.models import ContentType
    subcenter_ct = ContentType.objects.get_for_model(subcenter)
    
    for i, activity in enumerate(activities):
        AuditLog.objects.get_or_create(
            content_type=subcenter_ct,
            object_id=str(subcenter.id),
            action=activity,
            defaults={
                'user': user,
                'changes': {'activity': activity}
            }
        )
    
    print("Test data creation completed successfully!")
    print(f"SubCenter ID {subcenter.id} is ready for dashboard testing.")
    
    return subcenter.id

if __name__ == '__main__':
    subcenter_id = create_test_data()
    print(f"\nYou can now test the dashboard with SubCenter ID: {subcenter_id}")
