"""
Properly formatted sample data insertion script for fuel system
"""

import os
import django
import sys
from datetime import datetime, date, time
from decimal import Decimal

# Django setup
print("🔧 Setting up Django environment...")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

# Now import Django models
from django.contrib.auth import get_user_model
from fuel.models import SubCenter, Box
from django.db import transaction

User = get_user_model()

print("🚀 Starting sample data insertion...")

# Create admin user if doesn't exist
try:
    admin_user = User.objects.get(username='admin')
    print("✅ Admin user already exists")
except User.DoesNotExist:
    admin_user = User.objects.create_user(
        username='admin',
        email='admin@parliament.gov.zw',
        password='pass@123',
        first_name='System',
        last_name='Administrator',
        role='ADMIN'
    )
    print("✅ Created admin user")

# Create sub-centers with correct fields
sub_centers_data = [
    {
        'code': 'HAR001',
        'name': 'Harare Central Office',
        'location': 'Corner First Street and Nelson Mandela Avenue, Harare',
        'managed_by': admin_user,
        'is_active': True
    },
    {
        'code': 'BUL002',
        'name': 'Bulawayo Regional Office',
        'location': 'Fife Street, Bulawayo Central Business District',
        'managed_by': admin_user,
        'is_active': True
    }
]

sub_centers = []
for sc_data in sub_centers_data:
    sub_center, created = SubCenter.objects.get_or_create(
        code=sc_data['code'],
        defaults=sc_data
    )
    sub_centers.append(sub_center)
    print(f"✅ {'Created' if created else 'Found'} sub-center: {sc_data['name']}")

# Create sample users
users_data = [
    {
        'username': 'main_operator',
        'email': 'operator@parliament.gov.zw',
        'first_name': 'Sarah',
        'last_name': 'Moyo',
        'role': 'MAIN_CENTER',
        'password': 'operator123'
    },
    {
        'username': 'auditor1',
        'email': 'auditor@parliament.gov.zw',
        'first_name': 'David',
        'last_name': 'Chikwanha',
        'role': 'AUDITOR',
        'password': 'audit123'
    }
]

users = []
for user_data in users_data:
    password = user_data.pop('password')
    user, created = User.objects.get_or_create(
        username=user_data['username'],
        defaults=user_data
    )
    if created:
        user.set_password(password)
        user.save()
    users.append(user)
    print(f"✅ {'Created' if created else 'Found'} user: {user_data['username']}")

# Create sample boxes with proper decimal values
boxes_data = [
    {
        'fuel_type': 'PETROL',
        'denomination': 20,
        'number_of_books': 10,
        'coupons_per_book': 20,
        'total_litres': 4000,
        'supplier': 'National Oil Company Ltd',
        'total_value_usd': Decimal('2400.00'),
        'fuel_price_per_litre_usd': Decimal('0.60'),
        'exchange_rate_zwg_usd': Decimal('27.5'),
        'first_coupon_number': 'PET20001001',
        'last_coupon_number': 'PET20001200',
        'invoice_number': 'NOC-2025-001',
        'delivery_note': 'DEL-NOC-001',
        'status': 'RECEIVED',
        'notes': 'All coupons verified and in excellent condition',
        'received_by': admin_user,
        'barcode': 'NOC001PET20L200',
    },
    {
        'fuel_type': 'DIESEL',
        'denomination': 50,
        'number_of_books': 5,
        'coupons_per_book': 10,
        'total_litres': 2500,
        'supplier': 'Zimbabwe Energy Corporation',
        'total_value_usd': Decimal('1750.00'),
        'fuel_price_per_litre_usd': Decimal('0.70'),
        'exchange_rate_zwg_usd': Decimal('27.5'),
        'first_coupon_number': 'DSL50002001',
        'last_coupon_number': 'DSL50002050',
        'invoice_number': 'ZEC-2025-002',
        'delivery_note': 'DEL-ZEC-002',
        'status': 'VERIFIED',
        'notes': 'Diesel coupons for parliamentary fleet',
        'received_by': admin_user,
        'barcode': 'ZEC002DSL50L50',
        'verification_notes': 'Physical verification completed'
    },
    {
        'fuel_type': 'PETROL',
        'denomination': 10,
        'number_of_books': 20,
        'coupons_per_book': 25,
        'total_litres': 5000,
        'supplier': 'Fuel Distribution Partners',
        'total_value_usd': Decimal('3000.00'),
        'fuel_price_per_litre_usd': Decimal('0.60'),
        'exchange_rate_zwg_usd': Decimal('27.5'),
        'first_coupon_number': 'PET10003001',
        'last_coupon_number': 'PET10003500',
        'invoice_number': 'FDP-2025-003',
        'delivery_note': 'DEL-FDP-003',
        'status': 'DISPATCHED',
        'notes': 'Dispatched to constituency offices',
        'received_by': admin_user,
        'assigned_to': sub_centers[0] if sub_centers else None,
        'barcode': 'FDP003PET10L500',
    }
]

boxes = []
for box_data in boxes_data:
    # Calculate additional fields
    total_coupons = box_data['number_of_books'] * box_data['coupons_per_book']
    total_value_zwg = box_data['total_value_usd'] * box_data['exchange_rate_zwg_usd']
    
    # Add calculated fields
    box_data.update({
        'total_coupons_calculated': total_coupons,
        'total_value_zwg': total_value_zwg,
        'received_at': datetime.now(),
        'received_date': date.today(),
        'received_time': time(14, 30)  # 2:30 PM
    })
    
    # Create box (let the backend auto-generate box_code)
    box = Box.objects.create(**box_data)
    boxes.append(box)
    print(f"✅ Created box: {box.box_code} ({box.fuel_type} {box.denomination}L - {box.status})")

print("\n🎉 Sample data creation completed!")
print("\n📊 Summary:")
print(f"   Users: {User.objects.count()}")
print(f"   Sub-Centers: {SubCenter.objects.count()}")
print(f"   Fuel Boxes: {Box.objects.count()}")

print("\n🔑 Login Credentials:")
print("   Admin: admin / pass@123")
print("   Operator: main_operator / operator123")
print("   Auditor: auditor1 / audit123")

print("\n🧪 You can now test the form with this sample data!")
print("🌐 Backend API endpoint: http://localhost:8000/api/v1/boxes/")
print("🖥️  Frontend URL: http://localhost:5174")
