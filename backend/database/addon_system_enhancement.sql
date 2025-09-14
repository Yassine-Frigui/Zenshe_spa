-- Enhancement for Add-on System in Reservations

-- Step 1: Add columns to reservations table to track add-ons
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS has_addon BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS addon_service_ids TEXT NULL COMMENT 'Comma-separated list of add-on service IDs';