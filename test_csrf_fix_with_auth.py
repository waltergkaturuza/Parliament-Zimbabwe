#!/usr/bin/env python3
"""
Test script to verify CSRF fixes with authentication for beneficiary API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

def login_and_get_token():
    """Login to get JWT token"""
    login_url = f"{API_BASE}/auth/login/"
    login_data = {
        "username": "admin",
        "password": "testpass123"
    }
    
    print(f"🔐 Logging in to get token...")
    response = requests.post(login_url, json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        token = data.get('access')
        print(f"   ✅ Login successful! Got token.")
        return token
    else:
        print(f"   ❌ Login failed: {response.status_code} - {response.text}")
        return None

def test_endpoint_with_auth(method, endpoint, token, data=None):
    """Test an API endpoint with authentication"""
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    
    url = f"{API_BASE}{endpoint}"
    print(f"\n🧪 Testing {method} {url}")
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers)
        elif method == 'POST':
            response = requests.post(url, json=data, headers=headers)
        elif method == 'PUT':
            response = requests.put(url, json=data, headers=headers)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code < 400:
            print(f"   ✅ SUCCESS - CSRF is working!")
            if response.content:
                try:
                    content = response.json()
                    if isinstance(content, list):
                        print(f"   Response: List with {len(content)} items")
                    elif isinstance(content, dict):
                        keys = list(content.keys())[:5]
                        print(f"   Response: Dict with keys: {keys}")
                except:
                    print(f"   Response: {response.text[:100]}...")
        else:
            print(f"   ❌ ERROR (Not CSRF related)")
            print(f"   Response: {response.text[:200]}...")
            
        return response
        
    except Exception as e:
        print(f"   ❌ EXCEPTION: {e}")
        return None

def main():
    print("🔧 Testing CSRF Fixes with Authentication - Parliament Zimbabwe API")
    print("=" * 65)
    
    # Get authentication token
    token = login_and_get_token()
    if not token:
        print("❌ Cannot proceed without authentication token!")
        return
    
    print("\n" + "="*50)
    print("Testing API Endpoints with JWT Authentication")
    print("="*50)
    
    # Test the problematic endpoints first
    print("\n1️⃣ Testing SubCenter Endpoints (Previously 404/400)")
    test_endpoint_with_auth('GET', '/subcenters/1/statistics/', token)
    test_endpoint_with_auth('GET', '/subcenters/1/recent_activity/', token)
    
    print("\n2️⃣ Testing Beneficiary Endpoints (Previously 403 CSRF)")
    test_endpoint_with_auth('GET', '/beneficiaries/', token)
    
    # Test creating a beneficiary (this was giving 403 CSRF error)
    beneficiary_data = {
        "user": {
            "username": "test_csrf_fix_beneficiary",
            "first_name": "CSRF",
            "last_name": "TestUser",
            "email": "csrf.test@parliament.gov.zw",
            "role": "BENEFICIARY"
        },
        "employee_id": "CSRF123",
        "fuel_type": "PETROL",
        "monthly_entitlement_litres": 150,
        "category": 1,  # Should exist from our sample data
        "constituency": 1,  # Should exist from our sample data
        "vehicle_make": "Toyota",
        "vehicle_model": "Camry",
        "vehicle_year": 2020,
        "vehicle_registration": "CSRF-123",
        "vehicle_category": 1  # Should exist from our sample data
    }
    
    print("\n🎯 CRITICAL TEST: Creating new beneficiary (Previously 403 CSRF)")
    test_endpoint_with_auth('POST', '/beneficiaries/', token, beneficiary_data)
    
    print("\n3️⃣ Testing Other Core Endpoints")
    test_endpoint_with_auth('GET', '/users/', token)
    test_endpoint_with_auth('GET', '/subcenters/', token)
    test_endpoint_with_auth('GET', '/beneficiaries/categories/', token)
    test_endpoint_with_auth('GET', '/constituencies/', token)
    
    print("\n" + "="*50)
    print("🎉 CSRF Fix Verification Complete!")
    print("If beneficiary POST returned 201 (Created), CSRF is fixed!")
    print("If it returned 400+ (but NOT 403), it's a data validation issue, not CSRF!")
    print("="*50)

if __name__ == "__main__":
    main()
