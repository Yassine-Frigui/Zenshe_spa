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

    describe('create', () => {
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

            executeTransaction.mockResolvedValue(1);

            const orderId = await StoreOrderModel.create(mockOrderData);

            expect(executeTransaction).toHaveBeenCalled();
            expect(orderId).toBe(1);
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

            executeTransaction.mockResolvedValue(1);

            const orderId = await StoreOrderModel.create(mockOrderData);

            expect(orderId).toBeDefined();
            expect(executeTransaction).toHaveBeenCalled();
        });
    });

    describe('cancel', () => {
        test('should cancel order without stock restoration', async () => {
            executeQuery.mockResolvedValueOnce([[sampleOrders[0]]])
                        .mockResolvedValueOnce([{ affectedRows: 1 }]);

            const result = await StoreOrderModel.cancel(1);

            expect(result.success).toBe(true);
            expect(executeQuery).toHaveBeenCalled();
            
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
            executeQuery.mockResolvedValue([[sampleOrders[0]]]);

            const order = await StoreOrderModel.getOrderById(1);

            expect(order).toBeDefined();
            expect(order.order_number).toBe('ORD-2025-001');
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
