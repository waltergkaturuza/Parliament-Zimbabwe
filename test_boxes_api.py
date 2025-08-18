#!/usr/bin/env python
"""
Test script to identify the specific error in the boxes API endpoint
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_local')
django.setup()

from fuel.models import Box, SubCenter, User
from fuel.views_main import BoxViewSet
from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser
from rest_framework.test import APIRequestFactory

def test_box_queryset():
    """Test the Box model queryset that's causing the 500 error"""
    print("Testing Box model queryset...")
    
    try:
        # Test basic Box.objects.all()
        print("1. Testing Box.objects.all()...")
        boxes = Box.objects.all()
        print(f"   Found {boxes.count()} boxes")
        
        # Test with select_related
        print("2. Testing Box.objects.all().select_related('assigned_to', 'received_by')...")
        boxes_with_relations = Box.objects.all().select_related('assigned_to', 'received_by')
        print(f"   Found {boxes_with_relations.count()} boxes with relations")
        
        # Test iterating through boxes
        print("3. Testing iteration through boxes...")
        for i, box in enumerate(boxes_with_relations[:5]):  # Test first 5 only
            print(f"   Box {i+1}: {box.box_code} - assigned_to: {box.assigned_to}, received_by: {box.received_by}")
        
        print("✓ Box queryset tests passed")
        return True
        
    except Exception as e:
        print(f"✗ Error in Box queryset: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_box_viewset():
    """Test the BoxViewSet get_queryset method"""
    print("\nTesting BoxViewSet...")
    
    try:
        # Create a mock request
        factory = APIRequestFactory()
        request = factory.get('/api/v1/boxes/')
        
        # Create a test user
        try:
            user = User.objects.filter(is_superuser=True).first()
            if not user:
                user = User.objects.create_superuser('testadmin', 'test@example.com', 'testpass123')
        except Exception as e:
            print(f"   Warning: Could not create/get superuser: {e}")
            user = AnonymousUser()
        
        request.user = user
        
        # Test BoxViewSet
        viewset = BoxViewSet()
        viewset.request = request
        
        print("4. Testing BoxViewSet.get_queryset()...")
        queryset = viewset.get_queryset()
        print(f"   BoxViewSet queryset count: {queryset.count()}")
        
        # Test serialization
        print("5. Testing Box serialization...")
        for i, box in enumerate(queryset[:3]):  # Test first 3 only
            try:
                box_data = {
                    'id': box.id,
                    'box_code': box.box_code,
                    'fuel_type': box.fuel_type,
                    'status': box.status,
                    'assigned_to': box.assigned_to.name if box.assigned_to else None,
                    'received_by': box.received_by.get_full_name() if box.received_by else None,
                }
                print(f"   Box {i+1} serialized successfully: {box_data}")
            except Exception as e:
                print(f"   ✗ Error serializing box {i+1}: {e}")
                return False
        
        print("✓ BoxViewSet tests passed")
        return True
        
    except Exception as e:
        print(f"✗ Error in BoxViewSet: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_database_schema():
    """Test database schema for missing fields"""
    print("\nTesting database schema...")
    
    try:
        from django.db import connection
        cursor = connection.cursor()
        
        # Get Box table schema
        cursor.execute("PRAGMA table_info(fuel_box);")
        columns = cursor.fetchall()
        
        print("6. Box table columns:")
        column_names = []
        for col in columns:
            column_names.append(col[1])  # Column name is at index 1
            print(f"   - {col[1]} ({col[2]})")  # name (type)
        
        # Check for required fields
        required_fields = ['assigned_to_id', 'received_by_id', 'box_code', 'fuel_type', 'status']
        missing_fields = []
        
        for field in required_fields:
            if field not in column_names:
                missing_fields.append(field)
        
        if missing_fields:
            print(f"✗ Missing required fields: {missing_fields}")
            return False
        else:
            print("✓ All required fields present")
            return True
            
    except Exception as e:
        print(f"✗ Error checking database schema: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("=== Box API Error Diagnosis ===\n")
    
    # Run tests
    test1_passed = test_box_queryset()
    test2_passed = test_box_viewset()
    test3_passed = test_database_schema()
    
    print(f"\n=== Test Results ===")
    print(f"Box queryset test: {'PASSED' if test1_passed else 'FAILED'}")
    print(f"BoxViewSet test: {'PASSED' if test2_passed else 'FAILED'}")
    print(f"Database schema test: {'PASSED' if test3_passed else 'FAILED'}")
    
    if all([test1_passed, test2_passed, test3_passed]):
        print("\n✓ All tests passed - the issue might be elsewhere")
    else:
        print("\n✗ Some tests failed - this indicates the root cause")

if __name__ == '__main__':
    main()