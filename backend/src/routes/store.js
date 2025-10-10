const express = require('express');
const router = express.Router();
const ProductModel = require('../models/Product');
const ProductCategoryModel = require('../models/ProductCategory');
const StoreOrderModel = require('../models/StoreOrder');

// =====================================================
// PUBLIC STORE ROUTES (no authentication required)
// =====================================================

// GET /api/store/products - Get all products with filtering and pagination
router.get('/products', async (req, res) => {
    try {
        const filters = {
            category_id: req.query.category_id ? parseInt(req.query.category_id) : undefined,
            category: req.query.category,
            is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : true,
            is_featured: req.query.is_featured !== undefined ? req.query.is_featured === 'true' : undefined,
            search: req.query.search,
            min_price: req.query.min_price ? parseFloat(req.query.min_price) : undefined,
            max_price: req.query.max_price ? parseFloat(req.query.max_price) : undefined,
            in_stock_only: req.query.in_stock_only === 'true',
            language: req.query.lang || req.query.language || 'fr' // Support language parameter
        };

        const pagination = {
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 12,
            sort_by: req.query.sort_by || 'name',
            sort_order: req.query.sort_order || 'ASC'
        };

        // Validate pagination
        if (pagination.page < 1) pagination.page = 1;
        if (pagination.limit > 100) pagination.limit = 100;
        if (pagination.limit < 1) pagination.limit = 12;

        const result = await ProductModel.getAllProducts(filters, pagination);
        
        res.json({
            success: true,
            data: result.products,
            pagination: result.pagination,
            filters_applied: filters
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des produits',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/store/products/featured - Get featured products
router.get('/products/featured', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 8;
        const language = req.query.lang || req.query.language || 'fr';
        const products = await ProductModel.getFeaturedProducts(limit, language);
        
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching featured products:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des produits en vedette'
        });
    }
});

// GET /api/store/products/search - Search products
router.get('/products/search', async (req, res) => {
    try {
        const { q: searchTerm } = req.query;
        
        if (!searchTerm || searchTerm.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Le terme de recherche doit contenir au moins 2 caractères'
            });
        }

        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const products = await ProductModel.searchProducts(searchTerm.trim(), limit);
        
        res.json({
            success: true,
            data: products,
            search_term: searchTerm.trim()
        });
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la recherche de produits'
        });
    }
});

// GET /api/store/products/:id - Get single product by ID
router.get('/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        
        if (!productId || productId < 1) {
            return res.status(400).json({
                success: false,
                message: 'ID de produit invalide'
            });
        }

        const language = req.query.lang || req.query.language || 'fr';
        const product = await ProductModel.getProductById(productId, language);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Produit non trouvé'
            });
        }

        // Don't show inactive products to public
        if (!product.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Produit non disponible'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du produit'
        });
    }
});

// GET /api/store/categories - Get all categories
router.get('/categories', async (req, res) => {
    try {
        const activeOnly = req.query.active_only !== 'false'; // Default to true
        const categories = await ProductCategoryModel.getAllCategories(activeOnly);
        
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des catégories'
        });
    }
});

// GET /api/store/categories/:id - Get single category
router.get('/categories/:id', async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        
        if (!categoryId || categoryId < 1) {
            return res.status(400).json({
                success: false,
                message: 'ID de catégorie invalide'
            });
        }

        const category = await ProductCategoryModel.getCategoryById(categoryId);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Catégorie non trouvée'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la catégorie'
        });
    }
});

// GET /api/store/categories/:id/products - Get products by category
router.get('/categories/:id/products', async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        
        if (!categoryId || categoryId < 1) {
            return res.status(400).json({
                success: false,
                message: 'ID de catégorie invalide'
            });
        }

        const limit = req.query.limit ? parseInt(req.query.limit) : null;
        const products = await ProductModel.getProductsByCategory(categoryId, limit);
        
        res.json({
            success: true,
            data: products,
            category_id: categoryId
        });
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des produits de la catégorie'
        });
    }
});

