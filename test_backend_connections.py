#!/usr/bin/env python
"""
Test script to verify backend API endpoints are working correctly.
"""
import os
import sys
import django
import requests
import json
from django.conf import settings

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def test_api_endpoints():
    """Test key API endpoints"""
    base_url = "http://localhost:8000/api/v1"
    
    endpoints_to_test = [
        "/notifications/stats/",
        "/users/",
        "/subcenters/",
        "/auth/roles/",
        "/home/stats/",
        "/home/health/",
    ]
    
    print("🧪 Testing Backend API Endpoints")
    print("=" * 50)
    
    for endpoint in endpoints_to_test:
        url = f"{base_url}{endpoint}"
        try:
            print(f"Testing: {endpoint}")
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                print(f"  ✅ Status: {response.status_code} - OK")
                data = response.json()
                if isinstance(data, dict):
                    print(f"  📊 Keys: {list(data.keys())[:5]}...")
                elif isinstance(data, list):
                    print(f"  📊 List items: {len(data)}")
            elif response.status_code == 401:
                print(f"  🔒 Status: {response.status_code} - Authentication Required (Expected)")
            else:
                print(f"  ❌ Status: {response.status_code} - {response.text[:100]}")
                
        except requests.ConnectionError:
            print(f"  🔌 Connection Error - Django server not running?")
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
        
        print()
    
    # Test profile endpoint (needs auth)
    print("🔐 Testing Profile Endpoints (requires authentication)")
    print("-" * 50)
    
    auth_endpoints = [
        "/auth/user/",
        "/users/me/",
    ]
    
    for endpoint in auth_endpoints:
        url = f"{base_url}{endpoint}"
        try:
            print(f"Testing: {endpoint}")
            response = requests.get(url, timeout=5)
            
            if response.status_code == 401:
                print(f"  ✅ Status: {response.status_code} - Correctly requires authentication")
            else:
                print(f"  ⚠️  Status: {response.status_code} - Unexpected response")
                
        except requests.ConnectionError:
            print(f"  🔌 Connection Error - Django server not running?")
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
        
        print()

if __name__ == "__main__":
    test_api_endpoints()
