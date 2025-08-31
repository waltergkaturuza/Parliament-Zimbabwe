-- Quick Supabase Fix for Centralized Book Generation
-- Run this in Supabase SQL Editor if you need a minimal fix

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

-- Update coupon_serial to have proper default
ALTER TABLE fuel_coupon ALTER COLUMN coupon_serial SET DEFAULT 'NOT_PROVIDED';

-- Add unique constraint for coupon_serial (with proper error handling)
DO $$ 
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'fuel_coupon' 
        AND constraint_name = 'fuel_coupon_coupon_serial_unique'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE fuel_coupon ADD CONSTRAINT fuel_coupon_coupon_serial_unique UNIQUE (coupon_serial);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Any other error, log but continue
        RAISE NOTICE 'Constraint creation skipped: %', SQLERRM;
END $$;

-- CRITICAL: Clean up any existing incorrect migration records first
DELETE FROM django_migrations 
WHERE app = 'fuel' AND name IN (
    '10014_add_centralized_generation_fields',
    '10015_remove_book_total_coupons_remove_coupon_fuel_type_and_more',
    '10016_remove_book_total_coupons_remove_coupon_fuel_type_and_more'
);

-- Mark migrations as applied in CORRECT dependency order
-- 1. First ensure the dependency migration exists
INSERT INTO django_migrations (app, name, applied) 
SELECT 'fuel', '10013_add_books_relationship', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM django_migrations 
    WHERE app = 'fuel' AND name = '10013_add_books_relationship'
);

-- 2. Add small delay and insert dependent migration
SELECT pg_sleep(0.1);
INSERT INTO django_migrations (app, name, applied) 
SELECT 'fuel', '10014_add_centralized_generation_fields', NOW() + INTERVAL '1 second'
WHERE NOT EXISTS (
    SELECT 1 FROM django_migrations 
    WHERE app = 'fuel' AND name = '10014_add_centralized_generation_fields'
);

-- 3. Insert subsequent migrations with proper timing
SELECT pg_sleep(0.1);
INSERT INTO django_migrations (app, name, applied) 
SELECT 'fuel', '10015_remove_book_total_coupons_remove_coupon_fuel_type_and_more', NOW() + INTERVAL '2 seconds'
WHERE NOT EXISTS (
    SELECT 1 FROM django_migrations 
    WHERE app = 'fuel' AND name = '10015_remove_book_total_coupons_remove_coupon_fuel_type_and_more'
);

SELECT pg_sleep(0.1);
INSERT INTO django_migrations (app, name, applied) 
SELECT 'fuel', '10016_remove_book_total_coupons_remove_coupon_fuel_type_and_more', NOW() + INTERVAL '3 seconds'
WHERE NOT EXISTS (
    SELECT 1 FROM django_migrations 
    WHERE app = 'fuel' AND name = '10016_remove_book_total_coupons_remove_coupon_fuel_type_and_more'
);

-- Verification
SELECT 'MIGRATION DEPENDENCY FIX COMPLETE' as status;
SELECT app, name, applied FROM django_migrations 
WHERE app = 'fuel' AND name LIKE '1001%' 
ORDER BY applied;
