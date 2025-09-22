-- SAFE DATABASE FIX - Step by step approach
-- Run each section separately in Supabase SQL editor

-- =================================================================
-- STEP 1: ADD MISSING COLUMNS (Safe - won't fail if columns exist)
-- =================================================================
ALTER TABLE fuel_bookdispatch ADD COLUMN IF NOT EXISTS main_center_dispatch_number VARCHAR(50);
ALTER TABLE fuel_bookdispatch ADD COLUMN IF NOT EXISTS first_serial VARCHAR(50);
ALTER TABLE fuel_bookdispatch ADD COLUMN IF NOT EXISTS last_serial VARCHAR(50);
ALTER TABLE fuel_bookdispatch ADD COLUMN IF NOT EXISTS total_coupons INTEGER DEFAULT 0;
ALTER TABLE fuel_bookdispatch ADD COLUMN IF NOT EXISTS aggregated_litres NUMERIC(14,2) DEFAULT 0;
ALTER TABLE fuel_bookdispatch ADD COLUMN IF NOT EXISTS aggregated_value_usd NUMERIC(14,2) DEFAULT 0;

-- =================================================================
-- STEP 2: GENERATE DISPATCH NUMBERS
-- =================================================================
UPDATE fuel_bookdispatch 
SET main_center_dispatch_number = 'MCFD-2025-' || LPAD(id::text, 6, '0')
WHERE main_center_dispatch_number IS NULL OR main_center_dispatch_number = '';

-- =================================================================
-- STEP 3: CHECK WHAT TABLES AND COLUMNS WE HAVE FOR CALCULATIONS
-- =================================================================
-- Run this to see the structure:
SELECT 'fuel_book columns:' as info;
SELECT column_name FROM information_schema.columns WHERE table_name = 'fuel_book';

SELECT 'fuel_coupon columns:' as info;  
SELECT column_name FROM information_schema.columns WHERE table_name = 'fuel_coupon';

SELECT 'Sample fuel_book data:' as info;
SELECT id, dispatch_id, first_coupon_number, last_coupon_number FROM fuel_book LIMIT 3;

-- =================================================================
-- STEP 4A: SIMPLE BACKFILL (if fuel_book has the right columns)
-- =================================================================
-- Try this first - using first/last coupon numbers to calculate
UPDATE fuel_bookdispatch 
SET 
    first_serial = (
        SELECT MIN(b.first_coupon_number) 
        FROM fuel_book b 
        WHERE b.dispatch_id = fuel_bookdispatch.id
    ),
    last_serial = (
        SELECT MAX(b.last_coupon_number) 
        FROM fuel_book b 
        WHERE b.dispatch_id = fuel_bookdispatch.id
    ),
    total_coupons = (
        SELECT COUNT(b.id) * 50  -- Assuming 50 coupons per book
        FROM fuel_book b 
        WHERE b.dispatch_id = fuel_bookdispatch.id
    );

-- Calculate litres and value based on coupons
UPDATE fuel_bookdispatch 
SET 
    aggregated_litres = total_coupons * 20,  -- 20 litres per coupon
    aggregated_value_usd = total_coupons * 20  -- $1 per litre
WHERE total_coupons > 0;

-- =================================================================
-- STEP 5: VERIFY THE RESULTS
-- =================================================================
SELECT 
    id,
    main_center_dispatch_number,
    first_serial,
    last_serial,
    total_coupons,
    aggregated_litres,
    aggregated_value_usd,
    created
FROM fuel_bookdispatch 
WHERE main_center_dispatch_number IS NOT NULL
ORDER BY id DESC 
LIMIT 5;