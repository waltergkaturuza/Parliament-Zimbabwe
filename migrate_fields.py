#!/usr/bin/env python3
"""
Direct database migration script for MainCenter alignment fields
"""
import os
import sys
import sqlite3
from pathlib import Path

# Get the project directory
PROJECT_DIR = Path(__file__).resolve().parent
DB_PATH = PROJECT_DIR / 'db.sqlite3'

def add_missing_fields():
    """Add missing fields directly to SQLite database"""
    if not DB_PATH.exists():
        print(f"❌ Database not found at {DB_PATH}")
        return False
    
    print(f"🗄️  Adding missing fields to database: {DB_PATH}")
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if fields already exist and add them if they don't
        fields_to_add = [
            {
                'table': 'fuel_subcenter',
                'field': 'contact_number',
                'definition': 'VARCHAR(20) NULL'
            },
            {
                'table': 'fuel_subcenter', 
                'field': 'email',
                'definition': 'VARCHAR(254) NULL'
            },
            {
                'table': 'fuel_box',
                'field': 'is_received',
                'definition': 'BOOLEAN NOT NULL DEFAULT 1'
            }
        ]
        
        for field_info in fields_to_add:
            table = field_info['table']
            field = field_info['field']
            definition = field_info['definition']
            
            # Check if field exists
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [column[1] for column in cursor.fetchall()]
            
            if field not in columns:
                print(f"  ➕ Adding {table}.{field}")
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN {field} {definition}")
            else:
                print(f"  ✅ {table}.{field} already exists")
        
        # Commit changes
        conn.commit()
        print("✅ Database migration completed successfully")
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
    finally:
        if conn:
            conn.close()

def verify_fields():
    """Verify that the fields were added correctly"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check SubCenter table
        cursor.execute("PRAGMA table_info(fuel_subcenter)")
        subcenter_columns = [column[1] for column in cursor.fetchall()]
        
        # Check Box table  
        cursor.execute("PRAGMA table_info(fuel_box)")
        box_columns = [column[1] for column in cursor.fetchall()]
        
        print("\n📋 Field Verification:")
        print(f"  SubCenter.contact_number: {'✅' if 'contact_number' in subcenter_columns else '❌'}")
        print(f"  SubCenter.email: {'✅' if 'email' in subcenter_columns else '❌'}")
        print(f"  Box.is_received: {'✅' if 'is_received' in box_columns else '❌'}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Verification error: {e}")
        return False

if __name__ == '__main__':
    print("🚀 MainCenter Frontend-Backend Alignment Migration")
    print("=" * 50)
    
    success = add_missing_fields()
    if success:
        verify_fields()
        print("\n🎯 Migration complete! Ready for deployment.")
    else:
        print("\n❌ Migration failed!")
        sys.exit(1)
