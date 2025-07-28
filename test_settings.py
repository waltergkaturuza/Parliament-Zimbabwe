#!/usr/bin/env python
"""
Test script to verify Django settings are loading correctly
"""
import os
import sys
import django
from django.conf import settings

# Add the project directory to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

try:
    # Configure Django
    django.setup()
    
    print("✅ Django setup successful!")
    print(f"✅ ROOT_URLCONF: {settings.ROOT_URLCONF}")
    print(f"✅ DEBUG: {settings.DEBUG}")
    print(f"✅ ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
    print(f"✅ INSTALLED_APPS count: {len(settings.INSTALLED_APPS)}")
    
    # Test URL configuration
    from django.urls import get_resolver
    resolver = get_resolver()
    print(f"✅ URL resolver working: {resolver.urlconf_name}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
