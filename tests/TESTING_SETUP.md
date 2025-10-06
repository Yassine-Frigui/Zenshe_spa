# Testing Setup Guide

## Quick Start

### 1. Install Testing Dependencies

```bash
npm install
```

This will install:
- **jest**: Testing framework
- **supertest**: HTTP assertion library for integration tests

### 2. Run Tests

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Directory Structure

```
tests/
├── unit/                       # Unit tests (isolated component tests)
│   ├── models/                # Model tests
│   │   ├── Product.test.js   # Product model tests ✅
│   │   └── StoreOrder.test.js # Order model tests ✅
│   ├── routes/               # Route tests
│   └── services/             # Service tests
├── integration/              # Integration tests (API tests)
│   └── store-api.test.js    # Store API integration tests ✅
├── fixtures/                 # Test data
│   └── sample-data.js       # Sample mock data ✅
├── helpers/                  # Test utilities
│   ├── setup.js             # Test setup/teardown ✅
│   └── db-helper.js         # Database helpers ✅
└── README.md                # Full testing documentation
```

## Example Test Files Created

### ✅ Unit Tests
- **Product.test.js**: Tests for Product model (pre-order system)
- **StoreOrder.test.js**: Tests for Order model (no stock validation)

### ✅ Integration Tests
- **store-api.test.js**: API endpoint tests

### ✅ Test Helpers
- **setup.js**: Global test configuration
- **db-helper.js**: Database utilities for tests
- **sample-data.js**: Mock data fixtures

## Writing Your First Test

Create a new test file in `tests/unit/models/`:

```javascript
// tests/unit/models/MyModel.test.js

const MyModel = require('../../../backend/src/models/MyModel');

describe('MyModel', () => {
    test('should do something', () => {
        const result = MyModel.doSomething();
        expect(result).toBe(expectedValue);
    });
});
```

## Test Coverage

View coverage report after running:
```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

## Pre-Order System Tests

All tests verify the new pre-order system:
- ✅ No `stock_quantity` fields
- ✅ `is_preorder` is always true
- ✅ `estimated_delivery_days` is set
- ✅ Orders can be placed without stock validation
- ✅ High quantities allowed (up to 99)

## Continuous Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Common Commands

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run specific test file
npm test -- Product.test.js

# Run tests matching pattern
npm test -- --testNamePattern="Pre-order"
```

## Troubleshooting

### Tests Not Found
Make sure test files end with `.test.js` or `.spec.js`

### Database Connection Issues
- Use separate test database (set in `.env.test`)
- Check `tests/helpers/db-helper.js` configuration

### Mock Issues
- Clear mocks between tests: `jest.clearAllMocks()`
- Use proper mock syntax for modules

## Next Steps

1. ✅ **Installation**: Run `npm install` to install jest and supertest
2. ✅ **Run Tests**: Execute `npm test` to run example tests
3. 📝 **Write Tests**: Add tests for your models and routes
4. 📊 **Coverage**: Check coverage with `npm run test:coverage`
5. 🔄 **CI/CD**: Integrate tests into your deployment pipeline

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Docs](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Status**: ✅ Test infrastructure ready!  
**Example Tests**: 3 test files created  
**Next**: Run `npm install` then `npm test`
