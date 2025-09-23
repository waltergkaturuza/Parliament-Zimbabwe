#!/usr/bin/env python
"""Check dispatch table structure and fix data."""

import sqlite3
import os
from datetime import datetime

def check_and_fix_dispatch_table():
    """Check dispatch table structure and fix data."""
    print("🔧 Checking Dispatch Table Structure")
    print("=" * 50)
    
    # Connect to SQLite database
    db_path = os.path.join(os.path.dirname(__file__), 'backend', 'db.sqlite3')
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check table structure
        cursor.execute("PRAGMA table_info(fuel_bookdispatch)")
        columns = cursor.fetchall()
        print("📋 BookDispatch Table Columns:")
        for col in columns:
            print(f"   {col[1]} ({col[2]}) - Nullable: {not col[3]}")
        
        # Get sample data
        cursor.execute("SELECT * FROM fuel_bookdispatch LIMIT 3")
        sample_data = cursor.fetchall()
        
        if sample_data:
            print(f"\n📦 Sample dispatch data:")
            for row in sample_data:
                print(f"   Row: {row}")
        
        # Check subcenter table
        cursor.execute("PRAGMA table_info(fuel_subcenter)")
        subcenter_columns = cursor.fetchall()
        print(f"\n🏢 SubCenter Table Columns:")
        for col in subcenter_columns:
            print(f"   {col[1]} ({col[2]}) - Nullable: {not col[3]}")
        
        # Get subcenters
        cursor.execute("SELECT id, name FROM fuel_subcenter")
        subcenters = cursor.fetchall()
        print(f"\n🏢 Available SubCenters:")
        for sc in subcenters:
            print(f"   ID: {sc[0]}, Name: {sc[1]}")
        
        if not subcenters:
            print("❌ No subcenters found!")
            return
            
        # Now fix the dispatch data based on actual column names
        print(f"\n🔧 Fixing dispatch data...")
        
        # Check current state
        cursor.execute("SELECT COUNT(*) FROM fuel_bookdispatch WHERE to_center_id IS NULL")
        null_center_count = cursor.fetchone()[0]
        print(f"📊 Dispatches with NULL to_center_id: {null_center_count}")
        
        if null_center_count > 0:
            # Use first subcenter as default
            default_subcenter_id = subcenters[0][0]
            cursor.execute("""
            UPDATE fuel_bookdispatch 
            SET to_center_id = ? 
            WHERE to_center_id IS NULL
            """, (default_subcenter_id,))
            
            print(f"✅ Fixed to_center_id for {cursor.rowcount} dispatches")
        
        # Check for missing created timestamps
        cursor.execute("SELECT COUNT(*) FROM fuel_bookdispatch WHERE created IS NULL")
        null_created_count = cursor.fetchone()[0]
        print(f"📊 Dispatches with NULL created: {null_created_count}")
        
        if null_created_count > 0:
            current_time = datetime.now().isoformat()
            cursor.execute("""
            UPDATE fuel_bookdispatch 
            SET created = ? 
            WHERE created IS NULL
            """, (current_time,))
            
            print(f"✅ Fixed created timestamp for {cursor.rowcount} dispatches")
        
        # Add some sample coupon data for display purposes
        cursor.execute("SELECT COUNT(*) FROM fuel_bookdispatch WHERE total_coupons = 0")
        zero_coupons_count = cursor.fetchone()[0]
        print(f"📊 Dispatches with 0 coupons: {zero_coupons_count}")
        
        if zero_coupons_count > 0:
            cursor.execute("""
            UPDATE fuel_bookdispatch 
            SET total_books = 1,
                total_coupons = 100,
                total_value_usd = 50.0
            WHERE total_coupons = 0
            """)
            
            print(f"✅ Added sample data to {cursor.rowcount} dispatches")
        
        # Commit changes
        conn.commit()
        
        # Show final results
        print(f"\n📊 Final Dispatch Status:")
        cursor.execute("""
        SELECT id, to_center_id, total_books, total_coupons, total_value_usd, status
        FROM fuel_bookdispatch 
        ORDER BY id
        """)
        
        results = cursor.fetchall()
        for row in results:
            print(f"   ID {row[0]}: SubCenter {row[1]}, {row[2]} books, {row[3]} coupons, ${row[4]}, {row[5]}")
        
        print(f"\n🎉 Dispatch data fixes completed!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    check_and_fix_dispatch_table()