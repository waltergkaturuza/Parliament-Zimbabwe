-- CRITICAL AZURE PRODUCTION DATABASE FIX
-- Run this SQL script if Django migrations are not working
-- Database: parliament-fuel-postgres.postgres.database.azure.com
-- Database Name: parliament-fuel-db

-- Fix missing digital_signature and related fields in fuel_user table
ALTER TABLE fuel_user ADD COLUMN IF NOT EXISTS digital_signature TEXT;
ALTER TABLE fuel_user ADD COLUMN IF NOT EXISTS signature_uploaded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE fuel_user ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(100);
ALTER TABLE fuel_user ADD COLUMN IF NOT EXISTS full_address TEXT;
ALTER TABLE fuel_user ADD COLUMN IF NOT EXISTS national_id VARCHAR(50);

-- Fix missing book tracking fields in fuel_book table
ALTER TABLE fuel_book ADD COLUMN IF NOT EXISTS book_code VARCHAR(20);
ALTER TABLE fuel_book ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE fuel_book ADD COLUMN IF NOT EXISTS generated_by_id INTEGER;
ALTER TABLE fuel_book ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE fuel_book ADD COLUMN IF NOT EXISTS verified_by_id INTEGER;
ALTER TABLE fuel_book ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE fuel_book ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fuel_book_generated_by_id_fk'
    ) THEN
        ALTER TABLE fuel_book ADD CONSTRAINT fuel_book_generated_by_id_fk 
            FOREIGN KEY (generated_by_id) REFERENCES fuel_user(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fuel_book_verified_by_id_fk'
    ) THEN
        ALTER TABLE fuel_book ADD CONSTRAINT fuel_book_verified_by_id_fk 
            FOREIGN KEY (verified_by_id) REFERENCES fuel_user(id);
    END IF;
END $$;

-- Update django_migrations table to mark migration as applied
INSERT INTO django_migrations (app, name, applied) 
VALUES ('fuel', '0008_enhance_book_coupon_tracking', NOW())
ON CONFLICT DO NOTHING;

-- Verify the fix
SELECT 
    'fuel_user.digital_signature' as field,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fuel_user' AND column_name = 'digital_signature'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 
    'fuel_book.book_code' as field,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fuel_book' AND column_name = 'book_code'
    ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Check migration status
SELECT app, name, applied FROM django_migrations 
WHERE app = 'fuel' 
ORDER BY applied DESC 
LIMIT 5;
