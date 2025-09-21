#!/usr/bin/env python3
"""
Test script for the bidirectional allocation API endpoint
"""
import requests
import json

def test_calculate_endpoint():
    """Test the /api/boxes/calculate/ endpoint"""
    base_url = "http://127.0.0.1:8000"
    endpoint = f"{base_url}/api/boxes/calculate/"
    
    # Test data for first-last mode
    test_data_first_last = {
        "coupon_amounts": [5, 10, 20, 25],
        "mode": "first-last",
        "serial_start": "FC001001",
        "serial_end": "FC001050"
    }
    
    # Test data for first-count mode
    test_data_first_count = {
        "coupon_amounts": [5, 10, 20, 25],
        "mode": "first-count",
        "serial_start": "FC001001",
        "book_count": 50
    }
    
    print("Testing bidirectional allocation API endpoint...")
    print("=" * 60)
    
    # Test first-last mode
    print("\n1. Testing first-last mode:")
    print(f"Request data: {json.dumps(test_data_first_last, indent=2)}")
    
    try:
        response = requests.post(endpoint, json=test_data_first_last)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")
    
    print("\n" + "-" * 40)
    
    # Test first-count mode
    print("\n2. Testing first-count mode:")
    print(f"Request data: {json.dumps(test_data_first_count, indent=2)}")
    
    try:
        response = requests.post(endpoint, json=test_data_first_count)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_calculate_endpoint()