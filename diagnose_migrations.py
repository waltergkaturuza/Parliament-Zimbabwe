#!/usr/bin/env python3
"""
Database Migration Diagnostic Script
Run this to understand the current state of your database and migrations
"""

import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from django.core.management import execute_from_command_line

def check_database_connection():
    """Test database connection"""
    print("🔍 Testing database connection...")
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        print("✅ Database connection successful")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def check_table_structure():
    """Check if key tables and columns exist"""
    print("\n📊 Checking table structure...")
    
    cursor = connection.cursor()
    
    # Check if tables exist
    tables_to_check = [
        'fuel_fuelentitlement',
        'fuel_parliamensession', 
        'fuel_book',
        'fuel_box',
        'fuel_coupon'
    ]
    
    for table in tables_to_check:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"✅ {table}: exists with {count} records")
            
            # Check specific columns that were causing issues
            if table == 'fuel_book':
                try:
                    cursor.execute(f"SELECT first_coupon_serial FROM {table} LIMIT 1")
                    print(f"   ✅ first_coupon_serial column exists")
                except Exception:
                    print(f"   ❌ first_coupon_serial column missing")
            
            if table == 'fuel_fuelentitlement':
                try:
                    cursor.execute(f"SELECT approved_by_id FROM {table} LIMIT 1")
                    print(f"   ✅ approved_by_id column exists")
                except Exception:
                    print(f"   ❌ approved_by_id column missing")
                    
        except Exception as e:
            print(f"❌ {table}: does not exist or error - {e}")

def check_migration_history():
    """Check migration history"""
    print("\n📋 Migration history:")
    
    try:
        cursor = connection.cursor()
        cursor.execute("""
            SELECT app, name, applied 
            FROM django_migrations 
            WHERE app = 'fuel' 
            ORDER BY applied DESC 
            LIMIT 10
        """)
        
        migrations = cursor.fetchall()
        for app, name, applied in migrations:
            print(f"✅ {app}.{name} - {applied}")
            
    except Exception as e:
        print(f"❌ Could not check migration history: {e}")

def check_problematic_columns():
    """Check for the specific columns that were causing issues"""
    print("\n🔍 Checking problematic columns...")
    
    cursor = connection.cursor()
    
    # Check PostgreSQL information schema if available
    try:
        if connection.vendor == 'postgresql':
            cursor.execute("""
                SELECT table_name, column_name 
                FROM information_schema.columns 
                WHERE table_name IN ('fuel_book', 'fuel_box', 'fuel_coupon', 'fuel_fuelentitlement')
                AND column_name IN ('first_coupon_serial', 'last_coupon_serial', 'approved_by_id', 'approval_date')
                ORDER BY table_name, column_name
            """)
            
            columns = cursor.fetchall()
            if columns:
                print("Existing columns that might cause conflicts:")
                for table, column in columns:
                    print(f"   ✅ {table}.{column}")
            else:
                print("No problematic columns found")
        else:
            print("SQLite detected - using PRAGMA table_info")
            
            for table in ['fuel_book', 'fuel_box', 'fuel_coupon', 'fuel_fuelentitlement']:
                try:
                    cursor.execute(f"PRAGMA table_info({table})")
                    columns = cursor.fetchall()
                    print(f"\n{table} columns:")
                    for col_info in columns:
                        print(f"   {col_info[1]} ({col_info[2]})")
                except Exception as e:
                    print(f"   ❌ Could not check {table}: {e}")
                    
    except Exception as e:
        print(f"❌ Could not check column information: {e}")

def main():
    print("🔧 Parliament Zimbabwe - Database Migration Diagnostic")
    print("=" * 55)
    
    # Test database connection
    if not check_database_connection():
        print("Cannot proceed without database connection")
        sys.exit(1)
    
    # Check table structure
    check_table_structure()
    
    # Check migration history
    check_migration_history()
    
    # Check problematic columns
    check_problematic_columns()
    
    print("\n🎯 Diagnostic complete!")
    print("=" * 25)

if __name__ == "__main__":
    main()
