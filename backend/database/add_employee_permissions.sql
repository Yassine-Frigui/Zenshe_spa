-- Add permissions column to utilisateurs table
-- This column will store a JSON array of allowed admin pages for employees

ALTER TABLE `utilisateurs` 
ADD COLUMN `permissions` JSON DEFAULT NULL COMMENT 'JSON array of allowed admin pages for employees' AFTER `role`;

-- Example permissions structure:
-- {
--   "pages": ["clients", "services", "reservations", "inventory", "store", "statistics", "reviews", "settings"]
-- }

-- Update existing employees to have all permissions by default
UPDATE `utilisateurs` 
SET `permissions` = JSON_OBJECT('pages', JSON_ARRAY('clients', 'services', 'reservations', 'inventory', 'store', 'statistics', 'reviews', 'settings'))
WHERE `role` = 'employe' AND `permissions` IS NULL;
