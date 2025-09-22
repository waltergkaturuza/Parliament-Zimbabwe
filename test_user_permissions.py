#!/usr/bin/env python
"""
Test script to check user permissions and vehicle access
"""
import os
import sys
import django
import json

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from fuel.models import SubCenter, PoolVehicle, User
from django.contrib.auth import get_user_model

def test_user_vehicle_access():
    """Test vehicle access for different user types"""
    
    User = get_user_model()
    
    # Test different user scenarios
    test_users = []
    
    # Get or create users with different roles
    main_center_user, created = User.objects.get_or_create(
        username='main_center_test',
        defaults={
            'email': 'main@test.com',
            'role': 'MAIN_CENTER',
            'first_name': 'Main',
            'last_name': 'User',
            'is_active': True
        }
    )
    test_users.append(('MAIN_CENTER', main_center_user))
    
    # Get first subcenter
    subcenter = SubCenter.objects.first()
    if subcenter:
        sub_center_user, created = User.objects.get_or_create(
            username='sub_center_test',
            defaults={
                'email': 'sub@test.com',
                'role': 'SUB_CENTER',
                'first_name': 'Sub',
                'last_name': 'User',
                'is_active': True,
                'sub_center': subcenter
            }
        )
        test_users.append(('SUB_CENTER', sub_center_user))
        
        # Sub center user without assigned subcenter
        sub_center_no_assignment, created = User.objects.get_or_create(
            username='sub_center_no_assign',
            defaults={
                'email': 'sub_no_assign@test.com',
                'role': 'SUB_CENTER',
                'first_name': 'Sub No Assign',
                'last_name': 'User',
                'is_active': True,
                'sub_center': None  # No subcenter assigned
            }
        )
        test_users.append(('SUB_CENTER (no assignment)', sub_center_no_assignment))
    
    # Regular user with different role
    regular_user, created = User.objects.get_or_create(
        username='regular_test',
        defaults={
            'email': 'regular@test.com',
            'role': 'BENEFICIARY',  # Different role
            'first_name': 'Regular',
            'last_name': 'User',
            'is_active': True
        }
    )
    test_users.append(('BENEFICIARY', regular_user))
    
    # Show total vehicles in database
    total_vehicles = PoolVehicle.objects.count()
    print(f"Total vehicles in database: {total_vehicles}")
    
    if total_vehicles > 0:
        for subcenter in SubCenter.objects.all()[:3]:
            vehicle_count = PoolVehicle.objects.filter(assigned_subcenter=subcenter).count()
            print(f"  - {subcenter.code} ({subcenter.name}): {vehicle_count} vehicles")
    
    print("\n" + "="*60)
    
    # Test API access for each user
    for role_desc, user in test_users:
        print(f"\nTesting access for {role_desc} user: {user.username}")
        print(f"  User role: {user.role}")
        print(f"  Assigned subcenter: {user.sub_center.code if user.sub_center else 'None'}")
        
        client = APIClient()
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        response = client.get('/api/pool-vehicles/')
        
        if response.status_code == 200:
            data = response.data
            results_count = len(data.get('results', []))
            print(f"  ✅ API Access: SUCCESS - {results_count} vehicles returned")
            
            if results_count > 0:
                vehicle_ids = [v['id'] for v in data['results'][:3]]
                print(f"  Vehicle IDs: {vehicle_ids}")
            else:
                print(f"  No vehicles returned for this user")
        else:
            print(f"  ❌ API Access: FAILED - Status {response.status_code}")
            print(f"  Error: {response.data if hasattr(response, 'data') else response.content}")

if __name__ == '__main__':
    print("=== Testing User Vehicle Access Permissions ===\n")
    
    try:
        test_user_vehicle_access()
    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()