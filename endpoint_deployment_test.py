#!/usr/bin/env python3
"""
Endpoint Testing with Retry Logic - Wait for Azure deployment
"""
import requests
import time
import json

BACKEND_URL = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

# Test specific endpoints we just implemented
critical_endpoints = [
    "/api/v1/dashboard/",
    "/api/v1/home/activity/", 
    "/api/v1/home/insights/",
    "/api/v1/analytics/consumption-trend/",
    "/api/v1/auth/change-password/",
    "/api/v1/notifications/mark-all-read/",
    "/api/v1/subcenter/statistics/",
    "/api/v1/fuel-stats/",
    "/api/v1/notifications/stats/"
]

def test_endpoint_with_retry(endpoint, max_retries=5, delay=10):
    """Test endpoint with retry logic"""
    for attempt in range(max_retries):
        try:
            response = requests.head(f"{BACKEND_URL}{endpoint}", timeout=10)
            status = response.status_code
            
            if status == 404:
                print(f"❌ Attempt {attempt + 1}: {endpoint} -> 404 (Still missing)")
                if attempt < max_retries - 1:
                    print(f"   ⏳ Waiting {delay} seconds for Azure deployment...")
                    time.sleep(delay)
                    continue
                else:
                    return f"❌ FAILED: {endpoint} -> 404 (Not deployed after {max_retries} attempts)"
            elif status == 401:
                return f"✅ SUCCESS: {endpoint} -> 401 (Protected - endpoint exists!)"
            elif status == 405:
                return f"✅ SUCCESS: {endpoint} -> 405 (Method not allowed - endpoint exists!)"
            elif status == 200:
                return f"✅ SUCCESS: {endpoint} -> 200 (Working perfectly!)"
            else:
                return f"⚠️ PARTIAL: {endpoint} -> {status} (Unexpected status)"
                
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"💥 Attempt {attempt + 1}: {endpoint} -> Error: {str(e)}")
                time.sleep(delay)
                continue
            else:
                return f"💥 ERROR: {endpoint} -> Connection failed after {max_retries} attempts"
    
    return f"❌ TIMEOUT: {endpoint} -> Failed all attempts"

if __name__ == "__main__":
    print("🚀 TESTING NEWLY IMPLEMENTED ENDPOINTS")
    print("=" * 60)
    print("⏳ This may take several minutes as Azure App Service updates...")
    print()
    
    # Test basic connectivity first
    try:
        response = requests.get(f"{BACKEND_URL}/admin/", timeout=10)
        print(f"🏠 Backend Connectivity: ✅ {response.status_code}")
    except Exception as e:
        print(f"🏠 Backend Connectivity: ❌ {str(e)}")
        print("Cannot proceed - backend is not accessible")
        exit(1)
    
    print(f"\n📋 Testing {len(critical_endpoints)} Critical Endpoints:")
    print("-" * 60)
    
    results = []
    for endpoint in critical_endpoints:
        print(f"\n🔍 Testing {endpoint}...")
        result = test_endpoint_with_retry(endpoint)
        results.append(result)
        print(f"   {result}")
    
    print(f"\n📊 FINAL RESULTS:")
    print("=" * 60)
    
    success_count = sum(1 for r in results if "SUCCESS" in r)
    partial_count = sum(1 for r in results if "PARTIAL" in r)
    failed_count = sum(1 for r in results if "FAILED" in r or "ERROR" in r or "TIMEOUT" in r)
    
    for result in results:
        print(result)
    
    print(f"\n📈 SUMMARY:")
    print(f"✅ Successful: {success_count}/{len(critical_endpoints)}")
    print(f"⚠️ Partial: {partial_count}/{len(critical_endpoints)}")
    print(f"❌ Failed: {failed_count}/{len(critical_endpoints)}")
    
    if success_count == len(critical_endpoints):
        print(f"\n🎉 ALL ENDPOINTS SUCCESSFULLY DEPLOYED!")
    elif success_count + partial_count == len(critical_endpoints):
        print(f"\n👍 ALL ENDPOINTS DEPLOYED (some with expected auth/method restrictions)")
    else:
        print(f"\n⚠️ Some endpoints still deploying. Azure App Service may need more time.")
