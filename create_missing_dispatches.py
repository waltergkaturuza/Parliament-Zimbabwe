#!/usr/bin/env python
"""Create missing dispatch records to match API expectations."""

import sqlite3
import os
from datetime import datetime, timedelta
import random

def create_missing_dispatches():
    """Create missing dispatch records 4-13 to match API expectations."""
    print("🔧 Creating Missing Dispatch Records")
    print("=" * 50)
    
    # Connect to SQLite database
    db_path = os.path.join(os.path.dirname(__file__), 'backend', 'db.sqlite3')
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check current dispatches
        cursor.execute("SELECT MAX(id) FROM fuel_bookdispatch")
        max_id = cursor.fetchone()[0] or 0
        print(f"📦 Current max dispatch ID: {max_id}")
        
        # Get subcenters for assignment
        cursor.execute("SELECT id, name FROM fuel_subcenter ORDER BY id")
        subcenters = cursor.fetchall()
        print(f"🏢 Available SubCenters: {len(subcenters)}")
        
        # Get user IDs for assignment
        cursor.execute("SELECT id, username FROM auth_user WHERE username IN ('admin', 'maincenter') ORDER BY id")
        users = cursor.fetchall()
        print(f"👤 Available Users: {users}")
        
        if not subcenters or not users:
            print("❌ Need subcenters and users to create dispatches!")
            return
        
        # Create dispatch records 4-13 (to get DISP-4 through DISP-13)
        dispatches_to_create = []
        base_date = datetime.now() - timedelta(days=30)  # Start 30 days ago
        
        for i in range(4, 14):  # Create IDs 4-13 (10 dispatches)
            dispatch_date = base_date + timedelta(days=i-4, hours=random.randint(8, 18), minutes=random.randint(0, 59))
            
            # Rotate subcenters and users
            subcenter_id = subcenters[(i-4) % len(subcenters)][0]
            user_id = users[(i-4) % len(users)][0]
            
            # Vary the data
            total_coupons = 100 + (i * 10)
            status = ['DISPATCHED', 'PENDING', 'DELIVERED'][i % 3]
            
            dispatches_to_create.append((
                i,  # id
                dispatch_date.isoformat(),  # created
                dispatch_date.isoformat(),  # modified  
                dispatch_date.isoformat(),  # dispatch_date
                status,  # status
                user_id,  # dispatched_by_id
                subcenter_id,  # to_center_id
                total_coupons,  # total_coupons
                f'MCD-{i:05d}',  # main_center_dispatch_number
                f'PU006GH{i:03d}001',  # first_serial
                f'PU006GH{i:03d}{total_coupons:03d}',  # last_serial
                'CENTER_TO_CENTER',  # dispatch_type
                '[]'  # verification_checks
            ))
        
        # Insert the new dispatch records
        insert_sql = """
        INSERT INTO fuel_bookdispatch (
            id, created, modified, dispatch_date, status, dispatched_by_id,
            to_center_id, total_coupons, main_center_dispatch_number,
            first_serial, last_serial, dispatch_type, verification_checks,
            courier_service, delivery_note, driver_name, driver_phone,
            generation_mode, notes, received_date, receiver_signature,
            special_instructions, tracking_number, transport_method,
            vehicle_number, verification_notes, verified_at, verified_by,
            from_center_id, to_beneficiary_id, program_id, session_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                 NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
                 NULL, NULL, NULL, NULL, NULL, NULL, NULL,
                 NULL, NULL, NULL, NULL)
        """
        
        created_count = 0
        for dispatch_data in dispatches_to_create:
            try:
                cursor.execute(insert_sql, dispatch_data)
                created_count += 1
                print(f"   ✅ Created dispatch ID {dispatch_data[0]}: MCD-{dispatch_data[0]:05d}")
            except Exception as e:
                print(f"   ❌ Failed to create dispatch ID {dispatch_data[0]}: {e}")
        
        # Commit changes
        conn.commit()
        print(f"\n🎉 Successfully created {created_count} new dispatch records!")
        
        # Show final results
        print(f"\n📊 All Dispatch Records:")
        cursor.execute("""
        SELECT d.id, d.main_center_dispatch_number, d.to_center_id, s.name as subcenter_name, 
               d.total_coupons, d.status, d.dispatch_date
        FROM fuel_bookdispatch d
        LEFT JOIN fuel_subcenter s ON d.to_center_id = s.id
        ORDER BY d.id
        """)
        
        all_results = cursor.fetchall()
        for row in all_results:
            dispatch_id, dispatch_number, center_id, center_name, coupons, status, date = row
            print(f"   ID {dispatch_id:2d}: {dispatch_number} | {center_name or 'No Center'} | {coupons} coupons | {status}")
        
        print(f"\n✅ Database now has {len(all_results)} dispatch records (should match API response)")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    create_missing_dispatches()