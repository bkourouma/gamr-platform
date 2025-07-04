// Security configuration for GAMR Platform
// Implements comprehensive security measures for production deployment

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { body, validationResult } = require('express-validator');

class SecurityConfig {
    /**
     * Configure Helmet security headers
     */
    static getHelmetConfig() {
        return helmet({
            // Content Security Policy
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: [
                        "'self'",
                        "'unsafe-inline'", // Required for Tailwind CSS
                        "https://fonts.googleapis.com"
                    ],
                    scriptSrc: [
                        "'self'",
                        "'unsafe-inline'", // Required for Vite in development
                        process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : null
                    ].filter(Boolean),
                    fontSrc: [
                        "'self'",
                        "https://fonts.gstatic.com"
                    ],
                    imgSrc: [
                        "'self'",
                        "data:",
                        "https:"
                    ],
                    connectSrc: [
                        "'self'",
                        process.env.FRONTEND_URL || "'self'"
                    ],
                    frameSrc: ["'none'"],
                    objectSrc: ["'none'"],
                    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
                }
            },
            
            // HTTP Strict Transport Security
            hsts: {
                maxAge: 31536000, // 1 year
                includeSubDomains: true,
                preload: true
            },
            
            // X-Frame-Options
            frameguard: {
                action: 'deny'
            },
            
            // X-Content-Type-Options
            noSniff: true,
            
            // X-XSS-Protection
            xssFilter: true,
            
            // Referrer Policy
            referrerPolicy: {
                policy: 'strict-origin-when-cross-origin'
            },
            
            // Hide X-Powered-By header
            hidePoweredBy: true,
            
            // DNS Prefetch Control
            dnsPrefetchControl: {
                allow: false
            },
            
            // Expect-CT
            expectCt: {
                maxAge: 86400,
                enforce: true
            }
        });
    }

    /**
     * Configure rate limiting
     */
    static getRateLimitConfig() {
        const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
        const max = parseInt(process.env.RATE_LIMIT_MAX) || 100; // requests per window

        return rateLimit({
            windowMs,
            max,
            message: {
                error: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.',
                retryAfter: Math.ceil(windowMs / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false,
            // Skip rate limiting for health checks
            skip: (req) => req.path === '/health',
            // Custom key generator for multi-tenant rate limiting
            keyGenerator: (req) => {
                const tenantId = req.user?.tenantId || 'anonymous';
                return `${req.ip}-${tenantId}`;
            }
        });
    }

    /**
     * Configure strict rate limiting for authentication endpoints
     */
    static getAuthRateLimitConfig() {
        return rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // 5 attempts per window
            message: {
                error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
                retryAfter: 900
            },
            standardHeaders: true,
            legacyHeaders: false,
            skipSuccessfulRequests: true // Don't count successful requests
        });
    }

    /**
     * Configure slow down middleware for suspicious activity
     */
    static getSlowDownConfig() {
        return slowDown({
            windowMs: 15 * 60 * 1000, // 15 minutes
            delayAfter: 50, // Allow 50 requests per window at full speed
            delayMs: 500, // Add 500ms delay per request after delayAfter
            maxDelayMs: 20000, // Maximum delay of 20 seconds
            skip: (req) => req.path === '/health'
        });
    }

    /**
     * Input validation schemas
     */
    static getValidationSchemas() {
        return {
            // User registration validation
            userRegistration: [
                body('email')
                    .isEmail()
                    .normalizeEmail()
                    .withMessage('Email invalide'),
                body('password')
                    .isLength({ min: 8 })
                    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
                    .withMessage('Le mot de passe doit contenir au moins 8 caractères avec majuscules, minuscules, chiffres et caractères spéciaux'),
                body('firstName')
                    .trim()
                    .isLength({ min: 2, max: 50 })
                    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
                    .withMessage('Prénom invalide'),
                body('lastName')
                    .trim()
                    .isLength({ min: 2, max: 50 })
                    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
                    .withMessage('Nom invalide')
            ],

            // Login validation
            login: [
                body('email')
                    .isEmail()
                    .normalizeEmail()
                    .withMessage('Email invalide'),
                body('password')
                    .notEmpty()
                    .withMessage('Mot de passe requis')
            ],

            // Evaluation validation
            evaluation: [
                body('title')
                    .trim()
                    .isLength({ min: 3, max: 200 })
                    .withMessage('Titre invalide (3-200 caractères)'),
                body('description')
                    .optional()
                    .trim()
                    .isLength({ max: 1000 })
                    .withMessage('Description trop longue (max 1000 caractères)'),
                body('modelId')
                    .isUUID()
                    .withMessage('ID de modèle invalide')
            ],

            // Risk sheet validation
            riskSheet: [
                body('title')
                    .trim()
                    .isLength({ min: 3, max: 200 })
                    .withMessage('Titre invalide (3-200 caractères)'),
                body('description')
                    .optional()
                    .trim()
                    .isLength({ max: 2000 })
                    .withMessage('Description trop longue (max 2000 caractères)'),
                body('priority')
                    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
                    .withMessage('Priorité invalide')
            ],

            // Corrective action validation
            correctiveAction: [
                body('title')
                    .trim()
                    .isLength({ min: 3, max: 200 })
                    .withMessage('Titre invalide (3-200 caractères)'),
                body('description')
                    .trim()
                    .isLength({ min: 10, max: 2000 })
                    .withMessage('Description invalide (10-2000 caractères)'),
                body('priority')
                    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
                    .withMessage('Priorité invalide'),
                body('dueDate')
                    .optional()
                    .isISO8601()
                    .withMessage('Date d\'échéance invalide')
            ]
        };
    }

    /**
     * Validation error handler middleware
     */
    static validationErrorHandler(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Données invalides',
                details: errors.array().map(err => ({
                    field: err.param,
                    message: err.msg,
                    value: err.value
                }))
            });
        }
        next();
    }

    /**
     * CORS configuration
     */
    static getCorsConfig() {
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            process.env.CORS_ORIGIN,
            'http://localhost:5173', // Vite dev server
            'http://localhost:3000'  // Alternative dev port
        ].filter(Boolean);

        return {
            origin: (origin, callback) => {
                // Allow requests with no origin (mobile apps, Postman, etc.)
                if (!origin) return callback(null, true);
                
                if (allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error('Non autorisé par la politique CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Origin',
                'X-Requested-With',
                'Content-Type',
                'Accept',
                'Authorization',
                'X-Tenant-ID'
            ],
            exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
            maxAge: 86400 // 24 hours
        };
    }

    /**
     * Security middleware for API routes
     */
    static securityMiddleware() {
        return (req, res, next) => {
            // Add security headers
            res.set({
                'X-API-Version': process.env.npm_package_version || '1.0.0',
                'X-Response-Time': Date.now() - req.startTime
            });

            // Log suspicious activity
            if (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',').length > 3) {
                console.warn('Suspicious X-Forwarded-For header:', req.headers['x-forwarded-for']);
            }

            // Check for common attack patterns
            const suspiciousPatterns = [
                /(<script|javascript:|vbscript:|onload=|onerror=)/i,
                /(union\s+select|drop\s+table|insert\s+into)/i,
                /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/i
            ];

            const checkString = JSON.stringify(req.body) + req.url + JSON.stringify(req.query);
            
            for (const pattern of suspiciousPatterns) {
                if (pattern.test(checkString)) {
                    console.warn('Suspicious request detected:', {
                        ip: req.ip,
                        url: req.url,
                        userAgent: req.get('User-Agent'),
                        pattern: pattern.toString()
                    });
                    
                    return res.status(400).json({
                        error: 'Requête invalide détectée'
                    });
                }
            }

            next();
        };
    }

    /**
     * File upload security configuration
     */
    static getFileUploadConfig() {
        return {
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB max file size
                files: 5, // Maximum 5 files per request
                fields: 20, // Maximum 20 form fields
                fieldSize: 1024 * 1024 // 1MB max field size
            },
            fileFilter: (req, file, cb) => {
                // Allowed file types
                const allowedTypes = [
                    'image/jpeg',
                    'image/png',
                    'image/gif',
                    'application/pdf',
                    'text/plain',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                ];

                if (allowedTypes.includes(file.mimetype)) {
                    cb(null, true);
                } else {
                    cb(new Error('Type de fichier non autorisé'), false);
                }
            }
        };
    }

    /**
     * Session security configuration
     */
    static getSessionConfig() {
        return {
            secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production', // HTTPS only in production
                httpOnly: true, // Prevent XSS
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                sameSite: 'strict' // CSRF protection
            },
            name: 'gamr.sid' // Custom session name
        };
    }
}

module.exports = SecurityConfig;
