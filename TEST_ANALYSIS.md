# Unit Test Analysis & Failures Explained

## Test Execution Summary
**Date**: October 10, 2025  
**Command**: `npm test`  
**Result**: **13 FAILED**, 6 PASSED, 19 TOTAL

---

## Failure Categories

### 1. Integration Test Failures

#### ❌ `tests/integration/store-api.test.js` - Module Not Found
**Error**: `Cannot find module '../../../backend/src/app'`

**Root Cause**: The test is trying to import the Express app from a path that doesn't exist or has the wrong relative path.

**Test Path**: `tests/integration/store-api.test.js`  
**Expected Module**: `../../../backend/src/app`  
**Actual Module**: Should be `../../backend/src/app` (one less `../`)

**Fix Required**: Update the import path in the integration test file.

---

### 2. Product Model Unit Test Failures

#### ❌ Method Name Mismatches
The tests expect different method names than what's actually implemented in the Product model.

| Test Expects | Actual Model Method | Status |
|-------------|-------------------|--------|
| `ProductModel.getProducts()` | `ProductModel.getAllProducts()` | ❌ MISMATCH |
| `ProductModel.create()` | `ProductModel.createProduct()` | ❌ MISMATCH |
| `ProductModel.update()` | `ProductModel.updateProduct()` | ❌ MISMATCH |
| `ProductModel.getProductById()` | `ProductModel.getProductById()` | ✅ MATCH |

**Affected Tests**:
1. ❌ "should retrieve products without stock filter"
2. ❌ "should handle pagination parameters"
3. ❌ "should filter by category_id"
4. ❌ "should search by term"
5. ❌ "should create product with pre-order fields"
6. ❌ "should update product with pre-order fields"
7. ❌ "should have pre-order related fields in create"

#### ❌ "should retrieve product by id with pre-order fields"
**Error**: Parameter mismatch in mock assertion

**Expected Call**: `executeQuery(query, [1])`  
**Actual Call**: `executeQuery(query, ["fr", "fr", 1])`

**Reason**: The actual `getProductById()` method accepts a `language` parameter (defaults to 'fr') and passes it twice in the query for product and category translations.

**What the test missed**: The model uses internationalization with language codes, but the test didn't account for these parameters.

#### ❌ "should return null if product not found"
**Error**: `expect(received).toBeNull()` but received a formatted object with default values

**Reason**: The `formatProduct()` method is being called even when no product is found, creating an object with default/undefined values instead of returning null.

**Current behavior**: Returns `{ id: undefined, name: undefined, price: NaN, estimated_delivery_days: 14, ... }`  
**Expected behavior**: Should return `null`

**Fix Required**: Update model to check if product exists before calling `formatProduct()`.

---

### 3. StoreOrder Model Unit Test Failures

#### ❌ Method Name Mismatches

| Test Expects | Actual Model Method | Status |
|-------------|-------------------|--------|
| `StoreOrderModel.create()` | `StoreOrderModel.createOrder()` | ❌ MISMATCH |
| `StoreOrderModel.cancel()` | `StoreOrderModel.cancelOrder()` | ❌ MISMATCH |
| `StoreOrderModel.getOrderById()` | `StoreOrderModel.getOrderById()` | ✅ MATCH |

**Affected Tests**:
1. ❌ "should create order without stock validation"
2. ❌ "should allow high quantity orders (no stock limits)"
3. ❌ "should cancel order without stock restoration"

#### ❌ "should retrieve order details"
**Error**: `expect(order.order_number).toBe('ORD-2025-001')` but received `undefined`

**Reason**: The test mock doesn't properly simulate the `formatOrderWithItems()` method, which is responsible for formatting the order data. The mock returns raw data, but the actual method would process it differently.

---

## Passing Tests ✅

### Product Model - formatProduct Tests
1. ✅ "should format product with pre-order fields correctly"
2. ✅ "should default estimated_delivery_days to 14 if not provided"
3. ✅ "should convert is_preorder to boolean"
4. ✅ "should return null if product is null"

**Why these pass**: The `formatProduct()` static method is a pure formatting function that doesn't depend on database calls, so it works correctly with the test data.

### Pre-order System Validation
5. ✅ "should not include stock quantity in order queries" (StoreOrder)
6. ✅ "should not have stock management methods" (Product)

**Why these pass**: These are validation tests that check for the ABSENCE of stock-related code, which correctly matches the pre-order-only system design.

---

## Understanding Your Unit Tests

### What are Unit Tests?
Unit tests check individual functions/methods in isolation from the rest of the system. They use **mocks** to simulate database calls without actually connecting to a database.

### How Your Tests Work

#### 1. **Mock Setup** (Making fake database responses)
```javascript
jest.mock('../../config/database', () => ({
    executeQuery: jest.fn(),
    executeTransaction: jest.fn()
}));
```

This tells Jest to replace the real database functions with fake ones that you can control.

