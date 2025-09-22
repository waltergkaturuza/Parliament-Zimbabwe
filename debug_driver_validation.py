#!/usr/bin/env python
"""
Test driver API with detailed error handling to see what's causing the 400 error
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
from fuel.models import Driver, User, SubCenter
from django.contrib.auth import get_user_model

def test_driver_validation_errors():
    """Test driver creation to see detailed validation errors"""
    
    User = get_user_model()
    
    # Get the admin user
    admin_user = User.objects.filter(username='admin').first()
    
    if not admin_user:
        print("No admin user found")
        return
    
    print(f"Testing Driver API validation with user: {admin_user.username} (role: {admin_user.role})")
    
    # Setup API client with authentication
    client = APIClient()
    refresh = RefreshToken.for_user(admin_user)
    access_token = str(refresh.access_token)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    # Get a subcenter for assignment
    subcenter = SubCenter.objects.first()
    if not subcenter:
        print("❌ No subcenter found - cannot test driver creation")
        return
    
    # Test different date formats to see what the API expects
    test_cases = [
        {
            "name": "ISO Date Format (YYYY-MM-DD)",
            "data": {
                "employee_id": "EMP1001",
                "first_name": "Test",
                "last_name": "Driver API",
                "id_number": "10012345678",
                "license_number": "TEST1001",
                "license_class": "CLASS_2",
                "license_expiry": "2025-12-31",  # ISO format
                "phone_number": "+263777123001",
                "email": "testdriver1001@parliament.zw",
                "address": "Test Address, Harare",
                "status": "ACTIVE",
                "hire_date": "2024-01-01",  # ISO format
                "assigned_subcenter": subcenter.id
            }
        },
        {
            "name": "US Date Format (MM/DD/YYYY)",
            "data": {
                "employee_id": "EMP1002",
                "first_name": "Test",
                "last_name": "Driver API 2",
                "id_number": "10012345679",
                "license_number": "TEST1002",
                "license_class": "CLASS_2",
                "license_expiry": "12/31/2025",  # US format
                "phone_number": "+263777123002",
                "email": "testdriver1002@parliament.zw",
                "address": "Test Address, Harare",
                "status": "ACTIVE",
                "hire_date": "01/01/2024",  # US format
                "assigned_subcenter": subcenter.id
            }
        },
        {
            "name": "Missing Required Fields",
            "data": {
                "first_name": "Test",
                "last_name": "Driver API 3",
                "license_number": "TEST1003",
                "license_expiry": "2025-12-31",
                # Missing: employee_id, id_number, phone_number, address, hire_date, assigned_subcenter
            }
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n--- Test Case {i}: {test_case['name']} ---")
        
        response = client.post('/api/drivers/', data=test_case['data'], format='json')
        
        if response.status_code == 201:
            print(f"✅ SUCCESS: Driver created - {response.data.get('full_name', 'Unknown')} (ID: {response.data.get('id')})")
            
            # Clean up - delete the test driver
            driver_id = response.data.get('id')
            if driver_id:
                delete_response = client.delete(f'/api/drivers/{driver_id}/')
                if delete_response.status_code == 204:
                    print(f"   🧹 Test driver cleaned up")
                
        else:
            print(f"❌ FAILED: {response.status_code}")
            
            if hasattr(response, 'data') and isinstance(response.data, dict):
                print(f"   Validation errors:")
                for field, errors in response.data.items():
                    if isinstance(errors, list):
                        for error in errors:
                            print(f"     {field}: {error}")
                    else:
                        print(f"     {field}: {errors}")
            else:
                print(f"   Raw response: {response.content.decode() if hasattr(response, 'content') else 'No content'}")

if __name__ == '__main__':
    print("=== Testing Driver API Validation Errors ===\n")
    
    try:
        test_driver_validation_errors()
    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()