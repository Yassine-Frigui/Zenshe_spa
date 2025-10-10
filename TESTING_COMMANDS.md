# 🎮 TESTING COMMAND REFERENCE CARD

## 🏃 Quick Commands (Copy & Paste)

### Run All Current Tests
```powershell
cd c:\Users\yassi\Desktop\dekstop\zenshe_spa
npx jest tests/unit --verbose
```
**What it does:** Runs 19 unit tests (Product + StoreOrder models)  
**Expected:** All 19 tests pass in ~0.5 seconds ✅

---

### Run Tests with Coverage Report
```powershell
npx jest tests/unit --coverage
```
**What it does:** Runs tests + generates coverage report  
**View report:** Open `coverage/lcov-report/index.html` in browser

---

### Watch Mode (Auto-rerun on changes)
```powershell
npx jest tests/unit --watch
```
**What it does:** Watches files, reruns tests when you save changes  
**Stop it:** Press `Ctrl+C`

---

### Run Specific Test File
```powershell
npx jest tests/unit/models/Product.test.js
```
**What it does:** Runs only Product model tests (14 tests)

---

### Run Tests Matching Pattern
```powershell
npx jest --testNamePattern="createProduct"
```
**What it does:** Runs only tests with "createProduct" in the name

---

## 🔧 Setup Commands (One-Time)

### Create Test Database
```powershell
mysql -u root -p -P 4306
```
Then inside MySQL:
```sql
CREATE DATABASE IF NOT EXISTS zenshespa_database_test CHARACTER SET utf8mb4;
GRANT ALL PRIVILEGES ON zenshespa_database_test.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
exit;
```

### Import Database Schema
```powershell
mysql -u root -p -P 4306 zenshespa_database_test < "zenshe_backup(incase of destruction).sql"
```

### Install Backend Test Dependencies
```powershell
cd backend
npm install --save-dev jest supertest @types/jest
```

### Install Frontend Test Dependencies
```powershell
cd frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom
```

### Install E2E Test Dependencies
```powershell
cd c:\Users\yassi\Desktop\dekstop\zenshe_spa
npm install --save-dev @playwright/test
npx playwright install chromium
```

---

## 🎯 Common Test Scenarios

### Scenario 1: I Changed a Model
```powershell
# Run that model's tests
npx jest tests/unit/models/YourModel.test.js --verbose
```

### Scenario 2: I Want to See What's Not Covered
```powershell
# Generate coverage report
npx jest tests/unit --coverage

# Open in browser
start coverage\lcov-report\index.html
```

### Scenario 3: A Test is Failing
```powershell
# Run with detailed output
npx jest tests/unit --verbose --no-coverage

# Run single failing test
npx jest tests/unit/models/Product.test.js
```

### Scenario 4: I Want to Debug a Test
Add to your test file:
```javascript
test('my test', () => {
    console.log('Debug info:', someVariable);
    // ... rest of test
});
```
Then run:
```powershell
npx jest tests/unit/models/Product.test.js --verbose
```

---

## 📊 Understanding Test Output

### Successful Test Output
```
 PASS  tests/unit/models/Product.test.js
  Product Model
    √ should create product (4 ms)
    √ should get product by id (2 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Time:        0.517 s
```

### Failed Test Output
```
 FAIL  tests/unit/models/Product.test.js
  Product Model
    × should create product (4 ms)

  ● Product Model › should create product

    Expected: "Product Name"
    Received: undefined

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 passed, 2 total
```

**How to fix:** Look at the error message, check the line number, verify your expectations match actual behavior.

---

## 🚀 When You Have More Tests

### Run Backend Tests Only
```powershell
cd backend
npm test
```

### Run Frontend Tests Only
```powershell
cd frontend
npm test
```

### Run E2E Tests
```powershell
cd c:\Users\yassi\Desktop\dekstop\zenshe_spa
npm run test:e2e
```

### Run E2E Tests with UI (Visual)
```powershell
npm run test:e2e:ui
```

### Run All Tests (Backend + Frontend + E2E)
```powershell
npm run test:all
```

---

## 🔍 Debugging Tips

### Check Test File Syntax
```powershell
node -c tests/unit/models/Product.test.js
```
**What it does:** Checks for JavaScript syntax errors

### See All Available Tests
```powershell
npx jest --listTests
```
**What it does:** Shows all test files Jest can find

### Run Tests in Specific Order
```powershell
npx jest --runInBand tests/unit
```
**What it does:** Runs tests sequentially (useful for debugging)

### Clear Jest Cache
```powershell
npx jest --clearCache
```
**What it does:** Clears Jest's cache (fixes weird issues)

---

## 📈 Coverage Thresholds

Your Jest config has these thresholds:
- **Branches:** 60%
- **Functions:** 60%
- **Lines:** 60%
- **Statements:** 60%

If coverage drops below these, tests will fail.

**Check current coverage:**
```powershell
npx jest tests/unit --coverage --verbose
```

---

## 🆘 Troubleshooting

### "Cannot find module"
**Fix:** Check import paths in your test file
```javascript
// Wrong
const Product = require('../Product');

// Right  
const Product = require('../../../src/models/Product');
```

### "Test suite failed to run"
**Fix:** Check for syntax errors
```powershell
node -c your-test-file.test.js
```

### "No tests found"
**Fix:** Make sure test files end with `.test.js` or `.spec.js`
```powershell
# Wrong: Product.tests.js
# Right: Product.test.js
```

### "Timeout - Async callback was not invoked"
**Fix:** Increase timeout in your test
```javascript
test('my test', async () => {
    // test code
}, 10000); // 10 second timeout
```

---

## 💡 Pro Tips

### Tip 1: Use Watch Mode When Developing
```powershell
npx jest tests/unit --watch
```
Tests auto-run when you save files. Press `a` to run all, `p` to filter by filename, `t` to filter by test name.

### Tip 2: Focus on One Test
```javascript
test.only('this test only', () => {
    // only this test runs
});
```

### Tip 3: Skip Tests Temporarily
```javascript
test.skip('skip this test', () => {
    // this test won't run
});
```

### Tip 4: See Console Logs
```javascript
test('my test', () => {
    console.log('Debug:', someValue);
    // Your console.log will appear in test output
});
```

---

## 📞 Quick Reference URLs

- **Jest Documentation:** https://jestjs.io/docs/getting-started
- **Supertest Documentation:** https://github.com/ladjs/supertest
- **Playwright Documentation:** https://playwright.dev/docs/intro
- **React Testing Library:** https://testing-library.com/docs/react-testing-library/intro

---

## 🎯 Next Steps

1. **Run current tests:** `npx jest tests/unit --verbose`
2. **Check they pass:** Should see 19 passed
3. **View coverage:** `npx jest tests/unit --coverage`
4. **Decide next:** Tell me what tests to create!

**Ready to create more tests?** Tell me which area to focus on! 🚀
