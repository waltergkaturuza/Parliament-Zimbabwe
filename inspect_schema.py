#!/usr/bin/env python3
"""
Schema Inspection Script - Check actual database structure
"""
import os
import sys
import django
from django.apps import apps

# Add the project directory to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'parliament_fuel_app.settings')
django.setup()

from django.db import connection

def inspect_schema():
    """Check actual database schema for fuel tables"""
    with connection.cursor() as cursor:
        # Get all fuel-related tables
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name LIKE 'fuel_%'
            ORDER BY name
        """)
        tables = cursor.fetchall()
        
        print("🔍 FUEL SCHEMA INSPECTION")
        print("=" * 50)
        
        for (table_name,) in tables:
            print(f"\n📋 Table: {table_name}")
            print("-" * 30)
            
            # Get table schema
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            
            for col in columns:
                col_id, name, data_type, not_null, default, pk = col
                pk_marker = " (PK)" if pk else ""
                not_null_marker = " NOT NULL" if not_null else ""
                default_marker = f" DEFAULT {default}" if default else ""
                print(f"  • {name}: {data_type}{pk_marker}{not_null_marker}{default_marker}")
        
        # Check if there are any existing records
        print(f"\n📊 DATA SUMMARY")
        print("=" * 50)
        
        important_tables = [
            'fuel_coupon', 
            'fuel_dispatchedcoupon', 
            'fuel_couponhandover',
            'fuel_handedovercoupon'
        ]
        
        for table in important_tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"  {table}: {count} records")
            except Exception as e:
                print(f"  {table}: ❌ Error - {e}")

if __name__ == "__main__":
    inspect_schema()