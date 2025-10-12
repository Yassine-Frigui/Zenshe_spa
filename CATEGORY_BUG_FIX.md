# Category Bug Fix - Root Cause Analysis

## The Problem
Service and Booking pages were showing **STORE category names** (with `name` field) instead of **SERVICE category names** (with `nom` field).

## Root Cause
**Duplicate method name in `frontend/src/services/api.js`:**

The `publicAPI` object had TWO methods named `getCategories()`:

1. **Line 71** (correct): 
   ```javascript
   getCategories: () => {
     const lang = getCurrentLanguage();
     return axios.get('/api/public/services/categories/list', { params: { lang } });
   }
   ```
   This returns **SERVICE categories** from `categories_services` table with fields: `id`, `nom`, `description`, `couleur_theme`, etc.

2. **Line 118** (overwrote the first):
   ```javascript
   getCategories: () => axios.get('/api/store/categories')
   ```
   This returns **STORE/PRODUCT categories** from `product_categories` table with fields: `id`, `name`, `description`, `is_active`, etc.

In JavaScript, when an object has duplicate keys, **the last one wins**. So every call to `publicAPI.getCategories()` was hitting the STORE endpoint instead of the SERVICE endpoint.

## The Fix

### 1. Renamed Store Method (api.js)
```diff
- getCategories: () => axios.get('/api/store/categories'),
+ getProductCategories: () => axios.get('/api/store/categories'), // Renamed to avoid collision
```

### 2. Updated Store Page (StorePage.jsx)
```diff
- api.publicAPI.getCategories()
+ api.publicAPI.getProductCategories()
```

### 3. Removed Duplicate Backend Route (public.js)
Removed the redundant `/services/categories/list` route from `public.js` since `publicServices.js` already handles it properly.

### 4. Simplified BookingPage.jsx
Removed unnecessary normalization logic and duplicate `fetchCategories` function. Now both Services and Booking pages correctly call the SERVICE categories endpoint.

## Verification Steps

1. **Stop all processes:**
   ```cmd
   taskkill /F /IM node.exe
   ```

2. **Clear Vite cache:**
   ```cmd
   cd frontend
   rmdir /S /Q node_modules\.vite .vite
   ```

3. **Start backend:**
   ```cmd
   cd backend
   npm run dev
   ```

4. **Start frontend:**
   ```cmd
   cd frontend
   npm run dev
   ```

5. **Test in browser:**
   - Open DevTools → Network tab → Disable cache
   - Hard refresh (Ctrl+Shift+R)
   - Navigate to Services page
   - Check console logs for "Category names: V-Steam, Vajacials, Massages..." (SERVICE categories with `nom`)
   - Navigate to Booking page
   - Verify categories display correctly

## Expected Results

- **Services Page**: Categories display with `nom` field (V-Steam, Vajacials, Massages, etc.)
- **Booking Page**: Categories display with `nom` field (same as Services)
- **Store Page**: Categories display with `name` field (Chaises de Spa, Produits de Soins, etc.)

## Files Changed

1. `frontend/src/services/api.js` - Renamed `getCategories` to `getProductCategories` for store
2. `frontend/src/pages/client/StorePage.jsx` - Updated to use `getProductCategories()`
3. `frontend/src/pages/client/BookingPage.jsx` - Simplified, removed normalization
4. `backend/src/routes/public.js` - Removed duplicate route

## Lessons Learned

1. **Avoid duplicate keys in JavaScript objects** - they silently overwrite each other
2. **Name methods precisely** - `getCategories()` was ambiguous (service vs. product categories)
3. **Keep it simple** - normalization was a band-aid; fixing the root cause was cleaner
4. **Test API contracts** - should have caught this with integration tests

## Recommendations

1. Add ESLint rule to catch duplicate object keys
2. Add integration test: `publicAPI.getCategories()` should return service categories with `nom`
3. Consider using TypeScript to catch these at compile time
4. Rename all methods to be explicit: `getServiceCategories()` vs `getProductCategories()`
