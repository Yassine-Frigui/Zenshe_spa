const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/e2e',
    timeout: 30000,
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: [
        {
            command: 'cd frontend && npm run dev',
            url: 'http://localhost:3000',
            timeout: 120000,
            reuseExistingServer: true,
        },
        {
            command: 'cd backend && node src/app.js',
            url: 'http://localhost:5000',
            timeout: 120000,
            reuseExistingServer: true,
        },
    ],
});