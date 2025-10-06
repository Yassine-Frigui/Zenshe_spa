# Unit Tests Directory

This directory contains all unit and integration tests for the Zenshe Spa application.

## Directory Structure

```
tests/
├── unit/                    # Unit tests (isolated tests for individual functions/methods)
│   ├── models/             # Tests for database models (Product, Order, Client, etc.)
│   ├── routes/             # Tests for API routes
│   └── services/           # Tests for service layer
├── integration/            # Integration tests (tests for multiple components working together)
├── fixtures/               # Test data and mock data
├── helpers/                # Test helper functions and utilities
└── README.md              # This file
```

## Running Tests

### Install Testing Dependencies

```bash
npm install --save-dev jest supertest
```

### Run All Tests

```bash
npm test
```

### Run Unit Tests Only

```bash
npm run test:unit
```

### Run Integration Tests Only

```bash
npm run test:integration
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

## Writing Tests

### Unit Test Example

```javascript
const ProductModel = require('../../backend/src/models/Product');

describe('Product Model', () => {
    test('should format product correctly', () => {
        const product = {
            id: 1,
            name: 'Test Product',
            price: 99.99,
            is_preorder: true,
            estimated_delivery_days: 14
        };
        
        const formatted = ProductModel.formatProduct(product);
        
        expect(formatted.id).toBe(1);
        expect(formatted.name).toBe('Test Product');
        expect(formatted.is_preorder).toBe(true);
    });
});
```

### Integration Test Example

```javascript
const request = require('supertest');
const app = require('../../backend/src/app');

describe('Store API', () => {
    test('GET /api/store/products should return products', async () => {
        const response = await request(app)
            .get('/api/store/products')
            .expect(200);
        
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
    });
});
```

## Test Guidelines

1. **Isolation**: Unit tests should be isolated and not depend on external services
2. **Mocking**: Use mocks for database calls and external APIs
3. **Coverage**: Aim for at least 80% code coverage
4. **Naming**: Use descriptive test names that explain what is being tested
5. **Arrange-Act-Assert**: Structure tests in three clear sections

## Test Naming Convention

- Use `describe()` for grouping related tests
- Use `test()` or `it()` for individual test cases
- Test names should be clear and descriptive

Example:
```javascript
describe('Product Model - Pre-order System', () => {
    test('should set is_preorder to true by default', () => {
        // test code
    });
    
    test('should have default delivery days of 14', () => {
        // test code
    });
});
```

## Fixtures

Test fixtures are located in `fixtures/` and contain:
- Sample product data
- Mock user data
- Mock order data
- Database seed data for tests

## Helpers

Test helpers in `helpers/` provide:
- Database setup/teardown functions
- Common test utilities
- Mock data generators
- Authentication helpers

## Pre-Order System Tests

Since the system now uses a pre-order model, tests should verify:
- No stock quantity checks
- `is_preorder` field is always true
- `estimated_delivery_days` is set correctly
- Orders can be placed without stock validation
- Products return pre-order data in API responses

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test
  
- name: Upload coverage
  run: npm run test:coverage
```

## Troubleshooting

### Database Connection Issues
- Ensure test database is configured in `.env.test`
- Use separate test database to avoid affecting production data

### Async Issues
- Use `async/await` or return promises in tests
- Set appropriate timeout for database operations

### Mock Issues
- Clear mocks between tests with `jest.clearAllMocks()`
- Reset modules if needed with `jest.resetModules()`

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
