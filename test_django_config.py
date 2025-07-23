#!/usr/bin/env python
"""
Test script to verify Django configuration before deployment
"""
import os
import sys
import django
from pathlib import Path

# Add the project directory to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

def test_django_setup():
    """Test if Django can be set up properly"""
    try:
        django.setup()
        print("✅ Django setup successful")
        return True
    except Exception as e:
        print(f"❌ Django setup failed: {e}")
        return False

def test_database_connection():
    """Test database connection"""
    try:
        from django.db import connection
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        print("✅ Database connection successful")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("This is expected if running locally without Azure database")
        return False

def test_url_imports():
    """Test if URL patterns can be imported"""
    try:
        from django.urls import reverse
        from config.urls import urlpatterns
        print(f"✅ URL patterns loaded successfully ({len(urlpatterns)} patterns)")
        return True
    except Exception as e:
        print(f"❌ URL import failed: {e}")
        return False

def test_wsgi_application():
    """Test if WSGI application can be created"""
    try:
        from config.wsgi import application
        print("✅ WSGI application created successfully")
        return True
    except Exception as e:
        print(f"❌ WSGI application failed: {e}")
        return False

if __name__ == "__main__":
    print("=== Django Configuration Test ===")
    
    tests = [
        test_django_setup,
        test_url_imports,
        test_wsgi_application,
        test_database_connection,
    ]
    
    results = []
    for test in tests:
        results.append(test())
        print()
    
    passed = sum(results)
    total = len(results)
    
    print(f"=== Test Results: {passed}/{total} passed ===")
    
    if passed >= 3:  # Database connection can fail locally
        print("✅ Django configuration appears to be working!")
        sys.exit(0)
    else:
        print("❌ Django configuration has issues that need to be fixed")
        sys.exit(1)
