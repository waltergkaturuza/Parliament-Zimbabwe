#!/usr/bin/env python3
"""
Test script to verify API endpoints are working after BoxViewSet fix
"""

import requests
import json
import sys

# Your Azure app URL
BASE_URL = "https://fuelcouponpos.azurewebsites.net"

def test_endpoint(endpoint, description):
    """Test a specific API endpoint"""
    url = f"{BASE_URL}{endpoint}"
    print(f"\nTesting {description}...")
    print(f"URL: {url}")
    
    try:
        response = requests.get(url, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS - Endpoint is working!")
            try:
                data = response.json()
                if isinstance(data, dict):
                    print(f"Response contains {len(data)} keys")
                elif isinstance(data, list):
                    print(f"Response contains {len(data)} items")
                else:
                    print("Response is valid JSON")
            except:
                print("Response is not JSON")
        elif response.status_code == 500:
            print("❌ ERROR - Still getting 500 Internal Server Error")
            print(f"Response: {response.text[:200]}...")
        else:
            print(f"⚠️  WARNING - Got status code {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT - Request timed out")
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR - Could not connect to server")
    except Exception as e:
        print(f"❌ ERROR - {str(e)}")

def main():
    print("🔍 Testing API endpoints after BoxViewSet fix...")
    print("=" * 60)
    
    # Test the main endpoints that were previously failing
    endpoints_to_test = [
        ("/api/v1/boxes/", "Boxes API (was returning 500)"),
        ("/api/v1/analytics/", "Analytics API"),
        ("/api/v1/parliament-managers/", "Parliament Managers API"),
        ("/admin/", "Django Admin (should work now)"),
        ("/", "Main site")
    ]
    
    for endpoint, description in endpoints_to_test:
        test_endpoint(endpoint, description)
    
    print("\n" + "=" * 60)
    print("🏁 API testing complete!")
    print("\nIf you see ✅ SUCCESS for the Boxes API, the fix worked!")
    print("If you still see ❌ ERROR (500), we may need additional fixes.")

if __name__ == "__main__":
    main()
