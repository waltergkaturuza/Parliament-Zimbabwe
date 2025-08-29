#!/usr/bin/env python
"""
Quick setup script to create test data for the analytics dashboard
"""
import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fuel_coupon_system.settings')
django.setup()

from fuel.models import SubCenter, User, Coupon
from datetime import datetime, timedelta

def setup_test_data():
    print("Setting up test data for analytics dashboard...")
    
    # 1. Create or get SubCenter
    subcenter, created = SubCenter.objects.get_or_create(
        code='SC002',
        defaults={
            'name': 'Harare Sub Center',
            'location': 'Harare, Zimbabwe',
            'contact_number': '+263-4-123456',
            'email': 'harare@subcenter.gov.zw',
            'is_active': True,
            'capacity': 1000
        }
    )
    print(f"SubCenter: {subcenter.name} (ID: {subcenter.id}) - {'Created' if created else 'Found'}")
    
    # 2. Find or create test user
    user, created = User.objects.get_or_create(
        username='test_subcenter_user',
        defaults={
            'email': 'test@subcenter.com',
            'first_name': 'Test',
            'last_name': 'SubCenter User',
            'role': 'SUB_CENTER',
            'is_approved': True,
            'centerId': subcenter.id,
            'centerName': subcenter.name
        }
    )
    if created:
        user.set_password('admin123')
        user.save()
    else:
        user.centerId = subcenter.id
        user.centerName = subcenter.name
        user.save()
    
    print(f"User: {user.username} (ID: {user.id}) - {'Created' if created else 'Updated'}")
    
    # 3. Create test coupons
    existing_coupons = Coupon.objects.filter(sub_center=subcenter).count()
    if existing_coupons < 100:
        print(f"Creating test coupons (currently have {existing_coupons})...")
        
        for i in range(100 - existing_coupons):
            coupon_number = f'SC002-2025-{existing_coupons + i + 1:04d}'
            
            # Create coupons with different statuses and dates
            status = 'available' if (existing_coupons + i) < 50 else 'used'
            created_date = datetime.now() - timedelta(days=(existing_coupons + i) // 10)
            
            Coupon.objects.create(
                coupon_number=coupon_number,
                sub_center=subcenter,
                amount=50.0,
                status=status,
                created_at=created_date,
                created_by=user
            )
    
    # 4. Print statistics
    total_coupons = Coupon.objects.filter(sub_center=subcenter).count()
    available_coupons = Coupon.objects.filter(sub_center=subcenter, status='available').count()
    used_coupons = Coupon.objects.filter(sub_center=subcenter, status='used').count()
    
    print(f"\nCoupon Statistics for {subcenter.name}:")
    print(f"  Total coupons: {total_coupons}")
    print(f"  Available coupons: {available_coupons}")
    print(f"  Used coupons: {used_coupons}")
    print(f"  Other status: {total_coupons - available_coupons - used_coupons}")
    
    print(f"\nTest data setup complete!")
    print(f"SubCenter ID: {subcenter.id}")
    print(f"User ID: {user.id}")
    print(f"Login: username={user.username}, password=admin123")

if __name__ == '__main__':
    setup_test_data()
