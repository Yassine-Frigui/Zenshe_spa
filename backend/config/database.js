require('dotenv').config();
const mysql = require('mysql2');

// Configuration de la base de données
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'zenshe_spa',
    port: parseInt(process.env.DB_PORT) || 3306,
    charset: 'utf8mb4',
    connectTimeout: 30000,      // 30 seconds for remote connections
    ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false
};

// Création du pool de connexions
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 5,         // Reduced for remote connections
    queueLimit: 0,
    idleTimeout: 300000,        // 5 minutes
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Version promise du pool
const promisePool = pool.promise();

// Test de connexion
const testConnection = async () => {
    try {
        console.log('🔍 Testing database connection...');
        console.log('Host:', dbConfig.host);
        console.log('Port:', dbConfig.port);
        console.log('Database:', dbConfig.database);
        console.log('User:', dbConfig.user);
        
        const connection = await promisePool.getConnection();
        console.log('✅ Connexion à la base de données réussie');
        
        // Test a simple query
        const [result] = await connection.execute('SELECT 1 as test');
        console.log('✅ Test query successful:', result[0]);
        
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Erreur de connexion à la base de données:');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('📡 Connection refused - check host and port');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('🔐 Access denied - check username and password');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('🗄️ Database does not exist - check database name');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('⏰ Connection timeout - check network connectivity');
        }
        
        return false;
    }
};

// Fonction pour exécuter des requêtes
const executeQuery = async (query, params = []) => {
    try {
        const [rows] = await promisePool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('Erreur lors de l\'exécution de la requête:', error);
        throw error;
    }
};

// Fonction pour les transactions
const executeTransaction = async (queries) => {
    const connection = await promisePool.getConnection();
    try {
        await connection.beginTransaction();
        
        const results = [];
        for (const { query, params } of queries) {
            const [result] = await connection.execute(query, params);
            results.push(result);
        }
        
        await connection.commit();
        return results;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    pool,
    promisePool,
    testConnection,
    executeQuery,
    executeTransaction
};
