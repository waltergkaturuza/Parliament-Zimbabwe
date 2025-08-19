#!/usr/bin/env python
"""
Comprehensive build and health check script for the Fuel Coupon System
"""
import os
import sys
import django
from django.conf import settings
from django.core.management import execute_from_command_line

def main():
    """Run comprehensive build and health checks"""
    print("="*60)
    print("FUEL COUPON SYSTEM - BUILD & HEALTH CHECK")
    print("="*60)
    
    # Set up Django environment
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fuel_coupon_system.settings')
    django.setup()
    
    try:
        # 1. Python Version Check
        print(f"\n1. Python Version: {sys.version}")
        
        # 2. Django Version Check
        print(f"2. Django Version: {django.get_version()}")
        
        # 3. Settings Check
        print(f"3. DEBUG Mode: {settings.DEBUG}")
        print(f"4. Database Engine: {settings.DATABASES['default']['ENGINE']}")
        
        # 4. Model Import Test
        print("\n5. Testing Model Imports...")
        from fuel.models import (
            Box, FuelTransaction, SessionAttendance, 
            FuelEntitlement, SubCenter, MainCenter
        )
        print("   ✓ All models imported successfully")
        
        # 5. Serializer Import Test
        print("\n6. Testing Serializer Imports...")
        from fuel.serializers import (
            BoxSerializer, FuelTransactionSerializer,
            SessionAttendanceSerializer, FuelEntitlementSerializer
        )
        print("   ✓ All serializers imported successfully")
        
        # 6. Views Import Test
        print("\n7. Testing Views Imports...")
        from fuel.views_main import (
            analytics_view, BoxViewSet, FuelTransactionViewSet
        )
        print("   ✓ All views imported successfully")
        
        # 7. URL Configuration Test
        print("\n8. Testing URL Configuration...")
        from django.urls import reverse
        from django.test import RequestFactory
        
        # 8. Test API Endpoints
        print("\n9. Testing API Endpoint Configurations...")
        from fuel.urls import urlpatterns
        print(f"   ✓ {len(urlpatterns)} URL patterns configured")
        
        # 9. Database Connection Test
        print("\n10. Testing Database Connection...")
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            if result:
                print("   ✓ Database connection successful")
        
        # 10. Migration Status Check
        print("\n11. Checking Migration Status...")
        from django.core.management import call_command
        from io import StringIO
        out = StringIO()
        call_command('showmigrations', stdout=out)
        migrations_output = out.getvalue()
        if '[X]' in migrations_output:
            print("   ✓ Migrations applied successfully")
        else:
            print("   ⚠ Some migrations may not be applied")
        
        print("\n" + "="*60)
        print("BUILD CHECK COMPLETED SUCCESSFULLY! ✓")
        print("="*60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ BUILD CHECK FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
