#!/usr/bin/env python3
"""
Comprehensive endpoint testing for all API calls used by frontend
"""
import requests
import json

# Backend URL
BACKEND_URL = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

# Comprehensive list of endpoints with appropriate HTTP methods
test_endpoints = [
    # Authentication (POST endpoints)
    ("/api/v1/auth/login/", "POST"),
    ("/api/v1/auth/register/", "POST"), 
    ("/api/v1/auth/change-password/", "POST"),
    
    # Admin and Dashboard (GET endpoints)
    ("/api/v1/admin/dashboard/", "GET"),
    ("/api/v1/dashboard/", "GET"),
    
    # Fuel and Statistics (GET endpoints)
    ("/api/v1/fuel-stats/", "GET"),
    ("/api/v1/fuel-prices/", "GET"),
    ("/api/v1/statistics/", "GET"),
    
    # Home endpoints (GET endpoints)
    ("/api/v1/home/stats/", "GET"),
    ("/api/v1/home/activity/", "GET"),
    ("/api/v1/home/health/", "GET"),
    ("/api/v1/home/insights/", "GET"),
    
    # Analytics (GET endpoints)
    ("/api/v1/analytics/", "GET"),
    ("/api/v1/analytics/fuel-requirements/", "GET"),
    ("/api/v1/analytics/consumption-trend/", "GET"),
    
    # Subcenter endpoints (GET endpoints)
    ("/api/v1/subcenter/statistics/", "GET"),
    ("/api/v1/subcenter/overview/", "GET"),
    ("/api/v1/subcenters/", "GET"),
    
    # Core resources (DRF ViewSets - GET for list views)
    ("/api/v1/users/", "GET"),
    ("/api/v1/boxes/", "GET"),
    ("/api/v1/books/", "GET"),
    ("/api/v1/books/received/", "GET"),
    ("/api/v1/coupons/", "GET"),
    ("/api/v1/dispatches/", "GET"),
    ("/api/v1/allocations/", "GET"),
    
    # Notifications (GET for stats, POST for mark-all-read)
    ("/api/v1/notifications/stats/", "GET"),
    ("/api/v1/notifications/mark-all-read/", "POST"),
]

def test_endpoint(endpoint, method="GET"):
    """Test an endpoint with the appropriate HTTP method and return detailed status"""
    try:
        # Use the specified HTTP method
        if method == "GET":
            response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=10)
        elif method == "POST":
            # For POST endpoints, send minimal valid JSON to avoid validation errors
            response = requests.post(f"{BACKEND_URL}{endpoint}", 
                                   json={}, 
                                   headers={'Content-Type': 'application/json'},
                                   timeout=10)
        elif method == "HEAD":
            response = requests.head(f"{BACKEND_URL}{endpoint}", timeout=10)
        else:
            # Fallback to GET
            response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=10)
            
        if response.status_code == 200:
            return f"✅ {method} {endpoint} -> {response.status_code} (Working)"
        elif response.status_code == 401:
            return f"🔒 {method} {endpoint} -> {response.status_code} (Protected - Auth Required)"
        elif response.status_code == 405:
            return f"📝 {method} {endpoint} -> {response.status_code} (Method Not Allowed)"
        elif response.status_code == 404:
            return f"❌ {method} {endpoint} -> {response.status_code} (MISSING - Need to implement)"
        elif response.status_code == 403:
            return f"🚫 {method} {endpoint} -> {response.status_code} (Forbidden)"
        elif response.status_code == 400:
            return f"⚠️ {method} {endpoint} -> {response.status_code} (Bad Request - likely needs auth/data)"
        else:
            return f"⚠️ {method} {endpoint} -> {response.status_code} (Unexpected)"
    except requests.exceptions.RequestException as e:
        return f"💥 {method} {endpoint} -> Error: {str(e)}"

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
    
    for endpoint_info in sorted(test_endpoints):
        if isinstance(endpoint_info, tuple):
            endpoint, method = endpoint_info
        else:
            # Backward compatibility for old format
            endpoint, method = endpoint_info, "GET"
            
        result = test_endpoint(endpoint, method)
        print(result)
        
        if "MISSING" in result:
            missing_endpoints.append(endpoint)
        elif "Working" in result or "Protected" in result or "Bad Request" in result:
            working_endpoints.append(endpoint)
    
    print(f"\n📊 SUMMARY:")
    print(f"✅ Working/Protected: {len(working_endpoints)}")
    print(f"❌ Missing: {len(missing_endpoints)}")
    
    if missing_endpoints:
        print(f"\n🛠️ ENDPOINTS TO IMPLEMENT:")
        for endpoint in missing_endpoints:
            print(f"   - {endpoint}")
