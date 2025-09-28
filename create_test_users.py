import os
import sys
import django

# Set up Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import User, SubCenter
from django.db import transaction

print("Creating subcenter test user...")

try:
    with transaction.atomic():
        # Get the first subcenter
        subcenter = SubCenter.objects.first()
        if not subcenter:
            print("No subcenters available")
            exit()
            
        print(f"Using subcenter: {subcenter.name}")
        
        # Create or get subcenter user
        subcenter_user, created = User.objects.get_or_create(
            username='subcenter_test',
            defaults={
                'first_name': 'Test',
                'last_name': 'SubCenter',
                'email': 'subcenter@test.com',
                'phone': '+263712000000',
                'role': 'SUB_CENTER',
                'sub_center': subcenter,
                'is_approved': True,
                'is_active': True,
                'password': 'pbkdf2_sha256$720000$dummy$dummy='  # Simple password for testing
            }
        )
        
        if created:
            print(f"✓ Created subcenter user: {subcenter_user.username}")
            print(f"  - Role: {subcenter_user.role}")
            print(f"  - Subcenter: {subcenter_user.sub_center.name}")
        else:
            print(f"✓ Subcenter user already exists: {subcenter_user.username}")
            
        # Show how many beneficiaries this subcenter user should see
        from fuel.models import BeneficiaryProfile
        beneficiary_count = BeneficiaryProfile.objects.filter(sub_center=subcenter).count()
        print(f"  - Should see {beneficiary_count} beneficiaries from {subcenter.name}")
        
        # Also create a superuser for testing all beneficiaries
        superuser, created = User.objects.get_or_create(
            username='admin_test',
            defaults={
                'first_name': 'Admin',
                'last_name': 'Test',
                'email': 'admin@test.com',
                'phone': '+263712000001',
                'role': 'SUPERUSER',
                'is_superuser': True,
                'is_staff': True,
                'is_approved': True,
                'is_active': True,
                'password': 'pbkdf2_sha256$720000$dummy$dummy='
            }
        )
        
        if created:
            print(f"✓ Created admin user: {superuser.username}")
        else:
            print(f"✓ Admin user already exists: {superuser.username}")
            
        total_beneficiaries = BeneficiaryProfile.objects.count()
        print(f"  - Should see all {total_beneficiaries} beneficiaries")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()