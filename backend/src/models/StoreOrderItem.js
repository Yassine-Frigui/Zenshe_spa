const { executeQuery } = require('../../config/database');

class StoreOrderItemModel {
    // Get order items by order ID
    static async getOrderItems(orderId) {
        const query = `
            SELECT 
                soi.*,
                p.name as current_product_name,
                p.image_url as current_product_image,
                p.price as current_product_price,
                p.is_active as product_is_active
            FROM store_order_items soi
            LEFT JOIN products p ON soi.product_id = p.id
            WHERE soi.order_id = ?
            ORDER BY soi.id
        `;

        const items = await executeQuery(query, [orderId]);
        return items.map(this.formatOrderItem);
    }

    // Get order item by ID
    static async getOrderItemById(id) {
        const query = `
            SELECT 
                soi.*,
                p.name as current_product_name,
                p.image_url as current_product_image,
                p.price as current_product_price,
                p.is_active as product_is_active
            FROM store_order_items soi
            LEFT JOIN products p ON soi.product_id = p.id
            WHERE soi.id = ?
        `;

        const [item] = await executeQuery(query, [id]);
        return item ? this.formatOrderItem(item) : null;
    }

    // Add item to existing order (admin function)
    static async addItemToOrder(orderId, itemData) {
        const {
            product_id,
            quantity,
            price = null // If null, use current product price
        } = itemData;

        if (!product_id || !quantity || quantity <= 0) {
            throw new Error('Invalid item data');
        }

        // Get product details
        const productQuery = 'SELECT * FROM products WHERE id = ? AND is_active = true';
        const [product] = await executeQuery(productQuery, [product_id]);

        if (!product) {
            throw new Error('Product not found or inactive');
        }

        // Use current product price if not specified
        const itemPrice = price || product.price;
        const subtotal = itemPrice * quantity;

        // Stock check removed - pre-order system allows any quantity

        const insertQuery = `
            INSERT INTO store_order_items (
                order_id, product_id, product_name, product_description,
                product_price, product_image_url, quantity, subtotal
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await executeQuery(insertQuery, [
            orderId,
            product_id,
            product.name,
            product.description,
            itemPrice,
            product.image_url,
            quantity,
            subtotal
        ]);

        // Stock update removed - pre-order system doesn't track stock
        // await executeQuery(
        //     'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        //     [quantity, product_id]
        // );

        // Update order totals (triggers will handle this automatically)
        
        return this.getOrderItemById(result.insertId);
    }

    // Update order item quantity (admin function)
    static async updateOrderItemQuantity(id, newQuantity) {
        if (!newQuantity || newQuantity <= 0) {
            throw new Error('Invalid quantity');
        }

        const item = await this.getOrderItemById(id);
        if (!item) {
            throw new Error('Order item not found');
        }

        const oldQuantity = item.quantity;
        const quantityDiff = newQuantity - oldQuantity;
        const newSubtotal = item.product_price * newQuantity;

        // Stock check removed - pre-order system allows any quantity

        // Update order item
        const updateQuery = `
            UPDATE store_order_items 
            SET quantity = ?, subtotal = ?
            WHERE id = ?
        `;

        await executeQuery(updateQuery, [newQuantity, newSubtotal, id]);

        // Stock update removed - pre-order system doesn't track stock
        // if (quantityDiff !== 0) {
        //     await executeQuery(
        //         'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        //         [quantityDiff, item.product_id]
        //     );
        // }

        return this.getOrderItemById(id);
    }

    // Remove item from order (admin function)
    static async removeOrderItem(id) {
        const item = await this.getOrderItemById(id);
        if (!item) {
            throw new Error('Order item not found');
        }

        // Stock restoration removed - pre-order system doesn't track stock
        // await executeQuery(
        //     'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
        //     [item.quantity, item.product_id]
        // );

        // Delete order item (triggers will update order totals)
        await executeQuery('DELETE FROM store_order_items WHERE id = ?', [id]);

        return { success: true, message: 'Order item removed successfully' };
    }

    // Get best selling products
    static async getBestSellingProducts(limit = 10, dateFrom = null, dateTo = null) {
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
                soi.product_id,
                soi.product_name,
                p.name as current_product_name,
                p.image_url as current_product_image,
                p.is_active as product_is_active,
                SUM(soi.quantity) as total_quantity_sold,
                SUM(soi.subtotal) as total_revenue,
                COUNT(DISTINCT soi.order_id) as order_count,
                AVG(soi.product_price) as average_price
            FROM store_order_items soi
            JOIN store_orders so ON soi.order_id = so.id
            LEFT JOIN products p ON soi.product_id = p.id
            WHERE so.status NOT IN ('cancelled') ${dateFilter}
            GROUP BY soi.product_id, soi.product_name
            ORDER BY total_quantity_sold DESC
            LIMIT ?
        `;

        params.push(limit);
        const results = await executeQuery(query, params);

        return results.map(row => ({
            product_id: row.product_id,
            product_name: row.product_name,
            current_product_name: row.current_product_name,
            current_product_image: row.current_product_image,
            product_is_active: Boolean(row.product_is_active),
            total_quantity_sold: parseInt(row.total_quantity_sold),
            total_revenue: parseFloat(row.total_revenue),
            order_count: parseInt(row.order_count),
            average_price: parseFloat(row.average_price)
        }));
    }

