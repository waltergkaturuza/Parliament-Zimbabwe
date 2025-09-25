#!/usr/bin/env python3
"""
Script to check and add program column to fuel_fuelentitlement table
"""

import os
import sys
import django
from django.db import connection

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'parliament_fuel_system.settings')
django.setup()

def check_and_add_program_column():
    with connection.cursor() as cursor:
        # Check if program_id column exists in fuel_fuelentitlement table
        cursor.execute("PRAGMA table_info(fuel_fuelentitlement);")
        columns = [row[1] for row in cursor.fetchall()]  # row[1] is column name
        
        print(f"Current columns in fuel_fuelentitlement: {columns}")
        
        if 'program_id' not in columns:
            print("Adding program_id column...")
            try:
                # Add the program_id column
                cursor.execute("""
                    ALTER TABLE fuel_fuelentitlement 
                    ADD COLUMN program_id INTEGER NULL 
                    REFERENCES fuel_program(id) DEFERRABLE INITIALLY DEFERRED;
                """)
                print("Successfully added program_id column!")
            except Exception as e:
                print(f"Error adding column: {e}")
        else:
            print("program_id column already exists!")

if __name__ == '__main__':
    check_and_add_program_column()