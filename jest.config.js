module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'backend/src/**/*.js',
        '!backend/src/app.js',
        '!backend/config/**',
        '!backend/database/**',
        '!**/node_modules/**'
    ],
    testMatch: [
        '**/tests/**/*.test.js',
        '**/tests/**/*.spec.js'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/coverage/'
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/helpers/setup.js'],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },
    verbose: true,
    testTimeout: 10000
};
