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

def check_user_subcenter_relationships():
    print("=== User and SubCenter Relationship Check ===")
    
    try:
        # Get the test user
        user = User.objects.get(username='testuser')
        print(f"Test User: {user.username}")
        print(f"  - Role: {user.role}")
        print(f"  - Sub Center: {user.sub_center}")
        print(f"  - Sub Center ID: {user.sub_center.id if user.sub_center else None}")
        print(f"  - Is Active: {user.is_active}")
        print(f"  - Is Approved: {user.is_approved}")
        
    except User.DoesNotExist:
        print("❌ Test user 'testuser' not found")
        return
    
    print("\n=== All SubCenters ===")
    subcenters = SubCenter.objects.all()
    for sc in subcenters:
        print(f"SubCenter ID {sc.id}: {sc.name}")
        print(f"  - Code: {sc.code}")
        print(f"  - Managed by: {sc.managed_by.username if sc.managed_by else 'None'}")
        print(f"  - Contact: {sc.contact_number}")
        
        # Check if user has access through SubCenterOfficer
        officers = SubCenterOfficer.objects.filter(sub_center=sc)
        print(f"  - Officers: {[o.user.username for o in officers]}")
        print()
    
    print("\n=== Access Check Simulation ===")
    # Simulate the ViewSet filtering logic
    if user.role == 'SUB_CENTER' and user.sub_center:
        print(f"User role is SUB_CENTER with sub_center: {user.sub_center}")
        accessible_centers = SubCenter.objects.filter(
            models.Q(managed_by=user) | models.Q(officers__user=user)
        ).distinct()
        print(f"Accessible centers: {list(accessible_centers.values_list('id', 'name'))}")
    else:
        print(f"User role '{user.role}' should have access to all centers")

if __name__ == "__main__":
    from django.db import models
    check_user_subcenter_relationships()
