#!/usr/bin/env python3
"""
Script to create sample beneficiary data for testing the beneficiaries table
"""
import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import (
    User, BeneficiaryCategory, Constituency, VehicleCategory, 
    BeneficiaryProfile
)
from decimal import Decimal

def create_sample_data():
    """Create sample beneficiary data"""
    print("Creating sample beneficiary data...")
    
    # 1. Create BeneficiaryCategories
    categories_data = [
        {'name': 'Member of Parliament', 'description': 'Elected Members of Parliament', 'monthly_entitlement': 500},
        {'name': 'Minister', 'description': 'Cabinet Ministers', 'monthly_entitlement': 800},
        {'name': 'Deputy Minister', 'description': 'Deputy Ministers', 'monthly_entitlement': 600},
        {'name': 'Committee Chairperson', 'description': 'Parliamentary Committee Chairpersons', 'monthly_entitlement': 450},
        {'name': 'Parliamentary Staff', 'description': 'Parliament Administration Staff', 'monthly_entitlement': 300},
    ]
    
    for cat_data in categories_data:
        category, created = BeneficiaryCategory.objects.get_or_create(
            name=cat_data['name'],
            defaults={
                'description': cat_data['description'],
                'monthly_entitlement_litres': Decimal(f"{cat_data['monthly_entitlement']}.00")
            }
        )
        if created:
            print(f"✅ Created category: {category.name}")
        else:
            print(f"📝 Category exists: {category.name}")
    
    # 2. Create Constituencies
    constituencies_data = [
        'Harare North', 'Harare South', 'Harare East', 'Harare West',
        'Bulawayo North', 'Bulawayo South', 'Bulawayo East',
        'Mutare North', 'Mutare South', 'Gweru Urban',
        'Kwekwe Central', 'Masvingo Urban', 'Chinhoyi',
        'Bindura', 'Karoi', 'Chegutu West', 'Norton',
        'Mabvuku-Tafara', 'Budiriro', 'Glen View North'
    ]
    
    for const_name in constituencies_data:
        constituency, created = Constituency.objects.get_or_create(
            name=const_name,
            defaults={'province': 'Test Province'}
        )
        if created:
            print(f"✅ Created constituency: {constituency.name}")
    
    # 3. Create VehicleCategories
    vehicle_categories_data = [
        {'name': 'Executive', 'description': 'Executive vehicles for Ministers'},
        {'name': 'Parliamentary', 'description': 'Standard parliamentary vehicles'},
        {'name': 'Committee', 'description': 'Committee chairperson vehicles'},
        {'name': 'Staff', 'description': 'Administrative staff vehicles'},
    ]
    
    for veh_data in vehicle_categories_data:
        vehicle_category, created = VehicleCategory.objects.get_or_create(
            name=veh_data['name'],
            defaults={'description': veh_data['description']}
        )
        if created:
            print(f"✅ Created vehicle category: {vehicle_category.name}")
    
    # 4. Create sample beneficiary users and profiles
    beneficiary_data = [
        {
            'username': 'hon_john_doe',
            'first_name': 'John',
            'last_name': 'Doe',
            'email': 'john.doe@parliament.gov.zw',
            'employee_id': 'MP001',
            'position': 'Member of Parliament',
            'category': 'Member of Parliament',
            'constituency': 'Harare North',
            'vehicle_make': 'Toyota',
            'vehicle_model': 'Land Cruiser',
            'vehicle_registration': 'ZIM001MP',
            'monthly_entitlement': 500
        },
        {
            'username': 'hon_jane_smith',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'email': 'jane.smith@parliament.gov.zw',
            'employee_id': 'MIN001',
            'position': 'Minister of Finance',
            'category': 'Minister',
            'constituency': 'Harare South',
            'vehicle_make': 'Mercedes-Benz',
            'vehicle_model': 'E-Class',
            'vehicle_registration': 'ZIM002MIN',
            'monthly_entitlement': 800
        },
        {
            'username': 'hon_robert_wilson',
            'first_name': 'Robert',
            'last_name': 'Wilson',
            'email': 'robert.wilson@parliament.gov.zw',
            'employee_id': 'DM001',
            'position': 'Deputy Minister of Health',
            'category': 'Deputy Minister',
            'constituency': 'Bulawayo North',
            'vehicle_make': 'Toyota',
            'vehicle_model': 'Prado',
            'vehicle_registration': 'ZIM003DM',
            'monthly_entitlement': 600
        },
        {
            'username': 'hon_mary_johnson',
            'first_name': 'Mary',
            'last_name': 'Johnson',
            'email': 'mary.johnson@parliament.gov.zw',
            'employee_id': 'CH001',
            'position': 'Committee Chairperson',
            'category': 'Committee Chairperson',
            'constituency': 'Mutare North',
            'vehicle_make': 'Nissan',
            'vehicle_model': 'Navara',
            'vehicle_registration': 'ZIM004CH',
            'monthly_entitlement': 450
        },
        {
            'username': 'staff_peter_brown',
            'first_name': 'Peter',
            'last_name': 'Brown',
            'email': 'peter.brown@parliament.gov.zw',
            'employee_id': 'ST001',
            'position': 'Senior Administrative Officer',
            'category': 'Parliamentary Staff',
            'constituency': 'Harare East',
            'vehicle_make': 'Honda',
            'vehicle_model': 'Fit',
            'vehicle_registration': 'ZIM005ST',
            'monthly_entitlement': 300
        }
    ]
    
    for ben_data in beneficiary_data:
        # Create or get user
        user, user_created = User.objects.get_or_create(
            username=ben_data['username'],
            defaults={
                'first_name': ben_data['first_name'],
                'last_name': ben_data['last_name'],
                'email': ben_data['email'],
                'role': 'BENEFICIARY',
                'is_approved': True,
                'is_active': True
            }
        )
        
        if user_created:
            user.set_password('beneficiary123')
            user.save()
            print(f"✅ Created user: {user.get_full_name()}")
        else:
            print(f"📝 User exists: {user.get_full_name()}")
        
        # Create BeneficiaryProfile
        category = BeneficiaryCategory.objects.get(name=ben_data['category'])
        constituency = Constituency.objects.get(name=ben_data['constituency'])
        vehicle_category = VehicleCategory.objects.first()  # Use first available
        
        profile, profile_created = BeneficiaryProfile.objects.get_or_create(
            user=user,
            defaults={
                'employee_id': ben_data['employee_id'],
                'position': ben_data['position'],
                'category': category,
                'constituency': constituency,
                'vehicle_category': vehicle_category,
                'vehicle_make': ben_data['vehicle_make'],
                'vehicle_model': ben_data['vehicle_model'],
                'vehicle_registration': ben_data['vehicle_registration'],
                'monthly_entitlement_litres': Decimal(f"{ben_data['monthly_entitlement']}.00"),
                'is_active_beneficiary': True
            }
        )
        
        if profile_created:
            print(f"✅ Created beneficiary profile: {profile.user.get_full_name()}")
        else:
            print(f"📝 Beneficiary profile exists: {profile.user.get_full_name()}")
    
    # Print summary
    print("\n🎉 Sample Data Creation Complete!")
    print(f"📊 Summary:")
    print(f"   - BeneficiaryCategories: {BeneficiaryCategory.objects.count()}")
    print(f"   - Constituencies: {Constituency.objects.count()}")  
    print(f"   - VehicleCategories: {VehicleCategory.objects.count()}")
    print(f"   - BeneficiaryProfiles: {BeneficiaryProfile.objects.count()}")
    print(f"   - Users with BENEFICIARY role: {User.objects.filter(role='BENEFICIARY').count()}")

if __name__ == '__main__':
    try:
        create_sample_data()
        print("\n✅ All sample data created successfully!")
    except Exception as e:
        print(f"\n❌ Error creating sample data: {e}")
        import traceback
        traceback.print_exc()
