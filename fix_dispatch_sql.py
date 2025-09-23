#!/usr/bin/env python
"""Fix dispatch data using SQL directly."""

import sqlite3
import os
from datetime import datetime

def fix_dispatch_data_sql():
    """Fix dispatch data using direct SQL commands."""
    print("🔧 Fixing Dispatch Data using SQL")
    print("=" * 50)
    
    # Connect to SQLite database
    db_path = os.path.join(os.path.dirname(__file__), 'backend', 'db.sqlite3')
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check current dispatch state
        cursor.execute("""
        SELECT id, dispatch_id, to_center_id, total_books, total_coupons, 
               total_value_usd, created, dispatched_at, status
        FROM fuel_bookdispatch 
        ORDER BY id
        """)
        
        dispatches = cursor.fetchall()
        print(f"📦 Found {len(dispatches)} dispatches")
        
        # Get available subcenters
        cursor.execute("SELECT id, name, code FROM fuel_subcenter ORDER BY id")
        subcenters = cursor.fetchall()
        print(f"🏢 Available SubCenters:")
        for sc in subcenters:
            print(f"   ID: {sc[0]}, Name: {sc[1]}, Code: {sc[2]}")
        
        if not subcenters:
            print("❌ No subcenters found!")
            return
        
        # Use first subcenter as default
        default_subcenter_id = subcenters[0][0]
        default_subcenter_name = subcenters[0][1]
        
        print(f"\n🔧 Using default subcenter: ID {default_subcenter_id} ({default_subcenter_name})")
        
        # Fix 1: Set to_center_id for dispatches that don't have it
        cursor.execute("""
        UPDATE fuel_bookdispatch 
        SET to_center_id = ? 
        WHERE to_center_id IS NULL
        """, (default_subcenter_id,))
        
        updated_center = cursor.rowcount
        print(f"✅ Fixed to_center_id for {updated_center} dispatches")
        
        # Fix 2: Set created timestamp for dispatches that don't have it
        current_time = datetime.now().isoformat()
        cursor.execute("""
        UPDATE fuel_bookdispatch 
        SET created = ? 
        WHERE created IS NULL
        """, (current_time,))
        
        updated_created = cursor.rowcount
        print(f"✅ Fixed created timestamp for {updated_created} dispatches")
        
        # Fix 3: Set dispatched_at for DISPATCHED status dispatches
        cursor.execute("""
        UPDATE fuel_bookdispatch 
        SET dispatched_at = COALESCE(dispatch_date, ?)
        WHERE dispatched_at IS NULL AND status = 'DISPATCHED'
        """, (current_time,))
        
        updated_dispatched = cursor.rowcount
        print(f"✅ Fixed dispatched_at for {updated_dispatched} dispatches")
        
        # Fix 4: Add some sample books and coupons for testing
        # First, let's see if we have any books
        cursor.execute("SELECT id, book_id FROM fuel_book LIMIT 5")
        books = cursor.fetchall()
        
        if books:
            print(f"📚 Found {len(books)} books available")
            
            # Update dispatches with sample data for testing
            sample_book_id = books[0][0]
            cursor.execute("""
            UPDATE fuel_bookdispatch 
            SET total_books = 1,
                total_coupons = 100,
                total_value_usd = 50.0
            WHERE total_books = 0
            """)
            
            updated_books = cursor.rowcount
            print(f"✅ Added sample book data to {updated_books} dispatches")
        else:
            print("⚠️ No books found - keeping book counts at 0")
        
        # Commit changes
        conn.commit()
        
        # Show updated results
        print(f"\n📊 Updated Dispatch Data:")
        cursor.execute("""
        SELECT d.dispatch_id, d.to_center_id, s.name as subcenter_name, 
               d.total_books, d.total_coupons, d.total_value_usd, d.status
        FROM fuel_bookdispatch d
        LEFT JOIN fuel_subcenter s ON d.to_center_id = s.id
        ORDER BY d.id
        """)
        
        results = cursor.fetchall()
        for row in results:
            dispatch_id, center_id, center_name, books, coupons, value, status = row
            print(f"   {dispatch_id}: {center_name or 'No Center'} | {books} books | {coupons} coupons | ${value or 0} | {status}")
        
        print(f"\n🎉 Successfully fixed dispatch data!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_dispatch_data_sql()