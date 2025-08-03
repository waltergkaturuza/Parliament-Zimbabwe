#!/usr/bin/env python3
"""
Backend connectivity test script
Tests the Django backend endpoints from various locations
"""

import requests
import json
from urllib.parse import urljoin

# Backend URLs to test
BACKEND_URLS = [
    "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net",
    "https://parliament-fuel-system.azurewebsites.net",
]

def test_backend_connectivity():
    """Test backend connectivity and CORS headers"""
    
    for base_url in BACKEND_URLS:
        print(f"\n🔍 Testing backend: {base_url}")
        print("=" * 60)
        
        # Test endpoints
        endpoints = [
            "/",
            "/api/v1/health/",
            "/cors-test/",
            "/auth/login/",
        ]
        
        for endpoint in endpoints:
            url = urljoin(base_url, endpoint)
            
            try:
                # Test GET request first
                print(f"   GET {endpoint}: ", end="")
                response = requests.get(url, timeout=10)
                print(f"Status {response.status_code}")
                
                # Print CORS headers if present
                cors_headers = {k: v for k, v in response.headers.items() 
                              if k.lower().startswith('access-control')}
                if cors_headers:
                    print(f"      CORS Headers: {cors_headers}")
                
                # Test OPTIONS request for CORS preflight
                if endpoint == "/auth/login/":
                    print(f"   OPTIONS {endpoint}: ", end="")
                    options_response = requests.options(url, 
                        headers={
                            'Origin': 'https://jolly-ocean-0e0dee90f.2.azurestaticapps.net',
                            'Access-Control-Request-Method': 'POST',
                            'Access-Control-Request-Headers': 'Content-Type,Authorization'
                        },
                        timeout=10
                    )
                    print(f"Status {options_response.status_code}")
                    
                    preflight_headers = {k: v for k, v in options_response.headers.items() 
                                       if k.lower().startswith('access-control')}
                    if preflight_headers:
                        print(f"      Preflight Headers: {preflight_headers}")
                
            except requests.exceptions.RequestException as e:
                print(f"❌ ERROR: {e}")
            except Exception as e:
                print(f"❌ UNEXPECTED ERROR: {e}")

def test_login_endpoint():
    """Test the login endpoint specifically"""
    
    for base_url in BACKEND_URLS:
        login_url = urljoin(base_url, "/auth/login/")
        
        print(f"\n🔐 Testing login endpoint: {login_url}")
        print("=" * 60)
        
        # Test login with dummy credentials
        try:
            headers = {
                'Content-Type': 'application/json',
                'Origin': 'https://jolly-ocean-0e0dee90f.2.azurestaticapps.net',
            }
            
            data = {
                'username': 'test',
                'password': 'test'
            }
            
            response = requests.post(login_url, 
                                   json=data, 
                                   headers=headers,
                                   timeout=10)
            
            print(f"   Status: {response.status_code}")
            print(f"   Headers: {dict(response.headers)}")
            
            if response.text:
                try:
                    content = response.json()
                    print(f"   Response: {content}")
                except:
                    print(f"   Response (text): {response.text[:200]}...")
                    
        except requests.exceptions.RequestException as e:
            print(f"❌ REQUEST ERROR: {e}")
        except Exception as e:
            print(f"❌ UNEXPECTED ERROR: {e}")

if __name__ == "__main__":
    print("🚀 Parliament Fuel System - Backend Connectivity Test")
    print("=" * 60)
    
    test_backend_connectivity()
    test_login_endpoint()
    
    print("\n✅ Backend connectivity test completed!")
    print("\nIf you see CORS errors, check:")
    print("1. CORS_ALLOWED_ORIGINS in production.py")
    print("2. CORS middleware order in MIDDLEWARE")
    print("3. Backend deployment status")
