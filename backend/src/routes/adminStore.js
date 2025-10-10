const express = require('express');
const router = express.Router();
const ProductModel = require('../models/Product');
const ProductCategoryModel = require('../models/ProductCategory');
const StoreOrderModel = require('../models/StoreOrder');
const StoreOrderItemModel = require('../models/StoreOrderItem');
const { uploadSingle, uploadMultiple, handleUploadError } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// Note: This file assumes admin authentication middleware will be applied at the app level
// All routes in this file should be protected by admin authentication

// =====================================================
// ADMIN PRODUCT MANAGEMENT
// =====================================================

// GET /api/admin/store/products - Get all products for admin (including inactive)
router.get('/products', async (req, res) => {
    try {
        const filters = {
            category_id: req.query.category_id ? parseInt(req.query.category_id) : undefined,
            category: req.query.category,
            is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined,
            is_featured: req.query.is_featured !== undefined ? req.query.is_featured === 'true' : undefined,
            search: req.query.search,
            min_price: req.query.min_price ? parseFloat(req.query.min_price) : undefined,
            max_price: req.query.max_price ? parseFloat(req.query.max_price) : undefined,
            in_stock_only: req.query.in_stock_only === 'true'
        };

        const pagination = {
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 20,
            sort_by: req.query.sort_by || 'created_at',
            sort_order: req.query.sort_order || 'DESC'
        };

        const result = await ProductModel.getAllProducts(filters, pagination);
        
        res.json({
            success: true,
            data: result.products,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error fetching products for admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des produits'
        });
    }
});

// POST /api/admin/store/products - Create new product
router.post('/products', async (req, res) => {
    try {
        const productData = req.body;
        const product = await ProductModel.createProduct(productData);
        
        res.status(201).json({
            success: true,
            message: 'Produit créé avec succès',
            data: product
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Erreur lors de la création du produit'
        });
    }
});

// GET /api/admin/store/products/:id - Get single product
router.get('/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const product = await ProductModel.getProductById(productId);
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Produit non trouvé'
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

// PUT /api/admin/store/products/:id - Update product
router.put('/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const productData = req.body;
        
        const product = await ProductModel.updateProduct(productId, productData);
        
        res.json({
            success: true,
            message: 'Produit mis à jour avec succès',
            data: product
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Erreur lors de la mise à jour du produit'
        });
    }
});

// DELETE /api/admin/store/products/:id - Soft delete product (deactivate)
router.delete('/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const result = await ProductModel.deleteProduct(productId);
        
        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la suppression du produit'
        });
    }
});

// DELETE /api/admin/store/products/:id/hard - Hard delete product
router.delete('/products/:id/hard', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const result = await ProductModel.hardDeleteProduct(productId);
        
        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error hard deleting product:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la suppression définitive du produit'
        });
    }
});

// PUT /api/admin/store/products/:id/stock - DISABLED: Stock management removed (pre-order system)
// router.put('/products/:id/stock', async (req, res) => {
//     try {
//         const productId = parseInt(req.params.id);
//         const { stock_quantity } = req.body;
//         
//         if (stock_quantity === undefined || stock_quantity < 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Quantité de stock invalide'
//             });
//         }

//         const product = await ProductModel.updateStock(productId, stock_quantity);
//         
//         res.json({
//             success: true,
//             message: 'Stock mis à jour avec succès',
//             data: product
//         });
//     } catch (error) {
//         console.error('Error updating stock:', error);
//         res.status(500).json({
//             success: false,
//             message: error.message || 'Erreur lors de la mise à jour du stock'
//         });
//     }
// });

// GET /api/admin/store/products/low-stock - DISABLED: Stock management removed (pre-order system)
// router.get('/products/low-stock', async (req, res) => {
//     try {
//         const threshold = req.query.threshold ? parseInt(req.query.threshold) : 5;
//         const products = await ProductModel.getLowStockProducts(threshold);
//         
//         res.json({
//             success: true,
//             data: products,
//             threshold: threshold
//         });
//     } catch (error) {
//         console.error('Error fetching low stock products:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Erreur lors de la récupération des produits en rupture de stock'
//         });
//     }
// });

// =====================================================
// ADMIN CATEGORY MANAGEMENT
// =====================================================

// GET /api/admin/store/categories - Get all categories with stats
router.get('/categories', async (req, res) => {
    try {
        const categories = await ProductCategoryModel.getCategoriesWithStats();
        
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

// POST /api/admin/store/categories - Create new category
router.post('/categories', async (req, res) => {
    try {
        const categoryData = req.body;
        const category = await ProductCategoryModel.createCategory(categoryData);
        
        res.status(201).json({
            success: true,
            message: 'Catégorie créée avec succès',
            data: category
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Erreur lors de la création de la catégorie'
        });
    }
});

// PUT /api/admin/store/categories/:id - Update category
router.put('/categories/:id', async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        const categoryData = req.body;
        
        const category = await ProductCategoryModel.updateCategory(categoryId, categoryData);
        
        res.json({
            success: true,
            message: 'Catégorie mise à jour avec succès',
            data: category
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Erreur lors de la mise à jour de la catégorie'
        });
    }
});

// DELETE /api/admin/store/categories/:id - Delete category
router.delete('/categories/:id', async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        const result = await ProductCategoryModel.deleteCategory(categoryId);
        
        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la suppression de la catégorie'
        });
    }
});

