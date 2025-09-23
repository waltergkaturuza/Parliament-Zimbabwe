#!/usr/bin/env python
"""Fix dispatch data with correct column names."""

import sqlite3
import os
from datetime import datetime

def fix_dispatch_data():
    """Fix dispatch data with correct columns."""
    print("🔧 Fixing Dispatch Data")
    print("=" * 50)
    
    # Connect to SQLite database
    db_path = os.path.join(os.path.dirname(__file__), 'backend', 'db.sqlite3')
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Get current dispatch state
        cursor.execute("""
        SELECT id, to_center_id, total_coupons, status, dispatch_date, 
               main_center_dispatch_number
        FROM fuel_bookdispatch 
        ORDER BY id
        """)
        
        dispatches = cursor.fetchall()
        print(f"📦 Found {len(dispatches)} dispatches")
        
        # Get available subcenters
        cursor.execute("SELECT id, name FROM fuel_subcenter")
        subcenters = cursor.fetchall()
        print(f"🏢 Available SubCenters:")
        for sc in subcenters:
            print(f"   ID: {sc[0]}, Name: {sc[1]}")
        
        if not subcenters:
            print("❌ No subcenters found!")
            return
        
        # Fix dispatches with issues
        fixes_applied = 0
        
        for dispatch in dispatches:
            dispatch_id, to_center_id, total_coupons, status, dispatch_date, dispatch_number = dispatch
            
            needs_fix = False
            fixes = []
            
            # Check if to_center_id is missing and subcenter exists
            if not to_center_id:
                # Assign to first available subcenter
                new_center_id = subcenters[0][0]
                cursor.execute("""
                UPDATE fuel_bookdispatch 
                SET to_center_id = ? 
                WHERE id = ?
                """, (new_center_id, dispatch_id))
                needs_fix = True
                fixes.append(f"Set to_center_id to {new_center_id}")
            
            # Add sample coupons if none exist
            if total_coupons == 0:
                cursor.execute("""
                UPDATE fuel_bookdispatch 
                SET total_coupons = 100,
                    first_serial = 'PU006GH355001',
                    last_serial = 'PU006GH355100'
                WHERE id = ?
                """, (dispatch_id,))
                needs_fix = True
                fixes.append(f"Added 100 sample coupons")
            
            if needs_fix:
                fixes_applied += 1
                print(f"   ✅ Fixed Dispatch {dispatch_number}: {', '.join(fixes)}")
        
        # Commit changes
        conn.commit()
        
        print(f"\n🎉 Applied fixes to {fixes_applied} dispatches")
        
        # Show updated results
        print(f"\n📊 Updated Dispatch Data:")
        cursor.execute("""
        SELECT d.id, d.main_center_dispatch_number, d.to_center_id, s.name as subcenter_name, 
               d.total_coupons, d.status, d.dispatch_date
        FROM fuel_bookdispatch d
        LEFT JOIN fuel_subcenter s ON d.to_center_id = s.id
        ORDER BY d.id
        """)
        
        results = cursor.fetchall()
        for row in results:
            dispatch_id, dispatch_number, center_id, center_name, coupons, status, date = row
            print(f"   {dispatch_number}: {center_name or 'No Center'} | {coupons} coupons | {status} | {date}")
        
        print(f"\n✅ Dispatch data fixes completed!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_dispatch_data()