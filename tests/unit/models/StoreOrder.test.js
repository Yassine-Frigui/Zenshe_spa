// Unit tests for Store Order Model

const StoreOrderModel = require('../../../backend/src/models/StoreOrder');
const { sampleOrders } = require('../../fixtures/sample-data');

// Mock the database module
jest.mock('../../../backend/config/database', () => ({
    executeQuery: jest.fn(),
    executeTransaction: jest.fn()
}));

const { executeQuery, executeTransaction } = require('../../../backend/config/database');

describe('StoreOrder Model - Pre-order System', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createOrder', () => {
        test('should create order without stock validation', async () => {
            const mockOrderData = {
                client_name: 'Test Client',
                client_email: 'test@example.com',
                client_phone: '123456789',
                client_address: '123 Test St',
                items: [
                    {
                        product_id: 1,
                        quantity: 5, // Any quantity allowed
                        price: 99.99
                    }
                ]
            };

            const mockOrderResult = {
                id: 1,
                order_number: 'ZS-20251010-0001',
                client_name: 'Test Client',
                client_email: 'test@example.com',
                client_phone: '123456789',
                client_address: '123 Test St',
                total_amount: 499.95,
                items_count: 5,
                status: 'pending',
                created_at: new Date()
            };

            executeTransaction.mockResolvedValue(mockOrderResult);

            const order = await StoreOrderModel.createOrder(mockOrderData);

            expect(executeTransaction).toHaveBeenCalled();
            expect(order).toBeDefined();
            expect(order.id).toBe(1);
        });

        test('should allow high quantity orders (no stock limits)', async () => {
            const mockOrderData = {
                client_name: 'Test Client',
                client_email: 'test@example.com',
                client_phone: '123456789',
                client_address: '123 Test St',
                items: [
                    {
                        product_id: 1,
                        quantity: 99, // Max allowed quantity
                        price: 99.99
                    }
                ]
            };

            const mockOrderResult = {
                id: 2,
                order_number: 'ZS-20251010-0002',
                total_amount: 9899.01,
                items_count: 99
            };

            executeTransaction.mockResolvedValue(mockOrderResult);

            const order = await StoreOrderModel.createOrder(mockOrderData);

            expect(order).toBeDefined();
            expect(executeTransaction).toHaveBeenCalled();
        });
    });

    describe('cancelOrder', () => {
        test('should cancel order without stock restoration', async () => {
            const mockCancelledOrder = {
                ...sampleOrders[0],
                status: 'cancelled'
            };

            // Mock the transaction flow
            executeTransaction.mockImplementation(async (callback) => {
                // Mock getOrderById inside transaction
                executeQuery.mockResolvedValueOnce([[sampleOrders[0]]])
                            .mockResolvedValueOnce([]) // items query
                            .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE query
                            .mockResolvedValueOnce([[mockCancelledOrder]]) // getOrderById again
                            .mockResolvedValueOnce([]); // items query again
                
                return await callback(executeQuery);
            });

            const result = await StoreOrderModel.cancelOrder(1);

            expect(result).toBeDefined();
            expect(executeTransaction).toHaveBeenCalled();
            
            // Verify no stock restoration query
            const queries = executeQuery.mock.calls.map(call => call[0]);
            const hasStockUpdate = queries.some(q => 
                typeof q === 'string' && q.includes('stock_quantity')
            );
            expect(hasStockUpdate).toBe(false);
        });
    });

    describe('getOrderById', () => {
        test('should retrieve order details', async () => {
            // Mock the order query - returns single order
            executeQuery.mockResolvedValueOnce([sampleOrders[0]])
                        // Mock the items query - returns array of items
                        .mockResolvedValueOnce([
                            {
                                id: 1,
                                product_id: 1,
                                product_name: 'Test Product',
                                product_description: 'Test Description',
                                product_price: 99.99,
                                product_image_url: '/uploads/test.jpg',
                                quantity: 2,
                                subtotal: 199.98,
                                created_at: new Date(),
                                current_product_name: 'Test Product',
                                current_product_image: '/uploads/test.jpg',
                                product_is_active: 1
                            }
                        ]);

            const order = await StoreOrderModel.getOrderById(1);

            expect(order).toBeDefined();
            expect(order.order_number).toBe('ORD-2025-001');
            expect(order.items).toBeDefined();
            expect(order.items.length).toBeGreaterThan(0);
        });
    });

    describe('Pre-order System Validation', () => {
        test('should not include stock quantity in order queries', async () => {
            executeQuery.mockResolvedValue([[sampleOrders[0]]]);

            await StoreOrderModel.getOrderById(1);

            const query = executeQuery.mock.calls[0][0];
            expect(query).not.toContain('stock_quantity');
        });
    });
});
