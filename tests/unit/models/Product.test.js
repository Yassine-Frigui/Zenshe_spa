// Unit tests for Product Model

const ProductModel = require('../../../backend/src/models/Product');
const { sampleProducts } = require('../../fixtures/sample-data');

// Mock the database module
jest.mock('../../../backend/config/database', () => ({
    executeQuery: jest.fn()
}));

const { executeQuery } = require('../../../backend/config/database');

describe('Product Model - Pre-order System', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('formatProduct', () => {
        test('should format product with pre-order fields correctly', () => {
            const product = {
                id: 1,
                name: 'Test Product',
                description: 'Description',
                detailed_description: 'Detailed description',
                price: 99.99,
                category: 'Test Category',
                category_id: 1,
                category_name: 'Test Category',
                image_url: '/test.jpg',
                gallery_images: '[]',
                is_preorder: true,
                estimated_delivery_days: 14,
                is_active: true,
                is_featured: false,
                weight: 0.5,
                dimensions: '10x10x10',
                sku: 'TEST-001',
                created_at: new Date(),
                updated_at: new Date()
            };

            const formatted = ProductModel.formatProduct(product);

            expect(formatted.id).toBe(1);
            expect(formatted.name).toBe('Test Product');
            expect(formatted.is_preorder).toBe(true);
            expect(formatted.estimated_delivery_days).toBe(14);
            expect(formatted.price).toBe(99.99);
        });

        test('should default estimated_delivery_days to 14 if not provided', () => {
            const product = {
                id: 1,
                name: 'Test Product',
                price: 99.99,
                is_preorder: true,
                estimated_delivery_days: null
            };

            const formatted = ProductModel.formatProduct(product);

            expect(formatted.estimated_delivery_days).toBe(14);
        });

        test('should convert is_preorder to boolean', () => {
            const product = {
                id: 1,
                name: 'Test Product',
                price: 99.99,
                is_preorder: 1
            };

            const formatted = ProductModel.formatProduct(product);

            expect(typeof formatted.is_preorder).toBe('boolean');
            expect(formatted.is_preorder).toBe(true);
        });

        test('should return null if product is null', () => {
            const formatted = ProductModel.formatProduct(null);
            expect(formatted).toBeNull();
        });
    });

    describe('getAllProducts', () => {
        it('should retrieve products without stock filter', async () => {
            const mockProducts = [sampleProducts[0], sampleProducts[1]];
            executeQuery.mockResolvedValue([mockProducts, []]);

            const result = await ProductModel.getAllProducts();

            expect(executeQuery).toHaveBeenCalled();
            expect(result.products).toBeDefined();
            expect(Array.isArray(result.products)).toBe(true);
        });

        test('should handle pagination parameters', async () => {
            executeQuery.mockResolvedValue([[sampleProducts[0]], []]);

            await ProductModel.getAllProducts({}, { page: 1, limit: 10 });

            expect(executeQuery).toHaveBeenCalled();
            const query = executeQuery.mock.calls[0][0];
            expect(query).toContain('LIMIT');
            expect(query).toContain('OFFSET');
        });

        test('should filter by category_id', async () => {
            executeQuery.mockResolvedValue([[sampleProducts[0]], []]);

            await ProductModel.getAllProducts({ category_id: 1 });

            const query = executeQuery.mock.calls[0][0];
            expect(query).toContain('category_id');
        });

        test('should search by term', async () => {
            executeQuery.mockResolvedValue([[sampleProducts[0]], []]);

            await ProductModel.getAllProducts({ search: 'Spa' });

            const query = executeQuery.mock.calls[0][0];
            expect(query).toContain('name LIKE');
        });
    });

    describe('getProductById', () => {
        test('should retrieve product by id with pre-order fields', async () => {
            // Simulate MySQL response with numeric boolean (1/0 instead of true/false)
            const mockProduct = {
                ...sampleProducts[0],
                is_preorder: 1, // MySQL returns 1 for true
                is_active: 1,
                is_featured: 1,
                price: '2500.00', // MySQL returns as string
                weight: '0.00', // MySQL returns as string
                estimated_delivery_days: '21' // MySQL returns as string
            };
            executeQuery.mockResolvedValue([mockProduct]); // Note: Single array, not nested

            const result = await ProductModel.getProductById(1, 'fr');

            expect(executeQuery).toHaveBeenCalledWith(
                expect.stringContaining('WHERE p.id = ?'),
                ['fr', 'fr', 1]
            );
            expect(result).toBeDefined();
            expect(result.is_preorder).toBe(true);
            expect(result.estimated_delivery_days).toBeDefined();
        });

        test('should return null if product not found', async () => {
            executeQuery.mockResolvedValue([]);

            const result = await ProductModel.getProductById(999);

            expect(result).toBeNull();
        });
    });

    describe('createProduct', () => {
        test('should create product with pre-order fields', async () => {
            const productData = {
                name: 'New Product',
                description: 'Description',
                price: 149.99,
                category_id: 1,
                is_preorder: true,
                estimated_delivery_days: 21,
                is_active: true,
                sku: 'NEW-001'
            };

            // Mock getProductBySku (SKU check) - return null (SKU doesn't exist)
            executeQuery.mockResolvedValueOnce([]) // getProductBySku returns empty
                        .mockResolvedValueOnce([{ insertId: 1 }]) // INSERT query
                        .mockResolvedValueOnce([[sampleProducts[0]]]); // getProductById

            const result = await ProductModel.createProduct(productData);

            expect(executeQuery).toHaveBeenCalled();
            const skuCheckQuery = executeQuery.mock.calls[0][0];
            const insertQuery = executeQuery.mock.calls[1][0];
            expect(insertQuery).toContain('INSERT INTO products');
            expect(insertQuery).toContain('is_preorder');
            expect(insertQuery).toContain('estimated_delivery_days');
            expect(insertQuery).not.toContain('stock_quantity');
        });
    });

    describe('updateProduct', () => {
        test('should update product with pre-order fields', async () => {
            const updates = {
                name: 'Updated Product',
                estimated_delivery_days: 30
            };

            // Mock getProductById (check if product exists)
            executeQuery.mockResolvedValueOnce([[sampleProducts[0]]]) // getProductById
                        .mockResolvedValueOnce([{ affectedRows: 1 }]) // UPDATE query
                        .mockResolvedValueOnce([[{ ...sampleProducts[0], ...updates }]]); // getProductById again

            await ProductModel.updateProduct(1, updates);

            const updateQuery = executeQuery.mock.calls[1][0]; // Second call is the UPDATE
            expect(updateQuery).toContain('UPDATE products');
            expect(updateQuery).not.toContain('stock_quantity');
        });
    });

    describe('Pre-order System Validation', () => {
        test('should not have stock management methods', () => {
            expect(ProductModel.updateStock).toBeUndefined();
            expect(ProductModel.reduceStock).toBeUndefined();
            expect(ProductModel.getLowStockProducts).toBeUndefined();
        });

        test('should have pre-order related fields in createProduct', async () => {
            executeQuery.mockResolvedValueOnce([{ insertId: 1 }])
                        .mockResolvedValueOnce([[{ ...sampleProducts[0], id: 1 }]]);

            const productData = {
                name: 'Test',
                price: 99.99,
                is_preorder: true,
                estimated_delivery_days: 14
            };

            await ProductModel.createProduct(productData);

            const params = executeQuery.mock.calls[0][1];
            expect(params).toContain(true); // is_preorder
            expect(params).toContain(14); // estimated_delivery_days
        });
    });
});
