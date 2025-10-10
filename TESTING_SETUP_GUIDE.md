# Complete Testing Setup Guide
**Comprehensive testing for Zenshe Spa Application**

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Test Database Setup](#test-database-setup)
3. [Environment Configuration](#environment-configuration)
4. [Installing Test Dependencies](#installing-test-dependencies)
5. [Running Tests](#running-tests)
6. [Test Coverage](#test-coverage)
7. [Troubleshooting](#troubleshooting)

---

## 1️⃣ Prerequisites

### Required Software
- ✅ Node.js v16+ (you have this)
- ✅ MariaDB/MySQL (you have this)
- ✅ npm (you have this)

### Check Your Versions
```bash
node --version    # Should be v16 or higher
npm --version     # Should be v8 or higher
mysql --version   # Your MariaDB version
```

---

## 2️⃣ Test Database Setup

### Step 1: Create Test Database

Open your MySQL/MariaDB client and run:

```sql
-- Create test database
CREATE DATABASE IF NOT EXISTS zenshespa_database_test
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

-- Grant permissions (adjust user/password as needed)
GRANT ALL PRIVILEGES ON zenshespa_database_test.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### Step 2: Import Schema to Test Database

**Option A: Using Command Line**
```bash
# Navigate to project root
cd C:\Users\yassi\Desktop\dekstop\zenshe_spa

# Import the SQL backup
mysql -u root -p -P 4306 zenshespa_database_test < "zenshe_backup(incase of destruction).sql"
```

**Option B: Using phpMyAdmin**
1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Select `zenshespa_database_test` database
3. Click "Import" tab
4. Choose file: `zenshe_backup(incase of destruction).sql`
5. Click "Go"

### Step 3: Verify Test Database

```sql
USE zenshespa_database_test;
SHOW TABLES;
-- Should show: products, store_orders, clients, services, etc.
```

### Step 4: Create Test Data Seed Script

Run this script to reset test database before each test run:

```bash
# We'll create this script for you
node backend/tests/helpers/seed-test-db.js
```

---

## 3️⃣ Environment Configuration

### Step 1: Create Test Environment File

Create `.env.test` in the **project root**:

```bash
# Copy this content to .env.test
# ===================================
# DATABASE CONFIGURATION (TEST)
# ===================================
DB_HOST=localhost
DB_PORT=4306
DB_USER=root
DB_PASSWORD=
DB_NAME=zenshespa_database_test

# ===================================
# EMAIL SERVICE (BREVO) - EXISTING KEY
# ===================================
BREVO_API_KEY=brevo_api_key_dummy

# ===================================
# JOTFORM API (GET YOUR KEY)
# ===================================
# Get from: https://www.jotform.com/myaccount/api
JOTFORM_API_KEY=your_jotform_api_key_here
JOTFORM_FORM_ID=your_form_id_here

# ===================================
# JWT SECRET (FOR TESTING)
# ===================================
JWT_SECRET=test-jwt-secret-key-for-unit-tests-only

# ===================================
# SESSION SECRET (FOR TESTING)
# ===================================
SESSION_SECRET=test-session-secret-for-testing

# ===================================
# ADMIN CREDENTIALS (FOR E2E TESTS)
# ===================================
TEST_ADMIN_EMAIL=admin@zenshe.test
TEST_ADMIN_PASSWORD=TestAdmin123!

# ===================================
# CLIENT CREDENTIALS (FOR E2E TESTS)
# ===================================
TEST_CLIENT_EMAIL=client@test.com
TEST_CLIENT_PASSWORD=TestClient123!

# ===================================
# FILE UPLOAD PATHS (FOR TESTING)
# ===================================
UPLOAD_DIR=backend/uploads/test
```

### Step 2: Get JotForm API Key (If You Don't Have It)

1. Go to https://www.jotform.com/myaccount/api
2. Log in to your JotForm account
3. Click "Create New Key"
4. Copy the API key
5. Replace `your_jotform_api_key_here` in `.env.test`

**OR for testing only, use a dummy key:**
```
JOTFORM_API_KEY=test-dummy-key-for-unit-tests
JOTFORM_FORM_ID=test-form-id
```

### Step 3: Create Test Upload Directory

```bash
# Create test upload directory
mkdir -p backend/uploads/test/products
mkdir -p backend/uploads/test/temp
```

---

## 4️⃣ Installing Test Dependencies

### Step 1: Install Backend Test Dependencies

```bash
# Navigate to backend folder
cd backend

# Install test dependencies
npm install --save-dev jest supertest @types/jest @types/supertest

# If you want code coverage reports
npm install --save-dev @jest/globals

# For database testing
npm install --save-dev mysql2
```

### Step 2: Install Frontend Test Dependencies

```bash
# Navigate to frontend folder
cd ../frontend

# Install React testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Install Jest environment for React
npm install --save-dev jest-environment-jsdom

# For mocking CSS imports
npm install --save-dev identity-obj-proxy

# For testing with Vite
npm install --save-dev @vitejs/plugin-react vitest @vitest/ui
```

### Step 3: Install E2E Test Dependencies (Root Level)

```bash
# Navigate to project root
cd ..

# Install Playwright for E2E tests
npm install --save-dev @playwright/test

# Initialize Playwright (creates config)
npx playwright install
```

---

## 5️⃣ Running Tests

### Quick Start - Run All Tests

```bash
# From project root
npm test
```

### Backend Tests

```bash
# Navigate to backend folder
cd backend

# Run all backend tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run with coverage report
npm run test:coverage

# Run in watch mode (auto-rerun on file changes)
npm run test:watch

# Run verbose (see all test details)
npm run test:verbose
```

### Frontend Tests

```bash
# Navigate to frontend folder
cd frontend

# Run all frontend tests
npm test

# Run only component tests
npm run test:components

# Run only integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### E2E Tests

```bash
# From project root
npm run test:e2e

# Run specific E2E test suite
npm run test:e2e:booking        # Booking flow
npm run test:e2e:checkout       # Checkout flow
npm run test:e2e:admin          # Admin workflows

# Run E2E in headed mode (see browser)
npm run test:e2e:headed

# Run E2E with UI (Playwright UI mode)
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

### Run Everything

```bash
# From project root - runs all tests in sequence
npm run test:all

# This will run:
# 1. Backend unit tests
# 2. Backend integration tests
# 3. Frontend unit tests
# 4. Frontend integration tests
# 5. E2E tests
```

---

## 6️⃣ Test Coverage

### Generate Coverage Reports

```bash
# Backend coverage
cd backend && npm run test:coverage

# Frontend coverage
cd frontend && npm run test:coverage

# Combined coverage report
npm run test:coverage:all
```

### View Coverage Reports

After running coverage commands, open:
- **Backend:** `backend/coverage/lcov-report/index.html`
- **Frontend:** `frontend/coverage/lcov-report/index.html`

### Coverage Goals

| Category | Goal | Current |
|----------|------|---------|
| Backend Models | 90%+ | Will achieve |
| Backend Routes | 85%+ | Will achieve |
| Backend Services | 80%+ | Will achieve |
| Frontend Components | 70%+ | Will achieve |
| Frontend Services | 80%+ | Will achieve |
| Overall | 80%+ | Will achieve |

---

## 7️⃣ Test Structure Overview

```
zenshe_spa/
├── backend/
│   ├── src/                        # Your app code
│   └── tests/                      # Backend tests
│       ├── unit/                   # Unit tests (isolated)
│       │   ├── models/            # 8 model tests
│       │   ├── services/          # Service tests
│       │   └── middleware/        # Middleware tests
│       ├── integration/            # Integration tests (with DB)
│       │   ├── auth-api.test.js
│       │   ├── store-api.test.js
│       │   ├── reservations-api.test.js
│       │   └── ... (20+ route tests)
│       ├── fixtures/               # Test data
│       └── helpers/                # Test utilities
│
├── frontend/
│   ├── src/                        # Your app code
│   └── tests/                      # Frontend tests
│       ├── unit/                   # Unit tests
│       │   ├── components/        # Component tests
│       │   ├── services/          # API service tests
│       │   ├── context/           # Context provider tests
│       │   └── utils/             # Utility function tests
│       ├── integration/            # Integration tests
│       │   ├── booking-flow.test.jsx
│       │   ├── checkout-flow.test.jsx
│       │   └── admin-crud.test.jsx
│       └── helpers/                # Test utilities
│
└── tests/
    └── e2e/                        # End-to-end tests
        ├── booking.spec.js         # Full booking journey
        ├── checkout.spec.js        # Complete checkout
        ├── admin-store.spec.js     # Admin store management
        └── authentication.spec.js  # Login/logout flows
```

---

## 8️⃣ Troubleshooting

### Issue: "Cannot connect to test database"

**Solution:**
```bash
# Check if MariaDB is running
# Check connection settings in .env.test
mysql -u root -p -P 4306 -e "SHOW DATABASES;"
```

### Issue: "BREVO_API_KEY is required"

**Solution:**
Make sure `.env.test` has your Brevo API key (you already have this)

### Issue: "Module not found"

**Solution:**
```bash
# Reinstall dependencies
cd backend && npm install
cd ../frontend && npm install
cd .. && npm install
```

### Issue: "Tests are slow"

**Solution:**
```bash
# Run only unit tests (faster)
npm run test:unit

# Run specific test file
npm test -- Product.test.js
```

### Issue: "Port already in use" (E2E tests)

**Solution:**
```bash
# Stop dev servers before running E2E tests
# Or configure E2E to use different ports
```

### Issue: "Database is locked" or "Table doesn't exist"

**Solution:**
```bash
# Reset test database
node backend/tests/helpers/seed-test-db.js

# Or re-import schema
mysql -u root -p -P 4306 zenshespa_database_test < "zenshe_backup(incase of destruction).sql"
```

---

## 9️⃣ CI/CD Integration (Bonus)

### GitHub Actions Example

Create `.github/workflows/tests.yml`:

```yaml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Setup Database
        run: |
          mysql -e 'CREATE DATABASE zenshespa_database_test;'
          mysql zenshespa_database_test < zenshe_backup*.sql
      
      - name: Install Dependencies
        run: |
          cd backend && npm install
          cd ../frontend && npm install
          cd .. && npm install
      
      - name: Run Backend Tests
        run: cd backend && npm test
      
      - name: Run Frontend Tests
        run: cd frontend && npm test
      
      - name: Run E2E Tests
        run: npm run test:e2e
```

---

## 🎯 Test Execution Checklist

Before running tests for the first time:

- [ ] Test database created (`zenshespa_database_test`)
- [ ] Schema imported to test database
- [ ] `.env.test` file created with all keys
- [ ] Test upload directories created
- [ ] Backend test dependencies installed
- [ ] Frontend test dependencies installed
- [ ] E2E test dependencies installed (Playwright)

Then run:

```bash
# 1. Seed test database
node backend/tests/helpers/seed-test-db.js

# 2. Run backend tests
cd backend && npm test

# 3. Run frontend tests
cd ../frontend && npm test

# 4. Run E2E tests
cd .. && npm run test:e2e
```

---

## 📊 Expected Test Count

After setup, you should have:

- **Backend Unit Tests:** ~80 tests
  - 8 models × ~8 tests each = 64 tests
  - Services: ~10 tests
  - Middleware: ~6 tests

- **Backend Integration Tests:** ~40 tests
  - 20+ API routes × 2-3 tests each

- **Frontend Unit Tests:** ~60 tests
  - Components: ~30 tests
  - Services: ~15 tests
  - Context: ~10 tests
  - Utils: ~5 tests

- **Frontend Integration Tests:** ~15 tests

- **E2E Tests:** ~20 tests

**Total: ~215 comprehensive tests covering your entire application**

---

## 🚀 Quick Command Reference

```bash
# Backend
npm run test:backend              # All backend tests
npm run test:backend:unit         # Backend unit only
npm run test:backend:integration  # Backend integration only

# Frontend
npm run test:frontend             # All frontend tests
npm run test:frontend:unit        # Frontend unit only
npm run test:frontend:integration # Frontend integration only

# E2E
npm run test:e2e                  # All E2E tests
npm run test:e2e:headed           # E2E with visible browser

# Coverage
npm run test:coverage             # All coverage
npm run test:backend:coverage     # Backend coverage only
npm run test:frontend:coverage    # Frontend coverage only

# Watch mode (development)
npm run test:watch                # Auto-rerun on changes
```

---

## 📝 Notes

1. **Test Database:** Always use a separate test database, never your production data!
2. **API Keys:** Test keys are fine for unit/integration tests. Real keys needed for E2E.
3. **Test Data:** Tests will create/modify data in test database. It's reset before each run.
4. **Performance:** Unit tests are fast (<1s), integration tests slower (5-10s), E2E slowest (30-60s)
5. **Parallel Execution:** Jest runs tests in parallel by default for speed.

---

**Ready? Let's create all the test files now!** 🎉
