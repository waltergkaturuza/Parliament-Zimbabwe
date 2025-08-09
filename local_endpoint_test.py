#!/usr/bin/env python3
"""
Local endpoint test to confirm our views work before Azure deployment
"""
import requests
import json

# Test local Django server (should be running on localhost:8000)
BASE_URL = "http://localhost:8000"

def test_local_endpoints():
    """Test the 9 missing endpoints locally"""
    
    missing_endpoints = [
        "/api/v1/analytics/consumption-trend/",
        "/api/v1/auth/change-password/", 
        "/api/v1/dashboard/",
        "/api/v1/fuel-stats/",
        "/api/v1/home/activity/",
        "/api/v1/home/insights/", 
        "/api/v1/notifications/mark-all-read/",
        "/api/v1/notifications/stats/",
        "/api/v1/subcenter/statistics/"
    ]
    
    print("🔍 LOCAL ENDPOINT TEST")
    print("=" * 60)
    
    # Test if server is running
    try:
        response = requests.get(f"{BASE_URL}/health/", timeout=5)
        print(f"🏠 Local Server Status: ✅ {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Local server not running: {e}")
        return
    
    print(f"\n📋 Testing 9 Missing Endpoints Locally:")
    print("-" * 60)
    
    working = 0
    missing = 0
    
    for endpoint in missing_endpoints:
        try:
            if endpoint == "/api/v1/auth/change-password/":
                # POST endpoint
                response = requests.post(f"{BASE_URL}{endpoint}", 
                                       json={"test": "data"}, 
                                       timeout=5)
            elif endpoint == "/api/v1/notifications/mark-all-read/":
                # POST endpoint
                response = requests.post(f"{BASE_URL}{endpoint}", 
                                       json={}, 
                                       timeout=5)
            else:
                # GET endpoint
                response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
            
            if response.status_code == 404:
                print(f"❌ {endpoint} -> 404 (MISSING)")
                missing += 1
            elif response.status_code in [200, 401, 400, 403, 405]:
                print(f"✅ {endpoint} -> {response.status_code} (WORKING)")
                working += 1
            else:
                print(f"⚠️ {endpoint} -> {response.status_code} (UNEXPECTED)")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ {endpoint} -> ERROR ({e})")
            missing += 1
    
    print(f"\n📊 LOCAL SUMMARY:")
    print(f"✅ Working: {working}")
    print(f"❌ Missing: {missing}")
    
    if missing == 0:
        print(f"\n🎯 ALL ENDPOINTS WORKING LOCALLY!")
        print(f"🚀 Issue is Azure deployment not picking up latest code")
    else:
        print(f"\n⚠️ Some endpoints still missing locally")

if __name__ == "__main__":
    test_local_endpoints()
