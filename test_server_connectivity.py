#!/usr/bin/env python3
"""
Test basic server connectivity
"""
import requests

BASE_URL = "http://localhost:8000"

print("Testing server connectivity...")

# Test basic GET requests
test_endpoints = [
    "/",
    "/api/",
    "/admin/",
    "/api/auth/login/"  # GET request to check if endpoint exists
]

for endpoint in test_endpoints:
    try:
        print(f"\nTesting GET {endpoint}...")
        response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
        print(f"  Status: {response.status_code}")
        if response.status_code == 404:
            print(f"  ✗ Not found")
        elif response.status_code < 500:
            print(f"  ✓ Accessible")
        else:
            print(f"  ⚠ Server error")
            
    except requests.exceptions.RequestException as e:
        print(f"  Error: {e}")

print("\nTesting POST to login...")
try:
    response = requests.post(f"{BASE_URL}/api/auth/login/", 
                           json={"username": "admin", "password": "admin123"}, 
                           timeout=5)
    print(f"Login POST Status: {response.status_code}")
    print(f"Response headers: {dict(response.headers)}")
    print(f"Response body: {response.text}")
except Exception as e:
    print(f"Login POST Error: {e}")
