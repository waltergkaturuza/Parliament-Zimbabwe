-- DIAGNOSTIC QUERIES - Run these to identify issues causing 500 errors
-- Execute each section separately in Supabase SQL editor

-- =================================================================
-- 1. CHECK TABLE STRUCTURE
-- =================================================================
-- Verify fuel_bookdispatch table has all required columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fuel_bookdispatch'
ORDER BY ordinal_position;

-- =================================================================
-- 2. CHECK DATA INTEGRITY
-- =================================================================
-- Check for NULL values that might cause API errors
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN main_center_dispatch_number IS NULL THEN 1 END) as missing_dispatch_number,
    COUNT(CASE WHEN created IS NULL THEN 1 END) as missing_created,
    COUNT(CASE WHEN to_center_id IS NULL THEN 1 END) as missing_to_center
FROM fuel_bookdispatch;

-- Check for orphaned records
SELECT 
    COUNT(*) as dispatches_with_missing_centers
FROM fuel_bookdispatch bd
LEFT JOIN fuel_subcenter sc ON bd.to_center_id = sc.id
WHERE bd.to_center_id IS NOT NULL AND sc.id IS NULL;

-- =================================================================
-- 3. CHECK POOL VEHICLES TABLE (related to your error)
-- =================================================================
-- Check if fuel_poolvehicle table exists and has data
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_name LIKE '%vehicle%' OR table_name LIKE '%pool%';

-- If pool vehicle table exists, check its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'fuel_poolvehicle'
ORDER BY ordinal_position;

-- Check pool vehicle data
SELECT COUNT(*) as pool_vehicle_count FROM fuel_poolvehicle;

-- =================================================================
-- 4. CHECK FOREIGN KEY CONSTRAINTS
-- =================================================================
-- Look for foreign key constraint issues
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (tc.table_name = 'fuel_bookdispatch' OR tc.table_name = 'fuel_poolvehicle');

-- =================================================================
-- 5. SAMPLE DATA CHECK
-- =================================================================
-- Show sample records to identify data issues
SELECT 
    id,
    main_center_dispatch_number,
    created,
    to_center_id,
    total_coupons,
    aggregated_litres
FROM fuel_bookdispatch 
ORDER BY id DESC 
LIMIT 5;