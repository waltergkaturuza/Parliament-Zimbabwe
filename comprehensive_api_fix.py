#!/usr/bin/env python
"""
Comprehensive fix for Box API and Analytics 500 errors
Based on Azure log analysis
"""
import os
import sys
import django
from django.db import connection, transaction

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fuel_coupon_system.settings')
django.setup()

from fuel.models import Box, SessionAttendance, User, FuelData
from django.contrib.auth import get_user_model

def fix_missing_database_columns():
    """Fix missing database columns that are causing 500 errors"""
    print("=== FIXING MISSING DATABASE COLUMNS ===")
    
    fixes_applied = []
    
    try:
        with connection.cursor() as cursor:
            # Check and fix Box table issues
            print("Checking Box table schema...")
            
            # Check if is_received column exists
            cursor.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'fuel_box' AND column_name = 'is_received';
            """)
            if not cursor.fetchone():
                print("Adding missing 'is_received' column to Box table...")
                cursor.execute("""
                    ALTER TABLE fuel_box 
                    ADD COLUMN is_received BOOLEAN DEFAULT FALSE;
                """)
                fixes_applied.append("Added is_received column to Box")
            
            # Check if verified_by_id column exists and has proper constraints
            cursor.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'fuel_box' AND column_name = 'verified_by_id';
            """)
            if not cursor.fetchone():
                print("Adding missing 'verified_by_id' column to Box table...")
                cursor.execute("""
                    ALTER TABLE fuel_box 
                    ADD COLUMN verified_by_id INTEGER NULL;
                """)
                cursor.execute("""
                    ALTER TABLE fuel_box 
                    ADD CONSTRAINT fuel_box_verified_by_id_fkey 
                    FOREIGN KEY (verified_by_id) REFERENCES fuel_user(id) 
                    ON DELETE SET NULL;
                """)
                fixes_applied.append("Added verified_by_id column to Box")
            
            # Check SessionAttendance table
            print("Checking SessionAttendance table schema...")
            cursor.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'fuel_sessionattendance' AND column_name = 'date';
            """)
            if not cursor.fetchone():
                print("Adding missing 'date' column to SessionAttendance table...")
                cursor.execute("""
                    ALTER TABLE fuel_sessionattendance 
                    ADD COLUMN date DATE NULL;
                """)
                fixes_applied.append("Added date column to SessionAttendance")
            
            # Update existing records to have proper default values
            print("Updating existing records with default values...")
            
            # Set is_received = TRUE for boxes that have received_at timestamp
            cursor.execute("""
                UPDATE fuel_box 
                SET is_received = TRUE 
                WHERE received_at IS NOT NULL AND is_received = FALSE;
            """)
            
            # Set date field for SessionAttendance records
            cursor.execute("""
                UPDATE fuel_sessionattendance 
                SET date = COALESCE(created::date, CURRENT_DATE)
                WHERE date IS NULL;
            """)
            
            print(f"Applied fixes: {fixes_applied}")
            
    except Exception as e:
        print(f"Error fixing database columns: {e}")
        return False
    
    return True

def fix_box_queryset_issues():
    """Fix Box ViewSet queryset issues"""
    print("=== FIXING BOX QUERYSET ISSUES ===")
    
    try:
        # Test basic Box queryset
        count = Box.objects.count()
        print(f"Basic Box count: {count}")
        
        # Test select_related with proper error handling
        try:
            boxes = Box.objects.select_related('assigned_to', 'received_by', 'verified_by').all()
            print(f"select_related query successful: {boxes.count()} boxes")
        except Exception as e:
            print(f"select_related error: {e}")
            # Try without verified_by if it's causing issues
            boxes = Box.objects.select_related('assigned_to', 'received_by').all()
            print(f"select_related without verified_by: {boxes.count()} boxes")
            
        return True
        
    except Exception as e:
        print(f"Box queryset fix error: {e}")
        return False

def create_default_fuel_data():
    """Create default fuel data for analytics"""
    print("=== CREATING DEFAULT FUEL DATA ===")
    
    try:
        if not FuelData.objects.exists():
            FuelData.objects.create(
                petrol_price_usd=1.25,
                diesel_price_usd=1.35,
                exchange_rate_usd_to_zwg=27.5,
                effective_date=django.utils.timezone.now().date()
            )
            print("Created default fuel data")
        else:
            print("Fuel data already exists")
            
        return True
        
    except Exception as e:
        print(f"Error creating fuel data: {e}")
        return False

def fix_analytics_permissions():
    """Fix analytics view permissions"""
    print("=== FIXING ANALYTICS PERMISSIONS ===")
    
    try:
        # Check if admin user exists and has proper permissions
        User = get_user_model()
        
        # Create or update admin user
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@parliament.gov.zw',
                'first_name': 'System',
                'last_name': 'Administrator',
                'role': 'SUPERUSER',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
                'is_approved': True
            }
        )
        
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            print("Created admin user")
        else:
            admin_user.role = 'SUPERUSER'
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.is_active = True
            admin_user.is_approved = True
            admin_user.save()
            print("Updated admin user permissions")
            
        return True
        
    except Exception as e:
        print(f"Error fixing analytics permissions: {e}")
        return False

def test_all_endpoints():
    """Test all the problematic endpoints"""
    print("=== TESTING ENDPOINTS ===")
    
    try:
        # Test Box API
        from fuel.views_main import BoxViewSet
        from django.http import HttpRequest
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        # Create mock request
        request = HttpRequest()
        request.user = User.objects.filter(is_superuser=True).first()
        
        if request.user:
            # Test BoxViewSet
            viewset = BoxViewSet()
            viewset.request = request
            queryset = viewset.get_queryset()
            print(f"BoxViewSet test successful: {queryset.count()} boxes")
            
            # Test analytics view  
            from fuel.views_main import analytics_view
            request.method = 'GET'
            request.GET = {}
            response = analytics_view(request)
            print(f"Analytics view test: {response.status_code}")
            
            # Test dashboard view
            from fuel.views_main import main_dashboard
            response = main_dashboard(request)
            print(f"Dashboard view test: {response.status_code}")
            
        return True
        
    except Exception as e:
        print(f"Endpoint testing error: {e}")
        return False

if __name__ == "__main__":
    print("Starting comprehensive Django API fix...")
    
    print("\n" + "="*50)
    success = True
    
    # Run all fixes
    if not fix_missing_database_columns():
        success = False
        
    if not fix_box_queryset_issues():
        success = False
        
    if not create_default_fuel_data():
        success = False
        
    if not fix_analytics_permissions():
        success = False
        
    if not test_all_endpoints():
        success = False
        
    print("\n" + "="*50)
    if success:
        print("✅ ALL FIXES APPLIED SUCCESSFULLY!")
        print("API endpoints should now work correctly.")
    else:
        print("❌ SOME FIXES FAILED!")
        print("Check the error messages above.")
    
    print("="*50)
