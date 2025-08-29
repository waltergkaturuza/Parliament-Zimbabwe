#!/usr/bin/env python
"""
Test script to check beneficiary creation permissions
"""
import sys
import os
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    django.setup()
except Exception as e:
    print(f"Django setup failed: {e}")
    sys.exit(1)

from django.contrib.auth import get_user_model
from fuel.permissions import BeneficiaryManagementPermission
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request

User = get_user_model()

def test_permissions():
    print("=== TESTING BENEFICIARY PERMISSIONS ===")
    
    # Create test users with different roles
    roles_to_test = ['MAIN_CENTER', 'SUB_CENTER', 'BENEFICIARY', 'AUDITOR', 'SUPERUSER']
    
    factory = APIRequestFactory()
    
    for role in roles_to_test:
        print(f"\nTesting role: {role}")
        
        # Create or get user with this role
        username = f"test_{role.lower()}"
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': f"{username}@example.com",
                'role': role,
                'is_active': True
            }
        )
        
        if created:
            print(f"  Created test user: {username}")
        else:
            # Update role in case it changed
            user.role = role
            user.save()
            print(f"  Using existing user: {username}")
        
        # Create a mock request
        request = factory.post('/api/v1/beneficiaries/')
        request.user = user
        
        # Test the permission
        permission = BeneficiaryManagementPermission()
        has_permission = permission.has_permission(request, None)
        
        print(f"  Permission result: {'✓ ALLOWED' if has_permission else '✗ DENIED'}")

def test_user_roles():
    print("\n=== CHECKING EXISTING USERS ===")
    
    users = User.objects.all()[:10]  # Limit to first 10 users
    
    for user in users:
        print(f"User: {user.username} | Role: {user.role} | Active: {user.is_active}")

if __name__ == "__main__":
    try:
        test_permissions()
        test_user_roles()
        print("\n=== TEST COMPLETED ===")
    except Exception as e:
        print(f"Test failed: {e}")
        import traceback
        traceback.print_exc()
