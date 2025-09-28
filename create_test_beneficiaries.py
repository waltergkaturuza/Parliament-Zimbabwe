import os
import sys
import django

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import User, BeneficiaryProfile, SubCenter, BeneficiaryCategory, Constituency
from django.db import transaction

print("Creating test beneficiaries...")

try:
    with transaction.atomic():
        # Get or create categories
        mp_category, _ = BeneficiaryCategory.objects.get_or_create(
            name="MP", 
            defaults={'description': 'Member of Parliament', 'category_multiplier': 1.5}
        )
        senator_category, _ = BeneficiaryCategory.objects.get_or_create(
            name="SENATOR", 
            defaults={'description': 'Senator', 'category_multiplier': 1.3}
        )
        
        # Get or create constituencies
        harare_east, _ = Constituency.objects.get_or_create(
            name="Harare East",
            defaults={'province': 'Harare', 'population': 50000}
        )
        bulawayo_central, _ = Constituency.objects.get_or_create(
            name="Bulawayo Central",
            defaults={'province': 'Bulawayo', 'population': 45000}
        )
        
        # Get existing subcenters or create simple ones
        subcenters = list(SubCenter.objects.all()[:2])
        if len(subcenters) < 2:
            subcenter_1, _ = SubCenter.objects.get_or_create(
                name="Harare Subcenter",
                defaults={
                    'code': 'HAR001',
                    'location': 'Harare',
                    'contact_number': '+263712345678',
                    'capacity': 100,
                    'is_active': True
                }
            )
            subcenter_2, _ = SubCenter.objects.get_or_create(
                name="Bulawayo Subcenter",
                defaults={
                    'code': 'BUL001',
                    'location': 'Bulawayo', 
                    'contact_number': '+263712345679',
                    'capacity': 80,
                    'is_active': True
                }
            )
        else:
            subcenter_1, subcenter_2 = subcenters[0], subcenters[1]
        
        print(f"Available subcenters: {[sc.name for sc in SubCenter.objects.all()]}")
        
        # Create test users and beneficiary profiles
        test_beneficiaries = [
            {
                'username': 'mp_harare_001',
                'first_name': 'Robert', 
                'last_name': 'Mugabe',
                'email': 'robert.mugabe@parliament.zw',
                'phone_number': '+263712345680',
                'category': mp_category,
                'constituency': harare_east,
                'sub_center': subcenter_1
            },
            {
                'username': 'senator_bulawayo_001',
                'first_name': 'Grace',
                'last_name': 'Mutasa', 
                'email': 'grace.mutasa@parliament.zw',
                'phone_number': '+263712345681',
                'category': senator_category,
                'constituency': bulawayo_central,
                'sub_center': subcenter_2
            },
            {
                'username': 'mp_harare_002',
                'first_name': 'Nelson',
                'last_name': 'Chamisa',
                'email': 'nelson.chamisa@parliament.zw', 
                'phone_number': '+263712345682',
                'category': mp_category,
                'constituency': harare_east,
                'sub_center': subcenter_1
            },
            {
                'username': 'mp_harare_003',
                'first_name': 'Joice',
                'last_name': 'Mujuru',
                'email': 'joice.mujuru@parliament.zw',
                'phone_number': '+263712345683', 
                'category': mp_category,
                'constituency': harare_east,
                'sub_center': subcenter_1
            },
            {
                'username': 'senator_bulawayo_002',
                'first_name': 'Morgan',
                'last_name': 'Tsvangirai',
                'email': 'morgan.tsvangirai@parliament.zw',
                'phone_number': '+263712345684',
                'category': senator_category,
                'constituency': bulawayo_central,
                'sub_center': subcenter_2
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
                    'phone': beneficiary_data['phone_number'],
                    'role': 'BENEFICIARY',
                    'is_approved': True,
                    'is_active': True,
                }
            )
            
            # Create beneficiary profile if doesn't exist
            profile, profile_created = BeneficiaryProfile.objects.get_or_create(
                user=user,
                defaults={
                    'category': beneficiary_data['category'],
                    'constituency': beneficiary_data['constituency'],
                    'sub_center': beneficiary_data['sub_center'],
                    'employee_id': f'EMP-{beneficiary_data["username"]}',
                    'position': 'Parliamentarian',
                    'department': 'Parliament',
                    'monthly_entitlement_litres': 300.0,
                    'vehicle_make': 'TOYOTA',
                    'vehicle_model': 'CAMRY',
                    'vehicle_year': 2022,
                    'fuel_type': 'PETROL',
                    'is_active_beneficiary': True
                }
            )
            
            if profile_created:
                created_count += 1
                print(f"Created beneficiary: {user.first_name} {user.last_name} -> {beneficiary_data['sub_center'].name}")
        
        print(f"\nSuccessfully created {created_count} new beneficiaries!")
        print(f"Total beneficiaries now: {BeneficiaryProfile.objects.count()}")
        print(f"Beneficiaries with subcenters: {BeneficiaryProfile.objects.filter(sub_center__isnull=False).count()}")
        
        # Show subcenter distribution
        for subcenter in SubCenter.objects.all():
            count = BeneficiaryProfile.objects.filter(sub_center=subcenter).count()
            print(f"- {subcenter.name}: {count} beneficiaries")

except Exception as e:
    print(f"Error creating beneficiaries: {str(e)}")
    import traceback
    traceback.print_exc()