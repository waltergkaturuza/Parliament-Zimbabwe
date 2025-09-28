#!/usr/bin/env python3
"""
Test fuel entitlements API endpoint to diagnose the 400 error
"""
import requests
import json

def test_fuel_entitlements_api():
    """Test the fuel entitlements API endpoint"""
    
    base_url = "https://parliament-zimbabwe.onrender.com/api/v1"
    
    print("🧪 TESTING FUEL ENTITLEMENTS API")
    print("=" * 50)
    
    # First test GET endpoint (should require authentication)
    print("\n1. Testing GET /fuel-entitlements/")
    try:
        response = requests.get(f"{base_url}/fuel-entitlements/", timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test POST endpoint (should show validation errors)
    print("\n2. Testing POST /fuel-entitlements/")
    test_data = {
        "beneficiary": "123",
        "entitlement_type": "MONTHLY",
        "litres_entitled": 100,
        "period_start": "2025-09-01",
        "period_end": "2025-09-30",
        "justification": "Test entitlement"
    }
    
    try:
        response = requests.post(
            f"{base_url}/fuel-entitlements/", 
            json=test_data,
            timeout=10,
            headers={"Content-Type": "application/json"}
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 400:
            print("\n   📋 Validation Errors:")
            try:
                errors = response.json()
                for field, error_list in errors.items():
                    if isinstance(error_list, list):
                        for error in error_list:
                            print(f"     - {field}: {error}")
                    else:
                        print(f"     - {field}: {error_list}")
            except:
                print(f"     Raw error: {response.text}")
                
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test GET stats endpoint
    print("\n3. Testing GET /fuel-entitlements/stats/")
    try:
        response = requests.get(f"{base_url}/fuel-entitlements/stats/", timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n" + "="*50)
    print("🎯 TESTING COMPLETE")

if __name__ == "__main__":
    test_fuel_entitlements_api()