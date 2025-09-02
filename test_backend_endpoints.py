#!/usr/bin/env python3
# Backend endpoint test script
import requests
import json

BASE_URL = "https://parliament-zimbabwe.onrender.com"

# Test endpoints
endpoints = [
    "/api/v1/fuel/books/",
    "/api/v1/fuel/books/available_for_dispatch/",
    "/api/v1/fuel/subcenters/",
    "/api/v1/fuel/boxes/",
    "/api/v1/analytics/",
    "/api/v1/auth/login/",
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
    print("Testing backend endpoints...")
    print(f"Base URL: {BASE_URL}")
    print("-" * 50)
    
    for endpoint in endpoints:
        result = test_endpoint(endpoint)
        status_icon = "✅" if result['accessible'] else "❌"
        print(f"{status_icon} {result['endpoint']} - {result['status']} {result['reason']}")
    
    print("-" * 50)
    print("Note: 401 Unauthorized is expected for protected endpoints")
    print("404 Not Found indicates missing/broken endpoints")
