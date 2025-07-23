#!/usr/bin/env python
"""
Simple Django validation script to test if the application can start
"""
import os
import sys
import traceback

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

def test_django_import():
    """Test basic Django import"""
    try:
        import django
        print("✅ Django import successful")
        return True
    except Exception as e:
        print(f"❌ Django import failed: {e}")
        return False

def test_django_setup():
    """Test Django setup"""
    try:
        import django
        django.setup()
        print("✅ Django setup successful")
        return True
    except Exception as e:
        print(f"❌ Django setup failed: {e}")
        traceback.print_exc()
        return False

def test_wsgi_app():
    """Test WSGI application creation"""
    try:
        from config.wsgi import application
        print("✅ WSGI application created successfully")
        return True
    except Exception as e:
        print(f"❌ WSGI application failed: {e}")
        traceback.print_exc()
        return False

def test_urls():
    """Test URL configuration"""
    try:
        from django.urls import reverse
        from config.urls import urlpatterns
        print(f"✅ URL patterns loaded ({len(urlpatterns)} patterns)")
        return True
    except Exception as e:
        print(f"❌ URL patterns failed: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=== Django Application Validation ===")
    print(f"Python: {sys.version}")
    print(f"Django Settings: {os.environ.get('DJANGO_SETTINGS_MODULE')}")
    print()
    
    tests = [
        ("Django Import", test_django_import),
        ("Django Setup", test_django_setup), 
        ("WSGI Application", test_wsgi_app),
        ("URL Configuration", test_urls)
    ]
    
    results = []
    for name, test_func in tests:
        print(f"Testing {name}...")
        try:
            result = test_func()
            results.append(result)
        except Exception as e:
            print(f"❌ {name} failed with exception: {e}")
            traceback.print_exc()
            results.append(False)
        print()
    
    passed = sum(results)
    total = len(results)
    
    print(f"=== Results: {passed}/{total} tests passed ===")
    
    if passed == total:
        print("🎉 All tests passed! Django application should start successfully.")
        sys.exit(0)
    else:
        print("⚠️  Some tests failed. Django application may not start properly.")
        sys.exit(1)