#### 2. **Test Structure**
```javascript
it('should retrieve products without stock filter', async () => {
    // 1. ARRANGE: Set up fake data
    const mockProducts = [{ id: 1, name: 'Product 1' }];
    executeQuery.mockResolvedValue([mockProducts, []]);
    
    // 2. ACT: Call the function being tested
    const result = await ProductModel.getProducts();
    
    // 3. ASSERT: Check if it worked correctly
    expect(executeQuery).toHaveBeenCalled();
    expect(result.products).toBeDefined();
});
```

### Why Tests Are Failing

**Simple Explanation**: The tests were written expecting certain function names (like `create()`, `update()`), but your actual code uses different names (like `createProduct()`, `updateProduct()`). It's like calling someone by the wrong name - they won't respond!

Additionally, some tests don't account for features you added later, like:
- Internationalization (language parameter)
- More sophisticated data formatting
- Transaction handling

---

## Actual Model Methods (What's Really in Your Code)

### Product Model
```javascript
class ProductModel {
    static async getAllProducts(filters, pagination)    // Tests call: getProducts()
    static async getProductById(id, language = 'fr')    // ✅ Tests call this correctly
    static async getProductBySku(sku)
    static async getFeaturedProducts(limit, language)
    static async getProductsByCategory(categoryId, limit, language)
    static async createProduct(productData)             // Tests call: create()
    static async updateProduct(id, productData)         // Tests call: update()
    static async deleteProduct(id)
    static async hardDeleteProduct(id)
    static async searchProducts(searchTerm, limit)
    static formatProduct(product)                       // ✅ Works perfectly
}
```

### StoreOrder Model
```javascript
class StoreOrderModel {
    static async generateOrderNumber(connection)
    static async createOrder(orderData)                 // Tests call: create()
    static async getOrderById(id)                       // ✅ Tests call this correctly
    static async getOrderByNumber(orderNumber)
    static async getOrdersByClient(clientId, pagination)
    static async getOrdersForAdmin(filters, pagination)
    static async updateOrderStatus(id, status, adminNotes)
    static async cancelOrder(id, reason)                // Tests call: cancel()
    static async getOrderStats(dateFrom, dateTo)
    static async createDraft(sessionId, draftData)
    static async updateDraft(draftId, draftData)
    static async getDraftBySession(sessionId)
    static async deleteDraftBySession(sessionId)
    static async convertDraftToOrder(draftId)
    static async updateOrder(orderId, orderData)
    static formatOrderWithItems(order, items)
}
```

---

## Next Steps to Fix Tests

### Option 1: Update Tests to Match Model (Recommended)
Update test files to use the correct method names:
- Change `ProductModel.getProducts()` → `ProductModel.getAllProducts()`
- Change `ProductModel.create()` → `ProductModel.createProduct()`
- Change `ProductModel.update()` → `ProductModel.updateProduct()`
- Change `StoreOrderModel.create()` → `StoreOrderModel.createOrder()`
- Change `StoreOrderModel.cancel()` → `StoreOrderModel.cancelOrder()`

### Option 2: Add Alias Methods to Models
Add wrapper methods in the models for backwards compatibility:
```javascript
static async create(productData) {
    return this.createProduct(productData);
}
```

**Recommendation**: **Option 1** is better because it keeps tests aligned with your actual API.

### Additional Fixes Needed
1. Fix integration test import path
2. Update `getProductById` test to expect language parameters
3. Fix `formatProduct` null handling in the model
4. Update order formatting mock in StoreOrder tests

---

## Testing Against Real Database

### Current Setup (Mocks)
✅ **Pros**: Fast, no database needed, tests run in isolation  
❌ **Cons**: Doesn't catch real database issues, schema mismatches, or SQL errors

### Testing with Real DB (Your Request)
✅ **Pros**: Tests actual database interactions, catches SQL errors, validates schema  
❌ **Cons**: Slower, requires database setup, tests affect each other if not cleaned properly

### How to Set Up Real DB Tests

Your test helpers already have the foundation:
- `tests/helpers/db-helper.js` - Database connection and cleanup functions
- `tests/helpers/setup.js` - Test environment configuration

**What's needed**:
1. Create a test database (separate from your main database)
2. Update `.env` or test config with test DB credentials
3. Import your SQL backup into test database
4. Update tests to use real DB instead of mocks
5. Add database cleanup between tests

**I can help you set this up if you want to test against the real database!**

---

## Summary

### The Good News ✅
- 6 tests are passing (formatting and validation tests)
- Your models are well-structured with pre-order system correctly implemented
- Test infrastructure is mostly in place

### The Issues ❌
- 13 tests failing due to method name mismatches
- Integration test has wrong import path
- Some tests don't account for internationalization features
- Tests use mocks instead of real database (which you want to change)

### The Fix
I'll now update the test files to use the correct method names and parameters, which should fix most failures. Then we can optionally configure tests to run against your real database using the SQL backup file.

**Would you like me to:**
1. ✅ Fix the test method names (I'll do this now)
2. ✅ Fix the integration test import path (I'll do this now)
3. ❓ Set up real database testing with your SQL file? (Let me know!)
