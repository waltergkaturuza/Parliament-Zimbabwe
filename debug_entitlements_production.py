#!/usr/bin/env python3
"""
Debug script to identify the exact cause of production entitlement creation issues
"""

import requests
import json
from datetime import datetime

# Production API configuration
PRODUCTION_API_URL = "https://parliament-zimbabwe.onrender.com/api/v1"
FRONTEND_URL = "https://parliament-zimbabwe-fuel.onrender.com"

def test_fuel_entitlements_endpoint():
    """Test the fuel-entitlements endpoint with different approaches"""
    print(f"🔍 Testing Fuel Entitlements Endpoint...")
    print(f"API Base URL: {PRODUCTION_API_URL}")
    print(f"Frontend URL: {FRONTEND_URL}")
    print("=" * 60)
    
    # Test 1: GET request to fuel-entitlements endpoint (should require auth)
    print("1. Testing GET /fuel-entitlements/ (unauthenticated)")
    try:
        response = requests.get(f"{PRODUCTION_API_URL}/fuel-entitlements/", timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        if response.status_code == 404:
            print("   ❌ Endpoint not found - URL routing issue")
        elif response.status_code == 401:
            print("   ✅ Endpoint exists but requires authentication")
        elif response.status_code == 200:
            print("   ⚠️  Endpoint accessible without authentication")
        else:
            print(f"   ⚠️  Unexpected status: {response.status_code}")
        
        if response.content:
            try:
                data = response.json()
                print(f"   Response: {json.dumps(data, indent=2)[:200]}...")
            except:
                print(f"   Raw response: {response.text[:200]}...")
    except requests.exceptions.ConnectionError as e:
        print(f"   ❌ Connection error: {e}")
    except requests.exceptions.Timeout:
        print(f"   ❌ Request timeout")
    except Exception as e:
        print(f"   ❌ Unexpected error: {e}")
    
    print()
    
    # Test 2: Test API root endpoint
    print("2. Testing API root endpoint")
    try:
        response = requests.get(f"{PRODUCTION_API_URL}/", timeout=10)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            try:
                data = response.json()
                if 'fuel-entitlements' in str(data):
                    print("   ✅ fuel-entitlements found in API root")
                else:
                    print("   ⚠️  fuel-entitlements not listed in API root")
            except:
                print(f"   Raw response: {response.text[:200]}...")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    
    # Test 3: Test different URL variations
    variations = [
        f"{PRODUCTION_API_URL}/fuel-entitlements/",
        f"{PRODUCTION_API_URL}/fuelentitlements/",
        f"{PRODUCTION_API_URL}/fuel_entitlements/",
        "https://parliament-zimbabwe.onrender.com/fuel-entitlements/",
        "https://parliament-zimbabwe.onrender.com/api/fuel-entitlements/",
    ]
    
    print("3. Testing URL variations:")
    for url in variations:
        try:
            response = requests.get(url, timeout=5)
            print(f"   {url} -> {response.status_code}")
            if response.status_code not in [404, 405]:
                print(f"      ✅ Found working URL!")
        except:
            print(f"   {url} -> ERROR")
    
    print()
    
    # Test 4: Check if there's a CORS or domain issue
    print("4. Testing CORS and domain configuration:")
    headers = {
        'Origin': FRONTEND_URL,
        'Referer': FRONTEND_URL,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(f"{PRODUCTION_API_URL}/fuel-entitlements/", headers=headers, timeout=10)
        print(f"   Status with CORS headers: {response.status_code}")
        cors_headers = {k: v for k, v in response.headers.items() if 'access-control' in k.lower() or 'cors' in k.lower()}
        if cors_headers:
            print(f"   CORS headers: {cors_headers}")
        else:
            print("   ⚠️  No CORS headers found")
    except Exception as e:
        print(f"   ❌ CORS test error: {e}")
    
    print()
    
    # Test 5: Simulate POST request (this will likely fail due to auth, but we can check error type)
    print("5. Testing POST request (will fail due to auth, but checking error type):")
    sample_payload = {
        "beneficiary": 1,
        "entitlement_type": "SESSION",
        "litres_entitled": 50,
        "period_start": "2024-01-15",
        "period_end": "2024-01-31"
    }
    
    try:
        response = requests.post(
            f"{PRODUCTION_API_URL}/fuel-entitlements/",
            json=sample_payload,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        print(f"   POST Status: {response.status_code}")
        if response.status_code == 400:
            print("   ✅ Endpoint exists - Bad Request (likely validation error)")
        elif response.status_code == 401:
            print("   ✅ Endpoint exists - Authentication required")
        elif response.status_code == 404:
            print("   ❌ Endpoint not found")
        else:
            print(f"   ⚠️  Unexpected POST status: {response.status_code}")
        
        if response.content:
            try:
                error_data = response.json()
                print(f"   Error details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"   Raw error: {response.text[:300]}...")
    except Exception as e:
        print(f"   ❌ POST test error: {e}")

def test_domain_accessibility():
    """Test if both domains are accessible"""
    print(f"\n🌐 Testing Domain Accessibility...")
    print("=" * 60)
    
    domains = [
        "https://parliament-zimbabwe.onrender.com",
        "https://parliament-zimbabwe-fuel.onrender.com"
    ]
    
    for domain in domains:
        print(f"Testing {domain}:")
        try:
            response = requests.get(domain, timeout=10)
            print(f"   Status: {response.status_code}")
            print(f"   Content-Length: {len(response.content)}")
            
            # Check if it's serving the correct application
            if 'parliament' in response.text.lower() or 'fuel' in response.text.lower():
                print("   ✅ Serving Parliament/Fuel application")
            else:
                print("   ⚠️  May not be serving expected application")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
        print()

def generate_debug_summary():
    """Generate a summary of findings"""
    print(f"\n📋 Debug Summary & Recommendations")
    print("=" * 60)
    
    print("Based on the tests above, the most likely issues are:")
    print()
    print("1. 🌐 DOMAIN MISMATCH:")
    print("   - Frontend: parliament-zimbabwe-fuel.onrender.com")
    print("   - API: parliament-zimbabwe.onrender.com") 
    print("   - This can cause CORS issues and routing problems")
    print()
    print("2. 🔐 AUTHENTICATION FLOW:")
    print("   - 401 responses indicate auth is required")
    print("   - Check if auth tokens are being sent correctly")
    print("   - Verify token format and expiration")
    print()
    print("3. 🛠️  CONFIGURATION:")
    print("   - Ensure CORS settings allow cross-domain requests")
    print("   - Verify API URL configuration in frontend")
    print("   - Check if environment variables are set correctly")
    print()
    print("4. 📡 ROUTING:")
    print("   - Confirm URL patterns are registered correctly")
    print("   - Verify no conflicts in Django URL configuration")
    print()
    print("IMMEDIATE ACTION ITEMS:")
    print("✅ Check VITE_API_URL in production environment")
    print("✅ Verify CORS_ALLOWED_ORIGINS includes frontend domain")
    print("✅ Ensure authentication headers are included in requests")
    print("✅ Check if both applications are deployed and accessible")

if __name__ == "__main__":
    print("🔧 Production Fuel Entitlements Diagnostics")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    test_fuel_entitlements_endpoint()
    test_domain_accessibility()
    generate_debug_summary()