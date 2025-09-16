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