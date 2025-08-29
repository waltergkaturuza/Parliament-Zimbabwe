#!/usr/bin/env python3
"""
Setup script for production backend - creates admin users and test data
Run this on the production backend to set up initial data
"""

import requests
import json

# Production backend URL
BACKEND_URL = "https://parliament-zimbabwe.onrender.com/api/v1"

def create_admin_user():
    """Create admin user via Django management command"""
    # This would typically be run directly on the server
    print("Manual step: Run this on production backend:")
    print("python manage.py shell")
    print("""
from django.contrib.auth import get_user_model
from backend.models import SubCenter

User = get_user_model()

# Create or get subcenter
subcenter, created = SubCenter.objects.get_or_create(
    id=1,
    defaults={
        'name': 'Parliament Main Office',
        'location': 'Mount Pleasant, Harare',
        'contact_number': '+263242700151',
        'email': 'parliament@parliament.gov.zw'
    }
)

# Create admin user
admin_user, created = User.objects.get_or_create(
    username='subcenter_admin',
    defaults={
        'email': 'admin@parliament.gov.zw',
        'first_name': 'Sub Center',
        'last_name': 'Admin',
        'is_staff': True,
        'sub_center': subcenter,
        'role': 'subcenter_admin'
    }
)

if created:
    admin_user.set_password('subc@123')
    admin_user.save()
    print(f"Created admin user: {admin_user.username}")
else:
    print(f"Admin user already exists: {admin_user.username}")
""")

def test_backend_connection():
    """Test if backend is responding"""
    try:
        response = requests.get(f"{BACKEND_URL}/auth/test/", timeout=10)
        print(f"✅ Backend connection test: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        return False

def test_login():
    """Test login with admin credentials"""
    try:
        login_data = {
            "username": "subcenter_admin",
            "password": "subc@123"
        }
        response = requests.post(f"{BACKEND_URL}/auth/login/", json=login_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login successful for user: {data.get('user', {}).get('username')}")
            return data.get('access')
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login test failed: {e}")
        return None

def test_api_endpoints(token):
    """Test API endpoints with authentication"""
    if not token:
        print("❌ No token available for API tests")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test subcenters endpoint
    try:
        response = requests.get(f"{BACKEND_URL}/subcenters/", headers=headers, timeout=10)
        print(f"✅ Subcenters endpoint: {response.status_code}")
    except Exception as e:
        print(f"❌ Subcenters endpoint failed: {e}")
    
    # Test boxes endpoint  
    try:
        response = requests.get(f"{BACKEND_URL}/boxes/", headers=headers, timeout=10)
        print(f"✅ Boxes endpoint: {response.status_code}")
    except Exception as e:
        print(f"❌ Boxes endpoint failed: {e}")

if __name__ == "__main__":
    print("🔧 Production Backend Setup Script")
    print("=" * 50)
    
    # Step 1: Test backend connection
    print("\n1. Testing backend connection...")
    if test_backend_connection():
        print("Backend is responding")
    else:
        print("Backend connection failed - check if service is running")
        exit(1)
    
    # Step 2: Show admin user creation instructions
    print("\n2. Admin user setup...")
    create_admin_user()
    
    # Step 3: Test login
    print("\n3. Testing login...")
    token = test_login()
    
    # Step 4: Test API endpoints
    print("\n4. Testing API endpoints...")
    test_api_endpoints(token)
    
    print("\n✅ Setup script completed!")
    print("\nNext steps:")
    print("1. Run the Django shell commands on production backend")
    print("2. Verify frontend can connect to backend")
    print("3. Test dashboard functionality")
