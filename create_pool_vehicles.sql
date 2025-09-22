-- POOL VEHICLES FIX - Create missing pool vehicles table and data
-- This addresses the pool-vehicles API error you mentioned

-- =================================================================
-- 1. CHECK IF POOL VEHICLES TABLE EXISTS
-- =================================================================
SELECT table_name FROM information_schema.tables WHERE table_name = 'fuel_poolvehicle';

-- =================================================================
-- 2. CREATE POOL VEHICLES TABLE IF MISSING
-- =================================================================
CREATE TABLE IF NOT EXISTS fuel_poolvehicle (
    id SERIAL PRIMARY KEY,
    vehicle_number VARCHAR(20) NOT NULL UNIQUE,
    make VARCHAR(50),
    model VARCHAR(50),
    year INTEGER,
    fuel_type VARCHAR(20) DEFAULT 'Petrol',
    status VARCHAR(20) DEFAULT 'Available',
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    last_service_date DATE,
    next_service_date DATE,
    notes TEXT,
    created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- 3. ADD SAMPLE POOL VEHICLES DATA
-- =================================================================
INSERT INTO fuel_poolvehicle (vehicle_number, make, model, year, fuel_type, status) VALUES
('GV-001', 'Toyota', 'Hilux', 2020, 'Diesel', 'Available'),
('GV-002', 'Ford', 'Ranger', 2019, 'Diesel', 'Available'),
('GV-003', 'Nissan', 'Hardbody', 2021, 'Petrol', 'In Use'),
('GV-004', 'Isuzu', 'KB', 2018, 'Diesel', 'Available'),
('GV-005', 'Toyota', 'Land Cruiser', 2022, 'Diesel', 'Available')
ON CONFLICT (vehicle_number) DO NOTHING;

-- =================================================================
-- 4. VERIFY POOL VEHICLES SETUP
-- =================================================================
SELECT 
    COUNT(*) as total_vehicles,
    COUNT(CASE WHEN status = 'Available' THEN 1 END) as available_vehicles,
    COUNT(CASE WHEN status = 'In Use' THEN 1 END) as in_use_vehicles
FROM fuel_poolvehicle;

-- Show sample vehicles
SELECT id, vehicle_number, make, model, status FROM fuel_poolvehicle LIMIT 5;