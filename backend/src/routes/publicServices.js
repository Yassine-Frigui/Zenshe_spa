const express = require('express');
const ServiceModel = require('../models/Service');
const MultilingualService = require('../services/MultilingualService');
const { executeQuery } = require('../../config/database');
const router = express.Router();

// Public routes for services (accessible without authentication)

// Get all services with basic information
router.get('/', async (req, res) => {
    try {
        console.log('📥 GET /api/public/services called with query:', req.query);
        const { category, search, limit = 50, offset = 0, lang = 'fr' } = req.query;
        
        // Use multilingual service for translated content
        const filters = {};
        if (category) filters.category_id = category;
        if (search) filters.search = search;
        
        console.log('🔍 Fetching services with filters:', filters, 'lang:', lang);
        const allServices = await MultilingualService.getServicesWithTranslations(lang, filters);
        console.log('✅ Found', allServices.length, 'services');
        
        // Apply pagination
        const total = allServices.length;
        const paginatedServices = allServices.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        
        const response = {
            services: paginatedServices,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + parseInt(limit)) < total
            }
        };
        
        console.log('📤 Sending response with', paginatedServices.length, 'services');
        res.json(response);
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des services publics:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la récupération des services',
            error: error.message 
        });
    }
});

// Get service by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { lang = 'fr' } = req.query;
        
        const service = await MultilingualService.getServiceByIdWithTranslations(id, lang);
        
        if (!service) {
            return res.status(404).json({ message: 'Service non trouvé' });
        }
        
        res.json(service);
    } catch (error) {
        console.error('Erreur lors de la récupération du service:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la récupération du service',
            error: error.message 
        });
    }
});

// Get all service categories
router.get('/categories/list', async (req, res) => {
    try {
        const { lang = 'fr' } = req.query;
        const categories = await MultilingualService.getCategoriesWithTranslations(lang);
        
        res.json({
            success: true,
            data: categories,
            total: categories.length,
            language: lang
        });
    } catch (error) {
        console.error('Error fetching service categories:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur lors de la récupération des catégories',
            error: error.message 
        });
    }
});

// Get services count by category
router.get('/categories/count', async (req, res) => {
    try {
        const query = `
            SELECT categorie, COUNT(*) as count 
            FROM services 
            WHERE actif = 1 AND categorie IS NOT NULL 
            GROUP BY categorie 
            ORDER BY categorie
        `;
        const categoryCounts = await executeQuery(query);
        
        res.json(categoryCounts);
    } catch (error) {
        console.error('Erreur lors du comptage des services par catégorie:', error);
        res.status(500).json({ 
            message: 'Erreur lors du comptage des services',
            error: error.message 
        });
    }
});

// Get featured/popular services
router.get('/featured/list', async (req, res) => {
    try {
        const { lang = 'fr' } = req.query;
        
        // Get services marked as popular or featured
        const filters = { popular: true };
        const featuredServices = await MultilingualService.getServicesWithTranslations(lang, filters);
        
        res.json(featuredServices.slice(0, 6)); // Limit to 6 featured services
    } catch (error) {
        console.error('Erreur lors de la récupération des services populaires:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la récupération des services populaires',
            error: error.message 
        });
    }
});

// Get memberships with translations
router.get('/memberships/list', async (req, res) => {
    try {
        const { lang = 'fr' } = req.query;
        
        // Simple query - memberships table already exists
        const query = `
            SELECT 
                id,
                nom,
                prix_mensuel,
                prix_3_mois,
                services_par_mois,
                description,
                avantages,
                actif
            FROM memberships
            WHERE actif = 1
            ORDER BY prix_mensuel ASC
        `;
        
        const memberships = await executeQuery(query);
        
        res.json({ 
            success: true, 
            memberships: memberships || []
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des abonnements:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur lors de la récupération des abonnements',
            error: error.message 
        });
    }
});

// Get active promotions with translations
router.get('/promotions/list', async (req, res) => {
    try {
        const { lang = 'fr' } = req.query;
        
        const promotions = await MultilingualService.getPromotionsWithTranslations(lang);
        
        res.json(promotions);
    } catch (error) {
        console.error('Erreur lors de la récupération des promotions:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la récupération des promotions',
            error: error.message 
        });
    }
});

// Get all memberships (public access)
router.get('/memberships/list', async (req, res) => {
    try {
        const { lang = 'fr' } = req.query;
        
        console.log('📥 GET /api/public/services/memberships/list called with lang:', lang);
        
        // Simple query for memberships (translations can be added later)
        const [memberships] = await executeQuery(`
            SELECT 
                id, 
                nom, 
                description, 
                prix_mensuel, 
                prix_3_mois, 
                services_par_mois, 
                actif
            FROM memberships 
            WHERE actif = 1 
            ORDER BY prix_mensuel ASC
        `);
        
        console.log('✅ Found', memberships.length, 'memberships');
        
        res.json({
            memberships: memberships
        });
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des abonnements publics:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la récupération des abonnements',
            error: error.message 
        });
    }
});

// Get salon settings with translations
router.get('/settings/salon', async (req, res) => {
    try {
        const { lang = 'fr' } = req.query;
        
        const settings = await MultilingualService.getSalonSettingsWithTranslations(lang);
        
        res.json(settings);
    } catch (error) {
        console.error('Erreur lors de la récupération des paramètres du salon:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la récupération des paramètres du salon',
            error: error.message 
        });
    }
});

module.exports = router;
