#!/usr/bin/env python3
"""
Create test beneficiary profiles for development
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import (
    User, BeneficiaryProfile, BeneficiaryCategory, Constituency, 
    PoliticalParty, SubCenter
)
from django.contrib.auth.hashers import make_password

def create_test_beneficiaries():
    print("Creating test beneficiaries...")
    
    # Get existing data
    categories = list(BeneficiaryCategory.objects.all())
    parties = list(PoliticalParty.objects.all())
    subcenters = list(SubCenter.objects.filter(is_active=True))
    
    if not categories:
        print("No categories found! Run populate_test_data.py first")
        return
    
    if not parties:
        print("No parties found! Run populate_test_data.py first")
        return
    
    if not subcenters:
        print("No subcenters found!")
        return
    
    # Create some constituencies if they don't exist
    constituencies = []
    const_data = [
        {'name': 'Harare Central', 'province': 'Harare', 'district': 'Harare'},
        {'name': 'Bulawayo South', 'province': 'Bulawayo', 'district': 'Bulawayo'},
        {'name': 'Chitungwiza North', 'province': 'Harare', 'district': 'Chitungwiza'},
    ]
    
    for const_info in const_data:
        const, created = Constituency.objects.get_or_create(
            name=const_info['name'],
            defaults={
                'province': const_info['province'],
                'district': const_info['district']
            }
        )
        constituencies.append(const)
        if created:
            print(f"Created constituency: {const.name}")
    
    # Test beneficiaries data
    test_beneficiaries = [
        {
            'username': 'james.chidakwa',
            'first_name': 'James',
            'last_name': 'Chidakwa',
            'email': 'chidakwa@parliament.co.zw',
            'phone_number': '000000',
            'employee_id': 'MP001',
            'category': categories[0],  # MP
            'party': parties[0],       # ZANU-PF
            'constituency': constituencies[0],
            'subcenter': subcenters[0],
            'position': 'Member of Parliament',
            'department': 'Legislature',
            'monthly_entitlement_litres': 600,
        },
        {
            'username': 'judith.mkwanda',
            'first_name': 'Judith',
            'last_name': 'Mkwanda',
            'email': 'mkwandaj@parliament.co.zw',
            'phone_number': '000000',
            'employee_id': 'MP002',
            'category': categories[0],  # MP
            'party': parties[0],       # ZANU-PF
            'constituency': constituencies[1],
            'subcenter': subcenters[0],
            'position': 'Member of Parliament',
            'department': 'Legislature',
            'monthly_entitlement_litres': 600,
        },
        {
            'username': 'admin.main',
            'first_name': 'Admin',
            'last_name': 'User',
            'email': 'main@parl.co.zw',
            'phone_number': '123456',
            'employee_id': 'STAFF001',
            'category': categories[2],  # Staff
            'party': parties[4],       # Independent
            'constituency': constituencies[2],
            'subcenter': subcenters[1] if len(subcenters) > 1 else subcenters[0],
            'position': 'Administrator',
            'department': 'Administration',
            'monthly_entitlement_litres': 400,
        }
    ]
    
    created_count = 0
    for ben_data in test_beneficiaries:
        try:
            # Create or get user
            user, user_created = User.objects.get_or_create(
                username=ben_data['username'],
                defaults={
                    'first_name': ben_data['first_name'],
                    'last_name': ben_data['last_name'],
                    'email': ben_data['email'],
                    'password': make_password('password123'),  # Default password
                    'role': 'BENEFICIARY',
                    'is_approved': True,
                    'is_active': True,
                }
            )
            
            if user_created:
                print(f"Created user: {user.username}")
            
            # Create beneficiary profile
            profile, profile_created = BeneficiaryProfile.objects.get_or_create(
                user=user,
                defaults={
                    'employee_id': ben_data['employee_id'],
                    'category': ben_data['category'],
                    'constituency': ben_data['constituency'],
                    'position': ben_data['position'],
                    'department': ben_data['department'],
                    'monthly_entitlement_litres': ben_data['monthly_entitlement_litres'],
                    'fuel_type': 'PETROL',
                    'vehicle_make': 'Toyota',
                    'vehicle_model': 'Corolla',
                    'vehicle_registration': f'ABC-{ben_data["employee_id"][-3:]}',
                    'is_active_beneficiary': True,
                    'sub_center': ben_data['subcenter'],
                }
            )
            
            if profile_created:
                print(f"Created beneficiary profile: {profile.user.get_full_name()} ({profile.employee_id})")
                created_count += 1
            else:
                print(f"Profile exists: {profile.user.get_full_name()}")
                
        except Exception as e:
            print(f"Error creating beneficiary {ben_data['username']}: {e}")
    
    print(f"\nSummary:")
    print(f"Created {created_count} new beneficiary profiles")
    print(f"Total beneficiaries: {BeneficiaryProfile.objects.count()}")
    print(f"Total users: {User.objects.count()}")
    print(f"Total categories: {BeneficiaryCategory.objects.count()}")
    print(f"Total parties: {PoliticalParty.objects.count()}")
    print(f"Total constituencies: {Constituency.objects.count()}")

if __name__ == "__main__":
    create_test_beneficiaries()