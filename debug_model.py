#!/usr/bin/env python
"""
Debug Django model introspection to see what fields BookDispatch has.
"""

import os
import django
import sys

# Add the backend directory to the path
sys.path.append('/c/Users/Administrator/Documents/POZ\fuel_coupon_system\backend')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from fuel.models import BookDispatch
from django.db import connection

def debug_model():
    """Debug the BookDispatch model to see what fields it has."""
    
    print("🔍 DEBUGGING BOOKDISPATCH MODEL")
    print("=" * 50)
    
    # Check model fields via Django introspection
    print("📋 Model fields according to Django:")
    for field in BookDispatch._meta.get_fields():
        print(f"  - {field.name}: {type(field).__name__}")
    
    # Check if 'books' field exists
    try:
        books_field = BookDispatch._meta.get_field('books')
        print(f"\n✅ Found 'books' field: {type(books_field).__name__}")
        print(f"  - Related model: {books_field.related_model}")
        print(f"  - Related name: {books_field.related_query_name()}")
    except Exception as e:
        print(f"\n❌ 'books' field not found: {e}")
    
    # Check database schema
    print(f"\n🗃️  Database table structure:")
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(fuel_bookdispatch);")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  - {col[1]}: {col[2]}")
        
        # Check for ManyToMany table
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%bookdispatch_books%';")
        m2m_tables = cursor.fetchall()
        if m2m_tables:
            print(f"\n📊 ManyToMany tables found:")
            for table in m2m_tables:
                print(f"  - {table[0]}")
                cursor.execute(f"PRAGMA table_info({table[0]});")
                m2m_cols = cursor.fetchall()
                for col in m2m_cols:
                    print(f"    * {col[1]}: {col[2]}")
        else:
            print(f"\n❌ No ManyToMany tables found for bookdispatch_books")
    
    # Try to create an instance and see what happens
    print(f"\n🧪 Testing BookDispatch instance:")
    dispatch = BookDispatch()
    
    # List all attributes
    attrs = [attr for attr in dir(dispatch) if not attr.startswith('_')]
    book_related_attrs = [attr for attr in attrs if 'book' in attr.lower()]
    
    print(f"  - Total attributes: {len(attrs)}")
    print(f"  - Book-related attributes: {book_related_attrs}")
    
    # Check if books attribute exists
    if hasattr(dispatch, 'books'):
        print(f"  ✅ dispatch.books exists: {type(dispatch.books)}")
    else:
        print(f"  ❌ dispatch.books does not exist")

if __name__ == "__main__":
    debug_model()
