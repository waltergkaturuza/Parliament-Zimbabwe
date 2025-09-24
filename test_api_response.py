#!/usr/bin/env python3
"""
Quick test script to check API response structure for beneficiaries and fuel dispatches
"""

import requests
import json
from urllib.parse import urljoin

# Configuration
BASE_URL = "https://parliament-zimbabwe.onrender.com/api/v1/"
BENEFICIARIES_ENDPOINT = "beneficiaries/"
FUEL_DISPATCHES_ENDPOINT = "fuel-dispatches/"

def test_api_endpoint(endpoint, description):
    """Test an API endpoint and show response structure"""
    print(f"\n{'='*60}")
    print(f"Testing {description}")
    print(f"Endpoint: {endpoint}")
    print(f"{'='*60}")
    
    try:
        url = urljoin(BASE_URL, endpoint)
        print(f"Making request to: {url}")
        
        response = requests.get(url, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            if 'results' in data:
                items = data['results']
                total_count = data.get('count', len(items))
                print(f"Total items: {total_count}")
                print(f"Items in current page: {len(items)}")
                
                if items:
                    print(f"\nFirst item structure:")
                    first_item = items[0]
                    for key, value in first_item.items():
                        value_preview = str(value)[:50] + ('...' if len(str(value)) > 50 else '')
                        print(f"  {key}: {value_preview}")
                else:
                    print("No items found in results")
            else:
                # Single object response
                print(f"Response data keys: {list(data.keys())}")
                for key, value in data.items():
                    value_preview = str(value)[:50] + ('...' if len(str(value)) > 50 else '')
                    print(f"  {key}: {value_preview}")
                    
        elif response.status_code == 401:
            print("Authentication required - this is expected for production API")
        elif response.status_code == 404:
            print("Endpoint not found - check URL")
        else:
            print(f"Error response: {response.text[:200]}")
            
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON response: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

def main():
    """Test both beneficiaries and fuel dispatches endpoints"""
    print("Testing Parliament Fuel System API Endpoints")
    print("This will check the structure of API responses for debugging frontend issues")
    
    # Test beneficiaries endpoint
    test_api_endpoint(BENEFICIARIES_ENDPOINT, "Beneficiaries API")
    
    # Test fuel dispatches endpoint
    test_api_endpoint(FUEL_DISPATCHES_ENDPOINT, "Fuel Dispatches API")
    
    print(f"\n{'='*60}")
    print("Summary:")
    print("- Beneficiaries should have: first_name, last_name, name fields")
    print("- Fuel Dispatches should have: beneficiary, liters_dispensed, coupon_number fields")
    print("If authentication is required, the fixes should still be visible once logged in")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()