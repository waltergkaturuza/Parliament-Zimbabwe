import requests
import json

# Test URL patterns
base_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"

print("🔍 CHECKING AVAILABLE ENDPOINTS")
print("=" * 60)

# Endpoints that should work with the new base URL setup
endpoints_to_test = [
    "/api/v1/users/",
    "/api/v1/subcenters/", 
    "/api/v1/auth/login/",
    "/api/v1/auth/register/",
    "/api/v1/analytics/",
    "/api/v1/dashboard/",
    "/api/v1/books/",
    "/api/v1/boxes/",
    "/api/v1/dispatches/",
    "/api/v1/audit/transactions/",
    "/api/v1/notifications/stats/",
    "/api/v1/fuel-requirements/",
]

print("Testing endpoints (expecting 401 for authenticated endpoints):")
print()

for endpoint in endpoints_to_test:
    try:
        response = requests.get(f"{base_url}{endpoint}", timeout=10)
        if response.status_code == 401:
            print(f"✅ {endpoint} - Authentication required (401) - WORKING")
        elif response.status_code == 200:
            print(f"✅ {endpoint} - Public endpoint working (200)")
        elif response.status_code == 404:
            print(f"❌ {endpoint} - Endpoint not found (404)")
        elif response.status_code == 405:
            print(f"⚠️  {endpoint} - Method not allowed (405) - Endpoint exists")
        else:
            print(f"⚠️  {endpoint} - Status {response.status_code}")
    except Exception as e:
        print(f"❌ {endpoint} - Error: {str(e)}")

print()
print("Summary: If endpoints show 401, the fix is working!")
print("If they show 404, there may be URL routing issues in Django.")
