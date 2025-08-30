#!/usr/bin/env python
import os
import django
import requests
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.test import Client
from django.urls import reverse

User = get_user_model()

def test_roles_api():
    print("=== Testing Roles API ===")
    
    # Check User.ROLE_CHOICES
    print(f"\n1. Backend User.ROLE_CHOICES ({len(User.ROLE_CHOICES)} roles):")
    for role_code, role_name in User.ROLE_CHOICES:
        print(f"   {role_code} -> {role_name}")
    
    # Check for SERGEANT_OF_ARMS specifically
    sergeant_roles = [role for role in User.ROLE_CHOICES if 'SERGEANT_OF_ARMS' in role[0]]
    print(f"\n2. SERGEANT_OF_ARMS roles found: {len(sergeant_roles)}")
    for role in sergeant_roles:
        print(f"   ✓ {role[0]} -> {role[1]}")
    
    # Test the API endpoint without authentication
    print(f"\n3. Testing API endpoint without auth:")
    try:
        response = requests.get('http://localhost:8000/api/auth/roles/')
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test with Django test client
    print(f"\n4. Testing with Django test client:")
    client = Client()
    try:
        response = client.get('/api/auth/roles/')
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Roles returned: {len(data.get('roles', []))}")
            sergeant_found = any(role['code'] == 'SERGEANT_OF_ARMS' for role in data.get('roles', []))
            print(f"   SERGEANT_OF_ARMS found: {sergeant_found}")
        else:
            print(f"   Response: {response.content.decode()[:200]}...")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Create a test user and try authenticated request
    print(f"\n5. Testing with authenticated user:")
    try:
        # Get or create a test user
        test_user, created = User.objects.get_or_create(
            username='test_admin',
            defaults={
                'email': 'test@example.com',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            test_user.set_password('testpass123')
            test_user.save()
            print(f"   Created test user: {test_user.username}")
        else:
            print(f"   Using existing test user: {test_user.username}")
        
        # Login and test
        client = Client()
        login_success = client.login(username='test_admin', password='testpass123')
        print(f"   Login successful: {login_success}")
        
        if login_success:
            response = client.get('/api/auth/roles/')
            print(f"   Authenticated request status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                roles = data.get('roles', [])
                print(f"   Roles returned: {len(roles)}")
                sergeant_found = any(role['code'] == 'SERGEANT_OF_ARMS' for role in roles)
                print(f"   SERGEANT_OF_ARMS found: {sergeant_found}")
                
                # Print all roles
                print(f"   All roles:")
                for role in roles:
                    print(f"     {role['code']} -> {role['name']}")
            else:
                print(f"   Response: {response.content.decode()[:200]}...")
        
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == '__main__':
    test_roles_api()
