-- Store/Boutique Database Schema
-- This file creates the necessary tables for the spa's boutique functionality

-- 1. Modify clients table to support store functionality
-- Check if column exists before adding it
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'clients' 
AND COLUMN_NAME = 'client_type';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE clients ADD COLUMN client_type ENUM(''spa_only'', ''store_only'', ''both'') DEFAULT ''spa_only''', 
    'SELECT "Column client_type already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Products table for boutique items
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    detailed_description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    image_url VARCHAR(500),
    gallery_images TEXT COMMENT 'JSON array of additional image URLs',
    stock_quantity INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    weight DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Product weight in kg for shipping',
    dimensions VARCHAR(100) COMMENT 'Product dimensions (LxWxH)',
    sku VARCHAR(50) UNIQUE COMMENT 'Stock Keeping Unit',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_products_category (category),
    INDEX idx_products_active (is_active),
    INDEX idx_products_featured (is_featured),
    INDEX idx_products_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci 
COMMENT='Products available in the boutique/store';

-- 3. Store orders table
CREATE TABLE IF NOT EXISTS store_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    client_id INT NULL COMMENT 'NULL for guest orders',
    
    -- Customer information (for both registered and guest customers)
    client_name VARCHAR(200) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(20) NOT NULL,
    client_address TEXT NOT NULL,
    
    -- Order details
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    items_count INT NOT NULL DEFAULT 0,
    
    -- Additional information
    notes TEXT COMMENT 'Customer notes or special instructions',
    admin_notes TEXT COMMENT 'Internal admin notes',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    INDEX idx_store_orders_client (client_id),
    INDEX idx_store_orders_status (status),
    INDEX idx_store_orders_created (created_at),
    INDEX idx_store_orders_number (order_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci 
COMMENT='Customer orders from the boutique/store';

-- 4. Store order items table (junction table for orders and products)
CREATE TABLE IF NOT EXISTS store_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    
    -- Product snapshot data (preserved even if product is deleted/modified)
    product_name VARCHAR(200) NOT NULL,
    product_description TEXT,
    product_price DECIMAL(10,2) NOT NULL COMMENT 'Price at time of order',
    product_image_url VARCHAR(500),
    
    -- Order item details
    quantity INT NOT NULL DEFAULT 1,
    subtotal DECIMAL(10,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES store_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_store_order_items_order (order_id),
    INDEX idx_store_order_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci 
COMMENT='Individual items within store orders';

-- 5. Product categories table (optional - for better organization)
CREATE TABLE IF NOT EXISTS product_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_product_categories_active (is_active),
    INDEX idx_product_categories_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci 
COMMENT='Categories for organizing boutique products';

-- Insert default product categories
INSERT IGNORE INTO product_categories (name, description, display_order) VALUES 
('Chaises de Spa', 'Chaises et équipements de spa professionnels', 1),
('Produits de Soins', 'Crèmes, huiles et produits de beauté', 2),
('Accessoires', 'Accessoires et outils pour les soins', 3),
('Équipements', 'Matériel et équipements professionnels', 4);

-- Update products table to use foreign key for categories (optional)
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'products' 
AND COLUMN_NAME = 'category_id';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE products ADD COLUMN category_id INT NULL AFTER category', 
    'SELECT "Column category_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key constraint if it doesn't exist
SET @constraint_exists = 0;
SELECT COUNT(*) INTO @constraint_exists 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'products' 
AND CONSTRAINT_NAME = 'products_ibfk_1';

SET @sql = IF(@constraint_exists = 0, 
    'ALTER TABLE products ADD FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL', 
    'SELECT "Foreign key constraint already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Trigger to automatically generate order numbers
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS generate_order_number 
BEFORE INSERT ON store_orders 
FOR EACH ROW 
BEGIN 
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        SET NEW.order_number = CONCAT('ORD', YEAR(NOW()), LPAD(MONTH(NOW()), 2, '0'), LPAD(DAY(NOW()), 2, '0'), LPAD((SELECT COALESCE(MAX(id), 0) + 1 FROM store_orders), 4, '0'));
    END IF;
END$$
DELIMITER ;

-- Trigger to update order totals and item counts
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS update_order_totals_after_insert
AFTER INSERT ON store_order_items 
FOR EACH ROW 
BEGIN 
    UPDATE store_orders 
    SET 
        total_amount = (SELECT SUM(subtotal) FROM store_order_items WHERE order_id = NEW.order_id),
        items_count = (SELECT SUM(quantity) FROM store_order_items WHERE order_id = NEW.order_id)
    WHERE id = NEW.order_id;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER IF NOT EXISTS update_order_totals_after_update
AFTER UPDATE ON store_order_items 
FOR EACH ROW 
BEGIN 
    UPDATE store_orders 
    SET 
        total_amount = (SELECT SUM(subtotal) FROM store_order_items WHERE order_id = NEW.order_id),
        items_count = (SELECT SUM(quantity) FROM store_order_items WHERE order_id = NEW.order_id)
    WHERE id = NEW.order_id;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER IF NOT EXISTS update_order_totals_after_delete
AFTER DELETE ON store_order_items 
FOR EACH ROW 
BEGIN 
    UPDATE store_orders 
    SET 
        total_amount = COALESCE((SELECT SUM(subtotal) FROM store_order_items WHERE order_id = OLD.order_id), 0),
        items_count = COALESCE((SELECT SUM(quantity) FROM store_order_items WHERE order_id = OLD.order_id), 0)
    WHERE id = OLD.order_id;
END$$
DELIMITER ;