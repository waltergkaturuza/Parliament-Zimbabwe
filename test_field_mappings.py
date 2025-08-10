#!/usr/bin/env python
"""
API Field Mapping Validation Test
Tests that our frontend-backend field mappings are working correctly
"""
import requests
import json
from datetime import date, datetime

# Configuration
API_BASE = 'http://127.0.0.1:8000/api/v1'
LOGIN_ENDPOINT = f'{API_BASE}/auth/login/'

def login_and_get_token():
    """Login and get authentication token"""
    login_data = {
        'username': 'admin',
        'password': 'password123'
    }
    
    try:
        response = requests.post(LOGIN_ENDPOINT, json=login_data)
        if response.status_code == 200:
            return response.json().get('access')
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_box_receipt_api():
    """Test Box Receipt API with frontend field mappings"""
    print("\n📦 Testing Box Receipt API...")
    
    token = login_and_get_token()
    if not token:
        return False
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test data using frontend field names
    test_data = {
        'couponAmount': 20,  # Frontend → denomination
        'monetaryValueUSD': 15.50,  # Frontend → monetary_value_usd
        'fuelPricePerLitreUSD': 0.78,  # Frontend → fuel_price_per_litre_usd
        'exchangeRate': 1.25,  # Frontend → exchange_rate
        'number_of_coupons': 100,
        'total_litres': 2000,
        'box_date': date.today().isoformat(),
        'sub_center': 1,
        'notes': 'Test box receipt from field mapping validation'
    }
    
    try:
        response = requests.post(f'{API_BASE}/box-receipts/', json=test_data, headers=headers)
        if response.status_code == 201:
            print("✅ Box Receipt API working - field mappings successful!")
            result = response.json()
            print(f"   Created box with ID: {result.get('id')}")
            print(f"   Denomination: {result.get('denomination')}")
            print(f"   Monetary Value USD: {result.get('monetary_value_usd')}")
            return True
        else:
            print(f"❌ Box Receipt API failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Box Receipt API error: {e}")
        return False

def test_parliament_session_api():
    """Test Parliament Session API with frontend field mappings"""
    print("\n🏛️ Testing Parliament Session API...")
    
    token = login_and_get_token()
    if not token:
        return False
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test data using frontend field names
    test_data = {
        'title': 'Test Parliamentary Session',
        'session_type': 'REGULAR',
        'start_date': date.today().isoformat(),
        'end_date': date.today().isoformat(),
        'description': 'Test session for field mapping validation',
        'venue': 'Parliament Main Chamber',
        'fuel_entitlement_litres': 150.0,
        'is_mandatory': True,
        'session_manager': 1,  # Frontend → organizer
        'managing_subcenter': 1,
        'is_active': True
    }
    
    try:
        response = requests.post(f'{API_BASE}/parliament-sessions/', json=test_data, headers=headers)
        if response.status_code == 201:
            print("✅ Parliament Session API working - field mappings successful!")
            result = response.json()
            print(f"   Created session with ID: {result.get('id')}")
            print(f"   Title: {result.get('title')}")
            print(f"   Organizer: {result.get('organizer')}")
            return True
        else:
            print(f"❌ Parliament Session API failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Parliament Session API error: {e}")
        return False

def test_program_api():
    """Test Program API with frontend field mappings"""
    print("\n📋 Testing Program API...")
    
    token = login_and_get_token()
    if not token:
        return False
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test data using frontend field names
    test_data = {
        'title': 'Test Program',  # Frontend → name
        'description': 'Test program for field mapping validation',
        'program_type': 'COMMITTEE',
        'start_time': '09:00:00',
        'end_time': '17:00:00',
        'venue': 'Committee Room A',
        'scheduled_date': date.today().isoformat(),
        'end_date': date.today().isoformat(),
        'location': 'Parliament Building',
        'organizer': 1,
        'sub_center': 1,
        'is_active': True
    }
    
    try:
        response = requests.post(f'{API_BASE}/programs/', json=test_data, headers=headers)
        if response.status_code == 201:
            print("✅ Program API working - field mappings successful!")
            result = response.json()
            print(f"   Created program with ID: {result.get('id')}")
            print(f"   Name: {result.get('name')}")
            print(f"   Title: {result.get('title')}")
            return True
        else:
            print(f"❌ Program API failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Program API error: {e}")
        return False

def test_user_registration_api():
    """Test User Registration API"""
    print("\n👤 Testing User Registration API...")
    
    # Test data using frontend field names
    test_data = {
        'username': f'testuser_{int(datetime.now().timestamp())}',
        'email': 'testuser@example.com',
        'first_name': 'Test',
        'last_name': 'User',
        'phone': '+263123456789',
        'password': 'testpassword123',
        'password2': 'testpassword123',
        'role': 'SUB_CENTER',
        'sub_center': 1,
        'registration_justification': 'Test user for field mapping validation'
    }
    
    try:
        response = requests.post(f'{API_BASE}/auth/register/', json=test_data)
        if response.status_code == 201:
            print("✅ User Registration API working!")
            result = response.json()
            print(f"   Created user: {result.get('username')}")
            return True
        else:
            print(f"❌ User Registration API failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ User Registration API error: {e}")
        return False

def run_comprehensive_api_tests():
    """Run all API tests"""
    print("🧪 COMPREHENSIVE API FIELD MAPPING TESTS")
    print("=" * 50)
    
    tests = [
        test_box_receipt_api,
        test_parliament_session_api,
        test_program_api,
        test_user_registration_api
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("\n" + "=" * 50)
    print(f"📊 TEST RESULTS: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL FIELD MAPPINGS ARE WORKING CORRECTLY!")
        print("✅ Frontend forms should now submit successfully without 'bad request' errors")
    else:
        print("⚠️  Some field mappings need attention")
    
    return passed == total

if __name__ == '__main__':
    run_comprehensive_api_tests()
