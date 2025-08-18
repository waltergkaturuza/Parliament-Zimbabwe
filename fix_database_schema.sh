#!/bin/bash

# Direct database fix script for Azure App Service
# Run this script to fix missing columns in production database

echo "🔧 FUEL COUPON SYSTEM - DATABASE SCHEMA FIX"
echo "============================================="

# Database connection info
DB_HOST="${DATABASE_HOST:-parliament-fuel-db-server.postgres.database.azure.com}"
DB_NAME="${DATABASE_NAME:-parliament_fuel_db}"
DB_USER="${DATABASE_USER:-azureuser}"

echo "Connecting to database: $DB_HOST/$DB_NAME"

# Check if SessionAttendance.date column exists and add if missing
echo "Checking SessionAttendance.date column..."
PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "
DO \$\$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fuel_sessionattendance' AND column_name = 'date'
    ) THEN
        ALTER TABLE fuel_sessionattendance ADD COLUMN date DATE DEFAULT CURRENT_DATE;
        CREATE INDEX IF NOT EXISTS fuel_sessionattendance_date_idx ON fuel_sessionattendance(date);
        RAISE NOTICE 'Added date column to fuel_sessionattendance';
    ELSE
        RAISE NOTICE 'Column fuel_sessionattendance.date already exists';
    END IF;
END
\$\$;
"

# Check if Box.verified_by_id column exists and add if missing  
echo "Checking Box.verified_by_id column..."
PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "
DO \$\$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fuel_box' AND column_name = 'verified_by_id'
    ) THEN
        ALTER TABLE fuel_box ADD COLUMN verified_by_id INTEGER NULL;
        ALTER TABLE fuel_box ADD CONSTRAINT fuel_box_verified_by_id_fkey 
            FOREIGN KEY (verified_by_id) REFERENCES fuel_user(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added verified_by_id column to fuel_box';
    ELSE
        RAISE NOTICE 'Column fuel_box.verified_by_id already exists';
    END IF;
END
\$\$;
"

# Check other potentially missing Box columns
echo "Checking other Box verification columns..."
PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "
DO \$\$
BEGIN
    -- Add verified_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fuel_box' AND column_name = 'verified_at'
    ) THEN
        ALTER TABLE fuel_box ADD COLUMN verified_at TIMESTAMP NULL;
        RAISE NOTICE 'Added verified_at column to fuel_box';
    END IF;
    
    -- Add verification_notes if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fuel_box' AND column_name = 'verification_notes'
    ) THEN
        ALTER TABLE fuel_box ADD COLUMN verification_notes TEXT NULL;
        RAISE NOTICE 'Added verification_notes column to fuel_box';
    END IF;
END
\$\$;
"

echo "✅ Database schema fix completed!"
echo "Now test the Django admin at: https://parliament-fuel-system-d0bvbjfrdbepdrfh.southafricanorth-01.azurewebsites.net/admin/"
