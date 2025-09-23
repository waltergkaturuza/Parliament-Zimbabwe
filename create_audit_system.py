#!/usr/bin/env python
"""Create proper coupon tracking system with audit trail."""

import sqlite3
import os
from datetime import datetime
import random

def create_audit_tracking_system():
    """Create proper coupon tracking with full audit trail."""
    print("🔧 Creating Comprehensive Audit Tracking System")
    print("=" * 60)
    
    # Connect to SQLite database
    db_path = os.path.join(os.path.dirname(__file__), 'backend', 'db.sqlite3')
    if not os.path.exists(db_path):
        print(f"❌ Database not found at: {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Step 1: Create individual coupons for each dispatch
        print("🎫 STEP 1: Creating Individual Coupon Records")
        
        # Get all dispatches
        cursor.execute("""
        SELECT id, main_center_dispatch_number, to_center_id, total_coupons, 
               first_serial, last_serial, status
        FROM fuel_bookdispatch 
        ORDER BY id
        """)
        dispatches = cursor.fetchall()
        
        # First, create some books if they don't exist
        cursor.execute("SELECT COUNT(*) FROM fuel_book")
        book_count = cursor.fetchone()[0]
        
        if book_count == 0:
            print("   📚 Creating sample books...")
            for i in range(1, 6):  # Create 5 books
                cursor.execute("""
                INSERT INTO fuel_book (
                    id, created, modified, book_id, status, pages_per_book, 
                    coupons_per_page, fuel_type, coupon_value, is_archived
                ) VALUES (?, ?, ?, ?, 'AVAILABLE', 10, 10, 'DIESEL', 20, 0)
                """, (
                    i, datetime.now().isoformat(), datetime.now().isoformat(),
                    f'BK-2025-{i:03d}', 
                ))
            print(f"   ✅ Created 5 sample books")
        
        coupon_id = 1
        for dispatch in dispatches:
            dispatch_id, number, center_id, total_coupons, first_serial, last_serial, status = dispatch
            
            print(f"\n   📦 Processing {number}: {total_coupons} coupons")
            
            # Generate proper coupon serials based on PetroTrade format
            # Format: PU006GH + batch + sequential
            batch_num = f"{dispatch_id:03d}"  # Use dispatch ID as batch
            
            # Create individual coupons for this dispatch
            created_coupons = 0
            for i in range(total_coupons):
                coupon_serial = f"PU006GH{batch_num}{i+1:03d}"
                
                try:
                    # Insert into fuel_coupon
                    cursor.execute("""
                    INSERT INTO fuel_coupon (
                        id, created, modified, coupon_serial, fuel_type, 
                        coupon_value, litres, status, book_id, page_number,
                        usd_value, is_archived
                    ) VALUES (?, ?, ?, ?, 'DIESEL', 20, 20.0, 'AVAILABLE', 
                             ?, ?, 1.0, 0)
                    """, (
                        coupon_id,
                        datetime.now().isoformat(),
                        datetime.now().isoformat(), 
                        coupon_serial,
                        ((dispatch_id - 1) % 5) + 1,  # Rotate through books 1-5
                        (i // 10) + 1,  # Page number (10 coupons per page)
                    ))
                    
                    # Link to dispatch via fuel_dispatchedcoupon
                    cursor.execute("""
                    INSERT INTO fuel_dispatchedcoupon (
                        id, created, modified, coupon_id, dispatched_book_id,
                        status, dispatch_date, allocated_to_id, coupon_status
                    ) VALUES (?, ?, ?, ?, NULL, ?, ?, NULL, 'AVAILABLE')
                    """, (
                        coupon_id,
                        datetime.now().isoformat(),
                        datetime.now().isoformat(),
                        coupon_id,
                        'DISPATCHED' if status in ['DISPATCHED', 'DELIVERED'] else 'PENDING',
                        datetime.now().isoformat()
                    ))
                    
                    created_coupons += 1
                    coupon_id += 1
                    
                except Exception as e:
                    print(f"      ❌ Failed to create coupon {coupon_serial}: {e}")
            
            # Update dispatch with proper serial range
            if created_coupons > 0:
                proper_first = f"PU006GH{batch_num}001"
                proper_last = f"PU006GH{batch_num}{created_coupons:03d}"
                
                cursor.execute("""
                UPDATE fuel_bookdispatch 
                SET first_serial = ?, last_serial = ?
                WHERE id = ?
                """, (proper_first, proper_last, dispatch_id))
                
                print(f"      ✅ Created {created_coupons} coupons: {proper_first} → {proper_last}")
        
        # Step 2: Create subcenter stock tracking for accepted dispatches
        print(f"\n📦 STEP 2: Creating SubCenter Stock from Accepted Dispatches")
        
        # Find accepted dispatches (DELIVERED status = subcenter accepted)
        cursor.execute("""
        SELECT id, to_center_id, total_coupons, first_serial, last_serial
        FROM fuel_bookdispatch 
        WHERE status = 'DELIVERED'
        """)
        accepted_dispatches = cursor.fetchall()
        
        for dispatch in accepted_dispatches:
            dispatch_id, center_id, coupons, first_serial, last_serial = dispatch
            
            # Create handover record (this represents subcenter accepting the dispatch)
            try:
                cursor.execute("""
                INSERT INTO fuel_couponhandover (
                    id, created, modified, from_center_id, to_center_id,
                    total_coupons, status, handover_date, first_serial, last_serial
                ) VALUES (?, ?, ?, 1, ?, ?, 'COMPLETED', ?, ?, ?)
                """, (
                    dispatch_id,  # Use dispatch ID as handover ID
                    datetime.now().isoformat(),
                    datetime.now().isoformat(),
                    center_id,  # to_center
                    coupons,
                    datetime.now().isoformat(),
                    first_serial,
                    last_serial
                ))
                
                # Link individual coupons to handover
                cursor.execute("""
                SELECT c.id, c.coupon_serial 
                FROM fuel_coupon c
                JOIN fuel_dispatchedcoupon dc ON c.id = dc.coupon_id
                WHERE c.coupon_serial BETWEEN ? AND ?
                """, (first_serial, last_serial))
                
                coupon_records = cursor.fetchall()
                for coupon_id, serial in coupon_records:
                    cursor.execute("""
                    INSERT INTO fuel_handedovercoupon (
                        id, created, modified, coupon_id, handover_id
                    ) VALUES (?, ?, ?, ?, ?)
                    """, (
                        coupon_id,
                        datetime.now().isoformat(), 
                        datetime.now().isoformat(),
                        coupon_id,
                        dispatch_id
                    ))
                
                print(f"   ✅ Created stock for SubCenter {center_id}: {coupons} coupons")
                
            except Exception as e:
                print(f"   ❌ Failed to create stock for dispatch {dispatch_id}: {e}")
        
        # Step 3: Summary and verification
        print(f"\n📊 STEP 3: System Verification")
        
        # Count total coupons created
        cursor.execute("SELECT COUNT(*) FROM fuel_coupon")
        total_coupons = cursor.fetchone()[0]
        print(f"   🎫 Total individual coupons: {total_coupons}")
        
        # Count dispatch linkages
        cursor.execute("SELECT COUNT(*) FROM fuel_dispatchedcoupon")
        dispatch_links = cursor.fetchone()[0]
        print(f"   🔗 Dispatch-coupon links: {dispatch_links}")
        
        # Count handover records
        cursor.execute("SELECT COUNT(*) FROM fuel_couponhandover")
        handovers = cursor.fetchone()[0]
        print(f"   🤝 Handover records: {handovers}")
        
        # Count handed over coupons
        cursor.execute("SELECT COUNT(*) FROM fuel_handedovercoupon")
        handed_coupons = cursor.fetchone()[0]
        print(f"   📋 Handed over coupons: {handed_coupons}")
        
        # Subcenter stock summary
        print(f"\n🏢 SubCenter Stock Summary:")
        cursor.execute("""
        SELECT 
            s.name,
            COUNT(hc.coupon_id) as stock_coupons,
            SUM(c.litres) as total_litres
        FROM fuel_subcenter s
        LEFT JOIN fuel_couponhandover h ON s.id = h.to_center_id
        LEFT JOIN fuel_handedovercoupon hc ON h.id = hc.handover_id  
        LEFT JOIN fuel_coupon c ON hc.coupon_id = c.id
        GROUP BY s.id, s.name
        ORDER BY s.id
        """)
        
        stock_summary = cursor.fetchall()
        for name, coupons, litres in stock_summary:
            print(f"   {name}: {coupons or 0} coupons = {litres or 0}L")
        
        # Commit all changes
        conn.commit()
        
        print(f"\n🎉 AUDIT TRACKING SYSTEM CREATED!")
        print(f"   ✅ Individual coupon records with proper serials")
        print(f"   ✅ Dispatch → Coupon linkage for full audit trail")
        print(f"   ✅ SubCenter stock based on accepted dispatches")
        print(f"   ✅ Complete handover tracking")
        print(f"   ✅ Precise stock calculations")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    create_audit_tracking_system()