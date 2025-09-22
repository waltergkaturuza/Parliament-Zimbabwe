#!/usr/bin/env python
"""
Test script to check what the GET /api/pool-vehicles/ endpoint returns
"""
import os
import sys
import django
import json

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Now import everything after Django setup
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from fuel.models import SubCenter, PoolVehicle, User
from django.contrib.auth import get_user_model

def test_vehicle_listing():
    """Test what the vehicle listing API returns"""
    
    # Setup test data
    User = get_user_model()
    
    # Get existing user or create one
    user = User.objects.filter(role='MAIN_CENTER').first()
    if not user:
        subcenter = SubCenter.objects.first()
        user = User.objects.create(
            username='testuser',
            email='test@example.com',
            role='MAIN_CENTER',
            first_name='Test',
            last_name='User',
            is_active=True,
            sub_center=subcenter
        )
    
    # Test using DRF API client with proper authentication
    client = APIClient()
    
    # Create JWT token for the user
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    # Set authentication header
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    # Get vehicle count from database
    vehicle_count = PoolVehicle.objects.count()
    print(f"Vehicles in database: {vehicle_count}")
    
    if vehicle_count > 0:
        vehicles = PoolVehicle.objects.all()[:3]  # Show first 3
        for vehicle in vehicles:
            print(f"  - {vehicle.registration_number}: {vehicle.make} {vehicle.model} (SubCenter: {vehicle.assigned_subcenter.code})")
    
    # Try to get vehicles via API  
    response = client.get('/api/pool-vehicles/')
    
    print(f"\nAPI Response:")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.data
        print(f"Response type: {type(data)}")
        print(f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
        
        if isinstance(data, dict):
            if 'results' in data:
                print(f"Results count: {len(data['results'])}")
                if data['results']:
                    print(f"First result keys: {list(data['results'][0].keys())}")
                    print(f"First result: {json.dumps(data['results'][0], indent=2)}")
                else:
                    print("Results array is empty")
            else:
                print(f"Data is dict but no 'results' key. Keys: {list(data.keys())}")
                print(f"Full response: {json.dumps(data, indent=2)}")
        elif isinstance(data, list):
            print(f"Response is a list with {len(data)} items")
            if data:
                print(f"First item: {json.dumps(data[0], indent=2)}")
        else:
            print(f"Response data: {data}")
    else:
        print(f"API request failed: {response.data if hasattr(response, 'data') else response.content}")
    
    return response

if __name__ == '__main__':
    print("=== Testing Vehicle Listing API ===\n")
    
    try:
        test_vehicle_listing()
    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()