// POST /api/admin/store/categories/reorder - Reorder categories
router.post('/categories/reorder', async (req, res) => {
    try {
        const { categoryOrders } = req.body;
        const result = await ProductCategoryModel.reorderCategories(categoryOrders);
        
        res.json({
            success: true,
            message: result.message
        });
    } catch (error) {
        console.error('Error reordering categories:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Erreur lors de la réorganisation des catégories'
        });
    }
});

// =====================================================
// ADMIN ORDER MANAGEMENT
// =====================================================

// GET /api/admin/store/orders - Get all orders for admin
router.get('/orders', async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            client_email: req.query.client_email,
            date_from: req.query.date_from,
            date_to: req.query.date_to,
            search: req.query.search
        };

        const pagination = {
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 20,
            sort_by: req.query.sort_by || 'created_at',
            sort_order: req.query.sort_order || 'DESC'
        };

        const result = await StoreOrderModel.getOrdersForAdmin(filters, pagination);
        
        res.json({
            success: true,
            data: result.orders,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error fetching orders for admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des commandes'
        });
    }
});

// GET /api/admin/store/orders/:id - Get single order with full details
router.get('/orders/:id', async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const order = await StoreOrderModel.getOrderById(orderId);
        
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

// PUT /api/admin/store/orders/:id/status - Update order status
router.put('/orders/:id/status', async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const { status, admin_notes } = req.body;
        
        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Statut requis'
            });
        }

        const order = await StoreOrderModel.updateOrderStatus(orderId, status, admin_notes);
        
        res.json({
            success: true,
            message: 'Statut de commande mis à jour avec succès',
            data: order
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Erreur lors de la mise à jour du statut'
        });
    }
});

// POST /api/admin/store/orders/:id/cancel - Cancel order
router.post('/orders/:id/cancel', async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const { reason } = req.body;
        
        const order = await StoreOrderModel.cancelOrder(orderId, reason);
        
        res.json({
            success: true,
            message: 'Commande annulée avec succès',
            data: order
        });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Erreur lors de l\'annulation de la commande'
        });
    }
});

// =====================================================
// ADMIN ANALYTICS & REPORTS
// =====================================================

// GET /api/admin/store/analytics/orders - Order analytics
router.get('/analytics/orders', async (req, res) => {
    try {
        const { date_from, date_to } = req.query;
        const stats = await StoreOrderModel.getOrderStats(date_from, date_to);
        
        res.json({
            success: true,
            data: stats,
            period: {
                date_from: date_from || null,
                date_to: date_to || null
            }
        });
    } catch (error) {
        console.error('Error fetching order analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des analyses de commandes'
        });
    }
});

// GET /api/admin/store/analytics/products/best-sellers - Best selling products
router.get('/analytics/products/best-sellers', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const { date_from, date_to } = req.query;
        
        const bestSellers = await StoreOrderItemModel.getBestSellingProducts(limit, date_from, date_to);
        
        res.json({
            success: true,
            data: bestSellers,
            period: {
                date_from: date_from || null,
                date_to: date_to || null
            }
        });
    } catch (error) {
        console.error('Error fetching best sellers:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des meilleures ventes'
        });
    }
});

// GET /api/admin/store/analytics/categories/sales - Category sales analytics
router.get('/analytics/categories/sales', async (req, res) => {
    try {
        const { date_from, date_to } = req.query;
        const categoryData = await ProductCategoryModel.getCategorySalesData(date_from, date_to);
        
        res.json({
            success: true,
            data: categoryData,
            period: {
                date_from: date_from || null,
                date_to: date_to || null
            }
        });
    } catch (error) {
        console.error('Error fetching category sales data:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des données de vente par catégorie'
        });
    }
});

// GET /api/admin/store/analytics/products/:id/sales - Product sales summary
router.get('/analytics/products/:id/sales', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const { date_from, date_to } = req.query;
        
        const salesData = await StoreOrderItemModel.getProductSalesSummary(productId, date_from, date_to);
        
        res.json({
            success: true,
            data: salesData,
            period: {
                date_from: date_from || null,
                date_to: date_to || null
            }
        });
    } catch (error) {
        console.error('Error fetching product sales summary:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du résumé des ventes du produit'
        });
    }
});

// =====================================================
// IMAGE UPLOAD ROUTES
// =====================================================

// POST /api/admin/store/upload/product-image - Upload single product image
router.post('/upload/product-image', (req, res) => {
    uploadSingle(req, res, (err) => {
        handleUploadError(err, req, res, () => {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            // Return the relative path to store in database
            const imageUrl = `/uploads/products/${req.file.filename}`;
            
            res.json({
                success: true,
                message: 'Image uploaded successfully',
                data: {
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    size: req.file.size,
                    imageUrl: imageUrl,
                    mimetype: req.file.mimetype
                }
            });
        });
    });
});

// POST /api/admin/store/upload/product-gallery - Upload multiple product gallery images
router.post('/upload/product-gallery', (req, res) => {
    uploadMultiple(req, res, (err) => {
        handleUploadError(err, req, res, () => {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No files uploaded'
                });
            }

            // Return array of relative paths
            const images = req.files.map(file => ({
                filename: file.filename,
                originalName: file.originalname,
                size: file.size,
                imageUrl: `/uploads/products/${file.filename}`,
                mimetype: file.mimetype
            }));
            
            res.json({
                success: true,
                message: `${req.files.length} image(s) uploaded successfully`,
                data: images
            });
        });
    });
});

// DELETE /api/admin/store/upload/product-image/:filename - Delete product image
router.delete('/upload/product-image/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../../uploads/products', filename);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        // Delete the file
        fs.unlinkSync(filePath);
        
        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting image'
        });
    }
});

module.exports = router;