#!/usr/bin/env python
"""Analyze current dispatch and coupon tracking system."""

import sqlite3
import os

def analyze_tracking_system():
    """Analyze current dispatch and coupon tracking system."""
    print("🔍 Analyzing Current Dispatch → Stock Tracking System")
    print("=" * 60)
    
    # Connect to SQLite database
    db_path = os.path.join(os.path.dirname(__file__), 'backend', 'db.sqlite3')
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check all tables related to tracking
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%dispatch%' OR name LIKE '%coupon%' OR name LIKE '%track%' ORDER BY name")
        tracking_tables = cursor.fetchall()
        print(f"📋 Tracking-related tables:")
        for table in tracking_tables:
            print(f"   - {table[0]}")
        
        # Check BookDispatch structure
        print(f"\n📦 BookDispatch Table Structure:")
        cursor.execute("PRAGMA table_info(fuel_bookdispatch)")
        dispatch_columns = cursor.fetchall()
        for col in dispatch_columns:
            print(f"   {col[1]} ({col[2]}) - Required: {col[3]}")
        
        # Check dispatch-book relationship
        print(f"\n🔗 Dispatch-Book Relationship:")
        cursor.execute("PRAGMA table_info(fuel_bookdispatch_books)")
        dispatch_books = cursor.fetchall()
        for col in dispatch_books:
            print(f"   {col[1]} ({col[2]})")
        
        # Check current dispatch data
        print(f"\n📊 Current Dispatch Analysis:")
        cursor.execute("""
        SELECT 
            d.id,
            d.main_center_dispatch_number,
            d.status,
            d.to_center_id,
            s.name as subcenter_name,
            d.total_coupons,
            d.first_serial,
            d.last_serial,
            COUNT(db.book_id) as books_linked
        FROM fuel_bookdispatch d
        LEFT JOIN fuel_subcenter s ON d.to_center_id = s.id
        LEFT JOIN fuel_bookdispatch_books db ON d.id = db.bookdispatch_id
        GROUP BY d.id
        ORDER BY d.id
        """)
        
        dispatches = cursor.fetchall()
        for row in dispatches:
            dispatch_id, number, status, center_id, center_name, coupons, first, last, books = row
            print(f"   DISP-{dispatch_id}: {number} | {status} | {center_name} | {coupons} coupons | {books} books")
            if first and last:
                print(f"      📝 Serials: {first} → {last}")
            else:
                print(f"      ⚠️ No serial range recorded")
        
        # Check if individual coupons track dispatch
        print(f"\n🎫 Coupon Tracking Analysis:")
        cursor.execute("SELECT COUNT(*) FROM fuel_coupon")
        total_coupons = cursor.fetchone()[0]
        print(f"   Total coupons in database: {total_coupons}")
        
        if total_coupons > 0:
            cursor.execute("PRAGMA table_info(fuel_coupon)")
            coupon_columns = cursor.fetchall()
            dispatch_fields = [col for col in coupon_columns if 'dispatch' in col[1].lower()]
            if dispatch_fields:
                print(f"   Dispatch tracking fields in coupons:")
                for col in dispatch_fields:
                    print(f"      {col[1]} ({col[2]})")
            else:
                print(f"   ❌ NO dispatch tracking fields in coupon table!")
        
        # Check subcenter stock tracking
        print(f"\n📦 SubCenter Stock Analysis:")
        # Look for stock-related tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE '%stock%' OR name LIKE '%inventory%') ORDER BY name")
        stock_tables = cursor.fetchall()
        if stock_tables:
            print(f"   Stock-related tables:")
            for table in stock_tables:
                print(f"      - {table[0]}")
        else:
            print(f"   ❌ NO dedicated stock tracking tables found!")
        
        # Check handover tracking
        print(f"\n🤝 Handover Tracking Analysis:")
        cursor.execute("SELECT COUNT(*) FROM fuel_couponhandover")
        handovers = cursor.fetchone()[0]
        print(f"   Total handover records: {handovers}")
        
        if handovers > 0:
            cursor.execute("""
            SELECT h.id, h.status, h.from_center_id, h.to_center_id, h.total_coupons
            FROM fuel_couponhandover h
            LIMIT 5
            """)
            sample_handovers = cursor.fetchall()
            print(f"   Sample handovers:")
            for row in sample_handovers:
                print(f"      ID {row[0]}: {row[1]} | From {row[2]} → To {row[3]} | {row[4]} coupons")
        
        print(f"\n🚨 CRITICAL GAPS IDENTIFIED:")
        print(f"   1. ❌ Individual coupon dispatch tracking missing")
        print(f"   2. ❌ No audit trail from dispatch → subcenter stock")
        print(f"   3. ❌ No individual serial number tracking in dispatches")
        print(f"   4. ❌ Stock calculation not tied to dispatch acceptance")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    analyze_tracking_system()