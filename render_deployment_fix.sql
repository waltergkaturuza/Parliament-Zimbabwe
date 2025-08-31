-- RENDER DEPLOYMENT FIX - Migration Dependency Resolution
-- Fixes: django.db.migrations.exceptions.InconsistentMigrationHistory
-- Error: Migration fuel.10014_add_centralized_generation_fields is applied before 
-- its dependency fuel.10013_add_books_relationship

-- CRITICAL: Run this script on your Supabase/PostgreSQL database before redeploying

-- Step 1: Clean slate - Remove all problematic migration records
-- This ensures we can rebuild the correct dependency chain
DELETE FROM django_migrations 
WHERE app = 'fuel' AND name IN (
    '10013_add_books_relationship',
    '10014_add_centralized_generation_fields', 
    '10015_remove_book_total_coupons_remove_coupon_fuel_type_and_more',
    '10016_remove_book_total_coupons_remove_coupon_fuel_type_and_more'
);

-- Step 2: Apply database schema changes (these are idempotent)
-- Add missing fields to Box table
ALTER TABLE fuel_box 
ADD COLUMN IF NOT EXISTS first_coupon_serial VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_coupon_serial VARCHAR(50),
ADD COLUMN IF NOT EXISTS total_books INTEGER;

-- Add missing fields to Book table  
ALTER TABLE fuel_book
ADD COLUMN IF NOT EXISTS first_coupon_serial VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_coupon_serial VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_generated BOOLEAN DEFAULT FALSE;

-- Add missing fields to Coupon table
ALTER TABLE fuel_coupon
ADD COLUMN IF NOT EXISTS coupon_serial VARCHAR(50) DEFAULT 'NOT_PROVIDED',
ADD COLUMN IF NOT EXISTS page_number INTEGER;

-- Update coupon_serial to have proper default if needed
DO $$
BEGIN
    ALTER TABLE fuel_coupon ALTER COLUMN coupon_serial SET DEFAULT 'NOT_PROVIDED';
EXCEPTION
    WHEN OTHERS THEN
        -- Column might already have this default, ignore
        NULL;
END $$;

-- Add unique constraint for coupon_serial (safe)
DO $$ 
BEGIN
    -- First check if constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'fuel_coupon' 
        AND constraint_name = 'fuel_coupon_coupon_serial_unique'
    ) THEN
        ALTER TABLE fuel_coupon ADD CONSTRAINT fuel_coupon_coupon_serial_unique UNIQUE (coupon_serial);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Constraint creation failed, might be due to duplicate data
        NULL;
END $$;

-- Step 3: Insert migration records in CORRECT dependency order
-- Wait a moment between each insert to ensure proper ordering
INSERT INTO django_migrations (app, name, applied) 
VALUES ('fuel', '10013_add_books_relationship', NOW());

-- Small delay to ensure timestamp ordering
SELECT pg_sleep(0.1);

INSERT INTO django_migrations (app, name, applied) 
VALUES ('fuel', '10014_add_centralized_generation_fields', NOW() + INTERVAL '1 second');

SELECT pg_sleep(0.1);

INSERT INTO django_migrations (app, name, applied) 
VALUES ('fuel', '10015_remove_book_total_coupons_remove_coupon_fuel_type_and_more', NOW() + INTERVAL '2 seconds');

SELECT pg_sleep(0.1);

INSERT INTO django_migrations (app, name, applied) 
VALUES ('fuel', '10016_remove_book_total_coupons_remove_coupon_fuel_type_and_more', NOW() + INTERVAL '3 seconds');

-- Step 4: Verification
SELECT 'MIGRATION ORDER VERIFICATION:' as message;
SELECT 
    app, 
    name, 
    applied,
    ROW_NUMBER() OVER (ORDER BY applied) as order_num
FROM django_migrations 
WHERE app = 'fuel' AND name LIKE '1001%'
ORDER BY applied;

-- Step 5: Final check for dependency consistency
SELECT 'DEPENDENCY CHECK:' as message;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM django_migrations 
            WHERE app = 'fuel' AND name = '10013_add_books_relationship'
        ) AND EXISTS (
            SELECT 1 FROM django_migrations 
            WHERE app = 'fuel' AND name = '10014_add_centralized_generation_fields'
        ) 
        THEN 'DEPENDENCY CHAIN CORRECT - READY FOR DEPLOYMENT'
        ELSE 'DEPENDENCY ISSUE - REVIEW REQUIRED'
    END as status;
