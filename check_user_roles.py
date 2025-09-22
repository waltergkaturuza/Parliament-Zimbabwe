#!/usr/bin/env python3
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("Current users in the system:")
print("-" * 50)
for user in User.objects.all():
    print(f"Username: {user.username}")
    print(f"Role: {getattr(user, 'role', 'No role field')}")
    print(f"Is Superuser: {user.is_superuser}")
    print(f"Is Staff: {user.is_staff}")
    print(f"Is Active: {user.is_active}")
    print("-" * 30)