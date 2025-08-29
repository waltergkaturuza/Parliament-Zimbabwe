#!/usr/bin/env python
import os
import sys
import django

# Add current directory to Python path
sys.path.append(os.getcwd())

# Setup Django with correct settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import User, SubCenter, SubCenterOfficer

def fix_test_user():
    print("=== Fixing Test User for SubCenter Access ===")
    
    try:
        # Get or create test user
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'testuser@test.com',
                'first_name': 'Test',
                'last_name': 'User',
                'role': 'SUB_CENTER',
                'is_active': True,
                'is_approved': True,
            }
        )
        
        if not created:
            # Update existing user
            user.role = 'SUB_CENTER'
            user.is_active = True
            user.is_approved = True
            user.save()
            print(f"✅ Updated existing user: {user.username}")
        else:
            print(f"✅ Created new user: {user.username}")
        
        # Get the test subcenter (ID 2)
        try:
            subcenter = SubCenter.objects.get(id=2)
            print(f"✅ Found SubCenter: {subcenter.name} (ID: {subcenter.id})")
            
            # Assign user to subcenter
            user.sub_center = subcenter
            user.save()
            print(f"✅ Assigned user to subcenter: {subcenter.name}")
            
            # Also create SubCenterOfficer entry for additional access
            officer, officer_created = SubCenterOfficer.objects.get_or_create(
                user=user,
                sub_center=subcenter,
                defaults={
                    'is_manager': True
                }
            )
            
            if officer_created:
                print(f"✅ Created SubCenterOfficer entry")
            else:
                print(f"✅ SubCenterOfficer entry already exists")
                
        except SubCenter.DoesNotExist:
            print(f"❌ SubCenter with ID 2 not found")
            return
        
        print("\n=== Updated User Details ===")
        print(f"Username: {user.username}")
        print(f"Role: {user.role}")
        print(f"Sub Center: {user.sub_center}")
        print(f"Sub Center ID: {user.sub_center.id if user.sub_center else None}")
        print(f"Is Active: {user.is_active}")
        print(f"Is Approved: {user.is_approved}")
        
        print("\n=== Access Test ===")
        # Test the ViewSet filtering logic
        from django.db import models
        if user.role == 'SUB_CENTER' and user.sub_center:
            accessible_centers = SubCenter.objects.filter(
                models.Q(managed_by=user) | models.Q(officers__user=user)
            ).distinct()
            print(f"Accessible centers: {list(accessible_centers.values_list('id', 'name'))}")
        
        print("\n🎉 Test user is now ready for SubCenter API access!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    fix_test_user()
