#!/usr/bin/env python
"""
Azure deployment diagnostic script
This script helps diagnose Django settings loading issues in Azure
"""
import os
import sys

print("=== Azure Django Diagnostic ===")
print(f"Python version: {sys.version}")
print(f"Python executable: {sys.executable}")
print(f"Current working directory: {os.getcwd()}")

# Check environment variables
print("\n=== Environment Variables ===")
print(f"DJANGO_SETTINGS_MODULE: {os.environ.get('DJANGO_SETTINGS_MODULE', 'NOT SET')}")

# Try to import Django
try:
    import django
    print(f"Django version: {django.VERSION}")
    print(f"Django location: {django.__file__}")
except ImportError as e:
    print(f"Django import failed: {e}")
    sys.exit(1)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Try to import settings module directly
try:
    import config.settings as settings_module
    print(f"Settings module imported successfully")
    print(f"Settings module file: {settings_module.__file__}")
    
    # Check if ROOT_URLCONF is accessible in the module
    if hasattr(settings_module, 'ROOT_URLCONF'):
        print(f"ROOT_URLCONF found in module: {settings_module.ROOT_URLCONF}")
    else:
        print("ROOT_URLCONF NOT found in settings module")
        print("Available settings attributes:")
        attrs = [attr for attr in dir(settings_module) if not attr.startswith('_')]
        print(f"  Total attributes: {len(attrs)}")
        print(f"  First 10: {attrs[:10]}")
        
except Exception as e:
    print(f"Settings module import failed: {e}")
    import traceback
    traceback.print_exc()

# Try Django setup
try:
    django.setup()
    print("Django setup successful")
    
    from django.conf import settings
    print(f"Django settings configured: {settings.configured}")
    
    # Try to access ROOT_URLCONF through Django settings
    try:
        root_urlconf = settings.ROOT_URLCONF
        print(f"ROOT_URLCONF via Django settings: {root_urlconf}")
    except AttributeError as e:
        print(f"ROOT_URLCONF access failed: {e}")
        
        # List all available settings
        print("Available Django settings:")
        for attr in sorted(dir(settings)):
            if not attr.startswith('_'):
                try:
                    value = getattr(settings, attr)
                    print(f"  {attr}: {str(value)[:50]}...")
                except:
                    print(f"  {attr}: <error accessing>")
                    
except Exception as e:
    print(f"Django setup failed: {e}")
    import traceback
    traceback.print_exc()

print("\n=== Diagnostic Complete ===")
