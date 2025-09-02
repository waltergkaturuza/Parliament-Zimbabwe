#!/usr/bin/env python3
# Test correct backend endpoint paths
import requests

BASE_URL = "https://parliament-zimbabwe.onrender.com"

# Test endpoints without /fuel/ prefix
endpoints = [
    "/api/v1/books/",
    "/api/v1/books/available_for_dispatch/",
    "/api/v1/subcenters/",
    "/api/v1/boxes/",
]

def test_endpoint(endpoint):
    """Test an endpoint and return the response status"""
    try:
        url = BASE_URL + endpoint
        response = requests.get(url, timeout=10)
        return {
            'endpoint': endpoint,
            'status': response.status_code,
            'reason': response.reason,
            'accessible': response.status_code not in [404, 500]
        }
    except Exception as e:
        return {
            'endpoint': endpoint,
            'status': 'ERROR',
            'reason': str(e),
            'accessible': False
        }

if __name__ == "__main__":
    print("Testing correct backend endpoint paths...")
    print(f"Base URL: {BASE_URL}")
    print("-" * 60)
    
    for endpoint in endpoints:
        result = test_endpoint(endpoint)
        status_icon = "✅" if result['accessible'] else "❌"
        print(f"{status_icon} {result['endpoint']} - {result['status']} {result['reason']}")
    
    print("-" * 60)
    print("Note: 401 Unauthorized is expected for protected endpoints")
    print("404 Not Found indicates missing/broken endpoints")
