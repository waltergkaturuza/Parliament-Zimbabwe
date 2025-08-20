#!/usr/bin/env python3
"""
Test JWT token decoding manually
"""
import os
import sys
import django
from django.conf import settings

# Add the project directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_local')

# Setup Django
django.setup()

from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import jwt
from fuel.models import User

def test_jwt_token(token_string):
    """Test JWT token decoding"""
    print(f"Testing JWT token (length: {len(token_string)})")
    print(f"Token starts with: {token_string[:50]}...")
    
    try:
        # Remove 'Bearer ' prefix if present
        if token_string.startswith('Bearer '):
            token_string = token_string[7:]
        
        # Test 1: Decode using JWT library directly
        print("\n1. Testing with jwt.decode()...")
        try:
            decoded = jwt.decode(token_string, settings.SECRET_KEY, algorithms=['HS256'])
            print(f"✅ JWT decode successful: {decoded}")
        except jwt.ExpiredSignatureError:
            print("❌ JWT token expired")
        except jwt.InvalidTokenError as e:
            print(f"❌ JWT invalid: {e}")
        
        # Test 2: Use Django REST framework JWT authentication
        print("\n2. Testing with DRF JWT authentication...")
        try:
            access_token = AccessToken(token_string)
            print(f"✅ AccessToken created: {access_token}")
            print(f"User ID: {access_token['user_id']}")
            print(f"Token type: {access_token.get('token_type', 'N/A')}")
            
            # Get user
            user_id = access_token['user_id']
            user = User.objects.get(id=user_id)
            print(f"✅ User found: {user.username} (ID: {user.id})")
            
        except TokenError as e:
            print(f"❌ Token error: {e}")
        except User.DoesNotExist:
            print(f"❌ User not found for ID: {access_token['user_id']}")
            
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    # Test with a sample token - replace with actual token from browser
    sample_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # Replace with actual token
    print("JWT Token Test Script")
    print("Replace the sample_token variable with your actual token from localStorage")
    # test_jwt_token(sample_token)
