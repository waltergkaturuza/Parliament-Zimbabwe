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

-- Add unique constraint for coupon_serial (with error handling)
DO $$ 
BEGIN
    ALTER TABLE fuel_coupon ADD CONSTRAINT fuel_coupon_coupon_serial_unique UNIQUE (coupon_serial);
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists, skip
        NULL;
END $$;

-- Mark migrations as applied (safe approach)
INSERT INTO django_migrations (app, name, applied) 
SELECT 'fuel', '10014_add_centralized_generation_fields', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM django_migrations 
    WHERE app = 'fuel' AND name = '10014_add_centralized_generation_fields'
);

INSERT INTO django_migrations (app, name, applied) 
SELECT 'fuel', '10015_remove_book_total_coupons_remove_coupon_fuel_type_and_more', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM django_migrations 
    WHERE app = 'fuel' AND name = '10015_remove_book_total_coupons_remove_coupon_fuel_type_and_more'
);

INSERT INTO django_migrations (app, name, applied) 
SELECT 'fuel', '10016_remove_book_total_coupons_remove_coupon_fuel_type_and_more', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM django_migrations 
    WHERE app = 'fuel' AND name = '10016_remove_book_total_coupons_remove_coupon_fuel_type_and_more'
);
