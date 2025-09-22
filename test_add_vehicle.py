#!/usr/bin/env python
"""
Test script to check Add Vehicle functionality
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
from django.test.client import Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from fuel.models import SubCenter, PoolVehicle, User
from django.contrib.auth.models import AnonymousUser
import requests

def test_add_vehicle():
    """Test adding a vehicle through the API"""
    
    # First, create a test user and subcenter
    User = get_user_model()
    
    # Create test subcenter if doesn't exist
    subcenter, created = SubCenter.objects.get_or_create(
        code='TEST001',
        defaults={
            'name': 'Test SubCenter',
            'location': 'Test Location',
            'contact_person': 'Test Person',
            'contact_number': '123456789',
            'email': 'test@example.com'
        }
    )
    
    # Create test user if doesn't exist
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={
            'email': 'test@example.com',
            'role': 'MAIN_CENTER',
            'first_name': 'Test',
            'last_name': 'User',
            'is_active': True,
            'sub_center': subcenter  # Assign to subcenter for access
        }
    )
    
    # Test data for creating a vehicle  
    import random
    vehicle_data = {
        'registration_number': f'TEST{random.randint(1000, 9999)}',
        'make': 'Toyota',
        'model': 'Corolla',
        'year': 2020,
        'vehicle_type': 'CAR',
        'fuel_type': 'PETROL',
        'engine_cc': 1500,
        'assigned_subcenter': subcenter.id,
        'current_mileage': 5000,
        'status': 'ACTIVE'
    }
    
    print(f"Testing vehicle creation with data: {json.dumps(vehicle_data, indent=2)}")
    
    # Test using DRF API client with proper authentication
    client = APIClient()
    
    # Create JWT token for the user
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    # Set authentication header
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    # Try to create vehicle  
    response = client.post('/api/pool-vehicles/', 
                          data=vehicle_data, 
                          format='json')
    
    print(f"Response status: {response.status_code}")
    
    if response.status_code == 201:
        print("✅ Vehicle created successfully!")
        response_data = response.data
        print(f"Created vehicle: {json.dumps(response_data, indent=2)}")
        
        # Check if vehicle actually exists in database
        try:
            vehicle = PoolVehicle.objects.get(registration_number='TEST123')
            print(f"✅ Vehicle found in database: {vehicle}")
        except PoolVehicle.DoesNotExist:
            print("❌ Vehicle was not found in database despite success response!")
            
    else:
        print(f"❌ Vehicle creation failed!")
        print(f"Response content: {response.data if hasattr(response, 'data') else response.content}")
        
        # Check for validation errors
        try:
            error_data = response.data if hasattr(response, 'data') else json.loads(response.content)
            print(f"Error details: {json.dumps(error_data, indent=2)}")
        except:
            pass
    
    return response

def test_vehicle_listing():
    """Test listing vehicles"""
    print("\n--- Testing vehicle listing ---")
    
    User = get_user_model()
    user = User.objects.filter(role='MAIN_CENTER').first()
    
    if not user:
        print("No MAIN_CENTER user found for testing")
        return
        
    client = APIClient()
    
    # Create JWT token for the user
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    # Set authentication header
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    response = client.get('/api/pool-vehicles/')
    print(f"List response status: {response.status_code}")
    
    if response.status_code == 200:
        try:
            data = response.data
            print(f"Found {len(data.get('results', data))} vehicles")
        except:
            print("Could not parse response data")
    else:
        print(f"List failed: {response.data if hasattr(response, 'data') else response.content}")

if __name__ == '__main__':
    print("=== Testing Add Vehicle Functionality ===\n")
    
    try:
        test_add_vehicle()
        test_vehicle_listing()
    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()