#!/usr/bin/env python3
"""
Comprehensive endpoint testing for all API calls used by frontend
"""
import requests
import json

# Backend URL
BACKEND_URL = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

# Comprehensive list of endpoints from frontend analysis
test_endpoints = [
    # Authentication
    "/api/v1/auth/login/",
    "/api/v1/auth/register/", 
    "/api/v1/auth/change-password/",
    
    # Admin and Dashboard
    "/api/v1/admin/dashboard/",
    "/api/v1/dashboard/",
    
    # Fuel and Statistics
    "/api/v1/fuel-stats/",
    "/api/v1/fuel-prices/",
    "/api/v1/statistics/",
    
    # Home endpoints
    "/api/v1/home/stats/",
    "/api/v1/home/activity/",
    "/api/v1/home/health/",
    "/api/v1/home/insights/",
    
    # Analytics
    "/api/v1/analytics/",
    "/api/v1/analytics/fuel-requirements/",
    "/api/v1/analytics/consumption-trend/",
    
    # Subcenter endpoints
    "/api/v1/subcenter/statistics/",
    "/api/v1/subcenter/overview/",
    "/api/v1/subcenters/",
    
    # Core resources (DRF ViewSets)
    "/api/v1/users/",
    "/api/v1/boxes/",
    "/api/v1/books/",
    "/api/v1/books/received/",
    "/api/v1/coupons/",
    "/api/v1/dispatches/",
    "/api/v1/allocations/",
    
    # Notifications
    "/api/v1/notifications/stats/",
    "/api/v1/notifications/mark-all-read/",
]

def test_endpoint(endpoint):
    """Test an endpoint and return detailed status"""
    try:
        response = requests.head(f"{BACKEND_URL}{endpoint}", timeout=10)
        if response.status_code == 200:
            return f"✅ {endpoint} -> {response.status_code} (Working)"
        elif response.status_code == 401:
            return f"🔒 {endpoint} -> {response.status_code} (Protected - Auth Required)"
        elif response.status_code == 405:
            return f"📝 {endpoint} -> {response.status_code} (Exists - Method Not Allowed)"
        elif response.status_code == 404:
            return f"❌ {endpoint} -> {response.status_code} (MISSING - Need to implement)"
        elif response.status_code == 403:
            return f"🚫 {endpoint} -> {response.status_code} (Forbidden)"
        else:
            return f"⚠️ {endpoint} -> {response.status_code} (Unexpected)"
    except requests.exceptions.RequestException as e:
        return f"💥 {endpoint} -> Error: {str(e)}"

if __name__ == "__main__":
    print("🔍 COMPREHENSIVE ENDPOINT ANALYSIS")
    print("=" * 60)
    
    # Test basic connectivity
    try:
        response = requests.get(f"{BACKEND_URL}/admin/", timeout=10)
        print(f"🏠 Backend Status: ✅ {response.status_code}")
    except Exception as e:
        print(f"🏠 Backend Status: ❌ {str(e)}")
        exit(1)
    
    print(f"\n📋 Testing {len(test_endpoints)} Frontend API Endpoints:")
    print("-" * 60)
    
    missing_endpoints = []
    working_endpoints = []
    protected_endpoints = []
    
    for endpoint in sorted(test_endpoints):
        result = test_endpoint(endpoint)
        print(result)
        
        if "MISSING" in result:
            missing_endpoints.append(endpoint)
        elif "Working" in result or "Protected" in result or "Method Not Allowed" in result:
            working_endpoints.append(endpoint)
    
    print(f"\n📊 SUMMARY:")
    print(f"✅ Working/Protected: {len(working_endpoints)}")
    print(f"❌ Missing: {len(missing_endpoints)}")
    
    if missing_endpoints:
        print(f"\n🛠️ ENDPOINTS TO IMPLEMENT:")
        for endpoint in missing_endpoints:
            print(f"   - {endpoint}")
