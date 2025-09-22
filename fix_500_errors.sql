-- FIX FOR 500 ERRORS - Based on diagnostic results
-- The issue is NULL to_center_id values causing API failures

-- =================================================================
-- 1. IDENTIFY THE ROOT CAUSE
-- =================================================================
-- Check how many dispatches have NULL to_center_id
SELECT 
    COUNT(*) as total_dispatches,
    COUNT(CASE WHEN to_center_id IS NULL THEN 1 END) as missing_center_id,
    COUNT(CASE WHEN to_center_id IS NOT NULL THEN 1 END) as with_center_id
FROM fuel_bookdispatch;

-- Check what centers are available
SELECT id, name FROM fuel_subcenter ORDER BY id LIMIT 10;

-- =================================================================
-- 2. FIX THE NULL to_center_id ISSUE
-- =================================================================
-- Option A: Set a default center for dispatches with NULL to_center_id
-- First, let's see if there's a main center we can use as default
SELECT id, name, is_main_center 
FROM fuel_subcenter 
WHERE is_main_center = true OR name ILIKE '%main%' OR name ILIKE '%head%'
LIMIT 5;

-- If there's a main center, use it as default (replace '1' with actual main center ID)
-- UPDATE fuel_bookdispatch 
-- SET to_center_id = 1 
-- WHERE to_center_id IS NULL;

-- Option B: Create a default "Main Center" if none exists
INSERT INTO fuel_subcenter (name, is_main_center, created, updated)
VALUES ('Main Fuel Center', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Get the main center ID and update NULL dispatches
UPDATE fuel_bookdispatch 
SET to_center_id = (
    SELECT id FROM fuel_subcenter 
    WHERE is_main_center = true OR name = 'Main Fuel Center'
    LIMIT 1
)
WHERE to_center_id IS NULL;

-- =================================================================
-- 3. VERIFY THE FIX
-- =================================================================
-- Check that all dispatches now have to_center_id
SELECT 
    COUNT(*) as total_dispatches,
    COUNT(CASE WHEN to_center_id IS NULL THEN 1 END) as still_missing_center_id,
    COUNT(CASE WHEN to_center_id IS NOT NULL THEN 1 END) as fixed_center_id
FROM fuel_bookdispatch;

-- Show sample of fixed records
SELECT 
    id,
    main_center_dispatch_number,
    to_center_id,
    total_coupons,
    aggregated_litres,
    created
FROM fuel_bookdispatch 
ORDER BY id DESC 
LIMIT 5;