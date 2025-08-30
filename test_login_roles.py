#!/usr/bin/env python
import os
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Try to login and get a token
login_data = {
    'username': 'admin',
    'password': 'admin123'
}

print('=== Testing Login and Roles API ===')
print('1. Attempting login...')
try:
    login_response = requests.post('http://localhost:8000/api/auth/login/', json=login_data)
    print(f'   Login status: {login_response.status_code}')
    
    if login_response.status_code == 200:
        login_result = login_response.json()
        access_token = login_result.get('access_token')
        print(f'   Login successful, token received: {access_token[:20] if access_token else "None"}...')
        
        # Test roles API with token
        if access_token:
            print('2. Testing roles API with authentication...')
            headers = {'Authorization': f'Bearer {access_token}'}
            roles_response = requests.get('http://localhost:8000/api/auth/roles/', headers=headers)
            print(f'   Roles API status: {roles_response.status_code}')
            
            if roles_response.status_code == 200:
                roles_data = roles_response.json()
                roles = roles_data.get('roles', [])
                print(f'   Roles returned: {len(roles)}')
                sergeant_found = any(role['code'] == 'SERGEANT_OF_ARMS' for role in roles)
                print(f'   SERGEANT_OF_ARMS found: {sergeant_found}')
                
                print('   All roles:')
                for role in roles:
                    print(f'     {role["code"]} -> {role["name"]}')
            else:
                print(f'   Roles API error: {roles_response.text[:200]}')
    else:
        print(f'   Login failed: {login_response.text[:200]}')
        
except Exception as e:
    print(f'   Error: {e}')
