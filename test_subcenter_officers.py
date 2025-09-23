#!/usr/bin/env python
"""Check subcenter officer data in API response."""

import requests
import json
import os

# Avoid Django import conflicts
if 'DJANGO_SETTINGS_MODULE' in os.environ:
    del os.environ['DJANGO_SETTINGS_MODULE']

BASE_URL = 'http://127.0.0.1:8000/api'

def test_subcenter_officer_data():
    """Check what officer data is being returned in subcenter API."""
    print("🧪 Testing Subcenter Officer Data")
    print("=" * 50)
    
    # Login as maincenter
    login_data = {'username': 'maincenter', 'password': 'main@123'}
    response = requests.post(f'{BASE_URL}/auth/login/', json=login_data)
    
    if response.status_code != 200:
        print("❌ MAIN_CENTER login failed")
        return
    
    token = response.json()['access']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Get subcenters with detailed output
    print("📡 Getting subcenter data with officer information...")
    response = requests.get(f'{BASE_URL}/subcenters/', headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        subcenters = data.get('results', data) if isinstance(data, dict) else data
        
        print(f"✅ Found {len(subcenters)} subcenters")
        
        for i, subcenter in enumerate(subcenters, 1):
            print(f"\n🏢 Subcenter {i}:")
            print(f"   ID: {subcenter.get('id')}")
            print(f"   Name: {subcenter.get('name')}")
            print(f"   Location: {subcenter.get('location')}")
            
            # Check all possible officer fields
            officer_fields = [
                'officer_in_charge',
                'officer_name', 
                'officerName',
                'managed_by',
                'manager',
                'contact_person'
            ]
            
            print("   👤 Officer Data:")
            for field in officer_fields:
                value = subcenter.get(field)
                if value is not None:
                    print(f"      {field}: {value}")
            
            # Print all available fields for debugging
            print("   📋 All Available Fields:")
            for key, value in subcenter.items():
                if key not in ['id', 'name', 'location']:
                    print(f"      {key}: {value}")
    else:
        print(f"❌ API call failed: {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    test_subcenter_officer_data()