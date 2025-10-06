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

async function testPreorderSystem() {
    let connection;
    try {
        console.log('\n🧪 Testing Pre-Order System...\n');
        console.log('='.repeat(80));
        
        connection = await mysql.createConnection(dbConfig);

        // Test 1: Verify no stock_quantity column exists
        console.log('\n✅ Test 1: Checking that stock_quantity column is removed...');
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'products' 
            AND COLUMN_NAME = 'stock_quantity'
        `, [dbConfig.database]);
        
        if (columns.length === 0) {
            console.log('   ✅ PASS: stock_quantity column does not exist');
        } else {
            console.log('   ❌ FAIL: stock_quantity column still exists!');
        }

        // Test 2: Verify is_preorder column exists
        console.log('\n✅ Test 2: Checking that is_preorder column exists...');
        const [preorderCol] = await connection.query(`
            SELECT COLUMN_NAME, COLUMN_DEFAULT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'products' 
            AND COLUMN_NAME = 'is_preorder'
        `, [dbConfig.database]);
        
        if (preorderCol.length > 0) {
            console.log(`   ✅ PASS: is_preorder column exists (default: ${preorderCol[0].COLUMN_DEFAULT})`);
        } else {
            console.log('   ❌ FAIL: is_preorder column does not exist!');
        }

        // Test 3: Verify estimated_delivery_days column exists
        console.log('\n✅ Test 3: Checking that estimated_delivery_days column exists...');
        const [deliveryCol] = await connection.query(`
            SELECT COLUMN_NAME, COLUMN_DEFAULT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'products' 
            AND COLUMN_NAME = 'estimated_delivery_days'
        `, [dbConfig.database]);
        
        if (deliveryCol.length > 0) {
            console.log(`   ✅ PASS: estimated_delivery_days column exists (default: ${deliveryCol[0].COLUMN_DEFAULT} days)`);
        } else {
            console.log('   ❌ FAIL: estimated_delivery_days column does not exist!');
        }

        // Test 4: Verify all products are set to pre-order
        console.log('\n✅ Test 4: Checking that all products are set to pre-order...');
        const [products] = await connection.query(`
            SELECT id, name, is_preorder, estimated_delivery_days 
            FROM products
        `);
        
        const allPreorder = products.every(p => p.is_preorder === 1);
        if (allPreorder && products.length > 0) {
            console.log(`   ✅ PASS: All ${products.length} products are set to pre-order`);
            products.forEach(p => {
                console.log(`      - ${p.name}: ${p.estimated_delivery_days} days delivery`);
            });
        } else if (products.length === 0) {
            console.log('   ⚠️  WARNING: No products in database');
        } else {
            console.log('   ❌ FAIL: Some products are not set to pre-order!');
        }

        // Test 5: Simulate product fetch (what API returns)
        console.log('\n✅ Test 5: Simulating product API response...');
        const [apiProducts] = await connection.query(`
            SELECT id, name, price, is_preorder, estimated_delivery_days, is_active
            FROM products 
            WHERE is_active = TRUE
            LIMIT 3
        `);
        
        if (apiProducts.length > 0) {
            console.log('   ✅ PASS: API response format:');
            console.table(apiProducts);
        } else {
            console.log('   ⚠️  WARNING: No active products found');
        }

        // Test 6: Verify Product model compatibility
        console.log('\n✅ Test 6: Testing Product.js model compatibility...');
        try {
            const ProductModel = require('./src/models/Product.js');
            console.log('   ✅ PASS: Product model loaded successfully');
            
            // Check if old stock methods exist (they shouldn't)
            if (typeof ProductModel.updateStock === 'function') {
                console.log('   ⚠️  WARNING: updateStock method still exists in Product model');
            } else {
                console.log('   ✅ PASS: updateStock method removed from Product model');
            }
            
            if (typeof ProductModel.reduceStock === 'function') {
                console.log('   ⚠️  WARNING: reduceStock method still exists in Product model');
            } else {
                console.log('   ✅ PASS: reduceStock method removed from Product model');
            }
            
            if (typeof ProductModel.getLowStockProducts === 'function') {
                console.log('   ⚠️  WARNING: getLowStockProducts method still exists in Product model');
            } else {
                console.log('   ✅ PASS: getLowStockProducts method removed from Product model');
            }
        } catch (error) {
            console.log('   ⚠️  Could not load Product model:', error.message);
        }

        // Summary
        console.log('\n\n' + '='.repeat(80));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(80));
        
        const hasNoStock = columns.length === 0;
        const hasPreorder = preorderCol.length > 0;
        const hasDelivery = deliveryCol.length > 0;
        const allArePreorder = products.length > 0 && products.every(p => p.is_preorder === 1);
        
        const passedTests = [hasNoStock, hasPreorder, hasDelivery, allArePreorder].filter(Boolean).length;
        const totalTests = 4;
        
        console.log(`\nTests Passed: ${passedTests}/${totalTests}`);
        
        if (passedTests === totalTests) {
            console.log('\n🎉 ALL TESTS PASSED!');
            console.log('✅ Your database is correctly configured for pre-order system');
            console.log('✅ No stock tracking - customers can order any quantity');
            console.log('✅ Delivery estimates are set for all products');
        } else {
            console.log('\n⚠️  SOME TESTS FAILED');
            console.log('Please review the failures above and re-run the migration script if needed.');
        }

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run tests
testPreorderSystem()
    .then(() => {
        console.log('\n✅ Testing complete!\n');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Testing failed:', error);
        process.exit(1);
    });
