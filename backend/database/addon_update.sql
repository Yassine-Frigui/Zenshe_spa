-- Add healing add-on flag to reservations table
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS has_healing_addon BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS addon_price DECIMAL(10,2) DEFAULT 0.00;

-- Update healing add-on service
UPDATE services 
SET service_type = 'addon', 
    description = 'Enhancement add-on for V-Steam services - provides additional healing benefits'
WHERE id = 7;