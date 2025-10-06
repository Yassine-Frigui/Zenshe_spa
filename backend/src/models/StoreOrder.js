const { executeQuery, executeTransaction } = require('../../config/database');

class StoreOrderModel {
    // Generate unique order number
    static async generateOrderNumber(connection = null) {
        const executeQueryFunc = connection || executeQuery;
        
        // Format: ZS-YYYYMMDD-NNNN (e.g., ZS-20250916-0001)
        const today = new Date();
        const dateStr = today.getFullYear() + 
                       String(today.getMonth() + 1).padStart(2, '0') + 
                       String(today.getDate()).padStart(2, '0');
        
        // Get the highest order number for today
        const query = `
            SELECT order_number 
            FROM store_orders 
            WHERE order_number LIKE                 // No stock management - pre-order system only
            }

            return orderId;
        });
    }
}

module.exports = StoreOrderModel;   ORDER BY order_number DESC 
            LIMIT 1
        `;
        
        const pattern = `ZS-${dateStr}-%`;
        const results = await executeQueryFunc(query, [pattern]);
        
        let nextNumber = 1;
        if (results.length > 0 && results[0].order_number) {
            // Extract the sequence number from the last order
            const lastOrderNumber = results[0].order_number;
            const parts = lastOrderNumber.split('-');
            if (parts.length === 3) {
                const lastSequence = parseInt(parts[2]);
                if (!isNaN(lastSequence)) {
                    nextNumber = lastSequence + 1;
                }
            }
        }
        
        const sequenceStr = String(nextNumber).padStart(4, '0');
        return `ZS-${dateStr}-${sequenceStr}`;
    }

    // Create new order
    static async createOrder(orderData) {
        const {
            client_id = null,
            client_name,
            client_email,
            client_phone,
            client_address,
            notes = null,
            items = [] // Array of {product_id, quantity, price}
        } = orderData;

        // Validate required fields
        if (!client_name || !client_email || !client_phone || !client_address) {
            throw new Error('Customer information is required');
        }

        if (!items || items.length === 0) {
            throw new Error('Order must contain at least one item');
        }

        return executeTransaction(async (connection) => {
            // Generate unique order number
            const orderNumber = await this.generateOrderNumber(connection);
            
            const orderQuery = `
                INSERT INTO store_orders (
                    order_number, client_id, client_name, client_email, 
                    client_phone, client_address, notes, total_amount, items_count
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            // Calculate totals
            let totalAmount = 0;
            let totalItems = 0;

            // Validate items and calculate totals
            for (const item of items) {
                if (!item.product_id || !item.quantity || !item.price) {
                    throw new Error('Invalid item data');
                }
                totalAmount += item.price * item.quantity;
                totalItems += item.quantity;
            }

            const orderResult = await connection(orderQuery, [
                orderNumber,
                client_id,
                client_name,
                client_email,
                client_phone,
                client_address,
                notes,
                totalAmount,
                totalItems
            ]);

            const orderId = orderResult.insertId;

            // Insert order items
            for (const item of items) {
                // Get product details for snapshot
                const productResults = await connection(
                    'SELECT name, description, image_url FROM products WHERE id = ?',
                    [item.product_id]
                );

                const product = productResults[0];
                if (!product) {
                    throw new Error(`Product with ID ${item.product_id} not found`);
                }

                const itemQuery = `
                    INSERT INTO store_order_items (
                        order_id, product_id, product_name, product_description,
                        product_price, product_image_url, quantity, subtotal
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;

                await connection(itemQuery, [
                    orderId,
                    item.product_id,
                    product.name,
                    product.description,
                    item.price,
                    product.image_url,
                    item.quantity,
                    item.price * item.quantity
                ]);

                // No stock management needed - all products are pre-order only
            }

            // Update client type if registered customer
            if (client_id) {
                await connection(`
                    UPDATE clients 
                    SET client_type = CASE 
                        WHEN client_type = 'spa_only' THEN 'both'
                        ELSE client_type 
                    END 
                    WHERE id = ?
                `, [client_id]);
            }

            // Return order data immediately instead of querying again
            return { 
                id: orderId,
                order_number: orderNumber,
                client_name,
                client_email,
                client_phone,
                client_address,
                total_amount: totalAmount,
                items_count: totalItems,
                status: 'pending',
                created_at: new Date()
            };
        });
    }

    // Get order by ID with items
    static async getOrderById(id) {
        const orderQuery = `
            SELECT 
                so.*,
                c.nom, c.prenom
            FROM store_orders so
            LEFT JOIN clients c ON so.client_id = c.id
            WHERE so.id = ?
        `;

        const [order] = await executeQuery(orderQuery, [id]);
        if (!order) return null;

        // Get order items
        const itemsQuery = `
            SELECT 
                soi.*,
                p.name as current_product_name,
                p.image_url as current_product_image,
                p.is_active as product_is_active
            FROM store_order_items soi
            LEFT JOIN products p ON soi.product_id = p.id
            WHERE soi.order_id = ?
            ORDER BY soi.id
        `;

        const items = await executeQuery(itemsQuery, [id]);

        return this.formatOrderWithItems(order, items);
    }

