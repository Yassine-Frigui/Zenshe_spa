const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

// Security middleware
const { 
    securityHeaders, 
    generalLimiter, 
    sanitizeRequest, 
    securityLogger 
} = require('./middleware/security');

// Import des routes
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const clientAuthRoutes = require('./routes/clientAuth');
const publicServicesRoutes = require('./routes/publicServices');
const publicServicesMultilingualRoutes = require('./routes/publicServicesMultilingual');
const serviceRoutes = require('./routes/services');
const reservationRoutes = require('./routes/reservations');
const inventaireRoutes = require('./routes/inventaire');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');
const membershipRoutes = require('./routes/memberships');
const clientMembershipRoutes = require('./routes/clientMemberships');
const adminClientMembershipRoutes = require('./routes/adminClientMemberships');
const statisticsRoutes = require('./routes/statistics');
const referralCodesRoutes = require('./routes/referralCodes');
const storeRoutes = require('./routes/store');
const adminStoreRoutes = require('./routes/adminStore');
const jotformRoutes = require('./routes/jotform');

// Import de la configuration de base de données
const { testConnection } = require('../config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware - must be first
app.use(securityHeaders);
app.use(generalLimiter);
app.use(securityLogger);
app.use(sanitizeRequest);

// CORS configuration - more restrictive for production
const corsOptions = {
    origin: function (origin, callback) {
        console.log('CORS request from origin:', origin);
        
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3001'
        ].filter(Boolean); // Remove undefined values
        
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        // Allow configured origins
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // Development mode - be more permissive
            if (process.env.NODE_ENV !== 'production') {
                console.log('⚠️ Allowing non-whitelisted origin in development:', origin);
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS policy'));
            }
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Add ngrok warning bypass
app.use((req, res, next) => {
    res.set('ngrok-skip-browser-warning', 'true');
    next();
});

// Servir les fichiers statiques (images, uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes principales
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/client', clientAuthRoutes);
app.use('/api/client/memberships', clientMembershipRoutes);
app.use('/api/admin/client-memberships', adminClientMembershipRoutes);
console.log('👑 Admin client memberships routes mounted at /api/admin/client-memberships');
app.use('/api/public/services', publicServicesRoutes);
app.use('/api/public/services-multilingual', publicServicesMultilingualRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/inventaire', inventaireRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/statistics', statisticsRoutes);
console.log('📊 Statistics routes mounted at /api/admin/statistics');
app.use('/api/public', publicRoutes);
app.use('/api/memberships', membershipRoutes);
console.log('💳 Client membership routes mounted at /api/client/memberships');
app.use('/api/referral-codes', referralCodesRoutes);
console.log('🎁 Referral codes routes mounted at /api/referral-codes');
app.use('/api/store', storeRoutes);
console.log('🛍️  Store routes mounted at /api/store');
app.use('/api/admin/store', adminStoreRoutes);
console.log('🛍️  Admin store routes mounted at /api/admin/store');
app.use('/api/jotform', jotformRoutes);
console.log('📝 Jotform routes mounted at /api/jotform');

// Route de test
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'ZenShe Spa API is working correctly!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV 
    });
});

// Route pour vérifier la santé de l'API
app.get('/api/health', async (req, res) => {
    try {
        const dbConnected = await testConnection();
        res.json({
            status: 'OK',
            database: dbConnected ? 'Connectée' : 'Déconnectée',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
    res.status(404).json({
        message: 'Route non trouvée',
        path: req.originalUrl
    });
});

// Démarrage du serveur
const startServer = async () => {
    try {
        // Test de la connexion à la base de données
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.warn('⚠️  Attention: Impossible de se connecter à la base de données');
        }

        app.listen(PORT, () => {
            console.log(`\n� Serveur ZenShe Spa démarré sur le port ${PORT}`);
            console.log(`🎯 API accessible sur: http://localhost:${PORT}/api`);
            console.log(`🔗 Test de l'API: http://localhost:${PORT}/api/test`);
            console.log(`� Environnement: ${process.env.NODE_ENV || 'development'}\n`);

            // Log memory usage
            const mem = process.memoryUsage();
            const heapUsedKB = (mem.heapUsed / 1024).toFixed(2);
            const heapUsedMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
            console.log(`🧠 Mémoire utilisée: ${heapUsedKB} KB (${heapUsedMB} MB)`);
        });
    } catch (error) {
        console.error('❌ Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
};

// Gestion de l'arrêt propre du serveur
process.on('SIGTERM', () => {
    console.log('SIGTERM reçu, arrêt du serveur...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT reçu, arrêt du serveur...');
    process.exit(0);
});

startServer();

module.exports = app;

