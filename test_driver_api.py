#!/usr/bin/env python
"""
Test driver API to see if it works after fixing permission issues
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
from fuel.models import Driver, User
from django.contrib.auth import get_user_model

def test_driver_api():
    """Test driver API access and creation"""
    
    User = get_user_model()
    
    # Get the admin user (same as frontend is using)
    admin_user = User.objects.filter(username='admin').first()
    
    if not admin_user:
        print("No admin user found")
        return
    
    print(f"Testing Driver API with user: {admin_user.username} (role: {admin_user.role})")
    
    # Setup API client with authentication
    client = APIClient()
    refresh = RefreshToken.for_user(admin_user)
    access_token = str(refresh.access_token)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    # Test GET /api/drivers/
    print(f"\n--- Testing Driver List (GET) ---")
    response = client.get('/api/drivers/')
    
    if response.status_code == 200:
        data = response.data
        results_count = len(data.get('results', []))
        print(f"✅ Driver List API: {results_count} drivers returned")
        print(f"Response structure: count={data.get('count', 'N/A')}, results length={results_count}")
    else:
        print(f"❌ Driver List API failed: {response.status_code}")
        print(f"Error: {response.data if hasattr(response, 'data') else response.content}")
        return
    
    # Test POST /api/drivers/ (create new driver)
    print(f"\n--- Testing Driver Creation (POST) ---")
    
    # Get a subcenter for assignment
    from fuel.models import SubCenter
    subcenter = SubCenter.objects.first()
    if not subcenter:
        print("❌ No subcenter found - cannot test driver creation")
        return
    
    test_driver_data = {
        "employee_id": "EMP123",
        "first_name": "Test",
        "last_name": "Driver API",
        "id_number": "12345678901",
        "license_number": "TEST123456",
        "license_class": "CLASS_2",
        "license_expiry": "2025-12-31",
        "phone_number": "+263777123456",
        "email": "testdriver@parliament.zw",
        "address": "Test Address, Harare",
        "status": "ACTIVE",
        "hire_date": "2024-01-01",
        "assigned_subcenter": subcenter.id
    }
    
    response = client.post('/api/drivers/', data=test_driver_data, format='json')
    
    if response.status_code == 201:
        print(f"✅ Driver Creation API: Driver created successfully")
        print(f"Created driver: {response.data.get('full_name')} (ID: {response.data.get('id')})")
        
        # Clean up - delete the test driver
        driver_id = response.data.get('id')
        if driver_id:
            delete_response = client.delete(f'/api/drivers/{driver_id}/')
            if delete_response.status_code == 204:
                print(f"✅ Test driver cleaned up successfully")
            else:
                print(f"⚠️ Failed to clean up test driver: {delete_response.status_code}")
                
    else:
        print(f"❌ Driver Creation API failed: {response.status_code}")
        print(f"Error: {response.data if hasattr(response, 'data') else response.content}")
        
        # Check if it's a serializer error
        if hasattr(response, 'data') and isinstance(response.data, dict):
            print(f"Detailed errors:")
            for field, errors in response.data.items():
                print(f"  {field}: {errors}")

if __name__ == '__main__':
    print("=== Testing Driver API Functionality ===\n")
    
    try:
        test_driver_api()
    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()