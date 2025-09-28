#!/usr/bin/env python3
"""
Transfer subcenter assignments from users to beneficiary profiles
and assign unassigned beneficiaries based on surname alphabetical ranges
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import SubCenter, User, BeneficiaryProfile
from django.db import transaction

def get_subcenter_by_surname_range(surname):
    """
    Assign subcenter based on surname first letter:
    - Subcenter A: A-E surnames  
    - Subcenter B: F-L surnames
    - Subcenter C: M-N surnames
    - Subcenter D: O-Z surnames
    """
    if not surname:
        return None
        
    first_letter = surname.upper()[0]
    
    # Find subcenters by their expected patterns
    subcenters = list(SubCenter.objects.filter(is_active=True).order_by('name'))
    
    if not subcenters:
        print("❌ No active subcenters found!")
        return None
    
    # Try to find subcenters with 'A', 'B', 'C' pattern first
    subcenter_a = None
    subcenter_b = None  
    subcenter_c = None
    subcenter_d = None
    
    for sc in subcenters:
        name_upper = sc.name.upper()
        if 'A' in name_upper and not subcenter_a:
            subcenter_a = sc
        elif 'B' in name_upper and not subcenter_b:
            subcenter_b = sc
        elif 'C' in name_upper and not subcenter_c:
            subcenter_c = sc
        elif not subcenter_d:  # Last one for O-Z range
            subcenter_d = sc
    
    # Assign based on surname ranges
    if first_letter in 'ABCDE':
        return subcenter_a or subcenters[0]
    elif first_letter in 'FGHIJKL':
        return subcenter_b or subcenters[1] if len(subcenters) > 1 else subcenters[0]
    elif first_letter in 'MN':
        return subcenter_c or subcenters[2] if len(subcenters) > 2 else subcenters[0]
    else:  # O-Z
        return subcenter_d or subcenters[3] if len(subcenters) > 3 else subcenters[0]

def transfer_user_subcenters_to_beneficiaries():
    """Transfer subcenter assignments from users to their beneficiary profiles"""
    print("=== Transferring SubCenter Assignments from Users to Beneficiaries ===")
    
    beneficiaries = BeneficiaryProfile.objects.select_related('user', 'sub_center').all()
    
    transferred_count = 0
    surname_assigned_count = 0
    already_assigned_count = 0
    
    print(f"Processing {beneficiaries.count()} beneficiaries...")
    
    for beneficiary in beneficiaries:
        print(f"\nProcessing: {beneficiary.user.get_full_name() if beneficiary.user else 'No User'} (ID: {beneficiary.id})")
        
        # Skip if beneficiary already has subcenter assigned
        if beneficiary.sub_center:
            print(f"  ✅ Already assigned to: {beneficiary.sub_center.name}")
            already_assigned_count += 1
            continue
            
        # Try to get subcenter from associated user
        if beneficiary.user and beneficiary.user.sub_center:
            beneficiary.sub_center = beneficiary.user.sub_center
            beneficiary.save()
            print(f"  ✅ Transferred from user: {beneficiary.user.sub_center.name}")
            transferred_count += 1
            continue
        
        # If no user subcenter, assign based on surname
        if beneficiary.user and beneficiary.user.last_name:
            assigned_subcenter = get_subcenter_by_surname_range(beneficiary.user.last_name)
            if assigned_subcenter:
                beneficiary.sub_center = assigned_subcenter
                beneficiary.save()
                print(f"  ✅ Assigned by surname '{beneficiary.user.last_name}': {assigned_subcenter.name}")
                surname_assigned_count += 1
            else:
                print(f"  ⚠️ Could not assign subcenter for surname: {beneficiary.user.last_name}")
        else:
            print(f"  ⚠️ No user or surname available for assignment")
    
    return transferred_count, surname_assigned_count, already_assigned_count

def show_assignment_summary():
    """Show summary of subcenter assignments after processing"""
    print("\n=== Assignment Summary ===")
    
    # Get all subcenters
    subcenters = SubCenter.objects.filter(is_active=True).order_by('name')
    
    for subcenter in subcenters:
        beneficiary_count = BeneficiaryProfile.objects.filter(sub_center=subcenter).count()
        user_count = User.objects.filter(sub_center=subcenter).count()
        
        # Show some sample beneficiaries
        sample_beneficiaries = BeneficiaryProfile.objects.filter(sub_center=subcenter).select_related('user')[:3]
        sample_names = [b.user.get_full_name() for b in sample_beneficiaries if b.user]
        
        print(f"\n📍 {subcenter.name}:")
        print(f"   - Beneficiaries: {beneficiary_count}")
        print(f"   - Users: {user_count}")
        if sample_names:
            print(f"   - Sample beneficiaries: {', '.join(sample_names[:3])}")
    
    # Show unassigned beneficiaries
    unassigned = BeneficiaryProfile.objects.filter(sub_center__isnull=True).count()
    if unassigned > 0:
        print(f"\n⚠️ Unassigned beneficiaries: {unassigned}")

def main():
    try:
        print("🏢 Starting SubCenter assignment transfer process...")
        
        # Show current state
        total_beneficiaries = BeneficiaryProfile.objects.count()
        assigned_beneficiaries = BeneficiaryProfile.objects.filter(sub_center__isnull=False).count()
        unassigned_beneficiaries = total_beneficiaries - assigned_beneficiaries
        
        print(f"\n📊 Current State:")
        print(f"   - Total beneficiaries: {total_beneficiaries}")
        print(f"   - Already assigned: {assigned_beneficiaries}")
        print(f"   - Unassigned: {unassigned_beneficiaries}")
        
        with transaction.atomic():
            transferred, surname_assigned, already_assigned = transfer_user_subcenters_to_beneficiaries()
            
        print(f"\n✅ Transfer completed successfully!")
        print(f"   - Transferred from users: {transferred}")
        print(f"   - Assigned by surname: {surname_assigned}")
        print(f"   - Already assigned: {already_assigned}")
        
        show_assignment_summary()
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()