-- Insert sample products for the boutique (Pre-order system - no stock management)
INSERT IGNORE INTO products (
    name, description, detailed_description, price, category, category_id,
    image_url, is_preorder, estimated_delivery_days, is_active, is_featured, sku
) VALUES 
(
    'Chaise de Spa Luxe ZS001',
    'Chaise de spa professionnelle avec fonction massage',
    'Chaise de spa luxueuse avec fonction massage, hauteur ajustable et revêtement en cuir premium. Parfaite pour tout spa ou centre de bien-être.',
    2500.00, 'Chaises de Spa', 1,
    '/images/products/spa-chair-001.jpg',
    TRUE, 21, TRUE, TRUE, 'ZS001-SPA-CHAIR'
),
(
    'Lit de Soins du Visage Professionnel',
    'Lit ajustable pour soins du visage avec coussin mémoire de forme',
    'Lit professionnel ajustable pour soins du visage avec coussin en mousse à mémoire de forme et surface vinyle facile à nettoyer.',
    1200.00, 'Équipements', 4,
    '/images/products/facial-bed-002.jpg',
    TRUE, 30, TRUE, FALSE, 'ZS002-FACIAL-BED'
),
(
    'Sérum Visage Bio Anti-Âge',
    'Sérum visage bio premium anti-âge aux ingrédients naturels',
    'Sérum visage bio premium anti-âge avec des ingrédients naturels pour une peau radieuse et jeune.',
    89.99, 'Produits de Soins', 2,
    '/images/products/serum-003.jpg',
    TRUE, 7, TRUE, TRUE, 'ZS003-SERUM'
);