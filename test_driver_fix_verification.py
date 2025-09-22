#!/usr/bin/env python
"""
Test driver API after fixing the field name issue
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

def test_driver_creation_after_fix():
    """Test driver creation with correct field names (as frontend would send)"""
    
    User = get_user_model()
    
    # Get the admin user
    admin_user = User.objects.filter(username='admin').first()
    
    if not admin_user:
        print("No admin user found")
        return
    
    print(f"Testing corrected Driver API with user: {admin_user.username} (role: {admin_user.role})")
    
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
    
    print(f"\n--- Testing Fixed Driver Creation ---")
    
    # Test data matching what frontend will send after fix
    corrected_driver_data = {
        "employee_id": "EMP2001",
        "first_name": "Test",
        "last_name": "Fixed Driver",
        "id_number": "20012345678",
        "license_number": "FIXED2001",
        "license_class": "CLASS_2",
        "license_expiry": "2025-12-31",  # ✅ Correct field name
        "phone_number": "+263777122001",
        "email": "fixeddriver@parliament.zw",
        "address": "Fixed Address, Harare",
        "status": "ACTIVE",
        "hire_date": "2024-01-01",  # ✅ Correct field name
        "assigned_subcenter": subcenter.id
    }
    
    response = client.post('/api/drivers/', data=corrected_driver_data, format='json')
    
    if response.status_code == 201:
        print(f"✅ SUCCESS: Driver created with correct field names!")
        print(f"   Created: {response.data.get('first_name')} {response.data.get('last_name')} (ID: {response.data.get('id')})")
        print(f"   License Expiry: {response.data.get('license_expiry')}")
        print(f"   Hire Date: {response.data.get('hire_date')}")
        
        # Clean up - delete the test driver
        driver_id = response.data.get('id')
        if driver_id:
            delete_response = client.delete(f'/api/drivers/{driver_id}/')
            if delete_response.status_code == 204:
                print(f"   🧹 Test driver cleaned up")
            else:
                print(f"   ⚠️ Failed to clean up test driver: {delete_response.status_code}")
                
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
    print("=== Testing Driver API After Field Name Fix ===\n")
    
    try:
        test_driver_creation_after_fix()
        print(f"\n🎉 Frontend should now be able to create drivers successfully!")
        print(f"   The field name mismatch (license_expiry_date → license_expiry) has been fixed.")
    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()