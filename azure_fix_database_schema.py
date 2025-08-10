#!/usr/bin/env python3
"""
Azure Production Database Schema Fix
Adds missing USD monetary fields to Box model for Azure production
"""

import os
import sys
import django
from django.db import connection

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fuel_coupon_system.settings')
django.setup()

def check_and_add_missing_fields():
    """Check and add missing fields to Azure production database"""
    print("🔍 Checking Azure production database schema...")
    
    with connection.cursor() as cursor:
        try:
            # Check if the fields exist
            cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'fuel_box';")
            columns = [row[0] for row in cursor.fetchall()]
            print(f"📋 Existing columns: {len(columns)} found")
            
            # Define missing fields
            missing_fields = {
                'monetary_value_usd': 'ALTER TABLE fuel_box ADD COLUMN monetary_value_usd DECIMAL(12,2) NULL;',
                'fuel_price_per_litre_usd': 'ALTER TABLE fuel_box ADD COLUMN fuel_price_per_litre_usd DECIMAL(8,2) NULL;',
                'exchange_rate': 'ALTER TABLE fuel_box ADD COLUMN exchange_rate DECIMAL(10,2) NULL;'
            }
            
            # Check which fields need to be added
            fields_to_add = []
            for field_name, sql in missing_fields.items():
                if field_name not in columns:
                    fields_to_add.append((field_name, sql))
                    print(f"❌ Missing field: {field_name}")
                else:
                    print(f"✅ Field exists: {field_name}")
            
            # Add missing fields
            if fields_to_add:
                print(f"\n🔧 Adding {len(fields_to_add)} missing fields...")
                for field_name, sql in fields_to_add:
                    try:
                        cursor.execute(sql)
                        print(f"✅ Added: {field_name}")
                    except Exception as e:
                        print(f"❌ Error adding {field_name}: {e}")
            else:
                print("✅ All required fields already exist!")
                
            # Also ensure box_code allows blank values
            print("\n🔧 Ensuring box_code field allows blank values...")
            try:
                cursor.execute("ALTER TABLE fuel_box ALTER COLUMN box_code DROP NOT NULL;")
                print("✅ box_code field updated to allow null/blank values")
            except Exception as e:
                print(f"ℹ️ box_code field modification: {e}")
                
        except Exception as e:
            print(f"❌ Database schema check failed: {e}")
            print("💡 This script is designed for PostgreSQL (Azure production)")
            return False
            
    print("\n🚀 Azure production database schema fix completed!")
    return True

if __name__ == '__main__':
    check_and_add_missing_fields()
