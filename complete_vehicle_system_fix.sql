-- COMPREHENSIVE VEHICLE SYSTEM DATABASE FIX
-- This script adds all missing tables and fields for the vehicle management system

-- =================================================================
-- 1. CREATE/UPDATE POOL VEHICLES TABLE WITH ALL REQUIRED FIELDS
-- =================================================================
CREATE TABLE IF NOT EXISTS fuel_poolvehicle (
    id SERIAL PRIMARY KEY,
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modified TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add all required columns for pool vehicles (matching Django model)
ALTER TABLE fuel_poolvehicle ADD COLUMN IF NOT EXISTS registration_number VARCHAR(20) UNIQUE;
ALTER TABLE fuel_poolvehicle ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(20) DEFAULT 'CAR';
ALTER TABLE fuel_poolvehicle ADD COLUMN IF NOT EXISTS make VARCHAR(50);
ALTER TABLE fuel_poolvehicle ADD COLUMN IF NOT EXISTS model VARCHAR(50);
ALTER TABLE fuel_poolvehicle ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE fuel_poolvehicle ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(10) DEFAULT 'DIESEL';
ALTER TABLE fuel_poolvehicle ADD COLUMN IF NOT EXISTS engine_cc INTEGER;
ALTER TABLE fuel_poolvehicle ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE fuel_poolvehicle ADD COLUMN IF NOT EXISTS assigned_subcenter_id INTEGER;
ALTER TABLE fuel_poolvehicle ADD COLUMN IF NOT EXISTS current_mileage INTEGER DEFAULT 0;
ALTER TABLE fuel_poolvehicle ADD COLUMN IF NOT EXISTS last_service_date DATE;
ALTER TABLE fuel_poolvehicle ADD COLUMN IF NOT EXISTS next_service_due DATE;
ALTER TABLE fuel_poolvehicle ADD COLUMN IF NOT EXISTS insurance_expiry DATE;
-- Add timestamp columns if missing (TimeStampedModel uses 'created' and 'modified')
-- First add as nullable columns
ALTER TABLE fuel_poolvehicle ADD COLUMN IF NOT EXISTS created TIMESTAMP WITH TIME ZONE;
ALTER TABLE fuel_poolvehicle ADD COLUMN IF NOT EXISTS modified TIMESTAMP WITH TIME ZONE;

-- Update existing NULL values with current timestamp
UPDATE fuel_poolvehicle SET created = NOW() WHERE created IS NULL;
UPDATE fuel_poolvehicle SET modified = NOW() WHERE modified IS NULL;

-- Now set default for future inserts
ALTER TABLE fuel_poolvehicle ALTER COLUMN created SET DEFAULT NOW();
ALTER TABLE fuel_poolvehicle ALTER COLUMN modified SET DEFAULT NOW();

-- Add foreign key constraint for subcenter (PostgreSQL compatible)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_poolvehicle_subcenter' 
        AND table_name = 'fuel_poolvehicle'
    ) THEN
        ALTER TABLE fuel_poolvehicle 
        ADD CONSTRAINT fk_poolvehicle_subcenter 
        FOREIGN KEY (assigned_subcenter_id) REFERENCES fuel_subcenter(id);
    END IF;
END $$;

-- =================================================================
-- 2. VEHICLE DRIVERS NOT NEEDED
-- =================================================================
-- The PoolVehicle model doesn't have an assigned_drivers field,
-- so no many-to-many table is needed. Skipping this section.

-- =================================================================
-- 3. ENSURE SUBCENTER TABLE HAS REQUIRED FIELDS
-- =================================================================
-- Make sure subcenter table exists and has all needed fields (matching Django model)
ALTER TABLE fuel_subcenter ADD COLUMN IF NOT EXISTS code VARCHAR(10) UNIQUE;
ALTER TABLE fuel_subcenter ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE fuel_subcenter ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE fuel_subcenter ADD COLUMN IF NOT EXISTS managed_by_id INTEGER;
ALTER TABLE fuel_subcenter ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE fuel_subcenter ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE fuel_subcenter ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20);
ALTER TABLE fuel_subcenter ADD COLUMN IF NOT EXISTS email VARCHAR(254);
-- Add timestamp columns if missing (TimeStampedModel uses 'created' and 'modified')
-- First add as nullable columns
ALTER TABLE fuel_subcenter ADD COLUMN IF NOT EXISTS created TIMESTAMP WITH TIME ZONE;
ALTER TABLE fuel_subcenter ADD COLUMN IF NOT EXISTS modified TIMESTAMP WITH TIME ZONE;

