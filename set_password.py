#!/usr/bin/env python
import os
import sys
import django

# Add current directory to Python path
sys.path.append(os.getcwd())

# Setup Django with correct settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import User

def set_test_user_password():
    print("=== Setting Test User Password ===")
    
    try:
        user = User.objects.get(username='testuser')
        user.set_password('password123')
        user.save()
        print(f"✅ Password set for user: {user.username}")
        print(f"   Role: {user.role}")
        print(f"   Sub Center: {user.sub_center}")
        print(f"   Is Active: {user.is_active}")
        print(f"   Is Approved: {user.is_approved}")
        
    except User.DoesNotExist:
        print("❌ User 'testuser' not found")

if __name__ == "__main__":
    set_test_user_password()
