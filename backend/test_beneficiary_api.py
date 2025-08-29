#!/usr/bin/env python
"""
Test script to directly test beneficiary creation API endpoint
"""
import sys
import os
import django
import json

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    django.setup()
except Exception as e:
    print(f"Django setup failed: {e}")
    sys.exit(1)

from django.contrib.auth import get_user_model
from django.test.client import Client
from django.contrib.auth.models import AnonymousUser
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def test_beneficiary_creation_api():
    print("=== TESTING BENEFICIARY CREATION API ===")
    
    client = APIClient()
    
    # Get or create a SUB_CENTER user for testing
    user, created = User.objects.get_or_create(
        username="test_subcenter_api",
        defaults={
            'email': 'test_subcenter@example.com',
            'role': 'SUB_CENTER',
            'is_active': True,
            'password': 'testpass123'
        }
    )
    
    if created:
        print(f"Created test user: {user.username}")
    else:
        print(f"Using existing user: {user.username}")
    
    # Create JWT token for authentication
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    print(f"Generated JWT token: {access_token[:20]}...")
    
    # Set authentication header
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    # Test data for beneficiary creation - use random email to avoid conflicts
    import random
    random_num = random.randint(1000, 9999)
    
    test_data = {
        "user": {
            "first_name": "Test",
            "last_name": "Beneficiary",
            "email": f"test.beneficiary.{random_num}@example.com",
            "phone": "+263771234567"
        },
        "employee_id": f"EMP{random_num}",
        "category": "MP",
        "constituency": "Harare Central",
        "position": "Member of Parliament",
        "vehicle_make": "Toyota",
        "vehicle_model": "Camry",
        "vehicle_registration": f"ABC{random_num}ZW",
        "fuel_type": "PETROL",
        "monthly_entitlement_litres": 400.0
    }
    
    print("Test data:", json.dumps(test_data, indent=2))
    
    # Make the API request
    response = client.post('/api/v1/beneficiaries/', test_data, format='json')
    
    print(f"\nAPI Response:")
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.items())}")
    
    if response.content:
        try:
            response_data = response.json()
            print(f"Response Data: {json.dumps(response_data, indent=2)}")
        except json.JSONDecodeError:
            print(f"Response Content (raw): {response.content.decode('utf-8')}")
    
    # Check the result
    if response.status_code == 201:
        print("✓ SUCCESS: Beneficiary created successfully!")
    elif response.status_code == 403:
        print("✗ PERMISSION DENIED: User doesn't have permission to create beneficiaries")
    elif response.status_code == 400:
        print("✗ BAD REQUEST: There's an issue with the request data")
    else:
        print(f"✗ UNEXPECTED STATUS: {response.status_code}")

def test_endpoint_without_auth():
    print("\n=== TESTING WITHOUT AUTHENTICATION ===")
    
    client = APIClient()
    
    test_data = {
        "employee_id": "EMP002",
        "category": "MP"
    }
    
    response = client.post('/api/v1/beneficiaries/', test_data, format='json')
    print(f"Status Code (no auth): {response.status_code}")
    
    if response.status_code == 401:
        print("✓ EXPECTED: Authentication required")
    else:
        print(f"✗ UNEXPECTED: Expected 401, got {response.status_code}")

if __name__ == "__main__":
    try:
        test_beneficiary_creation_api()
        test_endpoint_without_auth()
        print("\n=== API TEST COMPLETED ===")
    except Exception as e:
        print(f"Test failed: {e}")
        import traceback
        traceback.print_exc()
