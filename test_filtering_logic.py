#!/usr/bin/env python3
import os
import django
import sys

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import User, BeneficiaryProfile
from fuel.views_main import BeneficiaryProfileViewSet

def test_subcenter_filtering_logic():
    print("=== TESTING SUBCENTER FILTERING LOGIC ===")
    
    # Test the ViewSet filtering logic directly
    viewset = BeneficiaryProfileViewSet()
    
    # Mock request object for SUB_CENTER user
    class MockQueryParams:
        def get(self, key, default=None):
            return default
    
    class MockRequest:
        def __init__(self, user):
            self.user = user
            self.query_params = MockQueryParams()
    
    # Test with subcenter user
    subcenter_user = User.objects.get(username='subcenter')
    print(f"\n1. Testing with user: {subcenter_user.username}")
    print(f"   Role: {subcenter_user.role}")
    print(f"   SubCenter: {subcenter_user.sub_center}")
    
    # Create mock request
    mock_request = MockRequest(subcenter_user)
    viewset.request = mock_request
    
    # Get queryset
    queryset = viewset.get_queryset()
    beneficiaries = list(queryset.all())
    
    print(f"   Filtered beneficiaries count: {len(beneficiaries)}")
    for beneficiary in beneficiaries:
        print(f"   - {beneficiary.user.username} -> {beneficiary.sub_center}")
    
    # Verify filtering works correctly
    if subcenter_user.sub_center:
        expected_subcenter = subcenter_user.sub_center
        all_correct = all(b.sub_center == expected_subcenter for b in beneficiaries)
        
        if all_correct:
            print(f"   ✓ FILTERING WORKS: All beneficiaries from {expected_subcenter}")
        else:
            print(f"   ✗ FILTERING ISSUE: Mixed subcenters returned")
            for b in beneficiaries:
                print(f"     - {b.user.username} -> {b.sub_center} (expected: {expected_subcenter})")
    
    # Test with different subcenter user
    sub_center_test_user = User.objects.get(username='sub_center_test')
    print(f"\n2. Testing with user: {sub_center_test_user.username}")
    print(f"   Role: {sub_center_test_user.role}")
    print(f"   SubCenter: {sub_center_test_user.sub_center}")
    
    mock_request2 = MockRequest(sub_center_test_user)
    viewset.request = mock_request2
    
    queryset2 = viewset.get_queryset()
    beneficiaries2 = list(queryset2.all())
    
    print(f"   Filtered beneficiaries count: {len(beneficiaries2)}")
    for beneficiary in beneficiaries2:
        print(f"   - {beneficiary.user.username} -> {beneficiary.sub_center}")
    
    # Test with admin user (should see all)
    admin_user = User.objects.filter(is_superuser=True).first()
    if admin_user:
        print(f"\n3. Testing with admin user: {admin_user.username}")
        print(f"   Role: {admin_user.role}")
        
        mock_request3 = MockRequest(admin_user)
        viewset.request = mock_request3
        
        queryset3 = viewset.get_queryset()
        beneficiaries3 = list(queryset3.all())
        
        print(f"   All beneficiaries count: {len(beneficiaries3)}")
        for beneficiary in beneficiaries3:
            print(f"   - {beneficiary.user.username} -> {beneficiary.sub_center}")
    
    print(f"\n=== SUMMARY ===")
    print(f"Total beneficiaries in system: {BeneficiaryProfile.objects.count()}")
    print(f"Subcenter 'subcenter' sees: {len(beneficiaries)} beneficiaries")
    print(f"Subcenter 'sub_center_test' sees: {len(beneficiaries2)} beneficiaries")
    if admin_user:
        print(f"Admin sees: {len(beneficiaries3)} beneficiaries")
    
    if len(beneficiaries) != len(beneficiaries2):
        print("✓ Different subcenters see different beneficiaries (filtering works)")
    else:
        print("⚠ Different subcenters see same beneficiaries (may be expected if same counts)")

if __name__ == '__main__':
    test_subcenter_filtering_logic()