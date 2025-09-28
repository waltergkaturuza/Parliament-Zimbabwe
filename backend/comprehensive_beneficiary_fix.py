#!/usr/bin/env python3
"""
Comprehensive beneficiary and subcenter assignment fix:
1. Create BeneficiaryProfile for users with BENEFICIARY role who don't have one
2. Transfer subcenter assignments from users to beneficiary profiles
3. Assign unassigned beneficiaries based on surname alphabetical ranges
4. Handle the production deployment scenario
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import SubCenter, User, BeneficiaryProfile, BeneficiaryCategory
from django.db import transaction

def create_missing_beneficiary_profiles():
    """Create BeneficiaryProfile for users with BENEFICIARY role who don't have one"""
    print("=== Creating Missing Beneficiary Profiles ===")
    
    # Find BENEFICIARY users without profiles
    beneficiary_users = User.objects.filter(role='BENEFICIARY')
    users_without_profiles = []
    
    for user in beneficiary_users:
        try:
            user.beneficiary_profile
        except BeneficiaryProfile.DoesNotExist:
            users_without_profiles.append(user)
    
    print(f"Found {len(users_without_profiles)} users without beneficiary profiles")
    
    # Get default category (or create one)
    default_category, created = BeneficiaryCategory.objects.get_or_create(
        name="Member of Parliament",
        defaults={
            'description': 'Member of Parliament - Default Category',
            'monthly_entitlement_litres': 200,
            'is_active': True
        }
    )
    
    if created:
        print(f"✅ Created default category: {default_category.name}")
    
    created_profiles = 0
    for user in users_without_profiles:
        print(f"Creating profile for: {user.get_full_name()} ({user.username})")
        
        # Generate employee_id if not present
        employee_id = getattr(user, 'employee_id', None) or f"EMP{user.id:04d}"
        
        profile = BeneficiaryProfile.objects.create(
            user=user,
            category=default_category,
            employee_id=employee_id,
            position=user.first_name.title() if user.first_name else "Member",
            department="Parliament",
            monthly_entitlement_litres=200,
            is_active_beneficiary=True,
            vehicle_make="Toyota",
            vehicle_model="Corolla",
            vehicle_registration=f"REG{user.id:03d}",
            fuel_type="PETROL",
            sub_center=user.sub_center  # Use user's subcenter if available
        )
        
        print(f"  ✅ Created beneficiary profile for {user.get_full_name()}")
        created_profiles += 1
    
    return created_profiles

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
    
    # Find subcenters - try to match the naming pattern
    subcenters = list(SubCenter.objects.filter(is_active=True).order_by('name'))
    
    if not subcenters:
        print("❌ No active subcenters found!")
        return None
    
    print(f"Available subcenters: {[sc.name for sc in subcenters]}")
    
    # Map based on available subcenters
    if len(subcenters) >= 4:
        # We have at least 4 subcenters, use the first 4
        if first_letter in 'ABCDE':
            return subcenters[0]  # First subcenter for A-E
        elif first_letter in 'FGHIJKL':
            return subcenters[1]  # Second subcenter for F-L
        elif first_letter in 'MN':
            return subcenters[2]  # Third subcenter for M-N
        else:  # O-Z
            return subcenters[3]  # Fourth subcenter for O-Z
    else:
        # Distribute evenly among available subcenters
        index = hash(first_letter) % len(subcenters)
        return subcenters[index]

def transfer_and_assign_subcenters():
    """Transfer subcenter assignments and assign based on surname ranges"""
    print("\n=== Processing SubCenter Assignments ===")
    
    beneficiaries = BeneficiaryProfile.objects.select_related('user', 'sub_center').all()
    
    transferred_count = 0
    surname_assigned_count = 0
    already_assigned_count = 0
    
    print(f"Processing {beneficiaries.count()} beneficiaries...")
    
    for beneficiary in beneficiaries:
        user_name = beneficiary.user.get_full_name() if beneficiary.user else 'No User'
        print(f"\nProcessing: {user_name} (ID: {beneficiary.id})")
        
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
                print(f"  ✅ Assigned by surname '{beneficiary.user.last_name}' ({beneficiary.user.last_name[0]}): {assigned_subcenter.name}")
                surname_assigned_count += 1
            else:
                print(f"  ⚠️ Could not assign subcenter for surname: {beneficiary.user.last_name}")
        else:
            # Assign to first available subcenter as default
            default_subcenter = SubCenter.objects.filter(is_active=True).first()
            if default_subcenter:
                beneficiary.sub_center = default_subcenter
                beneficiary.save()
                print(f"  ⚠️ Assigned to default subcenter: {default_subcenter.name}")
                surname_assigned_count += 1
            else:
                print(f"  ❌ No subcenter available for assignment")
    
    return transferred_count, surname_assigned_count, already_assigned_count

def show_final_summary():
    """Show final summary of all assignments"""
    print("\n" + "="*60)
    print("🎯 FINAL ASSIGNMENT SUMMARY")
    print("="*60)
    
    # Show subcenter distribution
    subcenters = SubCenter.objects.filter(is_active=True).order_by('name')
    
    total_beneficiaries = BeneficiaryProfile.objects.count()
    assigned_beneficiaries = BeneficiaryProfile.objects.filter(sub_center__isnull=False).count()
    
    print(f"\n📊 Overview:")
    print(f"   - Total beneficiaries: {total_beneficiaries}")
    print(f"   - Assigned to subcenters: {assigned_beneficiaries}")
    print(f"   - Unassigned: {total_beneficiaries - assigned_beneficiaries}")
    
    print(f"\n🏢 SubCenter Distribution:")
    for subcenter in subcenters:
        beneficiaries = BeneficiaryProfile.objects.filter(sub_center=subcenter).select_related('user')
        count = beneficiaries.count()
        
        print(f"\n   📍 {subcenter.name} ({subcenter.code}): {count} beneficiaries")
        
        if count > 0:
            # Show sample names and surname ranges
            sample_beneficiaries = beneficiaries[:5]
            for b in sample_beneficiaries:
                if b.user:
                    surname_initial = b.user.last_name[0] if b.user.last_name else '?'
                    print(f"      - {b.user.get_full_name()} ({surname_initial})")
    
    # Show any unassigned beneficiaries
    unassigned = BeneficiaryProfile.objects.filter(sub_center__isnull=True).select_related('user')
    if unassigned.exists():
        print(f"\n⚠️ Unassigned Beneficiaries:")
        for b in unassigned:
            if b.user:
                print(f"   - {b.user.get_full_name()}")

def main():
    try:
        print("🏛️ Parliament Zimbabwe - Beneficiary SubCenter Assignment Fix")
        print("="*60)
        
        with transaction.atomic():
            # Step 1: Create missing beneficiary profiles
            created_profiles = create_missing_beneficiary_profiles()
            
            # Step 2: Transfer and assign subcenters
            transferred, surname_assigned, already_assigned = transfer_and_assign_subcenters()
        
        print(f"\n✅ Process completed successfully!")
        print(f"   - Created beneficiary profiles: {created_profiles}")
        print(f"   - Transferred from users: {transferred}")
        print(f"   - Assigned by surname: {surname_assigned}")
        print(f"   - Already assigned: {already_assigned}")
        
        show_final_summary()
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()