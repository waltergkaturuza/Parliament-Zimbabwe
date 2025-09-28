import os
import sys
import django

# Set up Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import User, BeneficiaryProfile, SubCenter, BeneficiaryCategory, Constituency
from django.db import transaction
from decimal import Decimal

print("Creating test beneficiaries without subcenter assignment initially...")

try:
    with transaction.atomic():
        # Get or create categories
        mp_category, _ = BeneficiaryCategory.objects.get_or_create(
            name="MP", 
            defaults={'description': 'Member of Parliament', 'category_multiplier': Decimal('1.5')}
        )
        
        # Get or create constituencies  
        harare_east, _ = Constituency.objects.get_or_create(
            name="Harare East",
            defaults={'province': 'Harare', 'population': 50000}
        )
        
        # Create test users and beneficiary profiles
        test_beneficiaries = [
            {
                'username': 'mp_harare_001',
                'first_name': 'Robert', 
                'last_name': 'Mugabe',
                'email': 'robert.mugabe@parliament.zw',
                'phone': '+263712345680',
            },
            {
                'username': 'mp_harare_002',
                'first_name': 'Nelson',
                'last_name': 'Chamisa',
                'email': 'nelson.chamisa@parliament.zw',
                'phone': '+263712345682',
            },
            {
                'username': 'mp_harare_003',
                'first_name': 'Joice',
                'last_name': 'Mujuru',
                'email': 'joice.mujuru@parliament.zw',
                'phone': '+263712345683',
            }
        ]
        
        created_count = 0
        for beneficiary_data in test_beneficiaries:
            # Create user if doesn't exist
            user, user_created = User.objects.get_or_create(
                username=beneficiary_data['username'],
                defaults={
                    'first_name': beneficiary_data['first_name'],
                    'last_name': beneficiary_data['last_name'],
                    'email': beneficiary_data['email'],
                    'phone': beneficiary_data['phone'],
                    'role': 'BENEFICIARY',
                    'is_approved': True,
                    'is_active': True,
                }
            )
            
            # Create beneficiary profile if doesn't exist - NO SUBCENTER YET
            profile, profile_created = BeneficiaryProfile.objects.get_or_create(
                user=user,
                defaults={
                    'category': mp_category,
                    'constituency': harare_east,
                    'employee_id': f'EMP-{beneficiary_data["username"]}',
                    'position': 'Parliamentarian',
                    'department': 'Parliament',
                    'monthly_entitlement_litres': Decimal('300.0'),
                    'vehicle_make': 'TOYOTA',
                    'vehicle_model': 'CAMRY',
                    'vehicle_year': 2022,
                    'fuel_type': 'PETROL',
                    'office_location': 'Parliament Building',
                    'base_allocation': Decimal('200.0'),
                    'category_multiplier': Decimal('1.5'),
                    'is_active_beneficiary': True
                }
            )
            
            if profile_created:
                created_count += 1
                print(f"Created beneficiary: {user.first_name} {user.last_name}")
        
        print(f"\nSuccessfully created {created_count} new beneficiaries!")
        print(f"Total beneficiaries now: {BeneficiaryProfile.objects.count()}")

except Exception as e:
    print(f"Error creating beneficiaries: {str(e)}")
    import traceback
    traceback.print_exc()