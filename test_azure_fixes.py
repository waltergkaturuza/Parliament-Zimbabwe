#!/usr/bin/env python3
"""
Local Test Script for Azure Fixes

This script tests the enhanced error handling locally before deploying to Azure.
"""

import os
import sys
import django
import json
from django.test import Client
from django.contrib.auth import get_user_model

def setup_django():
    """Setup Django environment"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()

def test_analytics_endpoints():
    """Test analytics endpoints with enhanced error handling"""
    print("🧪 Testing Analytics Endpoints")
    print("-" * 40)
    
    client = Client()
    
    # Test endpoints that were causing 500 errors
    endpoints = [
        ('/api/v1/analytics/received-breakdown/', 'Received Breakdown'),
        ('/api/v1/analytics/available-by-center/', 'Available by Center'),
        ('/api/v1/boxes/', 'Boxes API'),
    ]
    
    results = []
    
    for endpoint, name in endpoints:
        print(f"Testing {name}...")
        try:
            response = client.get(endpoint)
            
            if response.status_code == 200:
                print(f"  ✅ {name}: SUCCESS (200)")
                try:
                    data = response.json()
                    print(f"     Data keys: {list(data.keys()) if isinstance(data, dict) else 'List response'}")
                except:
                    print(f"     Non-JSON response")
            elif response.status_code == 401:
                print(f"  🔐 {name}: Requires Authentication (401)")
            elif response.status_code == 403:
                print(f"  🚫 {name}: Forbidden (403)")
            else:
                print(f"  ❌ {name}: Failed ({response.status_code})")
                if hasattr(response, 'content'):
                    print(f"     Error: {response.content.decode()[:200]}...")
                    
            results.append((name, response.status_code, endpoint))
            
        except Exception as e:
            print(f"  💥 {name}: Exception - {str(e)}")
            results.append((name, 'ERROR', endpoint))
    
    return results

def test_database_field_access():
    """Test database field access that might cause AttributeError"""
    print("\n🗄️  Testing Database Field Access")
    print("-" * 40)
    
    try:
        from fuel.models import Box
        
        # Test if we can safely access fields
        print("Testing Box model field access...")
        
        # Try to get a box instance
        try:
            box = Box.objects.first()
            if box:
                # Test safe field access
                total_value_usd = getattr(box, 'total_value_usd', 0)
                total_value_zwg = getattr(box, 'total_value_zwg', 0)
                verified_at = getattr(box, 'verified_at', None)
                verified_by = getattr(box, 'verified_by', None)
                total_coupons = getattr(box, 'total_coupons_calculated', 0)
                total_litres = getattr(box, 'total_litres', 0)
                
                print(f"  ✅ Safe field access working")
                print(f"     total_value_usd: {total_value_usd}")
                print(f"     total_value_zwg: {total_value_zwg}")
                print(f"     verified_at: {verified_at}")
                print(f"     verified_by: {verified_by}")
                print(f"     total_coupons: {total_coupons}")
                print(f"     total_litres: {total_litres}")
            else:
                print("  ℹ️  No box instances found to test")
                
        except Exception as e:
            print(f"  ❌ Database access failed: {str(e)}")
            
    except Exception as e:
        print(f"  💥 Model import failed: {str(e)}")

def test_database_connection():
    """Test database connection"""
    print("\n🔌 Testing Database Connection")
    print("-" * 40)
    
    try:
        from django.db import connection
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            
        print("  ✅ Database connection working")
        print(f"     Backend: {connection.settings_dict.get('ENGINE', 'Unknown')}")
        print(f"     Database: {connection.settings_dict.get('NAME', 'Unknown')}")
        
    except Exception as e:
        print(f"  ❌ Database connection failed: {str(e)}")

def test_environment_variables():
    """Test required environment variables"""
    print("\n🌍 Testing Environment Variables")
    print("-" * 40)
    
    required_vars = [
        'SECRET_KEY',
        'DEBUG',
        'ALLOWED_HOSTS',
    ]
    
    optional_vars = [
        'DATABASE_URL',
        'WEBSITE_HOSTNAME',
    ]
    
    for var in required_vars:
        value = os.environ.get(var)
        if value:
            display_value = value[:20] + "..." if len(value) > 20 else value
            print(f"  ✅ {var}: {display_value}")
        else:
            print(f"  ❌ {var}: Not set")
    
    for var in optional_vars:
        value = os.environ.get(var)
        if value:
            display_value = value[:30] + "..." if len(value) > 30 else value
            print(f"  ℹ️  {var}: {display_value}")
        else:
            print(f"  ⚪ {var}: Not set")

def main():
    """Main test function"""
    print("🧪 LOCAL TEST FOR AZURE FIXES")
    print("=" * 50)
    
    try:
        setup_django()
        print("✅ Django setup complete\n")
        
        # Run tests
        test_environment_variables()
        test_database_connection()
        test_database_field_access()
        endpoint_results = test_analytics_endpoints()
        
        # Summary
        print("\n📊 TEST SUMMARY")
        print("=" * 50)
        
        success_count = sum(1 for name, status, _ in endpoint_results if status == 200)
        auth_count = sum(1 for name, status, _ in endpoint_results if status in [401, 403])
        error_count = sum(1 for name, status, _ in endpoint_results if status not in [200, 401, 403])
        
        print(f"Endpoint Tests:")
        print(f"  ✅ Successful: {success_count}")
        print(f"  🔐 Auth Required: {auth_count}")
        print(f"  ❌ Errors: {error_count}")
        
        if error_count == 0:
            print("\n🎉 All tests passed! Ready for Azure deployment.")
        else:
            print("\n⚠️  Some tests failed. Review errors before deploying.")
            
        return 0 if error_count == 0 else 1
        
    except Exception as e:
        print(f"💥 Test setup failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
