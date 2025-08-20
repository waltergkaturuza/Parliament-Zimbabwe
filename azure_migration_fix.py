#!/usr/bin/env python3
"""
Azure Migration Fix Script

This script helps fix database migration issues on Azure that commonly cause 500 errors.
It creates a safe migration to add missing fields if they don't exist.
"""

import os
import sys
import django
from django.core.management import execute_from_command_line

def setup_django():
    """Setup Django environment"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()

def check_database_schema():
    """Check if database schema matches expected models"""
    print("🔍 Checking database schema...")
    
    from django.db import connection
    from fuel.models import Box
    
    # Get table info
    cursor = connection.cursor()
    
    # Check if the fuel_box table exists
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'fuel_box';
    """)
    
    box_table_exists = cursor.fetchone() is not None
    print(f"   Box table exists: {box_table_exists}")
    
    if box_table_exists:
        # Check for specific columns that might be missing
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'fuel_box' AND table_schema = 'public';
        """)
        
        columns = [row[0] for row in cursor.fetchall()]
        print(f"   Box table columns: {len(columns)} found")
        
        # Check for commonly missing fields
        expected_fields = [
            'total_value_usd',
            'total_value_zwg', 
            'verified_at',
            'verified_by_id',
            'total_coupons_calculated',
            'total_litres'
        ]
        
        missing_fields = []
        for field in expected_fields:
            if field not in columns:
                missing_fields.append(field)
        
        if missing_fields:
            print(f"   ❌ Missing fields: {missing_fields}")
            return False, missing_fields
        else:
            print(f"   ✅ All expected fields present")
            return True, []
    
    return False, ["Table doesn't exist"]

def create_safe_migration():
    """Create a safe migration that adds missing fields"""
    print("🛠️  Creating safe migration for missing fields...")
    
    migration_content = '''
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('fuel', '0001_initial'),  # Adjust this to your latest migration
    ]

    operations = [
        # Add fields that might be missing, but only if they don't exist
        migrations.RunSQL(
            """
            DO $$ 
            BEGIN
                -- Add total_value_usd if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'fuel_box' AND column_name = 'total_value_usd'
                ) THEN
                    ALTER TABLE fuel_box ADD COLUMN total_value_usd DECIMAL(10,2) DEFAULT 0;
                END IF;
                
                -- Add total_value_zwg if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'fuel_box' AND column_name = 'total_value_zwg'
                ) THEN
                    ALTER TABLE fuel_box ADD COLUMN total_value_zwg DECIMAL(15,2) DEFAULT 0;
                END IF;
                
                -- Add verified_at if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'fuel_box' AND column_name = 'verified_at'
                ) THEN
                    ALTER TABLE fuel_box ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE NULL;
                END IF;
                
                -- Add verified_by_id if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'fuel_box' AND column_name = 'verified_by_id'
                ) THEN
                    ALTER TABLE fuel_box ADD COLUMN verified_by_id INTEGER NULL;
                    ALTER TABLE fuel_box ADD CONSTRAINT fuel_box_verified_by_id_fkey 
                    FOREIGN KEY (verified_by_id) REFERENCES fuel_user(id) DEFERRABLE INITIALLY DEFERRED;
                END IF;
                
                -- Add total_coupons_calculated if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'fuel_box' AND column_name = 'total_coupons_calculated'
                ) THEN
                    ALTER TABLE fuel_box ADD COLUMN total_coupons_calculated INTEGER DEFAULT 0;
                END IF;
                
                -- Add total_litres if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'fuel_box' AND column_name = 'total_litres'
                ) THEN
                    ALTER TABLE fuel_box ADD COLUMN total_litres DECIMAL(10,2) DEFAULT 0;
                END IF;
            END $$;
            """,
            reverse_sql="-- No reverse operation needed"
        ),
    ]
'''
    
    # Write migration file
    migration_dir = "fuel/migrations"
    if not os.path.exists(migration_dir):
        os.makedirs(migration_dir)
    
    # Find next migration number
    import glob
    existing_migrations = glob.glob(f"{migration_dir}/[0-9][0-9][0-9][0-9]_*.py")
    if existing_migrations:
        last_migration = max(existing_migrations)
        next_num = int(os.path.basename(last_migration)[:4]) + 1
    else:
        next_num = 2  # Start from 0002 assuming 0001_initial exists
    
    migration_filename = f"{migration_dir}/{next_num:04d}_fix_missing_fields.py"
    
    with open(migration_filename, 'w') as f:
        f.write(migration_content)
    
    print(f"   ✅ Created migration: {migration_filename}")
    return migration_filename

def apply_migrations():
    """Apply all pending migrations"""
    print("🚀 Applying migrations...")
    
    try:
        # Make migrations first
        execute_from_command_line(['manage.py', 'makemigrations'])
        print("   ✅ Made migrations")
        
        # Apply migrations
        execute_from_command_line(['manage.py', 'migrate'])
        print("   ✅ Applied migrations")
        
        return True
    except Exception as e:
        print(f"   ❌ Migration failed: {str(e)}")
        return False

def main():
    """Main function"""
    print("🔧 AZURE MIGRATION FIX TOOL")
    print("=" * 50)
    
    try:
        setup_django()
        print("✅ Django setup complete")
        
        # Check current schema
        schema_ok, missing_fields = check_database_schema()
        
        if not schema_ok:
            print(f"❌ Schema issues detected: {missing_fields}")
            
            # Create and apply safe migration
            create_safe_migration()
            
            if apply_migrations():
                print("✅ Migrations applied successfully")
                
                # Re-check schema
                schema_ok, missing_fields = check_database_schema()
                if schema_ok:
                    print("✅ Database schema is now correct")
                else:
                    print(f"⚠️  Some issues remain: {missing_fields}")
            else:
                print("❌ Migration application failed")
        else:
            print("✅ Database schema is correct")
            
    except Exception as e:
        print(f"💥 Error: {str(e)}")
        return 1
    
    print("\n🎉 Migration fix complete!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
