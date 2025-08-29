#!/usr/bin/env python
"""
Production user setup script for deployment
Creates the subcenter_admin user with proper configuration
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import User, SubCenter, SubCenterOfficer

def setup_production_users():
    print("=== Setting up production users ===")
    
    # Create or update subcenter_admin user
    try:
        user, created = User.objects.get_or_create(
            username='subcenter_admin',
            defaults={
                'email': 'subcenter_admin@parliament.zw',
                'first_name': 'SubCenter',
                'last_name': 'Admin',
                'role': 'SUB_CENTER',
                'is_active': True,
                'is_approved': True,
            }
        )
        
        # Set password
        user.set_password('subc@123')
        user.role = 'SUB_CENTER'
        user.is_active = True
        user.is_approved = True
        user.save()
        
        print(f"✅ User configured: {user.username}")
        
        # Create a default subcenter if none exists
        subcenter, sc_created = SubCenter.objects.get_or_create(
            code='SC001',
            defaults={
                'name': 'Main SubCenter',
                'location': 'Harare',
                'contact_number': '0123456789',
                'managed_by': user
            }
        )
        
        if sc_created:
            print(f"✅ Created SubCenter: {subcenter.name}")
        
        # Assign user to subcenter
        user.sub_center = subcenter
        user.save()
        
        # Create SubCenterOfficer entry
        officer, officer_created = SubCenterOfficer.objects.get_or_create(
            user=user,
            sub_center=subcenter,
            defaults={'is_manager': True}
        )
        
        if officer_created:
            print(f"✅ Created SubCenterOfficer entry")
        
        print(f"\n=== Production Setup Complete ===")
        print(f"Username: {user.username}")
        print(f"Password: subc@123")
        print(f"Role: {user.role}")
        print(f"SubCenter: {user.sub_center.name} (ID: {user.sub_center.id})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    setup_production_users()
