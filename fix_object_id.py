#!/usr/bin/env python
"""Fix object_id field to allow NULL values"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_local')
django.setup()

from django.db import connection

def fix_object_id_field():
    """Update object_id field to allow NULL"""
    print("=== Fixing object_id field to allow NULL ===")
    
    cursor = connection.cursor()
    
    try:
        # Check current schema
        cursor.execute('PRAGMA table_info(fuel_systemalert);')
        columns = cursor.fetchall()
        
        object_id_info = None
        for col in columns:
            if col[1] == 'object_id':
                object_id_info = col
                break
        
        print(f"Current object_id field: {object_id_info}")
        
        # SQLite doesn't support ALTER COLUMN, so we need to recreate the table
        print("Creating temporary table...")
        cursor.execute('''
            CREATE TABLE fuel_systemalert_new AS 
            SELECT * FROM fuel_systemalert;
        ''')
        
        print("Dropping original table...")
        cursor.execute('DROP TABLE fuel_systemalert;')
        
        print("Creating new table with correct schema...")
        cursor.execute('''
            CREATE TABLE "fuel_systemalert" (
                "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, 
                "created" datetime NOT NULL, 
                "modified" datetime NOT NULL, 
                "title" varchar(200) NOT NULL, 
                "message" text NOT NULL, 
                "alert_type" varchar(10) NOT NULL, 
                "status" varchar(15) NOT NULL, 
                "object_id" varchar(255) NULL, 
                "acknowledged_at" datetime NULL, 
                "acknowledged_by_id" bigint NULL REFERENCES "fuel_user" ("id") DEFERRABLE INITIALLY DEFERRED, 
                "content_type_id" integer NULL REFERENCES "django_content_type" ("id") DEFERRABLE INITIALLY DEFERRED, 
                "created_by_id" bigint NULL REFERENCES "fuel_user" ("id") DEFERRABLE INITIALLY DEFERRED, 
                "priority" integer NULL, 
                "target_roles" JSON NULL, 
                "expires_at" datetime NULL, 
                "is_dismissible" boolean NULL
            );
        ''')
        
        print("Copying data back...")
        cursor.execute('''
            INSERT INTO fuel_systemalert 
            SELECT * FROM fuel_systemalert_new;
        ''')
        
        print("Dropping temporary table...")
        cursor.execute('DROP TABLE fuel_systemalert_new;')
        
        print("Creating indexes...")
        cursor.execute('CREATE INDEX "fuel_systemalert_alert_type_b5eb3169" ON "fuel_systemalert" ("alert_type");')
        cursor.execute('CREATE INDEX "fuel_systemalert_status_12853395" ON "fuel_systemalert" ("status");')
        cursor.execute('CREATE INDEX "fuel_systemalert_priority_0d9e6ae5" ON "fuel_systemalert" ("priority");')
        cursor.execute('CREATE INDEX "fuel_systemalert_created_9b76c3ac" ON "fuel_systemalert" ("created");')
        cursor.execute('CREATE INDEX "fuel_systemalert_expires_at_b8e4f74a" ON "fuel_systemalert" ("expires_at");')
        
        print("✅ Successfully updated object_id field to allow NULL")
        
        # Verify the change
        cursor.execute('PRAGMA table_info(fuel_systemalert);')
        columns = cursor.fetchall()
        
        for col in columns:
            if col[1] == 'object_id':
                print(f"Updated object_id field: {col}")
                break
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    fix_object_id_field()
