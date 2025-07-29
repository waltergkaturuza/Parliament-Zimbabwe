#!/usr/bin/env python
"""
Simple test to check environment variables and Django settings
"""
import os
import sys

# Add the project root directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Check environment variables
print("🔍 Environment Variables Check:")
print("=" * 50)

env_vars = [
    'DATABASE_URL', 'DATABASE_NAME', 'DATABASE_USER', 'DATABASE_PASSWORD', 
    'DATABASE_HOST', 'DATABASE_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
    'DB_HOST', 'DB_PORT'
]

for var in env_vars:
    value = os.environ.get(var)
    if value:
        # Mask password
        if 'PASSWORD' in var:
            value = '***MASKED***'
        print(f"{var}: {value}")
    else:
        print(f"{var}: Not set")

print("\n🔍 Django Settings Test:")
print("=" * 50)

try:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
    import django
    django.setup()
    
    from django.conf import settings
    
    print("✅ Django setup successful!")
    
    # Check SECRET_KEY
    print(f"SECRET_KEY: {getattr(settings, 'SECRET_KEY', 'NOT SET')[:10]}...")
    
    if hasattr(settings, 'DATABASES'):
        db_config = settings.DATABASES.get('default', {})
        print(f"Database ENGINE: {db_config.get('ENGINE', 'Not set')}")
        print(f"Database NAME: {db_config.get('NAME', 'Not set')}")
        print(f"Database USER: {db_config.get('USER', 'Not set')}")
        print(f"Database HOST: {db_config.get('HOST', 'Not set')}")
        print(f"Database PORT: {db_config.get('PORT', 'Not set')}")
        
        if db_config.get('ENGINE'):
            print("✅ Database configuration looks complete!")
        else:
            print("❌ Database ENGINE is missing!")
    else:
        print("❌ DATABASES setting not found!")
        
except Exception as e:
    print(f"❌ Django setup failed: {e}")
    import traceback
    traceback.print_exc()

print("=" * 50)
