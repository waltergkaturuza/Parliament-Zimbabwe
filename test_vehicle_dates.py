#!/usr/bin/env python
"""
Test script to verify Add Vehicle functionality works with date fields
"""
import os
import sys
import django
import json
from datetime import date, timedelta

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Now import everything after Django setup
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from fuel.models import SubCenter, PoolVehicle, User
from django.contrib.auth import get_user_model

def test_vehicle_with_dates():
    """Test creating a vehicle with date fields"""
    
    # Setup test data
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
            'sub_center': subcenter
        }
    )
    
    # Test data with date fields
    import random
    vehicle_data = {
        'registration_number': f'DATE{random.randint(1000, 9999)}',
        'make': 'Honda',
        'model': 'Civic',
        'year': 2021,
        'vehicle_type': 'CAR',
        'fuel_type': 'PETROL',
        'engine_cc': 1800,
        'assigned_subcenter': subcenter.id,
        'current_mileage': 10000,
        'status': 'ACTIVE',
        'last_service_date': '2024-08-15',  # Proper YYYY-MM-DD format
        'next_service_due': '2024-12-15',   # Proper YYYY-MM-DD format
        'insurance_expiry': '2025-06-30'    # Proper YYYY-MM-DD format
    }
    
    print(f"Testing vehicle creation with dates: {json.dumps(vehicle_data, indent=2)}")
    
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
        print("✅ Vehicle with dates created successfully!")
        response_data = response.data
        print(f"Created vehicle: {json.dumps(response_data, indent=2)}")
        
        # Check if vehicle actually exists in database
        try:
            vehicle = PoolVehicle.objects.get(registration_number=vehicle_data['registration_number'])
            print(f"✅ Vehicle found in database: {vehicle}")
            print(f"✅ Last service date: {vehicle.last_service_date}")
            print(f"✅ Next service due: {vehicle.next_service_due}")
            print(f"✅ Insurance expiry: {vehicle.insurance_expiry}")
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

if __name__ == '__main__':
    print("=== Testing Add Vehicle with Date Fields ===\n")
    
    try:
        test_vehicle_with_dates()
    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()