-- Direct SQL script to fix Supabase database schema for Parliament Zimbabwe Fuel System
-- This script ensures all aggregate fields exist and are properly configured

-- =================================================================
-- PART 1: Add missing columns to fuel_bookdispatch table
-- =================================================================

-- Check if columns exist and add them if missing
-- Note: PostgreSQL will give an error if column already exists, so we use IF NOT EXISTS pattern

-- Add main_center_dispatch_number if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fuel_bookdispatch' 
                   AND column_name = 'main_center_dispatch_number') THEN
        ALTER TABLE fuel_bookdispatch 
        ADD COLUMN main_center_dispatch_number VARCHAR(50) NULL;
        
        RAISE NOTICE 'Added main_center_dispatch_number column';
    ELSE
        RAISE NOTICE 'main_center_dispatch_number column already exists';
    END IF;
END $$;

-- Add first_serial if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fuel_bookdispatch' 
                   AND column_name = 'first_serial') THEN
        ALTER TABLE fuel_bookdispatch 
        ADD COLUMN first_serial VARCHAR(50) NULL;
        
        RAISE NOTICE 'Added first_serial column';
    ELSE
        RAISE NOTICE 'first_serial column already exists';
    END IF;
END $$;

-- Add last_serial if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fuel_bookdispatch' 
                   AND column_name = 'last_serial') THEN
        ALTER TABLE fuel_bookdispatch 
        ADD COLUMN last_serial VARCHAR(50) NULL;
        
        RAISE NOTICE 'Added last_serial column';
    ELSE
        RAISE NOTICE 'last_serial column already exists';
    END IF;
END $$;

-- Add total_coupons if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fuel_bookdispatch' 
                   AND column_name = 'total_coupons') THEN
        ALTER TABLE fuel_bookdispatch 
        ADD COLUMN total_coupons INTEGER NOT NULL DEFAULT 0;
        
        RAISE NOTICE 'Added total_coupons column';
    ELSE
        RAISE NOTICE 'total_coupons column already exists';
    END IF;
END $$;

-- Add aggregated_litres if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fuel_bookdispatch' 
                   AND column_name = 'aggregated_litres') THEN
        ALTER TABLE fuel_bookdispatch 
        ADD COLUMN aggregated_litres NUMERIC(14,2) NOT NULL DEFAULT 0;
        
        RAISE NOTICE 'Added aggregated_litres column';
    ELSE
        RAISE NOTICE 'aggregated_litres column already exists';
    END IF;
END $$;

-- Add aggregated_value_usd if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'fuel_bookdispatch' 
                   AND column_name = 'aggregated_value_usd') THEN
        ALTER TABLE fuel_bookdispatch 
        ADD COLUMN aggregated_value_usd NUMERIC(14,2) NOT NULL DEFAULT 0;
        
        RAISE NOTICE 'Added aggregated_value_usd column';
    ELSE
        RAISE NOTICE 'aggregated_value_usd column already exists';
    END IF;
END $$;

-- =================================================================
-- PART 2: Backfill data for all BookDispatch records
-- =================================================================

-- Generate main_center_dispatch_number for records that don't have it
UPDATE fuel_bookdispatch 
SET main_center_dispatch_number = 
    'MCFD-' || 
    EXTRACT(YEAR FROM COALESCE(created, NOW())) || '-' ||
    LPAD(id::text, 6, '0')
WHERE main_center_dispatch_number IS NULL OR main_center_dispatch_number = '';

-- Calculate and populate aggregate fields based on related Book records
UPDATE fuel_bookdispatch 
SET 
    first_serial = subquery.first_serial,
    last_serial = subquery.last_serial,
    total_coupons = subquery.total_coupons,
    aggregated_litres = subquery.total_litres,
    aggregated_value_usd = subquery.total_value_usd
FROM (
    SELECT 
        bd.id as dispatch_id,
        MIN(b.first_coupon_number) as first_serial,
        MAX(b.last_coupon_number) as last_serial,
        COALESCE(SUM(b.total_coupons), 0) as total_coupons,
        COALESCE(SUM(b.total_coupons * 20), 0) as total_litres,  -- 20 litres per coupon
        COALESCE(SUM(b.total_coupons * 20 * 1.0), 0) as total_value_usd  -- $1 per litre
    FROM fuel_bookdispatch bd
    LEFT JOIN fuel_book b ON b.dispatch_id = bd.id
    GROUP BY bd.id
) subquery
WHERE fuel_bookdispatch.id = subquery.dispatch_id;

-- =================================================================
-- PART 3: Verify the changes
-- =================================================================

-- Show sample of updated records
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
ORDER BY id 
LIMIT 10;

-- Show summary statistics
SELECT 
    COUNT(*) as total_dispatches,
    COUNT(CASE WHEN main_center_dispatch_number IS NOT NULL THEN 1 END) as with_dispatch_number,
    COUNT(CASE WHEN total_coupons > 0 THEN 1 END) as with_coupons,
    SUM(total_coupons) as total_coupons_all,
    SUM(aggregated_litres) as total_litres_all,
    SUM(aggregated_value_usd) as total_value_usd_all
FROM fuel_bookdispatch;

-- =================================================================
-- PART 4: Mark migrations as applied (if needed)
-- =================================================================

-- Mark our migrations as applied in django_migrations table
-- This prevents Django from trying to run them again

INSERT INTO django_migrations (app, name, applied) 
VALUES 
    ('fuel', '10027_merge_20250922_0335', NOW()),
    ('fuel', '10028_merge_production_conflicts', NOW()),
    ('fuel', '10019_add_dispatch_aggregates_safe', NOW()),
    ('fuel', '10020_merge_20250922_conflict_resolution', NOW()),
    ('fuel', '10028_add_dispatch_aggregates_safe', NOW()),
    ('fuel', '10029_dispatch_aggregates_safe', NOW())
ON CONFLICT (app, name) DO NOTHING;

-- Show final migration state
SELECT name, applied 
FROM django_migrations 
WHERE app = 'fuel' AND name LIKE '%2025%'
ORDER BY name;