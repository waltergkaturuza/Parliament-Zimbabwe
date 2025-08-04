#!/usr/bin/env python
"""Test production settings loading"""
import os
import sys

# Set the settings module explicitly
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.production'

try:
    import django
    print(f"📦 Django version: {django.get_version()}")
    
    # Setup Django
    django.setup()
    
    from django.conf import settings
    print("✅ Successfully loaded production settings!")
    print(f"🔧 Settings module: {settings.SETTINGS_MODULE}")
    print(f"🐛 DEBUG: {settings.DEBUG}")
    print(f"🌐 ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
    
    # Check database configuration
    db_config = settings.DATABASES['default']
    print(f"💾 Database engine: {db_config['ENGINE']}")
    
    # Check CORS settings
    if hasattr(settings, 'CORS_ALLOWED_ORIGINS'):
        print(f"🔗 CORS origins: {len(settings.CORS_ALLOWED_ORIGINS)} configured")
    
    # Check static files
    print(f"📁 STATIC_URL: {settings.STATIC_URL}")
    print(f"📁 STATIC_ROOT: {settings.STATIC_ROOT}")
    
    print("\n🎯 Production settings test PASSED!")
    
except Exception as e:
    print(f"❌ Error loading production settings: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
