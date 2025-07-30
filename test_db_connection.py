#!/usr/bin/env python
"""
Test script to verify database connection and Django setup
"""
import os
import sys
import django
import psycopg2
from psycopg2 import OperationalError

# Add the project root directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_raw_postgres_connection():
    """Test raw PostgreSQL connection with updated credentials"""
    print("🔌 Testing raw PostgreSQL connection...")
    
    connection_params = {
        'host': 'parliament-fuel-postgres.postgres.database.azure.com',
        'database': 'parliament-fuel-db',
        'user': 'yalezopkar',
        'password': 'MyNewSecurePass123',
        'port': '5432',
        'sslmode': 'require'
    }
    
    try:
        conn = psycopg2.connect(**connection_params)
        cursor = conn.cursor()
        
        # Test basic query
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print(f"✅ Raw PostgreSQL connection successful!")
        print(f"✅ PostgreSQL Version: {version[:50]}...")
        
        # Check tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        tables = cursor.fetchall()
        print(f"✅ Found {len(tables)} tables in database")
        
        cursor.close()
        conn.close()
        return True
        
    except OperationalError as e:
        print(f"❌ Raw PostgreSQL connection failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

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
    print("🔍 Testing database connections...")
    print("=" * 50)
    
    # Test raw PostgreSQL connection first
    raw_ok = test_raw_postgres_connection()
    
    if raw_ok:
        print("\n🔍 Testing Django database setup...")
        
        # Test Django database connection
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
                print("\n❌ Some Django tests failed. Check the errors above.")
        else:
            print("\n❌ Django database connection failed. Check your settings.")
    else:
        print("\n❌ Raw PostgreSQL connection failed. Check your credentials and firewall settings.")
        
    print("=" * 50)
