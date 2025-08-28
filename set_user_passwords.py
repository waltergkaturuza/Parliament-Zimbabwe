#!/usr/bin/env python3
import os
import sys
import django

sys.path.append(os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Set password for existing admin user
try:
    admin = User.objects.get(username='admin')
    admin.set_password('admin123')
    admin.save()
    print(f"Password set for admin user: {admin.username}")
except User.DoesNotExist:
    print("Admin user not found")

# Also set password for testuser
try:
    testuser = User.objects.get(username='testuser')
    testuser.set_password('password123')
    testuser.save()
    print(f"Password set for test user: {testuser.username}")
except User.DoesNotExist:
    print("Test user not found")
