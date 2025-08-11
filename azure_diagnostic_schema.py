#!/usr/bin/env python
"""
Azure Production Database Diagnostic Script
Purpose: Diagnose the digital_signature column error and verify migration status
"""

import os
import sys
import django
from django.conf import settings
from django.core.management import execute_from_command_line
from django.db import connection

def check_database_schema():
    """Check if digital_signature column exists in fuel_user table"""
    print("🔍 Checking database schema...")
    
    with connection.cursor() as cursor:
        # Check if digital_signature column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'fuel_user' 
            AND column_name = 'digital_signature'
        """)
        
        result = cursor.fetchone()
        if result:
            print("✅ digital_signature column EXISTS in fuel_user table")
            return True
        else:
            print("❌ digital_signature column MISSING from fuel_user table")
            return False

def check_all_new_columns():
    """Check all columns that should have been added by migration 0008"""
    print("\n🔍 Checking all new columns from migration 0008...")
    
    expected_user_columns = [
        'digital_signature',
        'profile_picture', 
        'full_address',
        'national_id',
        'signature_uploaded_at'
    ]
    
    expected_book_columns = [
        'book_code',
        'generated_at',
        'generated_by_id',
        'is_verified',
        'verification_notes',
        'verified_at',
        'verified_by_id'
    ]
    
    with connection.cursor() as cursor:
        print("\n📋 User table columns:")
        for column in expected_user_columns:
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'fuel_user' 
                AND column_name = %s
            """, [column])
            
            result = cursor.fetchone()
            status = "✅ EXISTS" if result else "❌ MISSING"
            print(f"  {column}: {status}")
        
        print("\n📋 Book table columns:")
        for column in expected_book_columns:
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'fuel_book' 
                AND column_name = %s
            """, [column])
            
            result = cursor.fetchone()
            status = "✅ EXISTS" if result else "❌ MISSING"
            print(f"  {column}: {status}")

def main():
    """Run comprehensive diagnostics"""
    print("🚨 Azure Production Database Diagnostic")
    print("=" * 50)
    
    # Set up Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'parliament_fuel_system.settings')
    django.setup()
    
    print(f"📊 Database Engine: {settings.DATABASES['default']['ENGINE']}")
    print(f"📊 Database Name: {settings.DATABASES['default']['NAME']}")
    print(f"📊 Database Host: {settings.DATABASES['default']['HOST']}")
    
    # Check migration status
    print("\n📋 Current migration status:")
    execute_from_command_line(['manage.py', 'showmigrations', 'fuel', '--verbosity=0'])
    
    # Check database schema
    missing_columns = not check_database_schema()
    check_all_new_columns()
    
    if missing_columns:
        print("\n🚨 URGENT ACTION REQUIRED:")
        print("1. Run: python manage.py migrate fuel 0008_enhance_book_coupon_tracking")
        print("2. Verify: python manage.py showmigrations fuel")
        print("3. Test: Try logging in again")
    else:
        print("\n✅ Database schema looks correct!")
        print("If still getting errors, check application logs for other issues.")

if __name__ == '__main__':
    main()
