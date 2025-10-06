# Store System Refactoring - Pre-Order Only System

## Overview
The store/boutique system has been completely refactored to eliminate stock/inventory management. All products are now **pre-order only** items (custom-made or imported), with no stock tracking.

## Summary of Changes

### 🗄️ Database Changes

#### `backend/database/store_schema.sql`
- **Removed**: `stock_quantity INT DEFAULT 0` field from products table
- **Added**: `is_preorder BOOLEAN DEFAULT TRUE` - indicates all items are pre-orders
- **Added**: `estimated_delivery_days INT DEFAULT 14` - estimated delivery time in days
- Products table now optimized for pre-order system without inventory tracking

### 🔧 Backend Model Changes

#### `backend/src/models/Product.js`
**Removed Methods:**
- `updateStock(productId, quantity)` - No longer needed
- `reduceStock(productId, quantity)` - No longer needed
- `getLowStockProducts(threshold)` - No longer needed

**Modified Methods:**
- `getProducts()`: Removed `in_stock_only` filter parameter
- `getProducts()`: Removed `stock_quantity` from valid sort columns
- `create()`: Now accepts `is_preorder` and `estimated_delivery_days` instead of `stock_quantity`
- `update()`: Now updates `is_preorder` and `estimated_delivery_days` instead of `stock_quantity`
- `formatProduct()`: Returns `is_preorder` and `estimated_delivery_days` instead of `stock_quantity`

#### `backend/src/models/StoreOrder.js`
**Modified Methods:**
- `create()`: Removed stock reduction logic (line ~136)
- `cancel()`: Removed stock restoration logic (line ~391)
- `createOrder()`: Commented out stock update query (line ~757)

#### `backend/src/models/StoreOrderItem.js`
**Modified Methods:**
- `addOrderItem()`: 
  - Removed stock availability check
  - Removed stock reduction after adding item
- `updateOrderItemQuantity()`:
  - Removed stock check for quantity increases
  - Removed stock adjustment logic
- `removeOrderItem()`:
  - Removed stock restoration logic
- `getProductSalesSummary()`:
  - Query now selects `is_preorder` and `estimated_delivery_days`
  - Returns pre-order info instead of stock_quantity in statistics

#### `backend/src/models/ProductCategory.js`
**Modified Methods:**
- `getCategoriesWithStats()`:
  - Removed `total_stock` from query
  - Removed `total_stock` from returned statistics object

### 🛣️ Backend Route Changes

#### `backend/src/routes/store.js`
- **Line ~285**: Removed stock availability check before order creation
- Orders can now be placed for any quantity without stock validation

#### `backend/src/routes/adminStore.js`
- **Line ~158**: DISABLED `PUT /products/:id/stock` endpoint (commented out)
- **Line ~188**: DISABLED `GET /products/low-stock` endpoint (commented out)
- These endpoints are no longer functional as stock management is removed

### 🎨 Frontend Changes

#### `frontend/src/pages/admin/AdminStoreDashboard.jsx`
**UI Changes:**
- Changed "Stock" table column to "Type" column
- Displays "Pré-commande" badge instead of stock quantity
- Removed stock-based sorting and filtering

#### `frontend/src/pages/client/ProductDetailPage.jsx`
**UI Changes:**
- Replaced `getStockStatus()` with `getPreorderStatus()`
- Removed stock-based button disabling
- Changed max quantity from `product.stock_quantity` to `99`
- Button text changed to "Commander (Pré-commande)"
- Delivery info now shows `estimated_delivery_days` instead of stock status
- All products show pre-order availability status

#### `frontend/src/pages/client/StorePage.jsx`
**UI Changes:**
- Replaced `getAvailabilityBadge(stock)` with `getPreorderBadge()`
- All products show "Pré-commande" badge instead of stock badges
- Removed stock quantity check on "Commander" button
- Button text changed to "Commander (Pré-commande)"

#### `frontend/src/components/CartSidebar.jsx`
**UI Changes:**
- Changed quantity increase limit from `item.stock_quantity` to `99`
- Users can now increase quantity up to 99 items per product

## API Response Changes

### Product Object (API Response)
**Before:**
```json
{
  "id": 1,
  "name": "Product Name",
  "price": 99.99,
  "stock_quantity": 10,
  ...
}
```

**After:**
```json
{
  "id": 1,
  "name": "Product Name",
  "price": 99.99,
  "is_preorder": true,
  "estimated_delivery_days": 14,
  ...
}
```

### Category Statistics
**Before:**
```json
{
  "statistics": {
    "total_products": 10,
    "active_products": 8,
    "total_stock": 150,
    ...
  }
}
```

**After:**
```json
{
  "statistics": {
    "total_products": 10,
    "active_products": 8,
    ...
  }
}
```

## Migration Guide

### Database Migration
To update existing databases, run:
```sql
-- Add new fields
ALTER TABLE products 
ADD COLUMN is_preorder BOOLEAN DEFAULT TRUE COMMENT 'All items are pre-order by default',
ADD COLUMN estimated_delivery_days INT DEFAULT 14 COMMENT 'Estimated delivery time in days';

-- Optional: Remove old stock_quantity field (after backing up)
-- ALTER TABLE products DROP COLUMN stock_quantity;
```

### Frontend Integration
No breaking changes - the frontend now:
- Displays "Pré-commande" badges instead of stock status
- Shows estimated delivery days instead of stock availability
- Allows ordering any quantity (up to 99 per item)

### Admin Panel
Admins should now:
- Set `estimated_delivery_days` when creating/editing products
- No longer manage stock quantities
- Focus on delivery time estimates for customer expectations

## Testing Checklist

- [ ] Products display pre-order badge on store page
- [ ] Product detail page shows delivery estimate
- [ ] Cart allows adding products without stock checks
- [ ] Orders can be created for any quantity
- [ ] Admin dashboard shows "Type: Pré-commande" instead of stock
- [ ] No errors in browser console
- [ ] No errors in backend logs
- [ ] Database queries execute without stock_quantity errors

## Benefits

1. **Simplified System**: No complex inventory tracking needed
2. **Unlimited Orders**: Customers can order any quantity (up to 99)
3. **Clear Expectations**: Customers see delivery estimates upfront
4. **Reduced Errors**: No "out of stock" errors or stock synchronization issues
5. **Better for Business Model**: Aligns with custom-made/imported product model

## Files Modified

### Backend (10 files)
1. `backend/database/store_schema.sql`
2. `backend/src/models/Product.js`
3. `backend/src/models/StoreOrder.js`
4. `backend/src/models/StoreOrderItem.js`
5. `backend/src/models/ProductCategory.js`
6. `backend/src/routes/store.js`
7. `backend/src/routes/adminStore.js`

### Frontend (4 files)
1. `frontend/src/pages/admin/AdminStoreDashboard.jsx`
2. `frontend/src/pages/client/ProductDetailPage.jsx`
3. `frontend/src/pages/client/StorePage.jsx`
4. `frontend/src/components/CartSidebar.jsx`

## Status: ✅ COMPLETE

All stock management has been successfully removed from the system. The store now operates as a pure pre-order system with no inventory tracking.
