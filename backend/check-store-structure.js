require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zenshespa_database',
    port: parseInt(process.env.DB_PORT) || 4306,
    charset: 'utf8mb4',
    connectTimeout: 30000,
    ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false
};

async function checkStoreStructure() {
    let connection;
    try {
        console.log('🔍 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected!\n');

        // Check products table structure
        console.log('📋 PRODUCTS TABLE STRUCTURE:');
        console.log('='.repeat(80));
        const [productsColumns] = await connection.query(`
            SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'
            ORDER BY ORDINAL_POSITION
        `, [dbConfig.database]);
        
        console.table(productsColumns);

        // Check if stock_quantity column exists
        const hasStockColumn = productsColumns.some(col => col.COLUMN_NAME === 'stock_quantity');
        const hasPreorderColumn = productsColumns.some(col => col.COLUMN_NAME === 'is_preorder');
        const hasDeliveryColumn = productsColumns.some(col => col.COLUMN_NAME === 'estimated_delivery_days');

        console.log('\n📊 COLUMN STATUS:');
        console.log('❌ stock_quantity exists:', hasStockColumn);
        console.log('✅ is_preorder exists:', hasPreorderColumn);
        console.log('✅ estimated_delivery_days exists:', hasDeliveryColumn);

        // Check existing products
        console.log('\n\n📦 EXISTING PRODUCTS:');
        console.log('='.repeat(80));
        const [products] = await connection.query('SELECT * FROM products LIMIT 5');
        if (products.length > 0) {
            console.table(products);
            console.log(`\nTotal products: ${products.length}`);
        } else {
            console.log('No products found in database.');
        }

        // Check store_orders structure
        console.log('\n\n📋 STORE_ORDERS TABLE STRUCTURE:');
        console.log('='.repeat(80));
        const [ordersColumns] = await connection.query(`
            SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'store_orders'
            ORDER BY ORDINAL_POSITION
        `, [dbConfig.database]);
        
        if (ordersColumns.length > 0) {
            console.table(ordersColumns);
        } else {
            console.log('store_orders table does not exist.');
        }

        // Check product_categories structure
        console.log('\n\n📋 PRODUCT_CATEGORIES TABLE STRUCTURE:');
        console.log('='.repeat(80));
        const [categoriesColumns] = await connection.query(`
            SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'product_categories'
            ORDER BY ORDINAL_POSITION
        `, [dbConfig.database]);
        
        if (categoriesColumns.length > 0) {
            console.table(categoriesColumns);
            
            // Show existing categories
            const [categories] = await connection.query('SELECT * FROM product_categories');
            if (categories.length > 0) {
                console.log('\n📂 EXISTING CATEGORIES:');
                console.table(categories);
            }
        } else {
            console.log('product_categories table does not exist.');
        }

        // Check store_order_items structure
        console.log('\n\n📋 STORE_ORDER_ITEMS TABLE STRUCTURE:');
        console.log('='.repeat(80));
        const [orderItemsColumns] = await connection.query(`
            SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'store_order_items'
            ORDER BY ORDINAL_POSITION
        `, [dbConfig.database]);
        
        if (orderItemsColumns.length > 0) {
            console.table(orderItemsColumns);
        } else {
            console.log('store_order_items table does not exist.');
        }

        console.log('\n\n' + '='.repeat(80));
        console.log('✅ Database inspection complete!');
        
        // Return status for next steps
        return {
            hasStockColumn,
            hasPreorderColumn,
            hasDeliveryColumn,
            productsCount: products.length
        };

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the check
checkStoreStructure()
    .then(status => {
        console.log('\n📝 MIGRATION NEEDED:');
        if (status.hasStockColumn) {
            console.log('⚠️  stock_quantity column needs to be removed');
        }
        if (!status.hasPreorderColumn) {
            console.log('⚠️  is_preorder column needs to be added');
        }
        if (!status.hasDeliveryColumn) {
            console.log('⚠️  estimated_delivery_days column needs to be added');
        }
        if (!status.hasStockColumn && status.hasPreorderColumn && status.hasDeliveryColumn) {
            console.log('✅ Database structure is already correct!');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('Failed to check database:', error);
        process.exit(1);
    });
