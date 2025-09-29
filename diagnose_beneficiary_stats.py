#!/usr/bin/env python3
"""
Diagnostic script to check beneficiary categories and statistics
This will help identify why the statistics aren't matching up correctly
"""

import os
import django
import sys

# Setup Django
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')

try:
    django.setup()
    print("✅ Django setup successful")
except Exception as e:
    print(f"❌ Django setup failed: {e}")
    sys.exit(1)

# Import models
from fuel.models import BeneficiaryProfile, BeneficiaryCategory, User

def analyze_beneficiary_data():
    """Analyze the current beneficiary data and categories"""
    print("\n🔍 BENEFICIARY DATA ANALYSIS")
    print("=" * 60)
    
    # Get total count
    total_beneficiaries = BeneficiaryProfile.objects.filter(is_active_beneficiary=True).count()
    print(f"📊 Total Active Beneficiaries: {total_beneficiaries}")
    
    # Get active beneficiaries with users
    active_beneficiaries = BeneficiaryProfile.objects.filter(
        is_active_beneficiary=True,
        user__isnull=False
    ).select_related('category', 'user')
    
    print(f"📊 Active Beneficiaries with Users: {active_beneficiaries.count()}")
    
    # Analyze categories
    print("\n📋 CATEGORY BREAKDOWN:")
    print("-" * 40)
    
    categories = {}
    user_statuses = {'ACTIVE': 0, 'INACTIVE': 0, 'SUSPENDED': 0}
    vehicles_count = 0
    total_allocation = 0
    
    for beneficiary in active_beneficiaries:
        # Category analysis
        if beneficiary.category:
            cat_name = beneficiary.category.name
            if cat_name not in categories:
                categories[cat_name] = 0
            categories[cat_name] += 1
        else:
            cat_name = "NO_CATEGORY"
            if cat_name not in categories:
                categories[cat_name] = 0
            categories[cat_name] += 1
        
        # User status analysis
        if beneficiary.user:
            if beneficiary.user.is_active and getattr(beneficiary.user, 'is_approved', True):
                user_statuses['ACTIVE'] += 1
            elif not beneficiary.user.is_active:
                user_statuses['INACTIVE'] += 1
            else:
                user_statuses['SUSPENDED'] += 1
        
        # Vehicle count (count all beneficiaries that have any vehicle info)
        if (beneficiary.vehicle_make and beneficiary.vehicle_make.strip()) or \
           (beneficiary.vehicle_model and beneficiary.vehicle_model.strip()) or \
           (beneficiary.vehicle_registration and beneficiary.vehicle_registration.strip()):
            vehicles_count += 1
        
        # Total allocation
        if beneficiary.monthly_entitlement_litres:
            total_allocation += float(beneficiary.monthly_entitlement_litres)
    
    # Print category breakdown
    for category, count in sorted(categories.items()):
        print(f"  {category}: {count}")
    
    # Print user status breakdown
    print("\n👤 USER STATUS BREAKDOWN:")
    print("-" * 40)
    for status, count in user_statuses.items():
        print(f"  {status}: {count}")
    
    # Print vehicle analysis
    print("\n🚗 VEHICLE ANALYSIS:")
    print("-" * 40)
    print(f"  Beneficiaries with Vehicle Info: {vehicles_count}")
    
    print("\n⛽ ALLOCATION ANALYSIS:")
    print("-" * 40)
    print(f"  Total Monthly Allocation: {total_allocation:.0f}L")
    
    # Show samples for debugging
    print("\n🔍 SAMPLE BENEFICIARY DATA:")
    print("-" * 40)
    sample_beneficiaries = active_beneficiaries[:5]
    for i, beneficiary in enumerate(sample_beneficiaries, 1):
        print(f"\n  Sample {i}:")
        print(f"    Name: {beneficiary.user.get_full_name() if beneficiary.user else 'No User'}")
        print(f"    Category: {beneficiary.category.name if beneficiary.category else 'No Category'}")
        print(f"    User Status: {'ACTIVE' if beneficiary.user and beneficiary.user.is_active else 'INACTIVE'}")
        print(f"    Vehicle: {beneficiary.vehicle_make} {beneficiary.vehicle_model}".strip())
        print(f"    Registration: {beneficiary.vehicle_registration or 'None'}")
        print(f"    Monthly Allocation: {beneficiary.monthly_entitlement_litres}L")

def check_frontend_category_matching():
    """Check which categories would match the frontend filtering logic"""
    print("\n🎯 FRONTEND CATEGORY MATCHING ANALYSIS")
    print("=" * 60)
    
    # Frontend category definitions from the code
    mp_categories = [
        'MEMBER OF PARLIAMENT', 'MEMBER_OF_PARLIAMENT', 'MP', 'MINISTER', 'DEPUTY MINISTER',
        'ASSISTANT MINISTER', 'CHIEF WHIP', 'DEPUTY CHIEF WHIP', 'SPEAKER', 'DEPUTY SPEAKER',
        'COMMITTEE CHAIRPERSON', 'PARLIAMENTARY COMMITTEE MEMBER', 'OPPOSITION LEADER',
        'DEPUTY OPPOSITION LEADER', 'BACKBENCHER'
    ]
    
    senator_categories = [
        'SENATOR', 'DEPUTY SENATOR', 'SENATE PRESIDENT', 'DEPUTY SENATE PRESIDENT',
        'SENATE COMMITTEE CHAIRPERSON', 'SENATE COMMITTEE MEMBER'
    ]
    
    staff_categories = [
        'STAFF', 'PARLIAMENTARY STAFF', 'ADMINISTRATIVE STAFF', 'SUPPORT STAFF', 'CLERK', 'ASSISTANT CLERK'
    ]
    
    # Get all categories from database
    db_categories = list(BeneficiaryCategory.objects.values_list('name', flat=True))
    
    print("📋 DATABASE CATEGORIES:")
    print("-" * 30)
    for category in db_categories:
        print(f"  {category}")
    
    print("\n🎯 MATCHING ANALYSIS:")
    print("-" * 30)
    
    for db_cat in db_categories:
        matches = []
        if db_cat in mp_categories:
            matches.append("MP")
        if db_cat in senator_categories:
            matches.append("SENATOR")
        if db_cat in staff_categories:
            matches.append("STAFF")
        
        if matches:
            print(f"  ✅ {db_cat} → {', '.join(matches)}")
        else:
            print(f"  ❌ {db_cat} → NO MATCH")
    
    print("\n💡 RECOMMENDED ACTIONS:")
    print("-" * 30)
    unmatched = [cat for cat in db_categories if cat not in (mp_categories + senator_categories + staff_categories)]
    if unmatched:
        print("  The following categories don't match frontend filters:")
        for cat in unmatched:
            print(f"    - {cat}")
        print("  Consider updating the frontend category lists or database category names.")
    else:
        print("  ✅ All database categories match frontend filters!")

def main():
    """Run the diagnostic analysis"""
    try:
        analyze_beneficiary_data()
        check_frontend_category_matching()
        
        print("\n" + "=" * 60)
        print("🎯 SUMMARY")
        print("=" * 60)
        print("This diagnostic shows:")
        print("1. How many beneficiaries exist in each category")
        print("2. How many have vehicle information")
        print("3. Which categories match the frontend filtering logic")
        print("\nIf statistics don't match the frontend, check:")
        print("- Category name mismatches between DB and frontend")
        print("- User approval/active status issues")
        print("- Vehicle information completeness")
        
    except Exception as e:
        print(f"❌ Error running analysis: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()