    // Get order by order number
    static async getOrderByNumber(orderNumber) {
        const orderQuery = `
            SELECT 
                so.*,
                c.nom, c.prenom
            FROM store_orders so
            LEFT JOIN clients c ON so.client_id = c.id
            WHERE so.order_number = ?
        `;

        const [order] = await executeQuery(orderQuery, [orderNumber]);
        if (!order) return null;

        const itemsQuery = `
            SELECT 
                soi.*,
                p.name as current_product_name,
                p.image_url as current_product_image
            FROM store_order_items soi
            LEFT JOIN products p ON soi.product_id = p.id
            WHERE soi.order_id = ?
            ORDER BY soi.id
        `;

        const items = await executeQuery(itemsQuery, [order.id]);

        return this.formatOrderWithItems(order, items);
    }

    // Get orders by client ID
    static async getOrdersByClient(clientId, pagination = {}) {
        const { page = 1, limit = 10 } = pagination;
        const offset = (page - 1) * limit;

        const ordersQuery = `
            SELECT so.* 
            FROM store_orders so
            WHERE so.client_id = ?
            ORDER BY so.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const orders = await executeQuery(ordersQuery, [clientId, limit, offset]);

        // Get total count
        const [{ total }] = await executeQuery(
            'SELECT COUNT(*) as total FROM store_orders WHERE client_id = ?',
            [clientId]
        );

        return {
            orders: orders.map(this.formatOrder),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(total),
                pages: Math.ceil(total / limit)
            }
        };
    }

    // Get all orders for admin (with filters)
    static async getOrdersForAdmin(filters = {}, pagination = {}) {
        const {
            status,
            client_email,
            date_from,
            date_to,
            search
        } = filters;

        const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'DESC' } = pagination;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams = [];

        if (status) {
            whereConditions.push('so.status = ?');
            queryParams.push(status);
        }

        if (client_email) {
            whereConditions.push('so.client_email LIKE ?');
            queryParams.push(`%${client_email}%`);
        }

        if (date_from) {
            whereConditions.push('so.created_at >= ?');
            queryParams.push(date_from);
        }

        if (date_to) {
            whereConditions.push('so.created_at <= ?');
            queryParams.push(date_to);
        }

        if (search) {
            whereConditions.push('(so.order_number LIKE ? OR so.client_name LIKE ? OR so.client_email LIKE ?)');
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const validSortColumns = ['created_at', 'order_number', 'status', 'total_amount', 'client_name'];
        const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
        const sortDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const ordersQuery = `
            SELECT 
                so.*,
                c.nom, c.prenom
            FROM store_orders so
            LEFT JOIN clients c ON so.client_id = c.id
            ${whereClause}
            ORDER BY so.${sortColumn} ${sortDirection}
            LIMIT ? OFFSET ?
        `;

        queryParams.push(limit, offset);

        const orders = await executeQuery(ordersQuery, queryParams);

        // Get total count
        const countQuery = `
            SELECT COUNT(*) as total
            FROM store_orders so
            LEFT JOIN clients c ON so.client_id = c.id
            ${whereClause}
        `;

        const countParams = queryParams.slice(0, -2); // Remove LIMIT and OFFSET
        const [{ total }] = await executeQuery(countQuery, countParams);

        return {
            orders: orders.map(this.formatOrder),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(total),
                pages: Math.ceil(total / limit)
            }
        };
    }

    // Update order status
    static async updateOrderStatus(id, status, adminNotes = null) {
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status');
        }

        let timestampUpdate = '';
        if (status === 'confirmed') timestampUpdate = ', confirmed_at = CURRENT_TIMESTAMP';
        if (status === 'shipped') timestampUpdate = ', shipped_at = CURRENT_TIMESTAMP';
        if (status === 'delivered') timestampUpdate = ', delivered_at = CURRENT_TIMESTAMP';

        const query = `
            UPDATE store_orders 
            SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = CURRENT_TIMESTAMP${timestampUpdate}
            WHERE id = ?
        `;

        await executeQuery(query, [status, adminNotes, id]);
        return this.getOrderById(id);
    }

    // Cancel order
    static async cancelOrder(id, reason = null) {
        return executeTransaction(async (connection) => {
            // Get order details
            const order = await this.getOrderById(id);
            if (!order) {
                throw new Error('Order not found');
            }

            if (order.status === 'cancelled') {
                throw new Error('Order already cancelled');
            }

            if (['shipped', 'delivered'].includes(order.status)) {
                throw new Error('Cannot cancel shipped or delivered order');
            }

            // No stock restoration needed - all products are pre-order only

            // Update order status
            await executeQuery(`
                UPDATE store_orders 
                SET status = 'cancelled', 
                    admin_notes = CONCAT(COALESCE(admin_notes, ''), ?, ' - Cancelled: ', COALESCE(?, 'No reason provided')),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, ['\n', reason, id], connection);

