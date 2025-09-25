#!/usr/bin/env python3
"""
Test local fuel entitlements API to verify our fixes
"""
import requests
import json

def test_entitlements_api():
    print("Testing local Fuel Entitlements API")
    print("=" * 50)
    
    base_url = "http://127.0.0.1:8000/api/v1"
    
    # Test fuel-entitlements endpoint
    try:
        url = f"{base_url}/fuel-entitlements/"
        print(f"Testing: {url}")
        
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response format: {type(data)}")
            
            if 'results' in data:
                results = data['results']
                print(f"Number of entitlements: {len(results)}")
                
                if results:
                    first_item = results[0]
                    print("First entitlement structure:")
                    print(f"  - beneficiary: {first_item.get('beneficiary', 'MISSING')}")
                    print(f"  - program: {first_item.get('program', 'MISSING')}")  
                    print(f"  - session: {first_item.get('session', 'MISSING')}")
                    print(f"  - entitlement_type: {first_item.get('entitlement_type', 'MISSING')}")
                else:
                    print("No entitlements found - creating test data might help")
            else:
                print("No 'results' field - might be different format or empty")
        
        elif response.status_code == 401:
            print("Authentication required - endpoint exists but needs login")
        else:
            print(f"Error response: {response.text}")
            
    except Exception as e:
        print(f"Error testing endpoint: {e}")

if __name__ == '__main__':
    test_entitlements_api()