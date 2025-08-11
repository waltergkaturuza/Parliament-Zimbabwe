#!/usr/bin/env python3
"""
Quick script to add the missing 'notes' field to the fuel_box table in Azure production
"""
import os
import django
from django.db import connection, transaction

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()

def add_notes_field():
    """Add the missing notes field to fuel_box table"""
    print("🔧 Adding missing 'notes' field to fuel_box table...")
    
    try:
        with connection.cursor() as cursor:
            # Check if notes field already exists
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'fuel_box' AND column_name = 'notes'
            """)
            
            if cursor.fetchone():
                print("✅ Notes field already exists!")
                return
            
            # Add the notes field
            cursor.execute("""
                ALTER TABLE fuel_box 
                ADD COLUMN notes TEXT
            """)
            
            print("✅ Successfully added 'notes' field to fuel_box table!")
            
    except Exception as e:
        print(f"❌ Error adding notes field: {str(e)}")
        raise

if __name__ == "__main__":
    add_notes_field()
    print("🚀 Database fix completed!")
