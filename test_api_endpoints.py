#!/usr/bin/env python
"""
Test script to verify API endpoint field mappings
"""
import os
import django
import requests
import json
from datetime import datetime, date

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
django.setup()

# API base URL
BASE_URL = 'http://127.0.0.1:8000/api'

def test_box_receipt_creation():
    """Test Box Receipt creation with new field mappings"""
    print("Testing Box Receipt Creation...")
    
    # Login first to get token
    login_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    try:
        login_response = requests.post(f'{BASE_URL}/auth/login/', json=login_data)
        if login_response.status_code == 200:
            token = login_response.json().get('access')
            headers = {'Authorization': f'Bearer {token}'}
            
            # Test Box Receipt creation with frontend field mappings
            box_data = {
                'couponAmount': 20,  # Frontend sends couponAmount → should map to denomination
                'monetaryValueUSD': 15.50,  # Frontend sends → should work with new model field
                'fuelPricePerLitreUSD': 0.78,  # Should work with new model field
                'exchangeRate': 1.25,  # Should work with new model field
                'number_of_coupons': 100,
                'total_litres': 2000,
                'box_date': date.today().isoformat(),
                'sub_center': 1,  # Assuming sub_center with ID 1 exists
                'notes': 'Test box from API endpoint testing'
            }
            
            box_response = requests.post(f'{BASE_URL}/box-receipts/', json=box_data, headers=headers)
            print(f"Box Receipt Response Status: {box_response.status_code}")
            if box_response.status_code == 201:
                print("✅ Box Receipt created successfully!")
                print(f"Response: {box_response.json()}")
            else:
                print(f"❌ Box Receipt creation failed: {box_response.text}")
        else:
            print(f"❌ Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"❌ Error testing Box Receipt: {e}")

def test_parliament_session_creation():
    """Test Parliament Session creation with field mappings"""
    print("\nTesting Parliament Session Creation...")
    
    # Login first to get token
    login_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    try:
        login_response = requests.post(f'{BASE_URL}/auth/login/', json=login_data)
        if login_response.status_code == 200:
            token = login_response.json().get('access')
            headers = {'Authorization': f'Bearer {token}'}
            
            # Test Parliament Session creation with frontend field mappings
            session_data = {
                'title': 'Test Parliamentary Session',
                'session_type': 'REGULAR',
                'start_date': date.today().isoformat(),
                'end_date': date.today().isoformat(),
                'description': 'Test session for API field mapping',
                'venue': 'Parliament Main Chamber',  # New field
                'fuel_entitlement_litres': 150.0,  # New field
                'is_mandatory': True,  # New field
                'session_manager': 1,  # Frontend sends → should map to organizer
                'managing_subcenter': 1,
                'is_active': True
            }
            
            session_response = requests.post(f'{BASE_URL}/parliament-sessions/', json=session_data, headers=headers)
            print(f"Parliament Session Response Status: {session_response.status_code}")
            if session_response.status_code == 201:
                print("✅ Parliament Session created successfully!")
                print(f"Response: {session_response.json()}")
            else:
                print(f"❌ Parliament Session creation failed: {session_response.text}")
        else:
            print(f"❌ Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"❌ Error testing Parliament Session: {e}")

def test_program_creation():
    """Test Program creation with field mappings"""
    print("\nTesting Program Creation...")
    
    # Login first to get token
    login_data = {
        'username': 'admin',
        'password': 'admin123'
    }
    
    try:
        login_response = requests.post(f'{BASE_URL}/auth/login/', json=login_data)
        if login_response.status_code == 200:
            token = login_response.json().get('access')
            headers = {'Authorization': f'Bearer {token}'}
            
            # Test Program creation with frontend field mappings
            program_data = {
                'title': 'Test Program',  # Frontend sends title → should map to name
                'description': 'Test program for API field mapping',
                'program_type': 'COMMITTEE',
                'session': 1,  # Assuming session with ID 1 exists
                'start_time': '09:00:00',
                'end_time': '17:00:00',
                'venue': 'Committee Room A',
                'scheduled_date': date.today().isoformat(),  # New field
                'end_date': date.today().isoformat(),  # New field
                'location': 'Parliament Building',  # New field
                'organizer': 1,  # New field
                'sub_center': 1,  # New field
                'is_active': True
            }
            
            program_response = requests.post(f'{BASE_URL}/programs/', json=program_data, headers=headers)
            print(f"Program Response Status: {program_response.status_code}")
            if program_response.status_code == 201:
                print("✅ Program created successfully!")
                print(f"Response: {program_response.json()}")
            else:
                print(f"❌ Program creation failed: {program_response.text}")
        else:
            print(f"❌ Login failed: {login_response.text}")
            
    except Exception as e:
        print(f"❌ Error testing Program: {e}")

if __name__ == '__main__':
    print("=== API Endpoint Field Mapping Tests ===")
    test_box_receipt_creation()
    test_parliament_session_creation()
    test_program_creation()
    print("\n=== Test Complete ===")