            return this.getOrderById(id);
        });
    }

    // Get order statistics
    static async getOrderStats(dateFrom = null, dateTo = null) {
        let dateFilter = '';
        let params = [];

        if (dateFrom && dateTo) {
            dateFilter = 'WHERE created_at >= ? AND created_at <= ?';
            params = [dateFrom, dateTo];
        } else if (dateFrom) {
            dateFilter = 'WHERE created_at >= ?';
            params = [dateFrom];
        } else if (dateTo) {
            dateFilter = 'WHERE created_at <= ?';
            params = [dateTo];
        }

        const statsQuery = `
            SELECT 
                COUNT(*) as total_orders,
                SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END) as total_revenue,
                SUM(CASE WHEN status != 'cancelled' THEN items_count ELSE 0 END) as total_items_sold,
                AVG(CASE WHEN status != 'cancelled' THEN total_amount ELSE NULL END) as average_order_value,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
                COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
                COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
                COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
            FROM store_orders 
            ${dateFilter}
        `;

        const [stats] = await executeQuery(statsQuery, params);

        return {
            total_orders: parseInt(stats.total_orders),
            total_revenue: parseFloat(stats.total_revenue || 0),
            total_items_sold: parseInt(stats.total_items_sold || 0),
            average_order_value: parseFloat(stats.average_order_value || 0),
            status_breakdown: {
                pending: parseInt(stats.pending_orders),
                confirmed: parseInt(stats.confirmed_orders),
                processing: parseInt(stats.processing_orders),
                shipped: parseInt(stats.shipped_orders),
                delivered: parseInt(stats.delivered_orders),
                cancelled: parseInt(stats.cancelled_orders)
            }
        };
    }

    // Format order for API response
    static formatOrder(order) {
        if (!order) return null;

        return {
            id: order.id,
            order_number: order.order_number,
            client_id: order.client_id,
            client_name: order.client_name,
            client_email: order.client_email,
            client_phone: order.client_phone,
            client_address: order.client_address,
            status: order.status,
            total_amount: parseFloat(order.total_amount),
            items_count: order.items_count,
            notes: order.notes,
            admin_notes: order.admin_notes,
            created_at: order.created_at,
            updated_at: order.updated_at,
            confirmed_at: order.confirmed_at,
            shipped_at: order.shipped_at,
            delivered_at: order.delivered_at,
            // Client info if registered customer
            registered_client: order.client_id ? {
                nom: order.nom,
                prenom: order.prenom
            } : null
        };
    }

    // Format order with items
    static formatOrderWithItems(order, items) {
        const formattedOrder = this.formatOrder(order);
        
        formattedOrder.items = items.map(item => ({
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            product_description: item.product_description,
            product_price: parseFloat(item.product_price),
            product_image_url: item.product_image_url,
            quantity: item.quantity,
            subtotal: parseFloat(item.subtotal),
            created_at: item.created_at,
            // Current product info (may have changed since order)
            current_product: {
                name: item.current_product_name,
                image_url: item.current_product_image,
                is_active: Boolean(item.product_is_active)
            }
        }));

        return formattedOrder;
    }

    // =====================================================
    // DRAFT ORDER METHODS
    // =====================================================

    // Create draft order
    static async createDraft(sessionId, draftData) {
        const {
            client_name,
            client_email,
            client_phone,
            delivery_address,
            notes,
            cart_items
        } = draftData;

        // Calculate totals from cart items
        let totalAmount = 0;
        let totalItems = 0;

        if (cart_items && cart_items.length > 0) {
            for (const item of cart_items) {
                totalAmount += (item.price || 0) * (item.quantity || 0);
                totalItems += item.quantity || 0;
            }
        }

        const query = `
            INSERT INTO store_orders (
                order_number, session_id, client_name, client_email, 
                client_phone, client_address, notes, total_amount, 
                items_count, status, order_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
        `;

        const orderData = JSON.stringify({
            cart_items: cart_items || [],
            form_data: {
                client_name,
                client_email,
                client_phone,
                delivery_address,
                notes
            }
        });

        const orderNumber = await this.generateOrderNumber();
        
        const result = await executeQuery(query, [
            orderNumber,
            sessionId,
            client_name,
            client_email,
            client_phone,
            delivery_address,
            notes,
            totalAmount,
            totalItems,
            orderData
        ]);

        return result.insertId;
    }

    // Update existing draft
    static async updateDraft(draftId, draftData) {
        const {
            client_name,
            client_email,
            client_phone,
            delivery_address,
            notes,
            cart_items
        } = draftData;

        // Calculate totals from cart items
        let totalAmount = 0;
        let totalItems = 0;

        if (cart_items && cart_items.length > 0) {
            for (const item of cart_items) {
                totalAmount += (item.price || 0) * (item.quantity || 0);
                totalItems += item.quantity || 0;
            }
        }

        const orderData = JSON.stringify({
            cart_items: cart_items || [],
            form_data: {
                client_name,
                client_email,
                client_phone,
                delivery_address,
                notes
            }
        });

        const query = `
            UPDATE store_orders 
            SET client_name = ?, client_email = ?, client_phone = ?, 
                client_address = ?, notes = ?, total_amount = ?, 
                items_count = ?, order_data = ?, updated_at = NOW()
            WHERE id = ? AND status = 'draft'
        `;

        await executeQuery(query, [
            client_name,
            client_email,
            client_phone,
            delivery_address,
            notes,
            totalAmount,
            totalItems,
            orderData,
            draftId
        ]);

        return draftId;
    }

    // Get draft by session ID
    static async getDraftBySession(sessionId) {
        const query = `
            SELECT id, session_id, client_name, client_email, client_phone, 
                   client_address, notes, total_amount, items_count, 
                   order_data, created_at, updated_at
            FROM store_orders 
            WHERE session_id = ? AND status = 'draft' 
            LIMIT 1
        `;

        const results = await executeQuery(query, [sessionId]);
        
        if (results.length === 0) {
            return null;
        }

        const draft = results[0];
        
        // Parse order data if exists
        let parsedData = null;
        if (draft.order_data) {
            try {
                parsedData = JSON.parse(draft.order_data);
            } catch (error) {
                console.error('Error parsing draft order data:', error);
            }
        }

        return {
            id: draft.id,
            session_id: draft.session_id,
            client_name: draft.client_name,
            client_email: draft.client_email,
            client_phone: draft.client_phone,
            delivery_address: draft.client_address,
            notes: draft.notes,
            total_amount: parseFloat(draft.total_amount),
            items_count: draft.items_count,
            cart_items: parsedData?.cart_items || [],
            form_data: parsedData?.form_data || {},
            created_at: draft.created_at,
            updated_at: draft.updated_at
        };
    }

    // Delete draft by session ID
    static async deleteDraftBySession(sessionId) {
        const query = 'DELETE FROM store_orders WHERE session_id = ? AND status = "draft"';
        return await executeQuery(query, [sessionId]);
    }

    // Convert draft to actual order
    static async convertDraftToOrder(draftId) {
        const query = `
            UPDATE store_orders 
            SET status = 'pending', session_id = NULL, updated_at = NOW()
            WHERE id = ? AND status = 'draft'
        `;
        
        await executeQuery(query, [draftId]);
        return draftId;
    }

    // Update existing order
    static async updateOrder(orderId, orderData) {
        const {
            client_id = null,
            client_name,
            client_email,
            client_phone,
            client_address,
            notes = null,
            items = []
        } = orderData;

        return executeTransaction(async (connection) => {
            // Calculate totals
            let totalAmount = 0;
            let totalItems = 0;

            for (const item of items) {
                totalAmount += item.price * item.quantity;
                totalItems += item.quantity;
            }

            // Update main order record
            const updateOrderQuery = `
                UPDATE store_orders 
                SET client_id = ?, client_name = ?, client_email = ?, 
                    client_phone = ?, client_address = ?, notes = ?, 
                    total_amount = ?, items_count = ?, updated_at = NOW()
                WHERE id = ?
            `;

            await executeQuery(updateOrderQuery, [
                client_id,
                client_name,
                client_email,
                client_phone,
                client_address,
                notes,
                totalAmount,
                totalItems,
                orderId
            ]);

            // Delete existing order items
            await executeQuery('DELETE FROM store_order_items WHERE order_id = ?', [orderId]);

            // Insert new order items
            for (const item of items) {
                const itemQuery = `
                    INSERT INTO store_order_items (
                        order_id, product_id, quantity, unit_price, subtotal
                    ) VALUES (?, ?, ?, ?, ?)
                `;

                const subtotal = item.price * item.quantity;
                await executeQuery(itemQuery, [
                    orderId,
                    item.product_id,
                    item.quantity,
                    item.price,
                    subtotal
                ]);

                // Stock update removed - pre-order system doesn't track stock
                // await executeQuery(
                //     'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                //     [item.quantity, item.product_id]
                // );
            }

            return orderId;
        });
    }
}

module.exports = StoreOrderModel;