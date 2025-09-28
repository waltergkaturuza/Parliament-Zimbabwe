#!/usr/bin/env python3
import os
import django
import sys
import requests
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import User

def test_subcenter_api():
    print("=== TESTING SUBCENTER API FILTERING ===")
    
    # Get subcenter user
    subcenter_user = User.objects.get(username='subcenter')
    print(f"Testing with user: {subcenter_user.username}")
    print(f"User role: {subcenter_user.role}")
    print(f"User subcenter: {subcenter_user.sub_center}")
    
    # Login to get JWT token
    login_data = {
        'username': 'subcenter',
        'password': 'testpass123'
    }
    
    login_response = requests.post('http://127.0.0.1:8000/api/auth/login/', json=login_data)
    
    if login_response.status_code == 200:
        tokens = login_response.json()
        access_token = tokens.get('access')
        
        print(f"✓ Login successful")
        print(f"Access token: {access_token[:50]}...")
        
        # Test beneficiaries API
        headers = {
            'Authorization': f'Bearer {access_token}'
        }
        
        beneficiaries_response = requests.get(
            'http://127.0.0.1:8000/api/beneficiaries/',
            headers=headers
        )
        
        print(f"\n=== BENEFICIARIES API RESPONSE ===")
        print(f"Status: {beneficiaries_response.status_code}")
        
        if beneficiaries_response.status_code == 200:
            data = beneficiaries_response.json()
            results = data.get('results', [])
            print(f"Number of beneficiaries returned: {len(results)}")
            
            for beneficiary in results:
                username = beneficiary.get('user', {}).get('username')
                subcenter = beneficiary.get('subcenter_name')
                print(f"- {username} -> {subcenter}")
                
            # Test that only subcenter's beneficiaries are returned
            subcenter_name = subcenter_user.sub_center.name if subcenter_user.sub_center else None
            all_from_same_subcenter = all(
                b.get('subcenter_name') == subcenter_name 
                for b in results
            )
            
            if all_from_same_subcenter and len(results) > 0:
                print(f"✓ FILTERING WORKS: All returned beneficiaries are from {subcenter_name}")
            elif len(results) == 0:
                print("⚠ No beneficiaries returned (might be expected if none assigned)")
            else:
                print(f"✗ FILTERING ISSUE: Mixed subcenters returned")
                
        else:
            print(f"Error: {beneficiaries_response.text}")
            
    else:
        print(f"Login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")

if __name__ == '__main__':
    test_subcenter_api()