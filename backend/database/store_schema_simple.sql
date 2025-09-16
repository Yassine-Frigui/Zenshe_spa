-- Simple Store Schema for ZenShe Spa
-- Execute in MariaDB/MySQL

-- 1. Create product categories table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Create products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    detailed_description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    category_id INT NULL,
    image_url VARCHAR(500),
    gallery_images TEXT COMMENT 'JSON array of additional image URLs',
    stock_quantity INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    weight DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Product weight in kg',
    dimensions VARCHAR(100) COMMENT 'Product dimensions (LxWxH)',
    sku VARCHAR(50) UNIQUE COMMENT 'Stock Keeping Unit',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_products_category (category),
    INDEX idx_products_active (is_active),
    INDEX idx_products_featured (is_featured),
    INDEX idx_products_sku (sku),
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. Create store orders table
CREATE TABLE IF NOT EXISTS store_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    client_id INT NULL COMMENT 'NULL for guest orders',
    
    -- Customer information
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. Create store order items table
CREATE TABLE IF NOT EXISTS store_order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    
    -- Product snapshot data
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 5. Insert default product categories
INSERT IGNORE INTO product_categories (name, description, display_order) VALUES 
('Chaises de Spa', 'Chaises et équipements de spa professionnels', 1),
('Produits de Soins', 'Crèmes, huiles et produits de beauté', 2),
('Accessoires', 'Accessoires et outils pour les soins', 3),
('Équipements', 'Matériel et équipements professionnels', 4);

-- 6. Insert sample products
INSERT IGNORE INTO products (
    name, description, detailed_description, price, category, category_id,
    image_url, stock_quantity, is_active, is_featured, sku
) VALUES 
(
    'Chaise de Spa Luxe ZS001',
    'Chaise de spa professionnelle avec fonction massage',
    'Chaise de spa luxueuse avec fonction massage, hauteur ajustable et revêtement en cuir premium. Parfaite pour tout spa ou centre de bien-être.',
    2500.00, 'Chaises de Spa', 1,
    '/images/products/spa-chair-001.jpg',
    5, TRUE, TRUE, 'ZS001-SPA-CHAIR'
),
(
    'Lit de Soins du Visage Professionnel',
    'Lit ajustable pour soins du visage avec coussin mémoire de forme',
    'Lit professionnel ajustable pour soins du visage avec coussin en mousse à mémoire de forme et surface vinyle facile à nettoyer.',
    1200.00, 'Équipements', 4,
    '/images/products/facial-bed-002.jpg',
    8, TRUE, FALSE, 'ZS002-FACIAL-BED'
),
(
    'Sérum Visage Bio Anti-Âge',
    'Sérum visage bio premium anti-âge aux ingrédients naturels',
    'Sérum visage bio premium anti-âge avec des ingrédients naturels pour une peau radieuse et jeune.',
    89.99, 'Produits de Soins', 2,
    '/images/products/serum-003.jpg',
    25, TRUE, TRUE, 'ZS003-SERUM'
);