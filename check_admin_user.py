#!/usr/bin/env python
"""
Script to check admin user details
"""
import os
import sys
import django

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_local')
django.setup()

from fuel.models import User

def check_admin_user():
    try:
        admin_user = User.objects.get(username='admin')
        print(f"Admin user found:")
        print(f"  ID: {admin_user.id}")
        print(f"  Username: {admin_user.username}")
        print(f"  Email: {admin_user.email}")
        print(f"  Is Active: {admin_user.is_active}")
        print(f"  Is Staff: {admin_user.is_staff}")
        print(f"  Is Superuser: {admin_user.is_superuser}")
        print(f"  Is Approved: {getattr(admin_user, 'is_approved', 'N/A')}")
        print(f"  Role: {getattr(admin_user, 'role', 'N/A')}")
        print(f"  Password: {admin_user.password[:50]}...")
        
        # Test password check
        from django.contrib.auth import authenticate
        auth_result = authenticate(username='admin', password='Admin@123')
        print(f"  Authentication test: {'SUCCESS' if auth_result else 'FAILED'}")
        
        if auth_result:
            print(f"  Authenticated user ID: {auth_result.id}")
        
    except User.DoesNotExist:
        print("Admin user not found!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check_admin_user()
