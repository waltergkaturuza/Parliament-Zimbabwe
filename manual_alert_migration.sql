-- Manual migration to add new fields to SystemAlert model
-- This will add the missing fields that the serializer expects

-- Add priority field
ALTER TABLE fuel_systemalert ADD COLUMN priority INTEGER DEFAULT 2;

-- Add target_roles field (JSON field)
ALTER TABLE fuel_systemalert ADD COLUMN target_roles TEXT;

-- Add expires_at field
ALTER TABLE fuel_systemalert ADD COLUMN expires_at DATETIME;

-- Add is_dismissible field
ALTER TABLE fuel_systemalert ADD COLUMN is_dismissible BOOLEAN DEFAULT 1;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS fuel_systemalert_priority_idx ON fuel_systemalert(priority);
CREATE INDEX IF NOT EXISTS fuel_systemalert_expires_at_idx ON fuel_systemalert(expires_at);

-- Update the existing records to have default values
UPDATE fuel_systemalert SET 
    priority = 2,
    is_dismissible = 1
WHERE priority IS NULL OR is_dismissible IS NULL;

-- Show the updated table structure
.schema fuel_systemalert
