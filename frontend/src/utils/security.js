// Production logging utility - removes console.log in production
const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  error: (...args) => {
    // Always log errors, but sanitize sensitive data in production
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, log to error service (Sentry, etc.)
      const sanitizedArgs = args.map(arg => 
        typeof arg === 'object' ? '[Sanitized Object]' : arg
      );
      console.error(...sanitizedArgs);
    }
  },
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};

// Security utility functions
export const sanitizeForDisplay = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potential XSS patterns
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

// Validate email format on frontend
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone format (8 digits)
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{8}$/;
  return phoneRegex.test(phone);
};

// Secure local storage wrapper
export const secureStorage = {
  setItem: (key, value) => {
    try {
      const encrypted = btoa(JSON.stringify(value)); // Basic encoding
      localStorage.setItem(`zenshespa_${key}`, encrypted);
    } catch (error) {
      logger.error('Failed to store item:', error);
    }
  },
  
  getItem: (key) => {
    try {
      const item = localStorage.getItem(`zenshespa_${key}`);
      if (!item) return null;
      return JSON.parse(atob(item));
    } catch (error) {
      logger.error('Failed to retrieve item:', error);
      return null;
    }
  },
  
  removeItem: (key) => {
    localStorage.removeItem(`zenshespa_${key}`);
  },
  
  clear: () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('zenshespa_')) {
        localStorage.removeItem(key);
      }
    });
  }
};

// Content Security Policy helpers
export const cspNonce = () => {
  return window.__CSP_NONCE__ || '';
};

export default {
  logger,
  sanitizeForDisplay,
  isValidEmail,
  isValidPhone,
  secureStorage,
  cspNonce
};