#!/usr/bin/env python3
"""
Fix SubCenter managed_by assignments and other null values
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import SubCenter, User
from django.db import transaction

def fix_subcenter_managers():
    """Assign managers to subcenters that don't have one"""
    print("=== Fixing SubCenter Manager Assignments ===")
    
    subcenters_without_managers = SubCenter.objects.filter(managed_by__isnull=True, is_active=True)
    
    print(f"Found {subcenters_without_managers.count()} subcenters without managers")
    
    for subcenter in subcenters_without_managers:
        print(f"\nProcessing: {subcenter.name} (ID: {subcenter.id})")
        
        # Look for users assigned to this subcenter
        subcenter_users = User.objects.filter(
            sub_center=subcenter, 
            is_active=True,
            role__in=['SUB_CENTER', 'SUB_CENTER_APPROVER', 'MAIN_CENTER']
        ).order_by('role')
        
        if subcenter_users.exists():
            # Prefer SUB_CENTER_APPROVER, then SUB_CENTER, then MAIN_CENTER
            manager = subcenter_users.filter(role='SUB_CENTER_APPROVER').first()
            if not manager:
                manager = subcenter_users.filter(role='SUB_CENTER').first()
            if not manager:
                manager = subcenter_users.filter(role='MAIN_CENTER').first()
            
            if manager:
                subcenter.managed_by = manager
                subcenter.save()
                print(f"  ✅ Assigned {manager.username} ({manager.get_full_name()}) as manager")
            else:
                print(f"  ⚠️ No suitable users found for management role")
        else:
            # No users assigned to this subcenter, look for any SUB_CENTER or MAIN_CENTER users
            available_managers = User.objects.filter(
                is_active=True,
                role__in=['MAIN_CENTER', 'SUB_CENTER_APPROVER'],
                managed_centers__isnull=True  # Don't assign someone who already manages another center
            ).first()
            
            if available_managers:
                subcenter.managed_by = available_managers
                subcenter.save()
                print(f"  ✅ Assigned available manager: {available_managers.username}")
            else:
                print(f"  ⚠️ No available managers found")

def set_default_capacities():
    """Set default capacities for subcenters that don't have one"""
    print("\n=== Setting Default Capacities ===")
    
    subcenters_without_capacity = SubCenter.objects.filter(capacity__isnull=True, is_active=True)
    
    print(f"Found {subcenters_without_capacity.count()} subcenters without capacity set")
    
    # Set default capacity based on subcenter characteristics
    for subcenter in subcenters_without_capacity:
        user_count = User.objects.filter(sub_center=subcenter, is_active=True).count()
        
        # Set capacity based on user count - rough estimate
        if user_count == 0:
            default_capacity = 50  # Small default
        elif user_count <= 2:
            default_capacity = 100
        elif user_count <= 5:
            default_capacity = 200
        else:
            default_capacity = 300
            
        subcenter.capacity = default_capacity
        subcenter.save()
        print(f"  ✅ Set capacity for {subcenter.name}: {default_capacity} (based on {user_count} users)")

def main():
    try:
        with transaction.atomic():
            fix_subcenter_managers()
            set_default_capacities()
            
        print(f"\n✅ SubCenter management assignments completed successfully!")
        
        # Show final status
        print("\n=== Final Status ===")
        all_subcenters = SubCenter.objects.filter(is_active=True)
        for sc in all_subcenters:
            manager_name = f"{sc.managed_by.username} ({sc.managed_by.get_full_name()})" if sc.managed_by else "No Manager"
            user_count = User.objects.filter(sub_center=sc, is_active=True).count()
            print(f"- {sc.name}: Manager: {manager_name}, Capacity: {sc.capacity}, Users: {user_count}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()