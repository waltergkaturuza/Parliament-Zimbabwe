#!/usr/bin/env python3
"""
Simple health check script for Azure deployment
"""
print("🟢 Python is working!")
print("Environment variables:")
import os
print(f"   DJANGO_SETTINGS_MODULE: {os.environ.get('DJANGO_SETTINGS_MODULE', 'NOT SET')}")
print(f"   DB_HOST: {os.environ.get('DB_HOST', 'NOT SET')}")
print(f"   DB_NAME: {os.environ.get('DB_NAME', 'NOT SET')}")

try:
    import django
    print(f"✅ Django imported successfully (version: {django.get_version()})")
    
    # Try to setup Django
    django.setup()
    print("✅ Django setup successful")
    
    from django.conf import settings
    print("✅ Django settings loaded")
    print(f"   Debug mode: {settings.DEBUG}")
    print(f"   Database engine: {settings.DATABASES['default']['ENGINE']}")
    
except Exception as e:
    print(f"❌ Django error: {e}")
    import traceback
    traceback.print_exc()
