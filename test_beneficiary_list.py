#!/usr/bin/env python
import os
import django
import requests
import json

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from fuel.models import BeneficiaryProfile

# Test the beneficiary list API
def test_beneficiary_list():
    print("Testing beneficiary list API...")
    
    # First check database directly
    User = get_user_model()
    beneficiaries = BeneficiaryProfile.objects.all()
    print(f"Beneficiaries in database: {beneficiaries.count()}")
    
    for beneficiary in beneficiaries:
        print(f"- {beneficiary.full_name} ({beneficiary.employee_id})")
    
    # Test API endpoint
    print("\nTesting API endpoint...")
    try:
        # Create admin user for API access
        admin_user = User.objects.filter(username='admin').first()
        if not admin_user:
            admin_user = User.objects.create_superuser(
                username='admin',
                email='admin@test.com',
                password='admin123'
            )
            print("Created admin user")
        
        # Get JWT token
        login_data = {
            'username': 'admin',
            'password': 'admin123'
        }
        
        response = requests.post('http://localhost:8000/api/auth/login/', json=login_data)
        if response.status_code == 200:
            token = response.json().get('access')
            print("Successfully obtained JWT token")
            
            # Test beneficiary list endpoint
            headers = {'Authorization': f'Bearer {token}'}
            response = requests.get('http://localhost:8000/api/beneficiary-profiles/', headers=headers)
            
            print(f"API Response Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"API returned {len(data.get('results', data))} beneficiaries")
                for beneficiary in data.get('results', data)[:3]:  # Show first 3
                    print(f"- {beneficiary.get('full_name')} ({beneficiary.get('employee_id')})")
            else:
                print(f"API Error: {response.text}")
        else:
            print(f"Login failed: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Server not running. Please start Django server first.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_beneficiary_list()
