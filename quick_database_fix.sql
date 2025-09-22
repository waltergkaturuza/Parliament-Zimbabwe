-- QUICK FIX: Essential database schema updates for immediate functionality
-- Run this directly in Supabase SQL editor

-- =================================================================
-- CRITICAL FIXES FOR IMMEDIATE FUNCTIONALITY
-- =================================================================

-- 1. Ensure all aggregate columns exist
ALTER TABLE fuel_bookdispatch ADD COLUMN IF NOT EXISTS main_center_dispatch_number VARCHAR(50);
ALTER TABLE fuel_bookdispatch ADD COLUMN IF NOT EXISTS first_serial VARCHAR(50);
ALTER TABLE fuel_bookdispatch ADD COLUMN IF NOT EXISTS last_serial VARCHAR(50);
ALTER TABLE fuel_bookdispatch ADD COLUMN IF NOT EXISTS total_coupons INTEGER DEFAULT 0;
ALTER TABLE fuel_bookdispatch ADD COLUMN IF NOT EXISTS aggregated_litres NUMERIC(14,2) DEFAULT 0;
ALTER TABLE fuel_bookdispatch ADD COLUMN IF NOT EXISTS aggregated_value_usd NUMERIC(14,2) DEFAULT 0;

-- 2. Generate dispatch numbers for all records
UPDATE fuel_bookdispatch 
SET main_center_dispatch_number = 'MCFD-2025-' || LPAD(id::text, 6, '0')
WHERE main_center_dispatch_number IS NULL;

-- 3. Quick backfill of aggregate data (FIXED VERSION)
-- First, let's calculate based on coupon numbers since total_coupons column doesn't exist
UPDATE fuel_bookdispatch 
SET 
    total_coupons = COALESCE((
        SELECT COUNT(c.id) 
        FROM fuel_book b 
        JOIN fuel_coupon c ON c.book_id = b.id
        WHERE b.dispatch_id = fuel_bookdispatch.id
    ), 0),
    aggregated_litres = COALESCE((
        SELECT COUNT(c.id) * 20
        FROM fuel_book b 
        JOIN fuel_coupon c ON c.book_id = b.id
        WHERE b.dispatch_id = fuel_bookdispatch.id
    ), 0),
    aggregated_value_usd = COALESCE((
        SELECT COUNT(c.id) * 20
        FROM fuel_book b 
        JOIN fuel_coupon c ON c.book_id = b.id
        WHERE b.dispatch_id = fuel_bookdispatch.id
    ), 0),
    first_serial = (
        SELECT MIN(b.first_coupon_number) 
        FROM fuel_book b 
        WHERE b.dispatch_id = fuel_bookdispatch.id
    ),
    last_serial = (
        SELECT MAX(b.last_coupon_number) 
        FROM fuel_book b 
        WHERE b.dispatch_id = fuel_bookdispatch.id
    );

-- 4. Verify the fix worked
SELECT 
    COUNT(*) as total_dispatches,
    COUNT(CASE WHEN total_coupons > 0 THEN 1 END) as with_data,
    SUM(total_coupons) as total_coupons,
    SUM(aggregated_litres) as total_litres
FROM fuel_bookdispatch;