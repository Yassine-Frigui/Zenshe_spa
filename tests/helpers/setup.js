// Test setup file - runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'zenshespa_database';
process.env.BREVO_API_KEY = 'brevo_api_key_dummy';
process.env.JOTFORM_API_KEY = 'test-jotform-api-key'; // Mock JotForm API key for testing
process.env.JOTFORM_FORM_ID = 'test-form-id'; // Mock JotForm form ID for testing

// Mock console methods to reduce noise in test output
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Increase timeout for database operations
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks();
});
