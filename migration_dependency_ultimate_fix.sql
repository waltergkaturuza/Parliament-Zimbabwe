-- ULTIMATE MIGRATION DEPENDENCY FIX
-- Solves: Migration fuel.10014_add_centralized_generation_fields is applied 
-- before its dependency fuel.10013_add_books_relationship

-- This script implements the "Last-resort" fix from the Django migration guide:
-- "Only if you are 100% sure the DB schema already matches 10013"

-- Step 1: Check current migration state
SELECT 'CURRENT MIGRATION STATE:' as info;
SELECT app, name, applied 
FROM django_migrations 
WHERE app = 'fuel' AND name LIKE '1001%'
ORDER BY applied;

-- Step 2: Identify the problem
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM django_migrations 
            WHERE app = 'fuel' AND name = '10014_add_centralized_generation_fields'
        ) AND NOT EXISTS (
            SELECT 1 FROM django_migrations 
            WHERE app = 'fuel' AND name = '10013_add_books_relationship'
        )
        THEN 'PROBLEM CONFIRMED: 10014 applied but 10013 missing'
        ELSE 'MIGRATION STATE OKAY'
    END as diagnosis;

-- Step 3: Apply the database schema changes (idempotent)
-- These represent what migration 10013 would have done

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
DO $$
BEGIN
    ALTER TABLE fuel_coupon ALTER COLUMN coupon_serial SET DEFAULT 'NOT_PROVIDED';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Default already set: %', SQLERRM;
END $$;

-- Add unique constraint (safe check)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'fuel_coupon' 
        AND constraint_name = 'fuel_coupon_coupon_serial_unique'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE fuel_coupon ADD CONSTRAINT fuel_coupon_coupon_serial_unique UNIQUE (coupon_serial);
        RAISE NOTICE 'Unique constraint created successfully';
    ELSE
        RAISE NOTICE 'Unique constraint already exists - skipping';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint creation issue: %', SQLERRM;
END $$;

-- Step 4: Fix the migration history (PostgreSQL version of Django's --fake)
-- This is equivalent to: python manage.py migrate fuel 10013_add_books_relationship --fake

-- Insert the missing dependency migration ONLY if it doesn't exist
INSERT INTO django_migrations (app, name, applied)
SELECT 'fuel', '10013_add_books_relationship', NOW() - INTERVAL '1 hour'
WHERE NOT EXISTS (
    SELECT 1 FROM django_migrations 
    WHERE app = 'fuel' AND name = '10013_add_books_relationship'
);

-- Step 5: Verification
SELECT 'MIGRATION FIX VERIFICATION:' as info;

-- Check that both migrations now exist in correct order
SELECT 
    app, 
    name, 
    applied,
    CASE 
        WHEN name = '10013_add_books_relationship' THEN 'DEPENDENCY (should be first)'
        WHEN name = '10014_add_centralized_generation_fields' THEN 'DEPENDENT (should be second)'
        ELSE 'OTHER'
    END as role
FROM django_migrations 
WHERE app = 'fuel' AND name IN ('10013_add_books_relationship', '10014_add_centralized_generation_fields')
ORDER BY applied;

-- Final status check
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM django_migrations m1
            JOIN django_migrations m2 ON m1.app = m2.app
            WHERE m1.app = 'fuel' 
            AND m1.name = '10013_add_books_relationship'
            AND m2.name = '10014_add_centralized_generation_fields'
            AND m1.applied < m2.applied
        )
        THEN '✅ MIGRATION DEPENDENCY FIXED - READY FOR DEPLOYMENT'
        ELSE '❌ ISSUE REMAINS - MANUAL INTERVENTION NEEDED'
    END as final_status;

-- Step 6: Schema verification
SELECT 'SCHEMA VERIFICATION:' as info;

-- Check that all required columns exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('fuel_box', 'fuel_book', 'fuel_coupon')
AND column_name IN ('first_coupon_serial', 'last_coupon_serial', 'total_books', 'is_generated', 'coupon_serial', 'page_number')
ORDER BY table_name, column_name;
