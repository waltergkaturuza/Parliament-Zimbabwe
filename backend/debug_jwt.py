#!/usr/bin/env python3
"""
Debug JWT Token Authentication Issues
"""
import os
import sys
import django
import requests
import json

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Now import Django models
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from fuel.models import User

def test_jwt_debug():
    print("=== JWT AUTHENTICATION DEBUG ===\n")
    
    # 1. Check if user exists and can authenticate
    try:
        user = User.objects.get(username='sub_center_admin')
        print(f"✓ User found: {user.username}")
        print(f"  - ID: {user.id}")
        print(f"  - Role: {user.role}")
        print(f"  - Is Active: {user.is_active}")
        print(f"  - Is Staff: {user.is_staff}")
        print()
        
        # Test password authentication
        auth_user = authenticate(username='sub_center_admin', password='subcenter123')
        if auth_user:
            print("✓ Password authentication successful")
        else:
            print("❌ Password authentication failed")
            return
            
    except User.DoesNotExist:
        print("❌ User 'sub_center_admin' not found")
        return
    
    # 2. Create tokens manually
    try:
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        
        print(f"✓ Manual token creation successful")
        print(f"  - Access Token: {str(access)[:50]}...")
        print(f"  - Refresh Token: {str(refresh)[:50]}...")
        print()
        
        # Decode token to check payload
        payload = access.payload
        print(f"✓ Token payload:")
        print(f"  - user_id: {payload.get('user_id')}")
        print(f"  - token_type: {payload.get('token_type')}")
        print(f"  - exp: {payload.get('exp')}")
        print()
        
    except Exception as e:
        print(f"❌ Manual token creation failed: {e}")
        return
    
    # 3. Test login API
    print("=== TESTING LOGIN API ===")
    try:
        response = requests.post('http://localhost:8000/api/auth/login/', json={
            'username': 'sub_center_admin',
            'password': 'subcenter123'
        })
        
        print(f"Login API Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Login API successful")
            print(f"  - Full response: {data}")
            api_token = data.get('access') or data.get('access_token')
            print(f"  - API Token: {api_token[:50]}..." if api_token else "No token")
            
            # Compare tokens
            if api_token:
                print(f"  - Manual token matches API token: {str(access) == api_token}")
                
                # 4. Test API endpoint with token
                print("\n=== TESTING API WITH TOKEN ===")
                headers = {'Authorization': f'Bearer {api_token}'}
                
                # Test boxes endpoint
                response = requests.get('http://localhost:8000/api/boxes/', headers=headers)
                print(f"Boxes API Status: {response.status_code}")
                
                if response.status_code == 200:
                    print("✓ API call successful with token")
                    data = response.json()
                    print(f"  - Response type: {type(data)}")
                    print(f"  - Data keys: {list(data.keys()) if isinstance(data, dict) else 'N/A'}")
                else:
                    print(f"❌ API call failed: {response.text}")
                    
                    # Try to decode the API token manually
                    try:
                        from rest_framework_simplejwt.tokens import UntypedToken
                        from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
                        
                        UntypedToken(api_token)
                        print("✓ API token is valid according to JWT library")
                    except (InvalidToken, TokenError) as e:
                        print(f"❌ API token is invalid: {e}")
            
        else:
            print(f"❌ Login API failed: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Django server. Is it running on localhost:8000?")
    except Exception as e:
        print(f"❌ API test failed: {e}")

if __name__ == '__main__':
    test_jwt_debug()
