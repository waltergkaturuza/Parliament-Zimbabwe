#!/usr/bin/env python
"""
Quick debug test to check specific API endpoint
"""
import requests
import json

API_BASE = 'http://127.0.0.1:8000/api/v1'

def debug_endpoint():
    print("🔍 DEBUG: API Endpoint Testing")
    
    # Get token
    login_data = {'username': 'admin', 'password': 'admin123'}
    response = requests.post(f'{API_BASE}/auth/login/', json=login_data)
    
    if response.status_code == 200:
        token = response.json().get('access')
        print(f"✅ Token obtained: {token[:20]}...")
        
        # Test a specific endpoint with detailed error info
        headers = {'Authorization': f'Bearer {token}'}
        
        # Test users endpoint
        response = requests.get(f'{API_BASE}/users/', headers=headers)
        print(f"\n📊 Users endpoint test:")
        print(f"   Status: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        
        if response.status_code != 200:
            print(f"   Error content: {response.text}")
            print(f"   Request headers: {headers}")
    else:
        print(f"❌ Login failed: {response.status_code}")

if __name__ == '__main__':
    debug_endpoint()
