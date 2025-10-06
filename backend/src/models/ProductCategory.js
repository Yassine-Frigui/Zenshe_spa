const { executeQuery } = require('../../config/database');

class ProductCategoryModel {
    // Get all categories
    static async getAllCategories(activeOnly = false) {
        let query = `
            SELECT 
                pc.*,
                COUNT(p.id) as product_count,
                COUNT(CASE WHEN p.is_active = true THEN 1 END) as active_product_count
            FROM product_categories pc
            LEFT JOIN products p ON pc.id = p.category_id
        `;
        
        const params = [];
        
        if (activeOnly) {
            query += ' WHERE pc.is_active = true';
        }
        
        query += `
            GROUP BY pc.id
            ORDER BY pc.display_order ASC, pc.name ASC
        `;
        
        const categories = await executeQuery(query, params);
        return categories.map(this.formatCategory);
    }

    // Get category by ID
    static async getCategoryById(id) {
        const query = `
            SELECT 
                pc.*,
                COUNT(p.id) as product_count,
                COUNT(CASE WHEN p.is_active = true THEN 1 END) as active_product_count
            FROM product_categories pc
            LEFT JOIN products p ON pc.id = p.category_id
            WHERE pc.id = ?
            GROUP BY pc.id
        `;
        
        const [category] = await executeQuery(query, [id]);
        return category ? this.formatCategory(category) : null;
    }

    // Get category by name
    static async getCategoryByName(name) {
        const query = `
            SELECT 
                pc.*,
                COUNT(p.id) as product_count
            FROM product_categories pc
            LEFT JOIN products p ON pc.id = p.category_id
            WHERE pc.name = ?
            GROUP BY pc.id
        `;
        
        const [category] = await executeQuery(query, [name]);
        return category ? this.formatCategory(category) : null;
    }

    // Create new category
    static async createCategory(categoryData) {
        const {
            name,
            description = null,
            image_url = null,
            is_active = true,
            display_order = 0
        } = categoryData;

        if (!name) {
            throw new Error('Category name is required');
        }

        // Check if name already exists
        const existingCategory = await this.getCategoryByName(name);
        if (existingCategory) {
            throw new Error('Category name already exists');
        }

        const query = `
            INSERT INTO product_categories (name, description, image_url, is_active, display_order)
            VALUES (?, ?, ?, ?, ?)
        `;

        const result = await executeQuery(query, [
            name,
            description,
            image_url,
            is_active,
            display_order
        ]);

        return this.getCategoryById(result.insertId);
    }

    // Update category
    static async updateCategory(id, categoryData) {
        const existingCategory = await this.getCategoryById(id);
        if (!existingCategory) {
            throw new Error('Category not found');
        }

        const {
            name,
            description,
            image_url,
            is_active,
            display_order
        } = categoryData;

        // Check name uniqueness if updating name
        if (name && name !== existingCategory.name) {
            const existingName = await this.getCategoryByName(name);
            if (existingName && existingName.id !== id) {
                throw new Error('Category name already exists');
            }
        }

        const query = `
            UPDATE product_categories SET
                name = COALESCE(?, name),
                description = COALESCE(?, description),
                image_url = COALESCE(?, image_url),
                is_active = COALESCE(?, is_active),
                display_order = COALESCE(?, display_order)
            WHERE id = ?
        `;

        await executeQuery(query, [
            name,
            description,
            image_url,
            is_active,
            display_order,
            id
        ]);

        return this.getCategoryById(id);
    }

    // Delete category
    static async deleteCategory(id) {
        const category = await this.getCategoryById(id);
        if (!category) {
            throw new Error('Category not found');
        }

        if (category.product_count > 0) {
            throw new Error('Cannot delete category that contains products. Move products to another category first.');
        }

        const query = 'DELETE FROM product_categories WHERE id = ?';
        await executeQuery(query, [id]);

        return { success: true, message: 'Category deleted successfully' };
    }

    // Soft delete category (deactivate)
    static async deactivateCategory(id) {
        const query = 'UPDATE product_categories SET is_active = false WHERE id = ?';
        await executeQuery(query, [id]);
        return this.getCategoryById(id);
    }

