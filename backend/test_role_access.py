#!/usr/bin/env python3
"""
Test role-based beneficiary access
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import User, BeneficiaryProfile
from fuel.views_main import BeneficiaryProfileViewSet
from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser

def test_role_based_access():
    print("=== Testing Role-Based Beneficiary Access ===")
    
    factory = RequestFactory()
    viewset = BeneficiaryProfileViewSet()
    
    # Test different user roles
    users_to_test = User.objects.filter(
        role__in=['ADMIN', 'MAIN_CENTER', 'AUDITOR', 'SUPERUSER', 'SUB_CENTER', 'SUB_CENTER_APPROVER']
    )
    
    total_beneficiaries = BeneficiaryProfile.objects.filter(is_active_beneficiary=True).count()
    
    print(f"\n📊 Total active beneficiaries in system: {total_beneficiaries}")
    
    for user in users_to_test:
        # Create a mock request
        request = factory.get('/api/v1/beneficiaries/')
        request.user = user
        # Add query_params attribute that DRF expects
        request.query_params = {}
        
        # Set the request on the viewset
        viewset.request = request
        viewset.action = 'list'
        
        # Get the filtered queryset
        queryset = viewset.get_queryset()
        beneficiary_count = queryset.count()
        
        expected_behavior = ""
        if user.role in ['ADMIN', 'MAIN_CENTER', 'AUDITOR', 'SUPERUSER']:
            expected_behavior = f"Should see ALL ({total_beneficiaries})"
        elif user.role in ['SUB_CENTER', 'SUB_CENTER_APPROVER']:
            if user.sub_center:
                subcenter_count = BeneficiaryProfile.objects.filter(
                    sub_center=user.sub_center, 
                    is_active_beneficiary=True
                ).count()
                expected_behavior = f"Should see subcenter only ({subcenter_count})"
            else:
                expected_behavior = "Should see NONE (no subcenter assigned)"
        
        status = "✅" if (
            (user.role in ['ADMIN', 'MAIN_CENTER', 'AUDITOR', 'SUPERUSER'] and beneficiary_count == total_beneficiaries) or
            (user.role in ['SUB_CENTER', 'SUB_CENTER_APPROVER'] and user.sub_center and beneficiary_count > 0) or
            (user.role in ['SUB_CENTER', 'SUB_CENTER_APPROVER'] and not user.sub_center and beneficiary_count == 0)
        ) else "❌"
        
        print(f"\n{status} User: {user.username} ({user.role})")
        print(f"   Subcenter: {user.sub_center.name if user.sub_center else 'None'}")
        print(f"   Can access: {beneficiary_count} beneficiaries")
        print(f"   Expected: {expected_behavior}")

if __name__ == '__main__':
    test_role_based_access()