-- Update existing NULL values with current timestamp
UPDATE fuel_subcenter SET created = NOW() WHERE created IS NULL;
UPDATE fuel_subcenter SET modified = NOW() WHERE modified IS NULL;

-- Now set default for future inserts
ALTER TABLE fuel_subcenter ALTER COLUMN created SET DEFAULT NOW();
ALTER TABLE fuel_subcenter ALTER COLUMN modified SET DEFAULT NOW();

-- =================================================================
-- 4. CREATE DEFAULT DATA
-- =================================================================
-- First, let's see what columns exist in fuel_subcenter
SELECT 'SUBCENTER TABLE COLUMNS:' as section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fuel_subcenter'
ORDER BY ordinal_position;

-- You already have SUB-001 through SUB-004 in production, so no need to insert more
-- Just ensure they have proper values for required fields
UPDATE fuel_subcenter SET is_active = true WHERE is_active IS NULL;
UPDATE fuel_subcenter SET location = 'Parliament Building Harare' WHERE location IS NULL AND code = 'SUB-001';

-- Add sample pool vehicles with all fields (matching Django model choices)
INSERT INTO fuel_poolvehicle (
    registration_number, vehicle_type, make, model, year, fuel_type, engine_cc, 
    status, assigned_subcenter_id, current_mileage, last_service_date, 
    next_service_due, insurance_expiry
) VALUES
('ABC-001', 'CAR', 'Toyota', 'Corolla', 2022, 'PETROL', 1800, 'ACTIVE', 
 (SELECT id FROM fuel_subcenter WHERE code = 'SUB-001' LIMIT 1), 15000, 
 '2025-08-15', '2025-11-15', '2025-12-31'),
('ABC-002', 'TRUCK', 'Ford', 'Ranger', 2021, 'DIESEL', 3200, 'ACTIVE',
 (SELECT id FROM fuel_subcenter WHERE code = 'SUB-001' LIMIT 1), 25000,
 '2025-07-20', '2025-10-20', '2026-01-15'),
('ABC-003', 'VAN', 'Nissan', 'NV200', 2020, 'PETROL', 1600, 'ACTIVE',
 (SELECT id FROM fuel_subcenter WHERE code = 'SUB-002' LIMIT 1), 35000,
 '2025-06-10', '2025-09-10', '2025-11-30')
ON CONFLICT (registration_number) DO NOTHING;

-- =================================================================
-- 5. FIX DISPATCH CENTER REFERENCES
-- =================================================================
-- Update dispatches with NULL to_center_id to use SUB-001 (your first subcenter)
UPDATE fuel_bookdispatch 
SET to_center_id = (
    SELECT id FROM fuel_subcenter 
    WHERE code = 'SUB-001'
    LIMIT 1
)
WHERE to_center_id IS NULL;

-- =================================================================
-- 6. VERIFICATION QUERIES
-- =================================================================
-- Check subcenter setup
SELECT 'SUBCENTERS:' as section;
SELECT id, name, code, location, is_active FROM fuel_subcenter ORDER BY id;

-- Check pool vehicles setup
SELECT 'POOL VEHICLES:' as section;
SELECT 
    id, registration_number, vehicle_type, make, model, year, 
    fuel_type, engine_cc, status, assigned_subcenter_id
FROM fuel_poolvehicle ORDER BY id;

-- Check dispatch fixes
SELECT 'DISPATCH FIXES:' as section;
SELECT 
    COUNT(*) as total_dispatches,
    COUNT(CASE WHEN to_center_id IS NULL THEN 1 END) as still_missing_center,
    COUNT(CASE WHEN to_center_id IS NOT NULL THEN 1 END) as with_center
FROM fuel_bookdispatch;

-- Show table structures for verification
SELECT 'POOL VEHICLE COLUMNS:' as section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fuel_poolvehicle'
ORDER BY ordinal_position;