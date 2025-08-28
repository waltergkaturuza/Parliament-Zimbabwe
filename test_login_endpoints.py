#!/usr/bin/env python3
"""
Simple test script for login endpoint
"""
import requests
import json

# Test the login endpoint directly
BASE_URL = "http://localhost:8000"

print("Testing login endpoints...")

test_credentials = [
    {"username": "admin", "password": "admin123"},
    {"username": "testuser", "password": "password123"}
]

endpoints_to_test = [
    "/api/auth/login/",
    "/api/auth/login-bypass/",
    "/auth/login/",
    "/auth/login-bypass/"
]

for endpoint in endpoints_to_test:
    print(f"\n--- Testing endpoint: {endpoint} ---")
    
    for creds in test_credentials:
        print(f"Testing {creds['username']}...")
        
        try:
            response = requests.post(f"{BASE_URL}{endpoint}", json=creds, timeout=5)
            print(f"  Status: {response.status_code}")
            print(f"  Response: {response.text[:200]}...")
            
            if response.status_code == 200:
                print(f"  ✓ Login successful for {creds['username']} at {endpoint}")
                break
                
        except requests.exceptions.RequestException as e:
            print(f"  Error: {e}")
    else:
        print(f"  ✗ No successful login for {endpoint}")
        
print("\nDone testing endpoints.")
