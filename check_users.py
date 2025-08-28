#!/usr/bin/env python3
import os
import sys
import django

sys.path.append(os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model, authenticate

User = get_user_model()

print("Checking users and authentication...")

# List all users
users = User.objects.all()
print(f"Total users: {users.count()}")
for user in users:
    print(f"  - {user.username} (email: {user.email}, is_active: {user.is_active})")

# Test authentication
print("\nTesting authentication...")
test_users = [
    ('admin', 'admin123'),
    ('testuser', 'password123')
]

for username, password in test_users:
    user = authenticate(username=username, password=password)
    if user:
        print(f"✓ {username} authentication successful")
    else:
        print(f"✗ {username} authentication failed")
        
    # Check if user exists
    try:
        db_user = User.objects.get(username=username)
        print(f"  User exists: {db_user.username}, is_active: {db_user.is_active}")
    except User.DoesNotExist:
        print(f"  User {username} does not exist in database")
