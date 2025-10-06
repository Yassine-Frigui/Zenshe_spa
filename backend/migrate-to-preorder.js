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

async function migrateToPreorderSystem() {
    let connection;
    try {
        console.log('🔍 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected!\n');

        console.log('📋 MIGRATION PLAN:');
        console.log('='.repeat(80));
        console.log('1. Add is_preorder column (default: TRUE)');
        console.log('2. Add estimated_delivery_days column (default: 14)');
        console.log('3. Remove stock_quantity column');
        console.log('4. Verify changes');
        console.log('='.repeat(80) + '\n');

        // Step 1: Add is_preorder column
        console.log('📝 Step 1: Adding is_preorder column...');
        try {
            await connection.query(`
                ALTER TABLE products 
                ADD COLUMN is_preorder BOOLEAN DEFAULT TRUE 
                COMMENT 'All items are pre-order by default'
            `);
            console.log('✅ is_preorder column added successfully');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  is_preorder column already exists');
            } else {
                throw error;
            }
        }

        // Step 2: Add estimated_delivery_days column
        console.log('\n📝 Step 2: Adding estimated_delivery_days column...');
        try {
            await connection.query(`
                ALTER TABLE products 
                ADD COLUMN estimated_delivery_days INT DEFAULT 14 
                COMMENT 'Estimated delivery time in days'
            `);
            console.log('✅ estimated_delivery_days column added successfully');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  estimated_delivery_days column already exists');
            } else {
                throw error;
            }
        }

        // Step 3: Set all existing products to pre-order
        console.log('\n📝 Step 3: Setting all existing products to pre-order...');
        const [updateResult] = await connection.query(`
            UPDATE products 
            SET is_preorder = TRUE, 
                estimated_delivery_days = 14 
            WHERE is_preorder IS NULL OR estimated_delivery_days IS NULL
        `);
        console.log(`✅ Updated ${updateResult.affectedRows} products to pre-order mode`);

        // Step 4: Remove stock_quantity column
        console.log('\n📝 Step 4: Removing stock_quantity column...');
        try {
            // First, check if column exists
            const [columns] = await connection.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = ? 
                AND TABLE_NAME = 'products' 
                AND COLUMN_NAME = 'stock_quantity'
            `, [dbConfig.database]);

            if (columns.length > 0) {
                await connection.query('ALTER TABLE products DROP COLUMN stock_quantity');
                console.log('✅ stock_quantity column removed successfully');
            } else {
                console.log('ℹ️  stock_quantity column does not exist');
            }
        } catch (error) {
            if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('ℹ️  stock_quantity column does not exist');
            } else {
                throw error;
            }
        }

        // Verify the changes
        console.log('\n\n📊 VERIFICATION:');
        console.log('='.repeat(80));
        
        const [productsColumns] = await connection.query(`
            SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'
            AND COLUMN_NAME IN ('stock_quantity', 'is_preorder', 'estimated_delivery_days')
            ORDER BY ORDINAL_POSITION
        `, [dbConfig.database]);
        
        console.table(productsColumns);

        // Show updated products
        console.log('\n📦 UPDATED PRODUCTS:');
        console.log('='.repeat(80));
        const [products] = await connection.query(`
            SELECT id, name, price, is_preorder, estimated_delivery_days, is_active 
            FROM products 
            LIMIT 10
        `);
        console.table(products);

        // Final status
        const hasStockColumn = productsColumns.some(col => col.COLUMN_NAME === 'stock_quantity');
        const hasPreorderColumn = productsColumns.some(col => col.COLUMN_NAME === 'is_preorder');
        const hasDeliveryColumn = productsColumns.some(col => col.COLUMN_NAME === 'estimated_delivery_days');

        console.log('\n\n✅ MIGRATION COMPLETE!');
        console.log('='.repeat(80));
        console.log('Status:');
        console.log(`  ✅ stock_quantity removed: ${!hasStockColumn}`);
        console.log(`  ✅ is_preorder added: ${hasPreorderColumn}`);
        console.log(`  ✅ estimated_delivery_days added: ${hasDeliveryColumn}`);
        console.log('\n🎉 Your store is now running in pre-order mode!');
        console.log('   All products are available for order without stock limits.');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('Full error:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run the migration
console.log('\n🚀 Starting migration to pre-order system...\n');
migrateToPreorderSystem()
    .then(() => {
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
