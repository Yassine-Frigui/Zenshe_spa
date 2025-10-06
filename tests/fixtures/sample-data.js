// Mock data fixtures for testing

const sampleProducts = [
    {
        id: 1,
        name: 'Chaise de Spa Luxe',
        description: 'Chaise de spa professionnelle',
        detailed_description: 'Chaise luxueuse avec massage',
        price: 2500.00,
        category: 'Chaises de Spa',
        category_id: 1,
        is_preorder: true,
        estimated_delivery_days: 21,
        is_active: true,
        is_featured: true,
        sku: 'ZS001-SPA-CHAIR'
    },
    {
        id: 2,
        name: 'Sérum Visage Bio',
        description: 'Sérum anti-âge premium',
        detailed_description: 'Sérum avec ingrédients naturels',
        price: 89.99,
        category: 'Produits de Soins',
        category_id: 2,
        is_preorder: true,
        estimated_delivery_days: 7,
        is_active: true,
        is_featured: false,
        sku: 'ZS002-SERUM'
    },
    {
        id: 3,
        name: 'Lit de Soins',
        description: 'Lit ajustable professionnel',
        detailed_description: 'Lit pour soins du visage',
        price: 1200.00,
        category: 'Équipements',
        category_id: 3,
        is_preorder: true,
        estimated_delivery_days: 30,
        is_active: true,
        is_featured: false,
        sku: 'ZS003-BED'
    }
];

const sampleCategories = [
    {
        id: 1,
        name: 'Chaises de Spa',
        description: 'Chaises et équipements de spa',
        is_active: true,
        display_order: 1
    },
    {
        id: 2,
        name: 'Produits de Soins',
        description: 'Crèmes, huiles et produits de beauté',
        is_active: true,
        display_order: 2
    },
    {
        id: 3,
        name: 'Équipements',
        description: 'Matériel professionnel',
        is_active: true,
        display_order: 3
    }
];

const sampleOrders = [
    {
        id: 1,
        order_number: 'ORD-2025-001',
        client_name: 'Test Client',
        client_email: 'test@example.com',
        client_phone: '123456789',
        client_address: '123 Test Street',
        status: 'pending',
        total_amount: 99.99,
        items_count: 1
    },
    {
        id: 2,
        order_number: 'ORD-2025-002',
        client_name: 'Another Client',
        client_email: 'client@example.com',
        client_phone: '987654321',
        client_address: '456 Client Avenue',
        status: 'confirmed',
        total_amount: 2500.00,
        items_count: 1
    }
];

const sampleOrderItems = [
    {
        id: 1,
        order_id: 1,
        product_id: 2,
        product_name: 'Sérum Visage Bio',
        product_price: 89.99,
        quantity: 1,
        subtotal: 89.99
    },
    {
        id: 2,
        order_id: 2,
        product_id: 1,
        product_name: 'Chaise de Spa Luxe',
        product_price: 2500.00,
        quantity: 1,
        subtotal: 2500.00
    }
];

const sampleClients = [
    {
        id: 1,
        nom: 'Dupont',
        prenom: 'Jean',
        telephone: '123456789',
        email: 'jean.dupont@example.com',
        client_type: 'both'
    },
    {
        id: 2,
        nom: 'Martin',
        prenom: 'Marie',
        telephone: '987654321',
        email: 'marie.martin@example.com',
        client_type: 'spa_only'
    }
];

module.exports = {
    sampleProducts,
    sampleCategories,
    sampleOrders,
    sampleOrderItems,
    sampleClients
};
