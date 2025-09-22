"""
Django migration state diagnostic and repair script.

This script helps diagnose and fix migration conflicts in production
where the django_migrations table and codebase are out of sync.
"""

import os
import django
from django.conf import settings
from django.db import connection

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def check_migration_state():
    """Check the current state of migrations in the database."""
    with connection.cursor() as cursor:
        # Get all fuel app migrations from django_migrations table
        cursor.execute("""
            SELECT name, applied 
            FROM django_migrations 
            WHERE app = 'fuel' 
            ORDER BY name
        """)
        
        db_migrations = cursor.fetchall()
        
        print("=== MIGRATIONS IN DATABASE ===")
        for name, applied in db_migrations:
            print(f"{name} - Applied: {applied}")
            
        # Check for leaf nodes
        cursor.execute("""
            SELECT name 
            FROM django_migrations 
            WHERE app = 'fuel' 
            AND name LIKE '10018%' OR name LIKE '10027%'
            ORDER BY name
        """)
        
        leaf_migrations = cursor.fetchall()
        print("\n=== POTENTIAL LEAF NODES ===")
        for (name,) in leaf_migrations:
            print(f"- {name}")

def fake_apply_migrations():
    """Mark migrations as applied without running them (for migrations that exist in codebase but not in DB)."""
    migrations_to_fake = [
        '10027_merge_20250922_0335',
        '10031_merge_leaf_nodes',
    ]
    
    with connection.cursor() as cursor:
        for migration_name in migrations_to_fake:
            # Check if migration already exists
            cursor.execute("""
                SELECT COUNT(*) FROM django_migrations 
                WHERE app = 'fuel' AND name = %s
            """, [migration_name])
            
            if cursor.fetchone()[0] == 0:
                print(f"Fake applying migration: {migration_name}")
                cursor.execute("""
                    INSERT INTO django_migrations (app, name, applied) 
                    VALUES ('fuel', %s, NOW())
                """, [migration_name])
            else:
                print(f"Migration {migration_name} already exists in database")

if __name__ == "__main__":
    print("Checking migration state...")
    check_migration_state()
    
    print("\n" + "="*50)
    print("Would you like to fake apply missing migrations? (y/n)")
    response = input().lower().strip()
    
    if response == 'y':
        fake_apply_migrations()
        print("Migration records updated!")
        print("\nNew state:")
        check_migration_state()
    else:
        print("No changes made.")