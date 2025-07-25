"""
Test Django configuration to identify startup issues
"""
import os
import sys
import django
from django.conf import settings
from django.core.management import execute_from_command_line

def test_django_startup():
    """Test Django startup with production-like settings"""
    print("🧪 TESTING DJANGO STARTUP")
    print("=" * 50)
    
    # Set environment to mimic production
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    os.environ['DJANGO_DEBUG'] = 'False'
    
    try:
        print("📦 1. Importing Django...")
        import django
        print(f"✅ Django version: {django.get_version()}")
        
        print("📦 2. Setting up Django...")
        django.setup()
        print("✅ Django setup complete")
        
        print("📦 3. Checking installed apps...")
        for app in settings.INSTALLED_APPS:
            try:
                __import__(app)
                print(f"✅ {app}")
            except ImportError as e:
                print(f"❌ {app}: {e}")
        
        print("📦 4. Checking database configuration...")
        from django.db import connection
        print(f"✅ Database engine: {settings.DATABASES['default']['ENGINE']}")
        print(f"✅ Database name: {settings.DATABASES['default']['NAME']}")
        
        print("📦 5. Testing database connection...")
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                print("✅ Database connection successful")
        except Exception as e:
            print(f"❌ Database connection failed: {e}")
        
        print("📦 6. Checking static files configuration...")
        print(f"✅ Static URL: {settings.STATIC_URL}")
        print(f"✅ Static root: {settings.STATIC_ROOT}")
        
        print("📦 7. Checking CORS configuration...")
        print(f"✅ CORS allowed origins: {len(settings.CORS_ALLOWED_ORIGINS)} origins")
        print(f"✅ Allowed hosts: {settings.ALLOWED_HOSTS}")
        
        print("\n✅ ALL TESTS PASSED - Django should start successfully")
        return True
        
    except Exception as e:
        print(f"\n❌ DJANGO STARTUP FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

def check_environment_variables():
    """Check critical environment variables"""
    print("\n🔧 CHECKING ENVIRONMENT VARIABLES")
    print("=" * 50)
    
    critical_vars = [
        'DJANGO_SECRET_KEY',
        'DJANGO_DEBUG',
        'DATABASE_URL',
        'DATABASE_NAME',
        'DATABASE_USER',
        'DATABASE_PASSWORD',
        'DATABASE_HOST',
        'DJANGO_ALLOWED_HOSTS'
    ]
    
    for var in critical_vars:
        value = os.environ.get(var)
        if value:
            # Mask sensitive values
            if 'PASSWORD' in var or 'SECRET' in var:
                display_value = '*' * len(value)
            else:
                display_value = value
            print(f"✅ {var}: {display_value}")
        else:
            print(f"❌ {var}: Not set")

if __name__ == "__main__":
    check_environment_variables()
    test_django_startup()
