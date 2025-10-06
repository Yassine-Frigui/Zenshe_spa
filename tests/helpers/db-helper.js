// Database helper functions for testing

const mysql = require('mysql2/promise');

let connection;

/**
 * Setup test database connection
 */
async function setupTestDatabase() {
    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'zenshespa_database_test',
        port: parseInt(process.env.DB_PORT) || 4306,
        charset: 'utf8mb4'
    };

    connection = await mysql.createConnection(dbConfig);
    return connection;
}

/**
 * Close test database connection
 */
async function closeTestDatabase() {
    if (connection) {
        await connection.end();
        connection = null;
    }
}

/**
 * Clean all test data from tables
 */
async function cleanDatabase() {
    if (!connection) {
        throw new Error('Database connection not established');
    }

    // Disable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Clear tables in correct order
    const tables = [
        'store_order_items',
        'store_orders',
        'products',
        'product_categories',
        'reservations',
        'clients',
        'memberships'
    ];

    for (const table of tables) {
        try {
            await connection.query(`TRUNCATE TABLE ${table}`);
        } catch (error) {
            console.warn(`Could not truncate table ${table}:`, error.message);
        }
    }

    // Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
}

/**
 * Insert test product
 */
async function insertTestProduct(productData = {}) {
    const defaultProduct = {
        name: 'Test Product',
        description: 'Test description',
        price: 99.99,
        category: 'Test Category',
        category_id: 1,
        is_preorder: true,
        estimated_delivery_days: 14,
        is_active: true,
        is_featured: false,
        sku: `TEST-${Date.now()}`
    };

    const product = { ...defaultProduct, ...productData };

    const [result] = await connection.query(
        `INSERT INTO products (name, description, price, category, category_id, 
         is_preorder, estimated_delivery_days, is_active, is_featured, sku)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            product.name,
            product.description,
            product.price,
            product.category,
            product.category_id,
            product.is_preorder,
            product.estimated_delivery_days,
            product.is_active,
            product.is_featured,
            product.sku
        ]
    );

    return result.insertId;
}

/**
 * Insert test category
 */
async function insertTestCategory(categoryData = {}) {
    const defaultCategory = {
        name: 'Test Category',
        description: 'Test category description',
        is_active: true,
        display_order: 1
    };

    const category = { ...defaultCategory, ...categoryData };

    const [result] = await connection.query(
        `INSERT INTO product_categories (name, description, is_active, display_order)
         VALUES (?, ?, ?, ?)`,
        [category.name, category.description, category.is_active, category.display_order]
    );

    return result.insertId;
}

/**
 * Get test database connection
 */
function getTestConnection() {
    return connection;
}

module.exports = {
    setupTestDatabase,
    closeTestDatabase,
    cleanDatabase,
    insertTestProduct,
    insertTestCategory,
    getTestConnection
};
