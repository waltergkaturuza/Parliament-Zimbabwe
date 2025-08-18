#!/usr/bin/env python
"""
Diagnostic script to check Box model database issues
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fuel_coupon_system.settings')
django.setup()

from django.db import connection
from fuel.models import Box, SessionAttendance
import traceback

def check_database_schema():
    """Check current database schema for missing columns"""
    print("=== Database Schema Check ===")
    
    try:
        with connection.cursor() as cursor:
            # Check fuel_box table structure
            cursor.execute("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'fuel_box' 
                ORDER BY ordinal_position;
            """)
            
            columns = cursor.fetchall()
            print(f"Found {len(columns)} columns in fuel_box table:")
            for col in columns:
                print(f"  - {col[0]} ({col[1]}, nullable: {col[2]})")
            
            # Check for specific problematic columns
            problematic_columns = ['verified_by_id', 'is_received', 'received_date']
            missing_columns = []
            
            existing_column_names = [col[0] for col in columns]
            for col in problematic_columns:
                if col not in existing_column_names:
                    missing_columns.append(col)
            
            if missing_columns:
                print(f"\nMissing columns: {missing_columns}")
            else:
                print("\nAll expected columns are present")
                
    except Exception as e:
        print(f"Database schema check failed: {e}")
        traceback.print_exc()

def check_box_queryset():
    """Check if Box queryset works"""
    print("\n=== Box QuerySet Test ===")
    
    try:
        # Test simple count
        count = Box.objects.count()
        print(f"Total boxes in database: {count}")
        
        # Test with select_related
        boxes = Box.objects.select_related('assigned_to', 'received_by', 'verified_by')
        print(f"select_related query successful: {boxes.count()} boxes")
        
        # Test a single box
        if count > 0:
            box = boxes.first()
            print(f"First box: {box.box_code if box else 'None'}")
            
    except Exception as e:
        print(f"Box queryset test failed: {e}")
        traceback.print_exc()

def check_session_attendance():
    """Check SessionAttendance for missing date column"""
    print("\n=== SessionAttendance Schema Check ===")
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'fuel_sessionattendance' 
                ORDER BY ordinal_position;
            """)
            
            columns = cursor.fetchall()
            print(f"Found {len(columns)} columns in fuel_sessionattendance table:")
            for col in columns:
                print(f"  - {col[0]} ({col[1]}, nullable: {col[2]})")
                
            # Check for date column specifically
            column_names = [col[0] for col in columns]
            if 'date' not in column_names:
                print("\nMISSING: 'date' column in SessionAttendance table")
            else:
                print("\n'date' column exists in SessionAttendance table")
                
    except Exception as e:
        print(f"SessionAttendance schema check failed: {e}")
        traceback.print_exc()

def test_api_endpoints():
    """Test the problematic API calls directly"""
    print("\n=== API Endpoint Tests ===")
    
    # Test Box queryset that's failing
    try:
        from fuel.views_main import BoxViewSet
        from django.http import HttpRequest
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        # Create a mock request with a superuser
        request = HttpRequest()
        try:
            request.user = User.objects.filter(is_superuser=True).first()
            if not request.user:
                request.user = User.objects.first()
        except:
            print("No users found in database")
            return
            
        # Test BoxViewSet queryset
        viewset = BoxViewSet()
        viewset.request = request
        queryset = viewset.get_queryset()
        print(f"BoxViewSet queryset works: {queryset.count()} boxes")
        
    except Exception as e:
        print(f"API endpoint test failed: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    print("Starting comprehensive database diagnostic...")
    check_database_schema()
    check_box_queryset()
    check_session_attendance()
    test_api_endpoints()
    print("\nDiagnostic complete!")
