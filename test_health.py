#!/usr/bin/env python3
"""
Test script to check if the Parliament Fuel System backend is accessible
"""
import requests
import sys

def test_backend_endpoints():
    base_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    
    endpoints_to_test = [
        "/",
        "/health/",
        "/api/",
        "/api/health/",
        "/auth/login/",
        "/admin/",
    ]
    
    print(f"🔍 Testing backend accessibility: {base_url}")
    print("=" * 60)
    
    for endpoint in endpoints_to_test:
        full_url = f"{base_url}{endpoint}"
        try:
            print(f"Testing: {full_url}")
            response = requests.get(full_url, timeout=10)
            print(f"  ✅ Status: {response.status_code}")
            if response.status_code == 200:
                content_type = response.headers.get('content-type', 'unknown')
                print(f"  📄 Content-Type: {content_type}")
                if len(response.text) < 200:
                    print(f"  📝 Response: {response.text[:100]}...")
                else:
                    print(f"  📝 Response length: {len(response.text)} chars")
            elif response.status_code == 404:
                print(f"  ⚠️  Endpoint not found")
            elif response.status_code >= 500:
                print(f"  ❌ Server error")
            else:
                print(f"  ℹ️  Other status")
                
        except requests.exceptions.ConnectTimeout:
            print(f"  ❌ Connection timeout")
        except requests.exceptions.ConnectionError:
            print(f"  ❌ Connection error - server not reachable")
        except Exception as e:
            print(f"  ❌ Error: {e}")
        
        print()

def test_login_endpoint():
    """Test the specific login endpoint that's failing"""
    login_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/auth/login/"
    
    print("🔐 Testing login endpoint specifically...")
    print("=" * 60)
    
    # Test OPTIONS request (preflight)
    try:
        print("Testing OPTIONS (preflight) request...")
        options_response = requests.options(
            login_url,
            headers={
                'Origin': 'https://jolly-ocean-0e0dee90f.2.azurestaticapps.net',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'content-type,authorization'
            },
            timeout=10
        )
        print(f"  ✅ OPTIONS Status: {options_response.status_code}")
        print(f"  📄 Headers: {dict(options_response.headers)}")
        
    except Exception as e:
        print(f"  ❌ OPTIONS Error: {e}")
    
    print()
    
    # Test actual POST request
    try:
        print("Testing POST request...")
        post_response = requests.post(
            login_url,
            json={
                'username': 'test',
                'password': 'test'
            },
            headers={
                'Origin': 'https://jolly-ocean-0e0dee90f.2.azurestaticapps.net',
                'Content-Type': 'application/json'
            },
            timeout=10
        )
        print(f"  ✅ POST Status: {post_response.status_code}")
        print(f"  📄 Headers: {dict(post_response.headers)}")
        print(f"  📝 Response: {post_response.text[:200]}...")
        
    except Exception as e:
        print(f"  ❌ POST Error: {e}")

if __name__ == "__main__":
    test_backend_endpoints()
    print("\n" + "=" * 60 + "\n")
    test_login_endpoint()
