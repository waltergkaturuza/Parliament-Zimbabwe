#!/usr/bin/env python3
"""
Focused test for the specific API endpoints that are failing
"""

import requests
import json

AZURE_BASE_URL = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

# Endpoints that are returning 500 errors according to frontend logs
FAILING_ENDPOINTS = [
    "/api/v1/analytics/fuel-requirements/",
    "/api/v1/analytics/consumption-trend/?days=30",
    "/api/v1/books/received/",
    "/api/v1/analytics/",
]

# Endpoints that are returning 404 errors
MISSING_ENDPOINTS = [
    "/users/?role=MAIN_CENTER,SUB_CENTER",
    "/sub-centers/",
    "/programs/",
    "/users/?role__in=MAIN_CENTER,SUB_CENTER",
    "/financial-analytics/?start_date=2025-07-11&end_date=2025-08-10",
    "/analytics/?start_date=2025-07-11&end_date=2025-08-10",
    "/subcenters/",
    "/users/stats/",
    "/users/?page_size=50",
    "/users/me/",
    "/audit/transactions/?",
    "/audit/transaction-stats/",
]

def test_endpoint_detailed(endpoint, with_auth=True):
    """Test endpoint with detailed error reporting"""
    url = f"{AZURE_BASE_URL}{endpoint}"
    headers = {'Content-Type': 'application/json'}
    
    # Test without auth first
    try:
        response = requests.get(url, headers=headers, timeout=15)
        print(f"\n🔍 Testing: {endpoint}")
        print(f"   Status: {response.status_code}")
        print(f"   Content-Type: {response.headers.get('content-type', 'N/A')}")
        
        if response.status_code == 500:
            print(f"   🔥 500 ERROR DETAILS:")
            try:
                error_data = response.json()
                print(f"      Error: {error_data}")
            except:
                print(f"      Raw Content: {response.text[:200]}...")
        elif response.status_code == 404:
            print(f"   ❌ 404 - Endpoint does not exist")
        elif response.status_code == 401:
            print(f"   🔒 401 - Authentication required")
        elif response.status_code == 200:
            print(f"   ✅ 200 - Working")
            try:
                data = response.json()
                print(f"      Response keys: {list(data.keys()) if isinstance(data, dict) else 'List/Other'}")
            except:
                print(f"      Non-JSON response")
        else:
            print(f"   ⚠️  Other status: {response.status_code}")
        
        return response.status_code
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Connection Error for {endpoint}: {e}")
        return None

def main():
    print("🔥 DETAILED ERROR ANALYSIS")
    print("=" * 60)
    
    print("\n📋 TESTING ENDPOINTS WITH 500 ERRORS:")
    for endpoint in FAILING_ENDPOINTS:
        test_endpoint_detailed(endpoint)
    
    print("\n📋 TESTING ENDPOINTS WITH 404 ERRORS:")
    for endpoint in MISSING_ENDPOINTS:
        test_endpoint_detailed(endpoint)
    
    # Test key working endpoints for comparison
    print("\n📋 TESTING KNOWN WORKING ENDPOINTS:")
    working_endpoints = ["/", "/api/v1/", "/api/v1/home/stats/"]
    for endpoint in working_endpoints:
        test_endpoint_detailed(endpoint)
    
    print("\n" + "=" * 60)
    print("Analysis complete. Check the details above to identify specific issues.")

if __name__ == "__main__":
    main()
