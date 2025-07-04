// Application Insights configuration for GAMR Platform
// Provides comprehensive monitoring, logging, and performance tracking

const appInsights = require('applicationinsights');

class ApplicationInsightsService {
    constructor() {
        this.isInitialized = false;
        this.client = null;
    }

    /**
     * Initialize Application Insights
     */
    initialize() {
        if (this.isInitialized) {
            return;
        }

        const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
        const instrumentationKey = process.env.APPLICATIONINSIGHTS_INSTRUMENTATION_KEY;

        if (!connectionString && !instrumentationKey) {
            console.warn('Application Insights not configured - monitoring disabled');
            return;
        }

        try {
            // Setup Application Insights
            if (connectionString) {
                appInsights.setup(connectionString);
            } else {
                appInsights.setup(instrumentationKey);
            }

            // Configure telemetry
            appInsights.setAutoCollectRequests(true);
            appInsights.setAutoCollectPerformance(true, true);
            appInsights.setAutoCollectExceptions(true);
            appInsights.setAutoCollectDependencies(true);
            appInsights.setAutoCollectConsole(true, true);
            appInsights.setUseDiskRetryCaching(true);
            appInsights.setSendLiveMetrics(true);

            // Set sampling rate for production
            appInsights.setAutoCollectPreAggregatedMetrics(true);
            if (process.env.NODE_ENV === 'production') {
                appInsights.Configuration.setInternalLogging(false, false);
                // Sample 20% of requests in production
                appInsights.defaultClient.config.samplingPercentage = 20;
            }

            // Add custom properties to all telemetry
            appInsights.defaultClient.addTelemetryProcessor((envelope) => {
                envelope.tags['ai.cloud.role'] = 'gamr-platform';
                envelope.tags['ai.cloud.roleInstance'] = process.env.WEBSITE_INSTANCE_ID || 'local';
                
                // Add custom properties
                if (envelope.data.baseData) {
                    envelope.data.baseData.properties = {
                        ...envelope.data.baseData.properties,
                        environment: process.env.NODE_ENV,
                        version: process.env.npm_package_version || '1.0.0',
                        tenant: envelope.data.baseData.properties?.tenantId || 'unknown'
                    };
                }
                
                return true;
            });

            // Start collecting telemetry
            appInsights.start();
            
            this.client = appInsights.defaultClient;
            this.isInitialized = true;
            
            console.log('✅ Application Insights initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Application Insights:', error);
        }
    }

    /**
     * Track custom events
     */
    trackEvent(name, properties = {}, measurements = {}) {
        if (!this.client) return;
        
        this.client.trackEvent({
            name,
            properties: {
                timestamp: new Date().toISOString(),
                ...properties
            },
            measurements
        });
    }

    /**
     * Track custom metrics
     */
    trackMetric(name, value, properties = {}) {
        if (!this.client) return;
        
        this.client.trackMetric({
            name,
            value,
            properties: {
                timestamp: new Date().toISOString(),
                ...properties
            }
        });
    }

    /**
     * Track exceptions
     */
    trackException(error, properties = {}) {
        if (!this.client) return;
        
        this.client.trackException({
            exception: error,
            properties: {
                timestamp: new Date().toISOString(),
                ...properties
            }
        });
    }

    /**
     * Track dependencies (external calls)
     */
    trackDependency(name, commandName, elapsedTime, success, properties = {}) {
        if (!this.client) return;
        
        this.client.trackDependency({
            name,
            commandName,
            elapsedTime,
            success,
            properties: {
                timestamp: new Date().toISOString(),
                ...properties
            }
        });
    }

    /**
     * Track user authentication events
     */
    trackAuthentication(userId, tenantId, success, method = 'jwt') {
        this.trackEvent('UserAuthentication', {
            userId,
            tenantId,
            success: success.toString(),
            method,
            userAgent: process.env.HTTP_USER_AGENT || 'unknown'
        });
    }

    /**
     * Track security evaluation events
     */
    trackSecurityEvaluation(evaluationId, tenantId, userId, action) {
        this.trackEvent('SecurityEvaluation', {
            evaluationId,
            tenantId,
            userId,
            action, // created, updated, completed, deleted
        });
    }

    /**
     * Track risk assessment events
     */
    trackRiskAssessment(ficheId, tenantId, userId, riskScore) {
        this.trackEvent('RiskAssessment', {
            ficheId,
            tenantId,
            userId,
            action: 'calculated'
        }, {
            riskScore
        });
    }

    /**
     * Track corrective actions
     */
    trackCorrectiveAction(actionId, tenantId, userId, status) {
        this.trackEvent('CorrectiveAction', {
            actionId,
            tenantId,
            userId,
            status // created, in_progress, completed, cancelled
        });
    }

    /**
     * Track AI chat interactions
     */
    trackAIChat(tenantId, userId, query, responseTime) {
        this.trackEvent('AIChatInteraction', {
            tenantId,
            userId,
            queryLength: query.length.toString()
        }, {
            responseTime
        });
    }

    /**
     * Track performance metrics
     */
    trackPerformance(operation, duration, success = true, properties = {}) {
        this.trackMetric(`Performance.${operation}`, duration, {
            success: success.toString(),
            ...properties
        });
    }

    /**
     * Track database operations
     */
    trackDatabaseOperation(operation, table, duration, success = true) {
        this.trackDependency(
            'Database',
            `${operation} ${table}`,
            duration,
            success,
            {
                operation,
                table,
                database: 'sqlite'
            }
        );
    }

    /**
     * Flush telemetry (useful for serverless environments)
     */
    flush() {
        if (this.client) {
            this.client.flush();
        }
    }

    /**
     * Create custom telemetry processor for request filtering
     */
    addRequestFilter() {
        if (!this.client) return;

        this.client.addTelemetryProcessor((envelope) => {
            // Filter out health check requests from telemetry
            if (envelope.data.baseType === 'RequestData') {
                const url = envelope.data.baseData.url;
                if (url && (url.includes('/health') || url.includes('/favicon.ico'))) {
                    return false; // Don't send this telemetry
                }
            }
            return true;
        });
    }

    /**
     * Set user context for telemetry
     */
    setUserContext(userId, tenantId) {
        if (!this.client) return;

        this.client.context.tags[this.client.context.keys.userId] = userId;
        this.client.context.tags[this.client.context.keys.sessionId] = tenantId;
    }

    /**
     * Clear user context
     */
    clearUserContext() {
        if (!this.client) return;

        delete this.client.context.tags[this.client.context.keys.userId];
        delete this.client.context.tags[this.client.context.keys.sessionId];
    }
}

// Create singleton instance
const applicationInsights = new ApplicationInsightsService();

// Express middleware for automatic request tracking
const createMiddleware = () => {
    return (req, res, next) => {
        // Set user context if available
        if (req.user) {
            applicationInsights.setUserContext(req.user.id, req.user.tenantId);
        }

        // Track custom properties
        const startTime = Date.now();
        
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            const success = res.statusCode < 400;
            
            applicationInsights.trackPerformance(
                `${req.method} ${req.route?.path || req.path}`,
                duration,
                success,
                {
                    method: req.method,
                    statusCode: res.statusCode.toString(),
                    userAgent: req.get('User-Agent') || 'unknown'
                }
            );
        });

        next();
    };
};

module.exports = {
    applicationInsights,
    createMiddleware
};
