#!/usr/bin/env python3
"""
Azure 500 Error Diagnostic Script

This script helps diagnose 500 Internal Server Errors on Azure App Service
by checking common issues that cause these errors.
"""

import os
import requests
import json
from datetime import datetime

def check_azure_endpoints():
    """Check Azure endpoints and log responses"""
    base_url = "https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net"
    
    # Test endpoints that are causing 500 errors
    test_endpoints = [
        "/api/v1/analytics/received-breakdown/?period=month",
        "/api/v1/analytics/available-by-center/",
        "/api/v1/boxes/",
        "/api/v1/boxes/?ordering=-box_code&limit=1&search=FCB-2025-",
        "/api/v1/boxes/?status=received&ordering=-received_at"
    ]
    
    print(f"🔍 Testing Azure endpoints at {datetime.now()}")
    print("=" * 60)
    
    # First, test the health endpoint
    try:
        health_url = f"{base_url}/api/health/"
        response = requests.get(health_url, timeout=30)
        print(f"✅ Health check: {response.status_code}")
        if response.status_code == 200:
            print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {str(e)}")
    
    print("\n" + "=" * 60)
    
    # Test authentication endpoint
    try:
        auth_url = f"{base_url}/api/auth/login/"
        test_credentials = {
            "username": "test",
            "password": "test"
        }
        response = requests.post(auth_url, json=test_credentials, timeout=30)
        print(f"🔐 Auth test: {response.status_code}")
        if response.status_code not in [200, 400, 401]:
            print(f"   Unexpected auth response: {response.text[:200]}")
    except Exception as e:
        print(f"❌ Auth test failed: {str(e)}")
    
    print("\n" + "=" * 60)
    
    # Test problematic endpoints (without auth for now)
    for endpoint in test_endpoints:
        try:
            url = f"{base_url}{endpoint}"
            print(f"\n🧪 Testing: {endpoint}")
            
            response = requests.get(url, timeout=30)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 500:
                print(f"   ❌ 500 Error detected")
                print(f"   Response headers: {dict(response.headers)}")
                print(f"   Response text (first 300 chars): {response.text[:300]}")
            elif response.status_code == 401:
                print(f"   🔐 Authentication required (expected)")
            elif response.status_code == 200:
                print(f"   ✅ Success!")
                try:
                    data = response.json()
                    print(f"   Data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                except:
                    print(f"   Non-JSON response: {response.text[:100]}")
            else:
                print(f"   ⚠️  Unexpected status: {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                
        except requests.exceptions.Timeout:
            print(f"   ⏱️  Timeout after 30 seconds")
        except requests.exceptions.ConnectionError as e:
            print(f"   🌐 Connection error: {str(e)}")
        except Exception as e:
            print(f"   💥 Unexpected error: {str(e)}")

def check_common_issues():
    """Check for common Azure deployment issues"""
    print("\n" + "=" * 60)
    print("🔧 COMMON AZURE DEPLOYMENT ISSUES")
    print("=" * 60)
    
    print("\n1. Environment Variables:")
    required_vars = [
        'DATABASE_URL',
        'DJANGO_SECRET_KEY',
        'AZURE_HOSTNAME',
        'FRONTEND_HOSTNAME'
    ]
    
    for var in required_vars:
        value = os.environ.get(var)
        if value:
            print(f"   ✅ {var}: {'*' * 10} (set)")
        else:
            print(f"   ❌ {var}: Not set")
    
    print("\n2. Python Version:")
    import sys
    print(f"   Current Python: {sys.version}")
    
    print("\n3. Django Import Test:")
    try:
        import django
        print(f"   ✅ Django {django.get_version()} imported successfully")
    except Exception as e:
        print(f"   ❌ Django import failed: {str(e)}")
    
    print("\n4. Database Connection Test:")
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
        import django
        django.setup()
        
        from django.db import connection
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        print(f"   ✅ Database connection successful: {result}")
    except Exception as e:
        print(f"   ❌ Database connection failed: {str(e)}")
    
    print("\n5. Model Import Test:")
    try:
        from fuel.models import Box, User, SubCenter
        print(f"   ✅ Core models imported successfully")
        
        # Test model counts (basic query)
        try:
            box_count = Box.objects.count()
            user_count = User.objects.count()
            print(f"   📊 Database stats: {box_count} boxes, {user_count} users")
        except Exception as e:
            print(f"   ⚠️  Model query failed: {str(e)}")
            
    except Exception as e:
        print(f"   ❌ Model import failed: {str(e)}")

def generate_recommendations():
    """Generate recommendations based on common 500 error patterns"""
    print("\n" + "=" * 60)
    print("💡 RECOMMENDATIONS FOR FIXING 500 ERRORS")
    print("=" * 60)
    
    recommendations = [
        "1. DATABASE MIGRATIONS:",
        "   - Run 'python manage.py migrate' on Azure",
        "   - Check if all model fields exist in PostgreSQL",
        "   - Verify DATABASE_URL environment variable",
        "",
        "2. ENVIRONMENT VARIABLES:",
        "   - Ensure all required environment variables are set in Azure App Service",
        "   - Check Azure App Service Configuration -> Application Settings",
        "   - Verify DATABASE_URL format: postgresql://user:pass@host:port/db?sslmode=require",
        "",
        "3. DEPENDENCIES:",
        "   - Ensure all packages in requirements.txt are installed",
        "   - Check for version conflicts in Azure Python runtime",
        "   - Verify psycopg2-binary is installed for PostgreSQL",
        "",
        "4. CODE ISSUES:",
        "   - Add try-catch blocks around database queries",
        "   - Use getattr() for optional model fields",
        "   - Handle missing foreign key relationships gracefully",
        "",
        "5. AZURE SPECIFIC:",
        "   - Check Azure App Service logs in Azure Portal",
        "   - Verify startup command in Azure App Service",
        "   - Ensure collectstatic runs successfully",
        "   - Check ALLOWED_HOSTS includes Azure hostname"
    ]
    
    for rec in recommendations:
        print(rec)

def main():
    """Main diagnostic function"""
    print("🚀 AZURE 500 ERROR DIAGNOSTIC TOOL")
    print("=" * 60)
    print(f"Started at: {datetime.now()}")
    
    # Run all diagnostic checks
    check_azure_endpoints()
    check_common_issues()
    generate_recommendations()
    
    print("\n" + "=" * 60)
    print(f"✅ Diagnostic completed at: {datetime.now()}")
    print("📋 Next steps:")
    print("   1. Review the output above")
    print("   2. Fix any identified issues")
    print("   3. Deploy updates to Azure")
    print("   4. Re-run this diagnostic")

if __name__ == "__main__":
    main()
