#!/usr/bin/env python
"""
Test script to verify database connection and Django setup
"""
import os
import sys
import django

# Add the project root directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection
from django.contrib.auth import get_user_model
from django.core.management import execute_from_command_line

def test_database_connection():
    """Test database connection"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            print("✅ Database connection successful!")
            print(f"Test query result: {result}")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_user_model():
    """Test user model"""
    try:
        User = get_user_model()
        user_count = User.objects.count()
        print(f"✅ User model accessible! Current user count: {user_count}")
        return True
    except Exception as e:
        print(f"❌ User model test failed: {e}")
        return False

def check_migrations():
    """Check migration status"""
    try:
        from django.core.management.commands.showmigrations import Command
        command = Command()
        print("📋 Migration status:")
        execute_from_command_line(['manage.py', 'showmigrations'])
        return True
    except Exception as e:
        print(f"❌ Migration check failed: {e}")
        return False

if __name__ == "__main__":
    print("🔍 Testing Django database setup...")
    print("=" * 50)
    
    # Test database connection
    db_ok = test_database_connection()
    
    if db_ok:
        # Test user model
        user_ok = test_user_model()
        
        # Check migrations
        migration_ok = check_migrations()
        
        if db_ok and user_ok:
            print("\n✅ All tests passed! You should be able to create a superuser now.")
            print("Run: python manage.py createsuperuser")
        else:
            print("\n❌ Some tests failed. Check the errors above.")
    else:
        print("\n❌ Database connection failed. Check your PostgreSQL settings.")
        
    print("=" * 50)
