-- Fix NOT NULL constraint on object_id field
PRAGMA foreign_keys=off;

-- Create new table without NOT NULL constraint on object_id
CREATE TABLE fuel_systemalert_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created DATETIME NOT NULL,
    modified DATETIME NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    alert_type VARCHAR(10) NOT NULL,
    status VARCHAR(15) NOT NULL,
    object_id VARCHAR(255),  -- Removed NOT NULL constraint
    acknowledged_at DATETIME,
    acknowledged_by_id BIGINT,
    created_by_id BIGINT,
    priority INTEGER,
    target_roles JSON,
    expires_at DATETIME,
    is_dismissible BOOLEAN
);

-- Copy data from old table to new table
INSERT INTO fuel_systemalert_new 
SELECT id, created, modified, title, message, alert_type, status, 
       CASE WHEN object_id = '' THEN NULL ELSE object_id END as object_id,
       acknowledged_at, acknowledged_by_id, created_by_id, priority, target_roles, expires_at, is_dismissible
FROM fuel_systemalert;

-- Drop old table
DROP TABLE fuel_systemalert;

-- Rename new table
ALTER TABLE fuel_systemalert_new RENAME TO fuel_systemalert;

PRAGMA foreign_keys=on;
