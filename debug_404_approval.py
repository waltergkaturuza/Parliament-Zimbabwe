#!/usr/bin/env python3
"""
Debug 404 errors on fuel entitlement approval
Test specific endpoints that are failing
"""

import requests
import json
from datetime import datetime

def test_entitlement_endpoints():
    """Test fuel entitlement endpoints for 404 errors"""
    print(f"🔧 Testing Fuel Entitlement Endpoints - {datetime.now()}")
    print("=" * 60)
    
    base_urls = [
        "https://parliament-zimbabwe.onrender.com/api/v1",
        "https://parliament-zimbabwe.onrender.com/api",
        "https://parliament-zimbabwe.onrender.com"
    ]
    
    endpoints_to_test = [
        "/fuel-entitlements/",
        "/fuel-entitlements/1/",
        "/fuel-entitlements/1/approve/", 
        "/fuelentitlements/",
        "/entitlements/",
    ]
    
    for base_url in base_urls:
        print(f"\n🌐 Testing base URL: {base_url}")
        print("-" * 40)
        
        for endpoint in endpoints_to_test:
            full_url = base_url + endpoint
            
            try:
                response = requests.get(full_url, timeout=10)
                status_icon = "✅" if response.status_code < 400 else "❌"
                print(f"  {status_icon} GET {endpoint} -> {response.status_code}")
                
                # Special handling for specific status codes
                if response.status_code == 404:
                    print(f"      🔍 404 - Endpoint not found")
                elif response.status_code == 401:
                    print(f"      🔐 401 - Authentication required (endpoint exists)")
                elif response.status_code == 405:
                    print(f"      ⚠️  405 - Method not allowed (endpoint exists but wrong method)")
                elif response.status_code in [400, 403]:
                    print(f"      ⚠️  {response.status_code} - Endpoint exists but has issues")
                    
            except requests.exceptions.Timeout:
                print(f"  ⏰ GET {endpoint} -> Timeout")
            except requests.exceptions.ConnectionError:
                print(f"  🌐 GET {endpoint} -> Connection Error")
            except Exception as e:
                print(f"  ❌ GET {endpoint} -> Error: {str(e)}")
    
    # Test specific approval endpoint patterns
    print(f"\n🎯 Testing Approval Endpoint Patterns")
    print("-" * 40)
    
    approval_patterns = [
        "/fuel-entitlements/1/approve/",
        "/fuel-entitlements/approve/1/", 
        "/api/v1/fuel-entitlements/1/approve/",
        "/api/fuel-entitlements/1/approve/",
    ]
    
    for pattern in approval_patterns:
        for base_url in ["https://parliament-zimbabwe.onrender.com"]:
            full_url = base_url + pattern
            try:
                response = requests.get(full_url, timeout=5)
                status_icon = "✅" if response.status_code < 400 else "❌"
                print(f"  {status_icon} {pattern} -> {response.status_code}")
            except Exception as e:
                print(f"  ❌ {pattern} -> {str(e)[:50]}")

    # Test POST method on approval endpoint
    print(f"\n📤 Testing POST to Approval Endpoints")
    print("-" * 40)
    
    post_endpoints = [
        "https://parliament-zimbabwe.onrender.com/api/v1/fuel-entitlements/1/approve/",
        "https://parliament-zimbabwe.onrender.com/api/fuel-entitlements/1/approve/"
    ]
    
    for url in post_endpoints:
        try:
            response = requests.post(url, 
                json={}, 
                timeout=5,
                headers={'Content-Type': 'application/json'}
            )
            print(f"  📤 POST {url.split('/')[-3:]} -> {response.status_code}")
            if response.status_code != 404:
                try:
                    print(f"      Response: {response.json()}")
                except:
                    print(f"      Response: {response.text[:100]}")
        except Exception as e:
            print(f"  ❌ POST -> {str(e)[:50]}")

if __name__ == "__main__":
    test_entitlement_endpoints()