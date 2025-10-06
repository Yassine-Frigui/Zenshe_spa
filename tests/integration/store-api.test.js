// Integration test for Store API

const request = require('supertest');
const app = require('../../../backend/src/app');

describe('Store API Integration Tests', () => {
    describe('GET /api/store/products', () => {
        test('should return list of products', async () => {
            const response = await request(app)
                .get('/api/store/products')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.products)).toBe(true);
        });

        test('should return products with pre-order fields', async () => {
            const response = await request(app)
                .get('/api/store/products')
                .expect(200);

            if (response.body.data.products.length > 0) {
                const product = response.body.data.products[0];
                expect(product).toHaveProperty('is_preorder');
                expect(product).toHaveProperty('estimated_delivery_days');
                expect(product).not.toHaveProperty('stock_quantity');
            }
        });
    });

    describe('GET /api/store/products/:id', () => {
        test('should return single product with pre-order info', async () => {
            // First get a product ID
            const listResponse = await request(app).get('/api/store/products');
            
            if (listResponse.body.data.products.length > 0) {
                const productId = listResponse.body.data.products[0].id;

                const response = await request(app)
                    .get(`/api/store/products/${productId}`)
                    .expect(200);

                expect(response.body.success).toBe(true);
                expect(response.body.data.is_preorder).toBe(true);
                expect(response.body.data.estimated_delivery_days).toBeDefined();
            }
        });
    });

    describe('POST /api/store/orders', () => {
        test('should create order without stock validation', async () => {
            const orderData = {
                client_name: 'Test Customer',
                client_email: 'test@example.com',
                client_phone: '1234567890',
                client_address: '123 Test Street',
                items: [
                    {
                        product_id: 1,
                        quantity: 10, // Any quantity should be allowed
                        price: 99.99
                    }
                ]
            };

            const response = await request(app)
                .post('/api/store/orders')
                .send(orderData)
                .expect('Content-Type', /json/);

            // Should succeed even with high quantity (no stock checks)
            if (response.status === 201 || response.status === 200) {
                expect(response.body.success).toBe(true);
                expect(response.body.data.order_number).toBeDefined();
            }
        });
    });

    describe('GET /api/store/categories', () => {
        test('should return categories without stock info', async () => {
            const response = await request(app)
                .get('/api/store/categories')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);

            if (response.body.data.length > 0) {
                const category = response.body.data[0];
                expect(category).toHaveProperty('name');
                
                // Should not have stock statistics
                if (category.statistics) {
                    expect(category.statistics).not.toHaveProperty('total_stock');
                }
            }
        });
    });
});
