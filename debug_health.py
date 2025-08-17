#!/usr/bin/env python
"""
Debug health check for fuel coupon system - tests specific endpoints that are failing
"""
import os
import sys
import django
from django.core.wsgi import get_wsgi_application

# Add project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

# Initialize Django
django.setup()

def test_endpoints():
    """Test the failing endpoints locally"""
    from django.test import Client
    from django.contrib.auth import get_user_model
    from rest_framework.test import APIClient
    from rest_framework_simplejwt.tokens import RefreshToken
    
    print("=== Testing Failing Endpoints ===")
    
    # Create API client
    client = APIClient()
    
    # Try to get a user for authentication
    User = get_user_model()
    
    try:
        # Get or create a test user
        user = User.objects.filter(role='MAIN_CENTER').first()
        if not user:
            user = User.objects.filter(is_superuser=True).first()
        if not user:
            print("❌ No suitable user found for testing")
            return
        
        print(f"✅ Using user: {user.username} (role: {user.role})")
        
        # Generate JWT token
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        
        # Set authentication header
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Test failing endpoints
        endpoints_to_test = [
            '/api/v1/boxes/',
            '/api/v1/analytics/fuel-requirements/',
            '/api/v1/financial-analytics/',
            '/api/v1/subcenters/overview/',
            '/api/v1/books/received/',
            '/api/v1/dynamic-allocation/',
            '/api/v1/pool-vehicles/',
        ]
        
        for endpoint in endpoints_to_test:
            print(f"\n📋 Testing: {endpoint}")
            try:
                response = client.get(endpoint)
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    print(f"   ✅ SUCCESS - Response length: {len(response.content)} bytes")
                    if hasattr(response, 'data'):
                        print(f"   Data keys: {list(response.data.keys()) if isinstance(response.data, dict) else 'Non-dict response'}")
                elif response.status_code == 401:
                    print(f"   ⚠️  AUTHENTICATION REQUIRED (expected in production)")
                elif response.status_code == 404:
                    print(f"   ❌ NOT FOUND - Endpoint may not exist")
                else:
                    print(f"   ❌ FAILED - Status: {response.status_code}")
                    if hasattr(response, 'content'):
                        error_content = response.content.decode('utf-8')[:200]
                        print(f"   Error: {error_content}")
                        
            except Exception as e:
                print(f"   ❌ EXCEPTION: {str(e)}")
        
        # Test user management (working endpoint for comparison)
        print(f"\n📋 Testing working endpoint: /api/v1/users/")
        try:
            response = client.get('/api/v1/users/')
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                print(f"   ✅ SUCCESS - User management working as expected")
            else:
                print(f"   ❌ UNEXPECTED - User management also failing")
        except Exception as e:
            print(f"   ❌ EXCEPTION: {str(e)}")
            
    except Exception as e:
        print(f"❌ Test setup failed: {str(e)}")

def test_models():
    """Test model imports and basic operations"""
    print("\n=== Testing Model Access ===")
    
    try:
        from fuel.models import Box, Book, SubCenter, PoolVehicle
        
        # Test Box model
        try:
            box_count = Box.objects.count()
            print(f"✅ Box model: {box_count} records")
        except Exception as e:
            print(f"❌ Box model error: {str(e)}")
            
        # Test Book model  
        try:
            book_count = Book.objects.count()
            print(f"✅ Book model: {book_count} records")
        except Exception as e:
            print(f"❌ Book model error: {str(e)}")
            
        # Test SubCenter model
        try:
            subcenter_count = SubCenter.objects.count()
            print(f"✅ SubCenter model: {subcenter_count} records")
        except Exception as e:
            print(f"❌ SubCenter model error: {str(e)}")
            
        # Test PoolVehicle model
        try:
            pool_vehicle_count = PoolVehicle.objects.count()
            print(f"✅ PoolVehicle model: {pool_vehicle_count} records")
        except Exception as e:
            print(f"❌ PoolVehicle model error: {str(e)}")
            
    except ImportError as e:
        print(f"❌ Model import error: {str(e)}")

def test_database_connection():
    """Test database connectivity"""
    print("\n=== Testing Database Connection ===")
    
    try:
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            if result:
                print("✅ Database connection successful")
                
                # Test if specific tables exist
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = %s 
                    AND table_name LIKE 'fuel_%%'
                    ORDER BY table_name
                """, [connection.settings_dict['NAME']])
                
                tables = cursor.fetchall()
                print(f"✅ Found {len(tables)} fuel tables:")
                for table in tables[:10]:  # Show first 10
                    print(f"   - {table[0]}")
                if len(tables) > 10:
                    print(f"   ... and {len(tables) - 10} more")
                    
    except Exception as e:
        print(f"❌ Database connection error: {str(e)}")

def test_django_settings():
    """Test Django settings"""
    print("\n=== Testing Django Settings ===")
    
    try:
        from django.conf import settings
        
        print(f"✅ DEBUG: {settings.DEBUG}")
        print(f"✅ DATABASE ENGINE: {settings.DATABASES['default']['ENGINE']}")
        print(f"✅ DATABASE NAME: {settings.DATABASES['default']['NAME']}")
        print(f"✅ ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
        
        # Check if all required apps are installed
        required_apps = ['fuel', 'rest_framework', 'corsheaders']
        for app in required_apps:
            if app in settings.INSTALLED_APPS:
                print(f"✅ {app} app installed")
            else:
                print(f"❌ {app} app missing")
                
    except Exception as e:
        print(f"❌ Settings error: {str(e)}")

if __name__ == '__main__':
    print("🔍 Fuel Coupon System Debug Health Check")
    print("=" * 50)
    
    test_django_settings()
    test_database_connection()
    test_models()
    test_endpoints()
    
    print("\n" + "=" * 50)
    print("🏁 Debug health check complete")
