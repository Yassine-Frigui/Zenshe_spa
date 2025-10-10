# 📊 ZENSHE SPA TESTING ARCHITECTURE

## 🎯 Complete Testing Strategy Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ZENSHE SPA APPLICATION                        │
│                                                                  │
│  Frontend (React)          Backend (Node.js)         Database   │
│  Port 3000                 Port 5000                 MySQL 4306  │
└─────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                     TESTING LAYERS                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ LAYER 1: UNIT TESTS (Fast, Isolated, Mocked)                    │
│ ✅ Current: 19 tests | 🎯 Goal: ~150 tests                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Backend Unit Tests               Frontend Unit Tests           │
│  ├─ Models (8)                    ├─ Components (40)            │
│  │  ├─ Product.test.js ✅         │  ├─ ProductCard.test.jsx    │
│  │  ├─ StoreOrder.test.js ✅      │  ├─ CartSummary.test.jsx    │
│  │  ├─ Client.test.js             │  ├─ BookingForm.test.jsx    │
│  │  ├─ Service.test.js            │  └─ ... (37 more)           │
│  │  ├─ Reservation.test.js        │                             │
│  │  ├─ Membership.test.js         ├─ Services (5)               │
│  │  ├─ ReferralCode.test.js       │  ├─ api.test.js             │
│  │  └─ ProductCategory.test.js    │  ├─ auth.test.js            │
│  │                                 │  └─ store.test.js           │
│  ├─ Services (2)                  │                             │
│  │  ├─ EmailService.test.js       ├─ Context (3)                │
│  │  └─ ReferralService.test.js    │  ├─ CartContext.test.jsx    │
│  │                                 │  ├─ AuthContext.test.jsx    │
│  └─ Middleware (2)                │  └─ AdminContext.test.jsx   │
│     ├─ auth.test.js                │                             │
│     └─ security.test.js            │                             │
│                                                                  │
│  Uses: Jest + Mocks                Uses: Vitest + RTL           │
│  Speed: < 1 second                 Speed: ~2-3 seconds          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ LAYER 2: INTEGRATION TESTS (Medium Speed, Real DB)              │
│ ✅ Current: 0 tests | 🎯 Goal: ~55 tests                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Backend API Tests                Frontend Flow Tests           │
│  ├─ auth-api.test.js              ├─ booking-flow.test.jsx      │
│  │  ├─ POST /api/auth/login       │  └─ Service → Date → Form   │
│  │  ├─ POST /api/auth/register    │                             │
│  │  └─ GET /api/auth/verify       ├─ checkout-flow.test.jsx     │
│  │                                 │  └─ Cart → Checkout → Pay   │
│  ├─ store-api.test.js              │                             │
│  │  ├─ GET /api/store/products    ├─ admin-store.test.jsx       │
│  │  ├─ GET /api/store/product/:id │  └─ Add/Edit/Delete Product │
│  │  └─ GET /api/store/categories  │                             │
│  │                                                               │
│  ├─ reservations-api.test.js                                    │
│  │  ├─ POST /api/reservations                                   │
│  │  ├─ GET /api/reservations/:id                                │
│  │  └─ PATCH /api/reservations/:id                              │
│  │                                                               │
│  ├─ admin-api.test.js (~10 routes)                              │
│  ├─ services-api.test.js (~5 routes)                            │
│  ├─ memberships-api.test.js (~4 routes)                         │
│  ├─ referral-api.test.js (~3 routes)                            │
│  ├─ jotform-api.test.js (~2 routes)                             │
│  └─ upload-api.test.js (~2 routes)                              │
│                                                                  │
│  Uses: Jest + Supertest + Real DB                               │
│  Speed: ~10-15 seconds                                          │
│  Database: zenshespa_database_test                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ LAYER 3: END-TO-END TESTS (Slow, Full Stack, Real Browser)      │
│ ✅ Current: 0 tests | 🎯 Goal: ~20 tests                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Critical User Journeys                                         │
│  ├─ booking.spec.js                                             │
│  │  1. Visit homepage                                           │
│  │  2. Click "Book Service"                                     │
│  │  3. Select massage type                                      │
│  │  4. Choose date/time                                         │
│  │  5. Fill booking form                                        │
│  │  6. Submit booking                                           │
│  │  7. Verify confirmation page                                 │
│  │                                                               │
│  ├─ checkout.spec.js                                            │
│  │  1. Browse products                                          │
│  │  2. Add to cart                                              │
│  │  3. View cart                                                │
│  │  4. Proceed to checkout                                      │
│  │  5. Fill shipping info                                       │
│  │  6. Complete order                                           │
│  │  7. Verify confirmation                                      │
│  │                                                               │
│  ├─ authentication.spec.js                                      │
│  │  ├─ Register new user                                        │
│  │  ├─ Login with credentials                                   │
│  │  ├─ Access protected routes                                  │
│  │  └─ Logout                                                   │
│  │                                                               │
│  ├─ admin-product-management.spec.js                            │
│  │  ├─ Admin login                                              │
│  │  ├─ Create new product                                       │
│  │  ├─ Edit product details                                     │
│  │  ├─ Upload product image                                     │
│  │  └─ Delete product                                           │
│  │                                                               │
│  └─ ... (16 more E2E scenarios)                                 │
│                                                                  │
│  Uses: Playwright + Chromium                                    │
│  Speed: ~30-60 seconds                                          │
│  Database: zenshespa_database_test                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     TEST INFRASTRUCTURE                          │
└─────────────────────────────────────────────────────────────────┘

Database Layer:
┌──────────────────────────────────────┐
│ zenshespa_database (Production)      │ ← Real data, port 4306
│ zenshespa_database_test (Testing)    │ ← Test data, port 4306
└──────────────────────────────────────┘
                  ↑
                  │ Seed before each test suite
                  │ Clean after each test
                  │
┌──────────────────────────────────────┐
│ Test Helpers                          │
│ ├─ db-helper.js                      │
│ │  ├─ setupTestDatabase()            │
│ │  ├─ cleanDatabase()                │
│ │  └─ seedTestDatabase()             │
│ │                                    │
│ ├─ setup.js                          │
│ │  ├─ Environment variables          │
│ │  ├─ Mock console methods           │
│ │  └─ Global test timeout            │
│ │                                    │
│ └─ fixtures/sample-data.js           │
│    ├─ Test products                  │
│    ├─ Test users                     │
│    └─ Test orders                    │
└──────────────────────────────────────┘

Configuration Files:
┌──────────────────────────────────────┐
│ backend/jest.config.js               │ ← Backend test config
│ frontend/vite.config.js (test)       │ ← Frontend test config
│ playwright.config.js                 │ ← E2E test config
│ .env.test                            │ ← Test environment vars
└──────────────────────────────────────┘
