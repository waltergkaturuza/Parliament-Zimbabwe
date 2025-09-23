#!/usr/bin/env python
"""Check database tables and create missing dispatches."""

import sqlite3
import os
from datetime import datetime, timedelta
import random

def check_tables_and_create_dispatches():
    """Check available tables and create missing dispatches."""
    print("🔧 Checking Database Tables and Creating Dispatches")
    print("=" * 60)
    
    # Connect to SQLite database
    db_path = os.path.join(os.path.dirname(__file__), 'backend', 'db.sqlite3')
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # List all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = cursor.fetchall()
        print(f"📋 Available tables:")
        for table in tables:
            print(f"   - {table[0]}")
        
        # Find user table
        user_tables = [t[0] for t in tables if 'user' in t[0].lower()]
        print(f"\n👤 User-related tables: {user_tables}")
        
        # Check fuel_user table
        if 'fuel_user' in [t[0] for t in tables]:
            cursor.execute("SELECT id, username FROM fuel_user WHERE username IN ('admin', 'maincenter') ORDER BY id")
            users = cursor.fetchall()
            print(f"👤 Users from fuel_user: {users}")
        else:
            # Create dummy users in dispatch table (just use IDs)
            users = [(1, 'admin'), (2, 'maincenter')]
            print(f"👤 Using dummy user IDs: {users}")
        
        # Get subcenters
        cursor.execute("SELECT id, name FROM fuel_subcenter ORDER BY id")
        subcenters = cursor.fetchall()
        print(f"🏢 Available SubCenters: {subcenters}")
        
        # Create dispatch records 4-13
        print(f"\n📦 Creating missing dispatch records...")
        
        base_date = datetime.now() - timedelta(days=10)
        created_count = 0
        
        for i in range(4, 14):  # Create IDs 4-13
            dispatch_date = base_date + timedelta(days=i-4, hours=10+i, minutes=30)
            
            # Rotate assignments
            subcenter_id = subcenters[(i-1) % len(subcenters)][0] if subcenters else 1
            user_id = users[(i-1) % len(users)][0] if users else 1
            
            total_coupons = 100 + (i * 5)
            status_options = ['DISPATCHED', 'PENDING', 'DELIVERED']
            status = status_options[i % 3]
            
            try:
                cursor.execute("""
                INSERT INTO fuel_bookdispatch (
                    id, created, modified, dispatch_date, status, 
                    dispatched_by_id, to_center_id, total_coupons,
                    main_center_dispatch_number, first_serial, last_serial,
                    dispatch_type, verification_checks
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    i,  # id
                    dispatch_date.isoformat(),  # created
                    dispatch_date.isoformat(),  # modified
                    dispatch_date.isoformat(),  # dispatch_date
                    status,  # status
                    user_id,  # dispatched_by_id
                    subcenter_id,  # to_center_id
                    total_coupons,  # total_coupons
                    f'MCD-{i:05d}',  # main_center_dispatch_number
                    f'TRK-2025-{random.randint(100000, 999999)}',  # first_serial
                    f'TRK-2025-{random.randint(100000, 999999)}',  # last_serial
                    'CENTER_TO_CENTER',  # dispatch_type
                    '[]'  # verification_checks
                ))
                
                created_count += 1
                print(f"   ✅ Created DISP-{i}: {total_coupons} coupons, {status}")
                
            except Exception as e:
                print(f"   ❌ Failed to create DISP-{i}: {e}")
        
        # Commit changes
        conn.commit()
        print(f"\n🎉 Successfully created {created_count} dispatch records!")
        
        # Show all dispatches
        print(f"\n📊 All Dispatch Records:")
        cursor.execute("""
        SELECT d.id, d.main_center_dispatch_number, s.name as subcenter_name, 
               d.total_coupons, d.status
        FROM fuel_bookdispatch d
        LEFT JOIN fuel_subcenter s ON d.to_center_id = s.id
        ORDER BY d.id
        """)
        
        all_dispatches = cursor.fetchall()
        for row in all_dispatches:
            dispatch_id, dispatch_number, center_name, coupons, status = row
            print(f"   DISP-{dispatch_id}: {center_name or 'No Center'} | {coupons} coupons | {status}")
        
        print(f"\n✅ Database now has {len(all_dispatches)} dispatch records")
        print("   API should now show complete data for all dispatches!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    check_tables_and_create_dispatches()