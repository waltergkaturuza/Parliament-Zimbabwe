#!/usr/bin/env python
"""
Test script to verify the fixed endpoints work correctly.
Run this after starting the Django server.
"""
import requests
import json

# Test configuration
BASE_URL = "http://127.0.0.1:8000/api/v1"
USERNAME = "admin"  # Change this to your test username
PASSWORD = "pass123"  # Change this to your test password

def get_auth_token():
    """Get authentication token"""
    login_url = f"{BASE_URL}/auth/login/"
    data = {
        "username": USERNAME,
        "password": PASSWORD
    }
    
    try:
        response = requests.post(login_url, json=data)
        if response.status_code == 200:
            token = response.json().get('access')
            print(f"✅ Login successful, got token: {token[:20]}...")
            return token
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_endpoint(url, headers, description):
    """Test a specific endpoint"""
    try:
        response = requests.get(url, headers=headers)
        print(f"Testing {description}: {url}")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"✅ {description} - SUCCESS")
            data = response.json()
            print(f"Response preview: {str(data)[:100]}...")
        elif response.status_code == 403:
            print(f"🔒 {description} - FORBIDDEN (permission issue)")
        elif response.status_code == 404:
            print(f"❌ {description} - NOT FOUND")
        else:
            print(f"⚠️ {description} - Status {response.status_code}")
            print(f"Response: {response.text[:200]}...")
        
        print("-" * 50)
        return response.status_code
        
    except Exception as e:
        print(f"❌ {description} - ERROR: {e}")
        print("-" * 50)
        return None

def main():
    print("🔧 Testing Fixed Endpoints")
    print("=" * 50)
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        print("Cannot proceed without authentication token")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Test endpoints that were failing
    endpoints = [
        # Previously problematic endpoints
        (f"{BASE_URL}/parliament-sessions/", "Parliament Sessions"),
        (f"{BASE_URL}/users/?role=MAIN_CENTER,SUB_CENTER", "Users with Role Filter"),
        (f"{BASE_URL}/beneficiary-profiles/", "Beneficiary Profiles"),
        (f"{BASE_URL}/admin/dashboard/", "Admin Dashboard"),
        (f"{BASE_URL}/fuel-stats/", "Fuel Statistics"),
        
        # Subcenter endpoints (were 404)
        (f"{BASE_URL}/subcenters/1/statistics/", "Subcenter Statistics"),
        (f"{BASE_URL}/subcenters/1/recent-activity/", "Subcenter Recent Activity"),
        
        # Box/Book endpoints
        (f"{BASE_URL}/boxes/", "Boxes List"),
        (f"{BASE_URL}/books/", "Books List"),
        (f"{BASE_URL}/books/available/", "Available Books"),
        
        # Analytics endpoint
        (f"{BASE_URL}/analytics/", "Analytics"),
        
        # Additional endpoints
        (f"{BASE_URL}/subcenters/", "Subcenters List"),
        (f"{BASE_URL}/coupons/", "Coupons List"),
    ]
    
    results = {}
    for url, description in endpoints:
        status = test_endpoint(url, headers, description)
        results[description] = status
    
    # Summary
    print("\n📊 SUMMARY")
    print("=" * 50)
    success_count = sum(1 for status in results.values() if status == 200)
    total_count = len(results)
    
    print(f"✅ Successful: {success_count}/{total_count}")
    print(f"❌ Failed: {total_count - success_count}/{total_count}")
    
    print("\nDetailed Results:")
    for description, status in results.items():
        if status == 200:
            print(f"✅ {description}")
        elif status == 403:
            print(f"🔒 {description} (Forbidden)")
        elif status == 404:
            print(f"❌ {description} (Not Found)")
        else:
            print(f"⚠️ {description} (Status: {status})")

if __name__ == "__main__":
    main()
