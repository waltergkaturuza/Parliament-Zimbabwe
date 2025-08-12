#!/usr/bin/env python
"""
Insert sample data into the fuel system
"""
import os
import sys
import django
from datetime import datetime, date, time

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

from django.contrib.auth import get_user_model
from fuel.models import Box, SubCenter

User = get_user_model()

def create_sample_data():
    """Create comprehensive sample data"""
    print("🚀 Creating sample data...")
    
    # 1. Create admin user if doesn't exist
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@parliament.gov.zw',
            'first_name': 'Walter',
            'last_name': 'Katuruza',
            'role': 'MAIN_CENTER',
            'is_staff': True,
            'is_superuser': True,
            'is_active': True
        }
    )
    
    if created:
        admin_user.set_password('pass@123')
        admin_user.save()
        print("✅ Created admin user")
    else:
        print("✅ Admin user already exists")
    
    # 2. Create some sub-centers
    sub_centers_data = [
        {
            'name': 'Harare Main Depot',
            'location': 'Harare',
            'contact_person': 'John Munyoro',
            'phone': '+263-4-123456',
            'email': 'harare@parliament.gov.zw'
        },
        {
            'name': 'Bulawayo Regional Center',
            'location': 'Bulawayo',
            'contact_person': 'Mary Ncube',
            'phone': '+263-9-654321',
            'email': 'bulawayo@parliament.gov.zw'
        },
        {
            'name': 'Mutare Distribution Hub',
            'location': 'Mutare',
            'contact_person': 'James Zimba',
            'phone': '+263-20-987654',
            'email': 'mutare@parliament.gov.zw'
        }
    ]
    
    sub_centers = []
    for sc_data in sub_centers_data:
        sub_center, created = SubCenter.objects.get_or_create(
            name=sc_data['name'],
            defaults=sc_data
        )
        sub_centers.append(sub_center)
        print(f"✅ {'Created' if created else 'Found'} sub-center: {sc_data['name']}")
    
    # 3. Create sample users for different roles
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
        },
        {
            'username': 'harare_clerk',
            'email': 'harare.clerk@parliament.gov.zw',
            'first_name': 'Grace',
            'last_name': 'Maposa',
            'role': 'SUB_CENTER',
            'sub_center': sub_centers[0],
            'password': 'clerk123'
        }
    ]
    
    for user_data in users_data:
        password = user_data.pop('password')
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults=user_data
        )
        if created:
            user.set_password(password)
            user.save()
            print(f"✅ Created user: {user_data['username']} ({user_data['role']})")
        else:
            print(f"✅ User already exists: {user_data['username']}")
    
    # 4. Create sample fuel boxes with comprehensive data
    boxes_data = [
        {
            'fuel_type': 'PETROL',
            'denomination': 20,
            'number_of_books': 10,
            'coupons_per_book': 20,
            'total_litres': 4000,
            'supplier': 'National Oil Company Ltd',
            'total_value_usd': 2400.00,
            'fuel_price_per_litre_usd': 0.60,
            'exchange_rate_zwg_usd': 27.5,
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
            'total_value_usd': 1750.00,
            'fuel_price_per_litre_usd': 0.70,
            'exchange_rate_zwg_usd': 27.5,
            'first_coupon_number': 'DSL50002001',
            'last_coupon_number': 'DSL50002050',
            'invoice_number': 'ZEC-2025-002',
            'delivery_note': 'DEL-ZEC-002',
            'status': 'VERIFIED',
            'notes': 'Diesel coupons for parliamentary fleet',
            'received_by': admin_user,
            'barcode': 'ZEC002DSL50L50',
            'verification_notes': 'Physical verification completed, all serial numbers match'
        },
        {
            'fuel_type': 'PETROL',
            'denomination': 10,
            'number_of_books': 20,
            'coupons_per_book': 25,
            'total_litres': 5000,
            'supplier': 'Fuel Distribution Partners',
            'total_value_usd': 3000.00,
            'fuel_price_per_litre_usd': 0.60,
            'exchange_rate_zwg_usd': 27.5,
            'first_coupon_number': 'PET10003001',
            'last_coupon_number': 'PET10003500',
            'invoice_number': 'FDP-2025-003',
            'delivery_note': 'DEL-FDP-003',
            'status': 'DISPATCHED',
            'notes': 'Dispatched to constituency offices',
            'received_by': admin_user,
            'assigned_to': sub_centers[0],
            'barcode': 'FDP003PET10L500',
        },
        {
            'fuel_type': 'DIESEL',
            'denomination': 20,
            'number_of_books': 8,
            'coupons_per_book': 15,
            'total_litres': 2400,
            'supplier': 'Regional Fuel Supply',
            'total_value_usd': 1680.00,
            'fuel_price_per_litre_usd': 0.70,
            'exchange_rate_zwg_usd': 27.5,
            'first_coupon_number': 'DSL20004001',
            'last_coupon_number': 'DSL20004120',
            'invoice_number': 'RFS-2025-004',
            'delivery_note': 'DEL-RFS-004',
            'status': 'PENDING',
            'notes': 'Awaiting quality verification',
            'received_by': admin_user,
            'barcode': 'RFS004DSL20L120',
        },
        {
            'fuel_type': 'PETROL',
            'denomination': 5,
            'number_of_books': 50,
            'coupons_per_book': 20,
            'total_litres': 5000,
            'supplier': 'Community Fuel Services',
            'total_value_usd': 3000.00,
            'fuel_price_per_litre_usd': 0.60,
            'exchange_rate_zwg_usd': 27.5,
            'first_coupon_number': 'PET05005001',
            'last_coupon_number': 'PET05006000',
            'invoice_number': 'CFS-2025-005',
            'delivery_note': 'DEL-CFS-005',
            'status': 'RECEIVED',
            'notes': 'Small denomination coupons for community programs',
            'received_by': admin_user,
            'barcode': 'CFS005PET05L1000',
        }
    ]
    
    for box_data in boxes_data:
        # Calculate additional fields
        total_coupons = box_data['number_of_books'] * box_data['coupons_per_book']
        total_value_zwg = box_data['total_value_usd'] * box_data['exchange_rate_zwg_usd']
        
        box_data.update({
            'total_coupons_calculated': total_coupons,
            'total_value_zwg': total_value_zwg,
            'received_at': datetime.now(),
            'received_date': date.today(),
            'received_time': time(14, 30)  # 2:30 PM
        })
        
        # Create the box (let auto-generation handle box_code)
        box = Box.objects.create(**box_data)
        
        print(f"✅ Created box: {box.box_code} ({box.fuel_type} {box.denomination}L - {box.status})")
    
    print("\n🎉 Sample data creation completed!")
    print("\n📊 Summary:")
    print(f"   Users: {User.objects.count()}")
    print(f"   Sub-Centers: {SubCenter.objects.count()}")
    print(f"   Fuel Boxes: {Box.objects.count()}")
    
    print("\n🔐 Login Credentials:")
    print("   Admin: admin / pass@123")
    print("   Operator: main_operator / operator123")
    print("   Auditor: auditor1 / audit123")
    print("   Sub-Center Clerk: harare_clerk / clerk123")

if __name__ == "__main__":
    create_sample_data()
