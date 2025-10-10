const { executeQuery, executeTransaction } = require('../../config/database');

class ProductModel {
    // Get all products with filtering and pagination (Pre-order only system)
    static async getAllProducts(filters = {}, pagination = {}) {
        const {
            category_id,
            category,
            is_active = true,
            is_featured,
            search,
            min_price,
            max_price,
            language = 'fr' // Default to French
        } = filters;

        const {
            page = 1,
            limit = 12,
            sort_by = 'name',
            sort_order = 'ASC'
        } = pagination;

        const offset = (page - 1) * limit;
        let whereConditions = ['p.is_active = ?'];
        let queryParams = [is_active];

        // Build WHERE conditions
        if (category_id) {
            whereConditions.push('p.category_id = ?');
            queryParams.push(category_id);
        }

        if (category) {
            whereConditions.push('p.category = ?');
            queryParams.push(category);
        }

        if (is_featured !== undefined) {
            whereConditions.push('p.is_featured = ?');
            queryParams.push(is_featured);
        }

        if (search) {
            whereConditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.detailed_description LIKE ?)');
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        if (min_price) {
            whereConditions.push('p.price >= ?');
            queryParams.push(min_price);
        }

        if (max_price) {
            whereConditions.push('p.price <= ?');
            queryParams.push(max_price);
        }

        // Valid sort columns (removed stock_quantity)
        const validSortColumns = ['name', 'price', 'created_at'];
        const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'name';
        const sortDirection = sort_order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        const query = `
            SELECT 
                p.*,
                COALESCE(pt.name, p.name) as name,
                COALESCE(pt.description, p.description) as description,
                COALESCE(pt.detailed_description, p.detailed_description) as detailed_description,
                COALESCE(pct.name, pc.name) as category_name,
                COALESCE(pct.description, pc.description) as category_description
            FROM products p
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            LEFT JOIN product_translations pt ON p.id = pt.product_id AND pt.language_code = ?
            LEFT JOIN product_category_translations pct ON pc.id = pct.category_id AND pct.language_code = ?
            WHERE ${whereConditions.join(' AND ')}
            ORDER BY COALESCE(pt.name, p.name) ${sortDirection}
            LIMIT ? OFFSET ?
        `;

        // Add language parameter twice (for product and category translations)
        queryParams.unshift(language, language);
        queryParams.push(limit, offset);
        
        const products = await executeQuery(query, queryParams);

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM products p
            LEFT JOIN product_translations pt ON p.id = pt.product_id AND pt.language_code = ?
            WHERE ${whereConditions.join(' AND ')}
        `;
        
        const countParams = [language, ...queryParams.slice(2, -2)]; // Add language, remove first 2 language params and last 2 (LIMIT/OFFSET)
        const [{ total }] = await executeQuery(countQuery, countParams);

        return {
            products: products.map(this.formatProduct),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(total),
                pages: Math.ceil(total / limit)
            }
        };
    }

    // Get product by ID
    static async getProductById(id, language = 'fr') {
        const query = `
            SELECT 
                p.*,
                COALESCE(pt.name, p.name) as name,
                COALESCE(pt.description, p.description) as description,
                COALESCE(pt.detailed_description, p.detailed_description) as detailed_description,
                COALESCE(pct.name, pc.name) as category_name,
                COALESCE(pct.description, pc.description) as category_description
            FROM products p
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            LEFT JOIN product_translations pt ON p.id = pt.product_id AND pt.language_code = ?
            LEFT JOIN product_category_translations pct ON pc.id = pct.category_id AND pct.language_code = ?
            WHERE p.id = ?
        `;
        
        const [product] = await executeQuery(query, [language, language, id]);
        return product ? this.formatProduct(product) : null;
    }

    // Get product by SKU
    static async getProductBySku(sku) {
        const query = `
            SELECT 
                p.*,
                pc.name as category_name,
                pc.description as category_description
            FROM products p
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            WHERE p.sku = ?
        `;
        
        const [product] = await executeQuery(query, [sku]);
        return product ? this.formatProduct(product) : null;
    }

    // Get featured products
    static async getFeaturedProducts(limit = 8, language = 'fr') {
        const query = `
            SELECT 
                p.*,
                COALESCE(pt.name, p.name) as name,
                COALESCE(pt.description, p.description) as description,
                COALESCE(pt.detailed_description, p.detailed_description) as detailed_description,
                COALESCE(pct.name, pc.name) as category_name
            FROM products p
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            LEFT JOIN product_translations pt ON p.id = pt.product_id AND pt.language_code = ?
            LEFT JOIN product_category_translations pct ON pc.id = pct.category_id AND pct.language_code = ?
            WHERE p.is_featured = true AND p.is_active = true
            ORDER BY p.created_at DESC
            LIMIT ?
        `;
        
        const products = await executeQuery(query, [language, language, limit]);
        return products.map(this.formatProduct);
    }

    // Get products by category
    static async getProductsByCategory(categoryId, limit = null, language = 'fr') {
        let query = `
            SELECT 
                p.*,
                COALESCE(pt.name, p.name) as name,
                COALESCE(pt.description, p.description) as description,
                COALESCE(pt.detailed_description, p.detailed_description) as detailed_description,
                COALESCE(pct.name, pc.name) as category_name
            FROM products p
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            LEFT JOIN product_translations pt ON p.id = pt.product_id AND pt.language_code = ?
            LEFT JOIN product_category_translations pct ON pc.id = pct.category_id AND pct.language_code = ?
            WHERE p.category_id = ? AND p.is_active = true
            ORDER BY COALESCE(pt.name, p.name) ASC
        `;
        
        const params = [language, language, categoryId];
        
        if (limit) {
            query += ' LIMIT ?';
            params.push(limit);
        }
        
        const products = await executeQuery(query, params);
        return products.map(this.formatProduct);
    }

    // Create new product
    static async createProduct(productData) {
        const {
            name,
            description,
            detailed_description,
            price,
            category,
            category_id,
            image_url,
            gallery_images,
            is_active = true,
            is_featured = false,
            is_preorder = true,
            estimated_delivery_days = 14,
            weight = 0.00,
            dimensions,
            sku
        } = productData;

        // Validate required fields
        if (!name || !price) {
            throw new Error('Name and price are required');
        }

        // Check if SKU already exists
        if (sku) {
            const existingProduct = await this.getProductBySku(sku);
            if (existingProduct) {
                throw new Error('SKU already exists');
            }
        }

        const query = `
            INSERT INTO products (
                name, description, detailed_description, price, category, 
                category_id, image_url, gallery_images,
                is_active, is_featured, is_preorder, estimated_delivery_days,
                weight, dimensions, sku
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await executeQuery(query, [
            name,
            description || null,
            detailed_description || null,
            price,
            category || null,
            category_id || null,
            image_url || null,
            gallery_images ? JSON.stringify(gallery_images) : null,
            is_active,
            is_featured,
            is_preorder,
            estimated_delivery_days,
            weight,
            dimensions || null,
            sku || null
        ]);

        return this.getProductById(result.insertId);
    }

    // Update product
    static async updateProduct(id, productData) {
        const existingProduct = await this.getProductById(id);
        if (!existingProduct) {
            throw new Error('Product not found');
        }

        const {
            name,
            description,
            detailed_description,
            price,
            category,
            category_id,
            image_url,
            gallery_images,
            is_active,
            is_featured,
            is_preorder,
            estimated_delivery_days,
            weight,
            dimensions,
            sku
        } = productData;

        // Check SKU uniqueness if updating
        if (sku && sku !== existingProduct.sku) {
            const existingSku = await this.getProductBySku(sku);
            if (existingSku && existingSku.id !== id) {
                throw new Error('SKU already exists');
            }
        }

        const query = `
            UPDATE products SET
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                detailed_description = COALESCE(?, detailed_description),
                price = COALESCE(?, price),
                category = COALESCE(?, category),
                category_id = COALESCE(?, category_id),
                image_url = COALESCE(?, image_url),
                gallery_images = COALESCE(?, gallery_images),
                is_active = COALESCE(?, is_active),
                is_featured = COALESCE(?, is_featured),
                is_preorder = COALESCE(?, is_preorder),
                estimated_delivery_days = COALESCE(?, estimated_delivery_days),
                weight = COALESCE(?, weight),
                dimensions = COALESCE(?, dimensions),
                sku = COALESCE(?, sku),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await executeQuery(query, [
            name,
            description,
            detailed_description,
            price,
            category,
            category_id,
            image_url,
            gallery_images ? JSON.stringify(gallery_images) : null,
            is_active,
            is_featured,
            is_preorder,
            estimated_delivery_days,
            weight,
            dimensions,
            sku,
            id
        ]);

        return this.getProductById(id);
    }

    // Delete product (soft delete - set inactive)
    static async deleteProduct(id) {
        const query = `
            UPDATE products SET 
                is_active = false, 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;
        
        await executeQuery(query, [id]);
        return { success: true, message: 'Product deactivated successfully' };
    }

    // Hard delete product
    static async hardDeleteProduct(id) {
        // Check if product is referenced in any orders
        const orderItemsCheck = await executeQuery(
            'SELECT COUNT(*) as count FROM store_order_items WHERE product_id = ?',
            [id]
        );

        if (orderItemsCheck[0].count > 0) {
            throw new Error('Cannot delete product that has been ordered. Consider deactivating instead.');
        }

        const query = 'DELETE FROM products WHERE id = ?';
        await executeQuery(query, [id]);
        return { success: true, message: 'Product deleted successfully' };
    }

    // Note: Stock management removed - all products are pre-order only
    // Orders are saved without checking stock availability

    // Search products
    static async searchProducts(searchTerm, limit = 20) {
        const query = `
            SELECT 
                p.*,
                pc.name as category_name,
                MATCH(p.name, p.description) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
            FROM products p
            LEFT JOIN product_categories pc ON p.category_id = pc.id
            WHERE (
                MATCH(p.name, p.description) AGAINST(? IN NATURAL LANGUAGE MODE) OR
                p.name LIKE ? OR 
                p.description LIKE ? OR 
                p.sku LIKE ?
            ) AND p.is_active = true
            ORDER BY relevance DESC, p.name ASC
            LIMIT ?
        `;

        const searchWildcard = `%${searchTerm}%`;
        const products = await executeQuery(query, [
            searchTerm, searchTerm, searchWildcard, searchWildcard, searchWildcard, limit
        ]);
        
        return products.map(this.formatProduct);
    }

    // Format product for API response
    static formatProduct(product) {
        if (!product) return null;

        return {
            id: product.id,
            name: product.name,
            description: product.description,
            detailed_description: product.detailed_description,
            price: parseFloat(product.price),
            category: product.category,
            category_id: product.category_id,
            category_name: product.category_name,
            image_url: product.image_url,
            gallery_images: product.gallery_images ? JSON.parse(product.gallery_images) : [],
            is_preorder: Boolean(product.is_preorder),
            estimated_delivery_days: parseInt(product.estimated_delivery_days || 14),
            is_active: Boolean(product.is_active),
            is_featured: Boolean(product.is_featured),
            weight: parseFloat(product.weight || 0),
            dimensions: product.dimensions,
            sku: product.sku,
            created_at: product.created_at,
            updated_at: product.updated_at
        };
    }
}

module.exports = ProductModel;