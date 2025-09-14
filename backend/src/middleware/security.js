const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const xss = require('xss');

// Security headers middleware
const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", "https://api.zenshespa.com", "wss:"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Rate limiting configurations
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 auth requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many authentication attempts',
            message: 'Please wait 15 minutes before trying again',
            retryAfter: new Date(Date.now() + 15 * 60 * 1000)
        });
    }
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

const reservationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 reservations per hour
    message: {
        error: 'Too many reservation attempts, please try again later.',
        retryAfter: '1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Input validation middleware
const validateInput = (validations) => {
    return async (req, res, next) => {
        // Run all validations
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array().map(err => ({
                    field: err.param,
                    message: err.msg,
                    value: err.value
                }))
            });
        }

        // Sanitize string inputs for XSS
        const sanitizeObject = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === 'string') {
                    obj[key] = xss(obj[key].trim());
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitizeObject(obj[key]);
                }
            }
        };

        if (req.body) {
            sanitizeObject(req.body);
        }

        next();
    };
};

// Common validation rules
const emailValidation = body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address');

const passwordValidation = body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

const phoneValidation = body('telephone')
    .matches(/^[0-9]{8}$/)
    .withMessage('Phone number must be exactly 8 digits');

const nameValidation = (field) => body(field)
    .isLength({ min: 2, max: 50 })
    .withMessage(`${field} must be between 2 and 50 characters`)
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage(`${field} can only contain letters, spaces, hyphens, and apostrophes`);

// Request sanitization middleware
const sanitizeRequest = (req, res, next) => {
    // Remove potentially dangerous properties
    if (req.body) {
        delete req.body.__proto__;
        delete req.body.constructor;
        delete req.body.prototype;
    }
    
    // Limit request size already handled by express.json({limit})
    next();
};

// Security logging middleware
const securityLogger = (req, res, next) => {
    // Log suspicious activities
    const suspiciousPatterns = [
        /select.*from/i,
        /union.*select/i,
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /\.\.\/\.\.\//,
        /etc\/passwd/i
    ];

    const checkSuspicious = (str) => {
        return suspiciousPatterns.some(pattern => pattern.test(str));
    };

    const logSuspicious = (data, source) => {
        console.warn(`🚨 SECURITY ALERT: Suspicious ${source} detected from IP: ${req.ip}`, {
            timestamp: new Date().toISOString(),
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.originalUrl,
            method: req.method,
            data: data
        });
    };

    // Check URL for suspicious patterns
    if (checkSuspicious(req.originalUrl)) {
        logSuspicious(req.originalUrl, 'URL pattern');
    }

    // Check request body for suspicious patterns
    if (req.body) {
        const bodyString = JSON.stringify(req.body);
        if (checkSuspicious(bodyString)) {
            logSuspicious(req.body, 'request body');
        }
    }

    next();
};

module.exports = {
    securityHeaders,
    authLimiter,
    generalLimiter,
    reservationLimiter,
    validateInput,
    emailValidation,
    passwordValidation,
    phoneValidation,
    nameValidation,
    sanitizeRequest,
    securityLogger
};