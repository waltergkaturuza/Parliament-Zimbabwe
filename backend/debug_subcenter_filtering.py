#!/usr/bin/env python3
"""
Debug script to check user and beneficiary subcenter assignments
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import User, BeneficiaryProfile, SubCenter

def debug_subcenter_assignments():
    print("=== DEBUG: Subcenter Assignments ===")
    
    # Check all subcenter users
    subcenter_users = User.objects.filter(role__in=['SUB_CENTER', 'SUB_CENTER_APPROVER'])
    
    print(f"\n📋 SUBCENTER USERS ({subcenter_users.count()}):")
    for user in subcenter_users:
        subcenter_name = user.sub_center.name if user.sub_center else "No Subcenter"
        subcenter_id = user.sub_center.id if user.sub_center else "None"
        print(f"  - {user.username} ({user.first_name} {user.last_name})")
        print(f"    Role: {user.role}")
        print(f"    Assigned Subcenter: {subcenter_name} (ID: {subcenter_id})")
        
        # Count beneficiaries in the same subcenter
        if user.sub_center:
            beneficiary_count = BeneficiaryProfile.objects.filter(
                sub_center=user.sub_center,
                is_active_beneficiary=True
            ).count()
            print(f"    Beneficiaries in same subcenter: {beneficiary_count}")
        print()
    
    # Check beneficiary subcenter distribution
    print("\n📊 BENEFICIARY SUBCENTER DISTRIBUTION:")
    subcenters = SubCenter.objects.filter(is_active=True)
    total_beneficiaries = 0
    
    for subcenter in subcenters:
        count = BeneficiaryProfile.objects.filter(
            sub_center=subcenter,
            is_active_beneficiary=True
        ).count()
        total_beneficiaries += count
        print(f"  - {subcenter.name} (ID: {subcenter.id}): {count} beneficiaries")
    
    unassigned_count = BeneficiaryProfile.objects.filter(
        sub_center__isnull=True,
        is_active_beneficiary=True
    ).count()
    total_beneficiaries += unassigned_count
    
    print(f"  - Unassigned: {unassigned_count} beneficiaries")
    print(f"  - TOTAL: {total_beneficiaries} beneficiaries")
    
    # Check for specific user if they exist
    test_user = User.objects.filter(username='subcenter').first()
    if test_user:
        print(f"\n🔍 SPECIFIC USER DEBUG: {test_user.username}")
        print(f"  Role: {test_user.role}")
        print(f"  Subcenter: {test_user.sub_center.name if test_user.sub_center else 'None'} (ID: {test_user.sub_center.id if test_user.sub_center else 'None'})")
        
        if test_user.sub_center:
            # Simulate the filtering logic
            matching_beneficiaries = BeneficiaryProfile.objects.filter(
                sub_center=test_user.sub_center,
                is_active_beneficiary=True
            )
            
            print(f"  Matching beneficiaries: {matching_beneficiaries.count()}")
            
            if matching_beneficiaries.count() > 0:
                print("  Sample beneficiaries:")
                for i, b in enumerate(matching_beneficiaries[:3]):
                    print(f"    {i+1}. {b.user.first_name} {b.user.last_name} (ID: {b.id})")
            else:
                print("  ❌ NO MATCHING BENEFICIARIES FOUND!")
                
                # Check if there are beneficiaries with the user's last name initial
                if test_user.last_name:
                    initial = test_user.last_name[0].upper()
                    similar_beneficiaries = BeneficiaryProfile.objects.filter(
                        user__last_name__istartswith=initial,
                        is_active_beneficiary=True
                    )
                    print(f"  Beneficiaries with '{initial}' initial: {similar_beneficiaries.count()}")

if __name__ == '__main__':
    debug_subcenter_assignments()