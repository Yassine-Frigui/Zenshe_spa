-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_reservation_addons_reservation ON reservation_addons(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_addons_service ON reservation_addons(addon_service_id);