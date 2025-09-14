-- Step 2: Create a junction table for better relational structure
CREATE TABLE IF NOT EXISTS reservation_addons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL,
    addon_service_id INT NOT NULL,
    addon_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (addon_service_id) REFERENCES services(id) ON DELETE CASCADE,
    UNIQUE KEY unique_reservation_addon (reservation_id, addon_service_id)
);