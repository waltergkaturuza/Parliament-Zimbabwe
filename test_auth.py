#!/usr/bin/env python3
"""
Simple test script to verify JWT authentication is working
"""
import os
import sys
import requests
import json

# Add the project directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_local')

# Setup Django
import django
django.setup()

# Test authentication
def test_auth():
    print("Testing JWT Authentication...")
    
    # Base URL for API
    base_url = "http://localhost:8000/api/v1"
    
    # Test login
    print("\n1. Testing login...")
    login_data = {
        "username": "admin",
        "password": "Admin@123"
    }
    
    try:
        login_response = requests.post(
            f"{base_url}/auth/login/",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Login response status: {login_response.status_code}")
        
        if login_response.status_code == 200:
            tokens = login_response.json()
            print(f"✅ Login successful")
            print(f"Access token length: {len(tokens['access'])}")
            print(f"Refresh token length: {len(tokens['refresh'])}")
            
            # Test authenticated request
            print("\n2. Testing authenticated request to /boxes/...")
            headers = {
                "Authorization": f"Bearer {tokens['access']}",
                "Content-Type": "application/json"
            }
            
            boxes_response = requests.get(
                f"{base_url}/boxes/",
                headers=headers
            )
            print(f"Boxes response status: {boxes_response.status_code}")
            
            if boxes_response.status_code == 200:
                print("✅ Authenticated request successful")
                boxes_data = boxes_response.json()
                print(f"Boxes count: {len(boxes_data.get('results', []))}")
            else:
                print("❌ Authenticated request failed")
                print(f"Response: {boxes_response.text}")
                
        else:
            print("❌ Login failed")
            print(f"Response: {login_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to Django server. Make sure it's running on localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_auth()