    // Activate category
    static async activateCategory(id) {
        const query = 'UPDATE product_categories SET is_active = true WHERE id = ?';
        await executeQuery(query, [id]);
        return this.getCategoryById(id);
    }

    // Reorder categories
    static async reorderCategories(categoryOrders) {
        // categoryOrders should be an array of {id, display_order}
        if (!Array.isArray(categoryOrders)) {
            throw new Error('Category orders must be an array');
        }

        const updatePromises = categoryOrders.map(({ id, display_order }) => {
            if (!id || display_order === undefined) {
                throw new Error('Each category order must have id and display_order');
            }
            
            return executeQuery(
                'UPDATE product_categories SET display_order = ? WHERE id = ?',
                [display_order, id]
            );
        });

        await Promise.all(updatePromises);

        return { success: true, message: 'Categories reordered successfully' };
    }

    // Get categories with product statistics
    static async getCategoriesWithStats() {
        const query = `
            SELECT 
                pc.*,
                COUNT(p.id) as total_products,
                COUNT(CASE WHEN p.is_active = true THEN 1 END) as active_products,
                COUNT(CASE WHEN p.is_featured = true AND p.is_active = true THEN 1 END) as featured_products,
                AVG(CASE WHEN p.is_active = true THEN p.price ELSE NULL END) as average_price,
                MIN(CASE WHEN p.is_active = true THEN p.price ELSE NULL END) as min_price,
                MAX(CASE WHEN p.is_active = true THEN p.price ELSE NULL END) as max_price
            FROM product_categories pc
            LEFT JOIN products p ON pc.id = p.category_id
            GROUP BY pc.id
            ORDER BY pc.display_order ASC, pc.name ASC
        `;
        
        const categories = await executeQuery(query);
        
        return categories.map(category => ({
            ...this.formatCategory(category),
            statistics: {
                total_products: parseInt(category.total_products || 0),
                active_products: parseInt(category.active_products || 0),
                featured_products: parseInt(category.featured_products || 0),
                average_price: parseFloat(category.average_price || 0),
                min_price: parseFloat(category.min_price || 0),
                max_price: parseFloat(category.max_price || 0)
            }
        }));
    }

    // Get category sales data
    static async getCategorySalesData(dateFrom = null, dateTo = null) {
        let dateFilter = '';
        let params = [];

        if (dateFrom && dateTo) {
            dateFilter = 'AND so.created_at >= ? AND so.created_at <= ?';
            params = [dateFrom, dateTo];
        } else if (dateFrom) {
            dateFilter = 'AND so.created_at >= ?';
            params = [dateFrom];
        } else if (dateTo) {
            dateFilter = 'AND so.created_at <= ?';
            params = [dateTo];
        }

        const query = `
            SELECT 
                pc.id,
                pc.name,
                pc.description,
                COUNT(DISTINCT soi.order_id) as order_count,
                SUM(soi.quantity) as total_quantity_sold,
                SUM(soi.subtotal) as total_revenue,
                COUNT(DISTINCT soi.product_id) as unique_products_sold
            FROM product_categories pc
            LEFT JOIN products p ON pc.id = p.category_id
            LEFT JOIN store_order_items soi ON p.id = soi.product_id
            LEFT JOIN store_orders so ON soi.order_id = so.id
            WHERE (so.status IS NULL OR so.status NOT IN ('cancelled')) ${dateFilter}
            GROUP BY pc.id
            ORDER BY total_revenue DESC
        `;

        const results = await executeQuery(query, params);

        return results.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            order_count: parseInt(row.order_count || 0),
            total_quantity_sold: parseInt(row.total_quantity_sold || 0),
            total_revenue: parseFloat(row.total_revenue || 0),
            unique_products_sold: parseInt(row.unique_products_sold || 0)
        }));
    }

    // Format category for API response
    static formatCategory(category) {
        if (!category) return null;

        return {
            id: category.id,
            name: category.name,
            description: category.description,
            image_url: category.image_url,
            is_active: Boolean(category.is_active),
            display_order: category.display_order,
            product_count: parseInt(category.product_count || 0),
            active_product_count: parseInt(category.active_product_count || 0),
            created_at: category.created_at
        };
    }
}

module.exports = ProductCategoryModel;