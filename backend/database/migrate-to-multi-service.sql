 -- ================================================================
-- MIGRATION TO MULTI-SERVICE RESERVATION SYSTEM
-- ================================================================
-- This script migrates from single-service to multi-service reservations
-- by utilizing the existing reservation_items table
-- ================================================================

USE zenshespa_database;

-- ================================================================
-- STEP 1: MIGRATE EXISTING RESERVATIONS TO reservation_items
-- ================================================================

-- Insert all existing reservations as main service items
INSERT INTO reservation_items (reservation_id, service_id, item_type, prix, notes)
SELECT 
    r.id,
    r.service_id,
    'main',
    r.prix_service,
    CASE 
        WHEN r.has_healing_addon = 1 THEN 'Migrated from old system - had healing addon'
        ELSE NULL
    END
FROM reservations r
WHERE r.service_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM reservation_items ri 
    WHERE ri.reservation_id = r.id AND ri.service_id = r.service_id
  );

-- Insert healing add-ons as separate items for reservations that had them
INSERT INTO reservation_items (reservation_id, service_id, item_type, prix, notes)
SELECT 
    r.id,
    7, -- Healing Add-On service ID
    'addon',
    r.addon_price,
    'Migrated healing addon from old system'
FROM reservations r
WHERE r.has_healing_addon = 1
  AND r.addon_price > 0
  AND NOT EXISTS (
    SELECT 1 FROM reservation_items ri 
    WHERE ri.reservation_id = r.id AND ri.service_id = 7 AND ri.item_type = 'addon'
  );

-- ================================================================
-- STEP 2: ADD NEW COLUMNS TO reservations TABLE
-- ================================================================

-- Add column to track if reservation uses new multi-service system
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS uses_items_table TINYINT(1) DEFAULT 0 
COMMENT 'If 1, services are in reservation_items. If 0, using legacy service_id';

-- Update flag for reservations that now have items
UPDATE reservations r
SET uses_items_table = 1
WHERE EXISTS (SELECT 1 FROM reservation_items ri WHERE ri.reservation_id = r.id);

-- ================================================================
-- STEP 3: CREATE VIEW FOR BACKWARD COMPATIBILITY
-- ================================================================

-- Create a view that provides backward-compatible reservation data
CREATE OR REPLACE VIEW reservations_with_services AS
SELECT 
    r.*,
    -- Service details (for single-service legacy mode)
    CASE 
        WHEN r.uses_items_table = 0 THEN r.service_id
        ELSE (SELECT service_id FROM reservation_items WHERE reservation_id = r.id AND item_type = 'main' LIMIT 1)
    END as primary_service_id,
    
    -- Count of services in this reservation
    COALESCE((SELECT COUNT(*) FROM reservation_items WHERE reservation_id = r.id), 0) as service_count,
    
    -- Calculate total from items if using new system
    CASE 
        WHEN r.uses_items_table = 1 THEN COALESCE((SELECT SUM(prix) FROM reservation_items WHERE reservation_id = r.id), r.prix_final)
        ELSE r.prix_final
    END as calculated_total
FROM reservations r;

-- ================================================================
-- STEP 4: CREATE HELPER FUNCTIONS
-- ================================================================

-- Function to get all services for a reservation
DELIMITER //
CREATE OR REPLACE FUNCTION get_reservation_services(res_id INT)
RETURNS TEXT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE service_list TEXT;
    
    -- Check if reservation uses items table
    IF (SELECT uses_items_table FROM reservations WHERE id = res_id) = 1 THEN
        -- Get services from reservation_items
        SELECT GROUP_CONCAT(s.nom ORDER BY ri.item_type, s.nom SEPARATOR ', ')
        INTO service_list
        FROM reservation_items ri
        JOIN services s ON ri.service_id = s.id
        WHERE ri.reservation_id = res_id;
    ELSE
        -- Get single service from reservations table
        SELECT s.nom
        INTO service_list
        FROM reservations r
        JOIN services s ON r.service_id = s.id
        WHERE r.id = res_id;
    END IF;
    
    RETURN COALESCE(service_list, 'No services');
END//
DELIMITER ;

-- ================================================================
-- STEP 5: VERIFICATION QUERIES
-- ================================================================

-- Show migration summary
SELECT 
    '✅ Migration Summary' as status,
    COUNT(DISTINCT r.id) as total_reservations,
    COUNT(DISTINCT CASE WHEN r.uses_items_table = 1 THEN r.id END) as using_new_system,
    COUNT(DISTINCT CASE WHEN r.uses_items_table = 0 THEN r.id END) as using_legacy_system,
    COUNT(ri.id) as total_reservation_items
FROM reservations r
LEFT JOIN reservation_items ri ON r.id = ri.reservation_id;

-- Show reservations with multiple services (if any)
SELECT 
    '📊 Multi-Service Reservations' as info,
    r.id as reservation_id,
    r.client_nom,
    r.client_prenom,
    COUNT(ri.id) as service_count,
    SUM(ri.prix) as total_prix
FROM reservations r
JOIN reservation_items ri ON r.id = ri.reservation_id
GROUP BY r.id
HAVING COUNT(ri.id) > 1;

-- Show sample of migrated data
SELECT 
    '🔍 Sample Migrated Data' as info,
    r.id as reservation_id,
    r.date_reservation,
    ri.service_id,
    s.nom as service_name,
    ri.item_type,
    ri.prix
FROM reservations r
JOIN reservation_items ri ON r.id = ri.reservation_id
JOIN services s ON ri.service_id = s.id
LIMIT 10;

SELECT '✅ Database migration completed! Backend and frontend updates required.' as next_steps;
