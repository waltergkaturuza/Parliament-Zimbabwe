#!/usr/bin/env python
"""
Test script to check if beneficiaries are being fetched correctly
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
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from fuel.models import BeneficiaryProfile

User = get_user_model()

def test_beneficiary_list_api():
    print("=== TESTING BENEFICIARY LIST API ===")
    
    # Check how many beneficiaries exist in the database
    total_beneficiaries = BeneficiaryProfile.objects.count()
    active_beneficiaries = BeneficiaryProfile.objects.filter(is_active_beneficiary=True).count()
    
    print(f"Total beneficiaries in database: {total_beneficiaries}")
    print(f"Active beneficiaries: {active_beneficiaries}")
    
    if total_beneficiaries > 0:
        print("\nSample beneficiaries:")
        for beneficiary in BeneficiaryProfile.objects.all()[:5]:
            print(f"  - {beneficiary.user.get_full_name()} ({beneficiary.category.name if beneficiary.category else 'No Category'}) - Status: {getattr(beneficiary, 'status', 'No Status')}")
    
    client = APIClient()
    
    # Get a SUB_CENTER user for testing
    user = User.objects.filter(role='SUB_CENTER').first()
    if not user:
        # Create one if none exists
        user = User.objects.create_user(
            username="test_subcenter_list",
            email='test_subcenter_list@example.com',
            role='SUB_CENTER',
            is_active=True,
            password='testpass123'
        )
        print(f"Created test user: {user.username}")
    else:
        print(f"Using existing user: {user.username}")
    
    # Create JWT token for authentication
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    # Set authentication header
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    # Test the list endpoint
    print("\n=== TESTING GET /api/v1/beneficiaries/ ===")
    response = client.get('/api/v1/beneficiaries/')
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        try:
            data = response.json()
            print(f"Response type: {type(data)}")
            
            if isinstance(data, dict):
                print(f"Response keys: {list(data.keys())}")
                if 'results' in data:
                    results = data['results']
                    print(f"Number of results: {len(results)}")
                    if results:
                        print(f"Sample result fields: {list(results[0].keys())}")
                elif 'count' in data:
                    print(f"Total count: {data['count']}")
            elif isinstance(data, list):
                print(f"Direct list with {len(data)} items")
                if data:
                    print(f"Sample item fields: {list(data[0].keys())}")
            
            print(f"Raw response (first 500 chars): {str(data)[:500]}...")
            
        except json.JSONDecodeError:
            print(f"Response content (not JSON): {response.content.decode('utf-8')[:500]}...")
    else:
        print(f"Error response: {response.content.decode('utf-8')}")
    
    # Also test without filters
    print("\n=== TESTING WITH PAGINATION ===")
    response = client.get('/api/v1/beneficiaries/?page=1&page_size=10')
    print(f"Paginated Status Code: {response.status_code}")
    if response.status_code == 200:
        try:
            data = response.json()
            if isinstance(data, dict) and 'results' in data:
                print(f"Paginated results: {len(data['results'])} items")
                print(f"Total count: {data.get('count', 'Unknown')}")
        except:
            pass

if __name__ == "__main__":
    try:
        test_beneficiary_list_api()
        print("\n=== LIST API TEST COMPLETED ===")
    except Exception as e:
        print(f"Test failed: {e}")
        import traceback
        traceback.print_exc()
