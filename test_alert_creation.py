#!/usr/bin/env python
"""Test script to debug SystemAlert creation issues"""

import os
import sys
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_local')
django.setup()

from fuel.models import SystemAlert, User
from fuel.serializers import SystemAlertSerializer
import json

def test_alert_creation():
    """Test creating a SystemAlert to identify the exact error"""
    print("=== Testing SystemAlert Creation ===")
    
    # Get a user to act as creator
    try:
        user = User.objects.filter(role='MAIN_CENTER').first()
        if not user:
            user = User.objects.first()
        print(f"Using user: {user.username} (role: {user.role})")
    except Exception as e:
        print(f"Error getting user: {e}")
        return
    
    # Test data similar to what frontend sends
    test_data = {
        'title': 'Test Alert',
        'message': 'This is a test alert',
        'alert_type': 'INFO',
        'priority': 2,
        'target_roles': ['MAIN_CENTER', 'SUB_CENTER'],
        'is_dismissible': True
    }
    
    print(f"Test data: {json.dumps(test_data, indent=2)}")
    
    # Test 1: Direct model creation
    print("\n--- Test 1: Direct Model Creation ---")
    try:
        alert = SystemAlert.objects.create(
            title=test_data['title'],
            message=test_data['message'],
            alert_type=test_data['alert_type'],
            priority=test_data['priority'],
            target_roles=test_data['target_roles'],
            is_dismissible=test_data['is_dismissible'],
            created_by=user
        )
        print(f"✅ Direct creation successful: {alert.id}")
        alert.delete()  # Clean up
    except Exception as e:
        print(f"❌ Direct creation failed: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
    
    # Test 2: Serializer validation
    print("\n--- Test 2: Serializer Validation ---")
    try:
        data_with_user = test_data.copy()
        data_with_user['created_by'] = user.id
        
        serializer = SystemAlertSerializer(data=data_with_user)
        if serializer.is_valid():
            print("✅ Serializer validation passed")
            alert = serializer.save(created_by=user)
            print(f"✅ Serializer save successful: {alert.id}")
            alert.delete()  # Clean up
        else:
            print(f"❌ Serializer validation failed: {serializer.errors}")
    except Exception as e:
        print(f"❌ Serializer failed: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
    
    # Test 3: Database schema check
    print("\n--- Test 3: Database Schema Check ---")
    try:
        from django.db import connection
        cursor = connection.cursor()
        cursor.execute('PRAGMA table_info(fuel_systemalert);')
        columns = cursor.fetchall()
        print("SystemAlert table columns:")
        for col in columns:
            print(f"  {col[1]} ({col[2]}) - null: {col[3]==0}, default: {col[4]}")
    except Exception as e:
        print(f"❌ Schema check failed: {e}")

if __name__ == '__main__':
    test_alert_creation()
