#!/usr/bin/env python
"""
Script to set password for admin user
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

def set_admin_password():
    try:
        # Try to get existing admin user
        admin_user = User.objects.get(username='admin')
        print(f"Found existing admin user: {admin_user.username}")
    except User.DoesNotExist:
        # Create new admin user if doesn't exist
        admin_user = User.objects.create_user(
            username='admin',
            email='admin@parlzm.co.zw',
            is_staff=True,
            is_superuser=True,
            is_active=True,
            is_approved=True
        )
        print(f"Created new admin user: {admin_user.username}")
    
    # Set the password
    password = 'Admin@123'
    admin_user.set_password(password)
    admin_user.save()
    
    print(f"Password set successfully for user: {admin_user.username}")
    print(f"You can now login with:")
    print(f"Username: {admin_user.username}")
    print(f"Password: {password}")
    
    return admin_user

if __name__ == '__main__':
    set_admin_password()
