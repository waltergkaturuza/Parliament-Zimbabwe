#!/usr/bin/env python3
"""
Test script to verify CSRF fixes for beneficiary API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"

def test_endpoint(method, endpoint, data=None, headers=None):
    """Test an API endpoint and return the result"""
    if headers is None:
        headers = {'Content-Type': 'application/json'}
    
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
            print(f"   ✅ SUCCESS")
            if response.content:
                try:
                    content = response.json()
                    if isinstance(content, list):
                        print(f"   Response: List with {len(content)} items")
                    elif isinstance(content, dict):
                        print(f"   Response: Dict with keys: {list(content.keys())[:5]}")
                except:
                    print(f"   Response: {response.text[:100]}...")
        else:
            print(f"   ❌ ERROR")
            print(f"   Response: {response.text[:200]}...")
            
        return response
        
    except Exception as e:
        print(f"   ❌ EXCEPTION: {e}")
        return None

def main():
    print("🔧 Testing CSRF Fixes for Parliament Zimbabwe API")
    print("=" * 50)
    
    # Test the problematic endpoints first
    print("\n1️⃣ Testing SubCenter Endpoints (Previously failing)")
    test_endpoint('GET', '/subcenters/1/statistics/')
    test_endpoint('GET', '/subcenters/1/recent_activity/')
    
    print("\n2️⃣ Testing Beneficiary Endpoints (CSRF Issues)")
    test_endpoint('GET', '/beneficiaries/')
    
    # Test creating a beneficiary (this was giving 403 CSRF error)
    beneficiary_data = {
        "user": {
            "username": "test_beneficiary_123",
            "first_name": "Test",
            "last_name": "Beneficiary",
            "email": "test.beneficiary@parliament.gov.zw",
            "role": "BENEFICIARY"
        },
        "employee_id": "MP123456",
        "fuel_type": "PETROL",
        "monthly_entitlement_litres": 200,
        "category": 1,  # Assuming category ID 1 exists
        "constituency": 1,  # Assuming constituency ID 1 exists
        "vehicle_make": "Toyota",
        "vehicle_model": "Camry",
        "vehicle_year": 2020,
        "vehicle_registration": "TEST-123",
        "vehicle_category": 1  # Assuming vehicle category ID 1 exists
    }
    
    test_endpoint('POST', '/beneficiaries/', beneficiary_data)
    
    print("\n3️⃣ Testing Other Core Endpoints")
    test_endpoint('GET', '/users/')
    test_endpoint('GET', '/subcenters/')
    test_endpoint('GET', '/beneficiaries/categories/')
    test_endpoint('GET', '/constituencies/')
    
    print("\n🎯 CSRF Fix Test Complete!")
    print("If you see ✅ SUCCESS for the beneficiary POST request,")
    print("then the CSRF issue has been resolved!")

if __name__ == "__main__":
    main()
