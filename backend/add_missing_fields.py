#!/usr/bin/env python
"""
Quick script to add missing database fields for centralized book generation
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection

def column_exists(table, column):
    """Check if a column exists in a table"""
    cursor = connection.cursor()
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cursor.fetchall()]
    return column in columns

def add_missing_fields():
    """Add missing fields for centralized book generation"""
    cursor = connection.cursor()
    
    print("🔧 Adding missing database fields for centralized book generation...")
    
    # Add missing columns to fuel_box if they don't exist
    if not column_exists('fuel_box', 'first_coupon_serial'):
        cursor.execute('ALTER TABLE fuel_box ADD COLUMN first_coupon_serial VARCHAR(50) NULL')
        print('✅ Added first_coupon_serial to fuel_box')
    else:
        print('ℹ️  first_coupon_serial already exists in fuel_box')

    if not column_exists('fuel_box', 'last_coupon_serial'):
        cursor.execute('ALTER TABLE fuel_box ADD COLUMN last_coupon_serial VARCHAR(50) NULL') 
        print('✅ Added last_coupon_serial to fuel_box')
    else:
        print('ℹ️  last_coupon_serial already exists in fuel_box')

    if not column_exists('fuel_box', 'total_books'):
        cursor.execute('ALTER TABLE fuel_box ADD COLUMN total_books INTEGER NULL')
        print('✅ Added total_books to fuel_box')
    else:
        print('ℹ️  total_books already exists in fuel_box')

    # Add missing columns to fuel_book if they don't exist  
    if not column_exists('fuel_book', 'is_generated'):
        cursor.execute('ALTER TABLE fuel_book ADD COLUMN is_generated BOOLEAN DEFAULT FALSE')
        print('✅ Added is_generated to fuel_book')
    else:
        print('ℹ️  is_generated already exists in fuel_book')
        
    if not column_exists('fuel_book', 'first_coupon_serial'):
        cursor.execute('ALTER TABLE fuel_book ADD COLUMN first_coupon_serial VARCHAR(50) NULL')
        print('✅ Added first_coupon_serial to fuel_book')
    else:
        print('ℹ️  first_coupon_serial already exists in fuel_book')

    if not column_exists('fuel_book', 'last_coupon_serial'):
        cursor.execute('ALTER TABLE fuel_book ADD COLUMN last_coupon_serial VARCHAR(50) NULL') 
        print('✅ Added last_coupon_serial to fuel_book')
    else:
        print('ℹ️  last_coupon_serial already exists in fuel_book')

    print('\n🎉 Database schema updated successfully!')
    print('✅ Single source of truth for book generation is now ready!')

if __name__ == '__main__':
    add_missing_fields()
