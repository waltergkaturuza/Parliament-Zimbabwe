#!/usr/bin/env python
"""
Script to check existing database fields
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'parliament.settings')
django.setup()

from django.db import connection

def check_table_structure():
    """Check the structure of fuel tables"""
    with connection.cursor() as cursor:
        # Check Box table structure
        cursor.execute("PRAGMA table_info(fuel_box)")
        box_fields = cursor.fetchall()
        
        print("🔍 FUEL_BOX TABLE FIELDS:")
        for field in box_fields:
            print(f"  {field[1]} ({field[2]})")
        
        # Check Book table structure  
        cursor.execute("PRAGMA table_info(fuel_book)")
        book_fields = cursor.fetchall()
        
        print("\n🔍 FUEL_BOOK TABLE FIELDS:")
        for field in book_fields:
            print(f"  {field[1]} ({field[2]})")
            
        # Check Coupon table structure
        cursor.execute("PRAGMA table_info(fuel_coupon)")
        coupon_fields = cursor.fetchall()
        
        print("\n🔍 FUEL_COUPON TABLE FIELDS:")
        for field in coupon_fields:
            print(f"  {field[1]} ({field[2]})")

if __name__ == "__main__":
    check_table_structure()
