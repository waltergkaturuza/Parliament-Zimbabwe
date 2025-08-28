#!/usr/bin/env python3
import os
import sys
import django

sys.path.append(os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.backends import ModelBackend

User = get_user_model()

print("Django Authentication Diagnosis")
print("="*50)

# Test user
username = "admin"
password = "admin123"

print(f"Testing authentication for: {username}")

# Check if user exists
try:
    user = User.objects.get(username=username)
    print(f"✓ User exists: {user}")
    print(f"  - Email: {user.email}")
    print(f"  - Is Active: {user.is_active}")
    print(f"  - Is Staff: {user.is_staff}")
    print(f"  - Is Superuser: {user.is_superuser}")
    print(f"  - Has usable password: {user.has_usable_password()}")
    
    # Test password directly
    print(f"  - Password check result: {user.check_password(password)}")
    
except User.DoesNotExist:
    print(f"✗ User {username} does not exist")
    exit(1)

# Test authentication function
print(f"\nTesting Django authenticate() function...")
auth_user = authenticate(username=username, password=password)
if auth_user:
    print(f"✓ Authentication successful: {auth_user}")
else:
    print(f"✗ Authentication failed")

# Test with ModelBackend directly
print(f"\nTesting ModelBackend directly...")
backend = ModelBackend()
backend_user = backend.authenticate(None, username=username, password=password)
if backend_user:
    print(f"✓ ModelBackend authentication successful: {backend_user}")
else:
    print(f"✗ ModelBackend authentication failed")

# Check authentication backends setting
from django.conf import settings
print(f"\nAuthentication Backends:")
for backend in getattr(settings, 'AUTHENTICATION_BACKENDS', []):
    print(f"  - {backend}")

print("\nDone.")
