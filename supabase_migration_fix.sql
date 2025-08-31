-- Supabase Migration Dependency Fix
-- Fixes the InconsistentMigrationHistory error by ensuring proper migration order

-- First, clean up any existing incorrect migration records
DELETE FROM django_migrations 
WHERE app = 'fuel' AND name IN (
    '10013_add_books_relationship',
    '10014_add_centralized_generation_fields', 
    '10015_remove_book_total_coupons_remove_coupon_fuel_type_and_more',
    '10016_remove_book_total_coupons_remove_coupon_fuel_type_and_more'
);

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

-- Add unique constraint for coupon_serial (with error handling)
DO $$ 
BEGIN
    ALTER TABLE fuel_coupon ADD CONSTRAINT fuel_coupon_coupon_serial_unique UNIQUE (coupon_serial);
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists, skip
        NULL;
END $$;

-- Insert migrations in correct dependency order
-- 1. First insert the dependency migration
INSERT INTO django_migrations (app, name, applied) 
VALUES ('fuel', '10013_add_books_relationship', NOW());

-- 2. Then insert the dependent migration
INSERT INTO django_migrations (app, name, applied) 
VALUES ('fuel', '10014_add_centralized_generation_fields', NOW());

-- 3. Insert subsequent migrations
INSERT INTO django_migrations (app, name, applied) 
VALUES ('fuel', '10015_remove_book_total_coupons_remove_coupon_fuel_type_and_more', NOW());

INSERT INTO django_migrations (app, name, applied) 
VALUES ('fuel', '10016_remove_book_total_coupons_remove_coupon_fuel_type_and_more', NOW());

-- Verify the migration order
SELECT app, name, applied 
FROM django_migrations 
WHERE app = 'fuel' AND name LIKE '1001%'
ORDER BY applied;