    // Get product sales summary
    static async getProductSalesSummary(productId, dateFrom = null, dateTo = null) {
        let dateFilter = '';
        let params = [productId];

        if (dateFrom && dateTo) {
            dateFilter = 'AND so.created_at >= ? AND so.created_at <= ?';
            params.push(dateFrom, dateTo);
        } else if (dateFrom) {
            dateFilter = 'AND so.created_at >= ?';
            params.push(dateFrom);
        } else if (dateTo) {
            dateFilter = 'AND so.created_at <= ?';
            params.push(dateTo);
        }

        const query = `
            SELECT 
                COUNT(DISTINCT soi.order_id) as order_count,
                SUM(soi.quantity) as total_quantity_sold,
                SUM(soi.subtotal) as total_revenue,
                AVG(soi.product_price) as average_selling_price,
                MIN(soi.product_price) as min_selling_price,
                MAX(soi.product_price) as max_selling_price,
                p.name as current_product_name,
                p.price as current_price,
                p.is_preorder as is_preorder,
                p.estimated_delivery_days as estimated_delivery_days
            FROM store_order_items soi
            JOIN store_orders so ON soi.order_id = so.id
            LEFT JOIN products p ON soi.product_id = p.id
            WHERE soi.product_id = ? AND so.status NOT IN ('cancelled') ${dateFilter}
            GROUP BY soi.product_id
        `;

        const [summary] = await executeQuery(query, params);

        if (!summary) {
            return {
                product_id: productId,
                order_count: 0,
                total_quantity_sold: 0,
                total_revenue: 0,
                average_selling_price: 0,
                min_selling_price: 0,
                max_selling_price: 0
            };
        }

        return {
            product_id: productId,
            order_count: parseInt(summary.order_count),
            total_quantity_sold: parseInt(summary.total_quantity_sold || 0),
            total_revenue: parseFloat(summary.total_revenue || 0),
            average_selling_price: parseFloat(summary.average_selling_price || 0),
            min_selling_price: parseFloat(summary.min_selling_price || 0),
            max_selling_price: parseFloat(summary.max_selling_price || 0),
            current_product: {
                name: summary.current_product_name,
                price: parseFloat(summary.current_price || 0),
                is_preorder: Boolean(summary.is_preorder),
                estimated_delivery_days: parseInt(summary.estimated_delivery_days || 14)
            }
        };
    }

    // Get order items by product ID (to see which orders contain a specific product)
    static async getOrderItemsByProduct(productId, pagination = {}) {
        const { page = 1, limit = 20 } = pagination;
        const offset = (page - 1) * limit;

        const query = `
            SELECT 
                soi.*,
                so.order_number,
                so.status as order_status,
                so.client_name,
                so.client_email,
                so.created_at as order_date
            FROM store_order_items soi
            JOIN store_orders so ON soi.order_id = so.id
            WHERE soi.product_id = ?
            ORDER BY soi.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const items = await executeQuery(query, [productId, limit, offset]);

        // Get total count
        const [{ total }] = await executeQuery(
            'SELECT COUNT(*) as total FROM store_order_items WHERE product_id = ?',
            [productId]
        );

        return {
            items: items.map(item => ({
                ...this.formatOrderItem(item),
                order_info: {
                    order_number: item.order_number,
                    order_status: item.order_status,
                    client_name: item.client_name,
                    client_email: item.client_email,
                    order_date: item.order_date
                }
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(total),
                pages: Math.ceil(total / limit)
            }
        };
    }

    // Format order item for API response
    static formatOrderItem(item) {
        if (!item) return null;

        return {
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            product_name: item.product_name,
            product_description: item.product_description,
            product_price: parseFloat(item.product_price),
            product_image_url: item.product_image_url,
            quantity: item.quantity,
            subtotal: parseFloat(item.subtotal),
            created_at: item.created_at,
            // Current product information (may have changed since order)
            current_product: {
                name: item.current_product_name,
                image_url: item.current_product_image,
                price: parseFloat(item.current_product_price || 0),
                is_active: Boolean(item.product_is_active)
            }
        };
    }
}

module.exports = StoreOrderItemModel;