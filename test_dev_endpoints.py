#!/usr/bin/env python3
"""
Test the development API endpoints
"""
import requests
import json

def test_endpoint(url, description):
    """Test a single endpoint"""
    print(f"\n=== Testing {description} ===")
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"Success! Data count: {len(data) if isinstance(data, list) else 'Not a list'}")
                if isinstance(data, list) and len(data) > 0:
                    print(f"Sample item: {json.dumps(data[0], indent=2)}")
                elif isinstance(data, dict):
                    print(f"Response: {json.dumps(data, indent=2)}")
                else:
                    print(f"Response: {data}")
                return True
            except json.JSONDecodeError:
                print(f"Response (not JSON): {response.text[:200]}")
                return False
        else:
            print(f"Error Response: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return False

def main():
    """Test all the endpoints"""
    base_url = "http://127.0.0.1:8000/api/v1"
    
    endpoints_to_test = [
        ("/subcenters/", "Subcenters List"),
        ("/beneficiaries/unique-categories/", "Unique Categories"),
        ("/beneficiaries/unique-parties/", "Unique Parties"),
    ]
    
    print("Testing API Endpoints...")
    
    success_count = 0
    total_count = len(endpoints_to_test)
    
    for endpoint, description in endpoints_to_test:
        url = base_url + endpoint
        if test_endpoint(url, description):
            success_count += 1
    
    print(f"\n=== Summary ===")
    print(f"Successful: {success_count}/{total_count}")
    print(f"Failed: {total_count - success_count}/{total_count}")

if __name__ == "__main__":
    main()