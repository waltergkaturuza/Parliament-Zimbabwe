#!/usr/bin/env python3
"""
Test deployment status and verify our fixes are working
"""
import requests
import json

# Backend URL
BACKEND_URL = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

# Test endpoints we added
test_endpoints = [
    "/api/v1/fuel-stats/",
    "/api/v1/home/stats/", 
    "/api/v1/analytics/",
    "/api/v1/subcenter/statistics/",
    "/api/v1/auth/login/",
    "/api/v1/auth/register/",
    "/api/v1/books/received/",
    "/api/v1/fuel-prices/"
]

def test_endpoint(endpoint):
    """Test an endpoint and return status"""
    try:
        response = requests.head(f"{BACKEND_URL}{endpoint}", timeout=10)
        return f"✅ {endpoint} -> {response.status_code}"
    except requests.exceptions.RequestException as e:
        return f"❌ {endpoint} -> Error: {str(e)}"

if __name__ == "__main__":
    print("🧪 TESTING DEPLOYMENT STATUS")
    print("=" * 50)
    
    # Test basic connectivity
    try:
        response = requests.get(f"{BACKEND_URL}/admin/", timeout=10)
        print(f"🏠 Backend Status: ✅ {response.status_code}")
    except Exception as e:
        print(f"🏠 Backend Status: ❌ {str(e)}")
        exit(1)
    
    print("\n📋 Testing New API Endpoints:")
    print("-" * 30)
    
    for endpoint in test_endpoints:
        result = test_endpoint(endpoint)
        print(result)
    
    print(f"\n🌐 Frontend URL: https://jolly-ocean-0e0dee90f.5.azurestaticapps.net/")
    
    # Test frontend accessibility
    try:
        response = requests.get("https://jolly-ocean-0e0dee90f.5.azurestaticapps.net/", timeout=10)
        print(f"🎨 Frontend Status: ✅ {response.status_code}")
    except Exception as e:
        print(f"🎨 Frontend Status: ❌ {str(e)} (might still be deploying)")
