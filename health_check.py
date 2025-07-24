#!/usr/bin/env python
"""
Health Check Script for Parliament Fuel System Backend
Run this to diagnose backend deployment issues
"""
import os
import sys
import django
from django.conf import settings
from django.core.management import execute_from_command_line

def main():
    """Run health checks and diagnostics"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
    
    try:
        django.setup()
        
        print("=== Parliament Fuel System Health Check ===")
        print(f"Django Version: {django.get_version()}")
        print(f"Settings Module: {settings.SETTINGS_MODULE}")
        print(f"Debug Mode: {settings.DEBUG}")
        print(f"Allowed Hosts: {settings.ALLOWED_HOSTS}")
        print(f"Database Engine: {settings.DATABASES['default']['ENGINE']}")
        
        # Test database connection
        print("\n=== Database Connection Test ===")
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                print("✅ Database connection: SUCCESS")
        except Exception as e:
            print(f"❌ Database connection: FAILED - {e}")
        
        # Test static files configuration
        print("\n=== Static Files Configuration ===")
        print(f"Static URL: {settings.STATIC_URL}")
        print(f"Static Root: {getattr(settings, 'STATIC_ROOT', 'Not configured')}")
        
        # Test CORS configuration
        print("\n=== CORS Configuration ===")
        print(f"CORS Allowed Origins: {getattr(settings, 'CORS_ALLOWED_ORIGINS', 'Not configured')}")
        
        # Test environment variables
        print("\n=== Environment Variables ===")
        env_vars = [
            'DB_PASSWORD', 'DB_HOST', 'DB_NAME', 'DB_USER',
            'DJANGO_SECRET_KEY', 'SECRET_KEY'
        ]
        for var in env_vars:
            value = os.environ.get(var)
            status = "✅ SET" if value else "❌ MISSING"
            print(f"{var}: {status}")
        
        # Test Application Insights
        print("\n=== Application Insights ===")
        ai_key = getattr(settings, 'APPINSIGHTS_INSTRUMENTATIONKEY', None)
        print(f"Instrumentation Key: {'✅ SET' if ai_key else '❌ MISSING'}")
        
        print("\n=== Health Check Complete ===")
        
    except Exception as e:
        print(f"❌ Health Check Failed: {e}")
        return 1
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
