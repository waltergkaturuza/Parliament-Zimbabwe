#!/usr/bin/env python
import os
import sys
import django

# Set up Django environment
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from fuel.models import SubCenter, Coupon, CouponDistribution, FuelTransaction

User = get_user_model()

def create_test_data():
    print("Creating test data...")
    
    # Create test users if they don't exist
    if not User.objects.filter(username='testuser').exists():
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='BENEFICIARY'
        )
        print(f"Created test user: {user.username}")
    
    # Create sub centers
    if not SubCenter.objects.exists():
        subcenter = SubCenter.objects.create(
            name='Test SubCenter',
            location='Test Location',
            is_active=True
        )
        print(f"Created subcenter: {subcenter.name}")
    
    # Create coupons
    if not Coupon.objects.exists():
        for i in range(5):
            coupon = Coupon.objects.create(
                coupon_number=f'TEST{i+1:04d}',
                fuel_type='PETROL',
                volume=50.0
            )
            print(f"Created coupon: {coupon.coupon_number}")
    
    # Create distributions
    if not CouponDistribution.objects.exists():
        user = User.objects.filter(role='BENEFICIARY').first()
        coupons = Coupon.objects.all()[:3]
        
        for coupon in coupons:
            distribution = CouponDistribution.objects.create(
                coupon=coupon,
                beneficiary=user,
                notes='Test distribution'
            )
            print(f"Created distribution: {distribution}")
    
    # Create transactions
    if not FuelTransaction.objects.exists():
        coupon = Coupon.objects.first()
        if coupon:
            transaction = FuelTransaction.objects.create(
                coupon=coupon,
                status='APPROVED',
                fuel_volume=45.0,
                notes='Test transaction'
            )
            print(f"Created transaction: {transaction}")
    
    print("Test data creation completed!")

if __name__ == '__main__':
    create_test_data()
