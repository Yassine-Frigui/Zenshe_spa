const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 4306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'zenshespa_database'
        });

        console.log('✅ Connected to database');

        // Add permissions column
        console.log('📝 Adding permissions column...');
        await connection.execute(`
            ALTER TABLE utilisateurs 
            ADD COLUMN permissions JSON DEFAULT NULL COMMENT 'JSON array of allowed admin pages for employees' AFTER role
        `);
        console.log('✅ Permissions column added');

        // Update existing employees
        console.log('📝 Updating existing employees with default permissions...');
        await connection.execute(`
            UPDATE utilisateurs 
            SET permissions = JSON_OBJECT('pages', JSON_ARRAY('clients', 'services', 'reservations', 'inventory', 'store', 'statistics', 'reviews', 'settings'))
            WHERE role = 'employe' AND permissions IS NULL
        `);
        console.log('✅ Existing employees updated');

        console.log('\n🎉 Migration completed successfully!');

    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️  Permissions column already exists, skipping...');
        } else {
            console.error('❌ Error:', error.message);
            throw error;
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration().catch(console.error);