// POST /api/store/orders - Create new order (guest or registered customer)
router.post('/orders', async (req, res) => {
    try {
        const {
            client_id = null,
            client_name,
            client_email,
            client_phone,
            client_address,
            notes,
            items,
            sessionId = null
        } = req.body;

        // Validate required fields
        if (!client_name || !client_email || !client_phone || !client_address) {
            return res.status(400).json({
                success: false,
                message: 'Les informations client sont requises (nom, email, téléphone, adresse)'
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'La commande doit contenir au moins un article'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(client_email)) {
            return res.status(400).json({
                success: false,
                message: 'Format d\'email invalide'
            });
        }

        // Validate items structure
        for (const item of items) {
            if (!item.product_id || !item.quantity || !item.price || 
                item.quantity < 1 || item.price < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Données d\'article invalides'
                });
            }

            // Verify product exists and is active
            const product = await ProductModel.getProductById(item.product_id);
            if (!product || !product.is_active) {
                return res.status(400).json({
                    success: false,
                    message: `Produit non disponible: ${item.product_id}`
                });
            }

            // Stock check removed - pre-order system allows any quantity
        }

        // Check if there's an existing draft for this session to convert
        let convertedFromDraft = false;
        let orderId = null;

        if (sessionId) {
            const existingDraft = await StoreOrderModel.getDraftBySession(sessionId);
            
            if (existingDraft) {
                console.log('Found existing draft, converting to final order...');
                
                // Update the draft to become a final order
                orderId = await StoreOrderModel.convertDraftToOrder(existingDraft.id);
                
                // Update with final order data
                await StoreOrderModel.updateOrder(orderId, {
                    client_id,
                    client_name,
                    client_email,
                    client_phone,
                    client_address,
                    notes,
                    items
                });
                
                convertedFromDraft = true;
                console.log('Draft converted to final order:', orderId);
            }
        }

        // If no draft was converted, create a new order
        if (!convertedFromDraft) {
            const orderData = {
                client_id,
                client_name,
                client_email,
                client_phone,
                client_address,
                notes,
                items
            };

            const order = await StoreOrderModel.createOrder(orderData);
            orderId = order.id;
        }

        res.status(201).json({
            success: true,
            message: convertedFromDraft ? 'Commande confirmée avec succès' : 'Commande créée avec succès',
            order: { id: orderId },
            converted_from_draft: convertedFromDraft
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la création de la commande'
        });
    }
});

// GET /api/store/orders/:orderNumber - Get order by order number (for order confirmation)
router.get('/orders/:orderNumber', async (req, res) => {
    try {
        const { orderNumber } = req.params;
        
        if (!orderNumber) {
            return res.status(400).json({
                success: false,
                message: 'Numéro de commande requis'
            });
        }

        const order = await StoreOrderModel.getOrderByNumber(orderNumber);
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Commande non trouvée'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la commande'
        });
    }
});

// GET /api/store/stats - Basic public statistics (for homepage display)
router.get('/stats', async (req, res) => {
    try {
        // Get basic public stats - total products, categories
        const [productsResult] = await ProductModel.getAllProducts({ is_active: true }, { page: 1, limit: 1 });
        const categories = await ProductCategoryModel.getAllCategories(true);

        const stats = {
            total_products: productsResult?.pagination?.total || 0,
            total_categories: categories.length,
            featured_products_count: (await ProductModel.getFeaturedProducts(100)).length
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching store stats:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
});

// =====================================================
// DRAFT ORDER MANAGEMENT (similar to reservations)
// =====================================================

// POST /api/store/save-draft - Save order draft
router.post('/save-draft', async (req, res) => {
    try {
        const {
            sessionId,
            client_name = '',
            client_email = '',
            client_phone = '',
            delivery_address = '',
            notes = '',
            cart_items = []
        } = req.body;

        // Session ID is required
        if (!sessionId) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID de session requis' 
            });
        }

        // Phone number is minimum requirement for saving
        if (!client_phone || client_phone.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Le numéro de téléphone est requis pour sauvegarder un brouillon' 
            });
        }

        // Check if a draft already exists for this session
        const existingDraft = await StoreOrderModel.getDraftBySession(sessionId);

        const draftData = {
            client_name: client_name.trim(),
            client_email: client_email.trim(),
            client_phone: client_phone.trim(),
            delivery_address: delivery_address.trim(),
            notes: notes.trim(),
            cart_items: cart_items,
            status: 'draft'
        };

        let orderId;
        if (existingDraft) {
            // UPDATE the same draft (one draft per session)
            orderId = await StoreOrderModel.updateDraft(existingDraft.id, draftData);
        } else {
            // CREATE new draft (first time for this session)
            orderId = await StoreOrderModel.createDraft(sessionId, draftData);
        }

        res.json({ 
            success: true, 
            sessionId: sessionId,
            orderId: orderId,
            message: 'Brouillon mis à jour (un seul par session)'
        });

    } catch (error) {
        console.error('Erreur lors de la sauvegarde du brouillon:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la sauvegarde du brouillon' 
        });
    }
});

// GET /api/store/get-draft/:sessionId - Get order draft
router.get('/get-draft/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const draft = await StoreOrderModel.getDraftBySession(sessionId);

        if (!draft) {
            return res.status(404).json({ 
                success: false, 
                message: 'Aucun brouillon trouvé' 
            });
        }

        res.json({ 
            success: true, 
            data: draft
        });

    } catch (error) {
        console.error('Erreur lors de la récupération du brouillon:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération du brouillon' 
        });
    }
});

// DELETE /api/store/delete-draft/:sessionId - Delete order draft
router.delete('/delete-draft/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        await StoreOrderModel.deleteDraftBySession(sessionId);

        res.json({ 
            success: true, 
            message: 'Brouillon supprimé avec succès' 
        });

    } catch (error) {
        console.error('Erreur lors de la suppression du brouillon:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la suppression du brouillon' 
        });
    }
});

module.exports = router;