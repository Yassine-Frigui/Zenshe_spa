require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Configuration de la base de données
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zenshespa_database',
    port: parseInt(process.env.DB_PORT) || 4306,
    charset: 'utf8mb4',
    multipleStatements: true // Enable multiple statements for our SQL file
};

async function initializeReferralTables() {
    let connection;
    
    try {
        console.log('🔧 Initializing referral code tables...');
        
        // Create connection
        connection = mysql.createConnection(dbConfig);
        
        // Read SQL file
        const sqlPath = path.join(__dirname, '..', 'database', 'referral_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Execute SQL
        await new Promise((resolve, reject) => {
            connection.query(sql, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ Referral tables created successfully');
                    resolve(results);
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Error initializing referral tables:', error.message);
        throw error;
    } finally {
        if (connection) {
            connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run if called directly
if (require.main === module) {
    initializeReferralTables()
        .then(() => {
            console.log('🎉 Referral system initialization completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Initialization failed:', error);
            process.exit(1);
        });
}

module.exports = { initializeReferralTables };