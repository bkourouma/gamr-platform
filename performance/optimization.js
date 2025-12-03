// Performance optimization configuration for GAMRDIGITALE Platform
// Implements caching, compression, and performance monitoring

const compression = require('compression');
const NodeCache = require('node-cache');
const { performance } = require('perf_hooks');

class PerformanceOptimizer {
    constructor() {
        // Initialize in-memory cache
        this.cache = new NodeCache({
            stdTTL: 600, // 10 minutes default TTL
            checkperiod: 120, // Check for expired keys every 2 minutes
            useClones: false // Better performance, but be careful with object mutations
        });

        // Performance metrics storage
        this.metrics = {
            requests: new Map(),
            database: new Map(),
            cache: {
                hits: 0,
                misses: 0,
                sets: 0,
                deletes: 0
            }
        };
    }

    /**
     * Configure compression middleware
     */
    getCompressionConfig() {
        return compression({
            // Compression level (1-9, 6 is default)
            level: 6,
            
            // Minimum response size to compress (in bytes)
            threshold: 1024,
            
            // Filter function to determine what to compress
            filter: (req, res) => {
                // Don't compress if the request includes a Cache-Control: no-transform directive
                if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
                    return false;
                }
                
                // Compress everything else that's compressible
                return compression.filter(req, res);
            },
            
            // Compression strategy
            strategy: compression.constants.Z_DEFAULT_STRATEGY
        });
    }

    /**
     * Cache middleware for API responses
     */
    cacheMiddleware(ttl = 300) { // 5 minutes default
        return (req, res, next) => {
            // Only cache GET requests
            if (req.method !== 'GET') {
                return next();
            }

            // Skip caching for authenticated requests with user-specific data
            if (req.headers.authorization && req.path.includes('/user/')) {
                return next();
            }

            const key = this.generateCacheKey(req);
            const cachedResponse = this.cache.get(key);

            if (cachedResponse) {
                this.metrics.cache.hits++;
                res.set('X-Cache', 'HIT');
                res.set('X-Cache-Key', key);
                return res.json(cachedResponse);
            }

            // Store original json method
            const originalJson = res.json;
            
            // Override json method to cache response
            res.json = (data) => {
                // Only cache successful responses
                if (res.statusCode === 200) {
                    this.cache.set(key, data, ttl);
                    this.metrics.cache.sets++;
                    res.set('X-Cache', 'MISS');
                    res.set('X-Cache-Key', key);
                }
                
                // Call original json method
                return originalJson.call(res, data);
            };

            this.metrics.cache.misses++;
            next();
        };
    }

    /**
     * Generate cache key from request
     */
    generateCacheKey(req) {
        const tenantId = req.user?.tenantId || 'public';
        const userId = req.user?.id || 'anonymous';
        const path = req.path;
        const query = JSON.stringify(req.query);
        
        return `${tenantId}:${userId}:${path}:${Buffer.from(query).toString('base64')}`;
    }

    /**
     * Cache specific data with custom TTL
     */
    set(key, value, ttl = 600) {
        this.cache.set(key, value, ttl);
        this.metrics.cache.sets++;
    }

    /**
     * Get cached data
     */
    get(key) {
        const value = this.cache.get(key);
        if (value !== undefined) {
            this.metrics.cache.hits++;
        } else {
            this.metrics.cache.misses++;
        }
        return value;
    }

    /**
     * Delete cached data
     */
    delete(key) {
        const deleted = this.cache.del(key);
        if (deleted > 0) {
            this.metrics.cache.deletes++;
        }
        return deleted;
    }

    /**
     * Clear cache by pattern
     */
    clearByPattern(pattern) {
        const keys = this.cache.keys();
        const matchingKeys = keys.filter(key => key.includes(pattern));
        
        if (matchingKeys.length > 0) {
            this.cache.del(matchingKeys);
            this.metrics.cache.deletes += matchingKeys.length;
        }
        
        return matchingKeys.length;
    }

    /**
     * Performance monitoring middleware
     */
    performanceMiddleware() {
        return (req, res, next) => {
            const startTime = performance.now();
            req.startTime = startTime;

            // Track request
            const requestKey = `${req.method} ${req.path}`;
            if (!this.metrics.requests.has(requestKey)) {
                this.metrics.requests.set(requestKey, {
                    count: 0,
                    totalTime: 0,
                    avgTime: 0,
                    minTime: Infinity,
                    maxTime: 0
                });
            }

            res.on('finish', () => {
                const endTime = performance.now();
                const duration = endTime - startTime;

                // Update request metrics
                const metric = this.metrics.requests.get(requestKey);
                metric.count++;
                metric.totalTime += duration;
                metric.avgTime = metric.totalTime / metric.count;
                metric.minTime = Math.min(metric.minTime, duration);
                metric.maxTime = Math.max(metric.maxTime, duration);

                // Add response headers
                res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
                
                // Log slow requests
                if (duration > 1000) { // Slower than 1 second
                    console.warn(`Slow request detected: ${requestKey} took ${duration.toFixed(2)}ms`);
                }
            });

            next();
        };
    }

    /**
     * Database query performance tracking
     */
    trackDatabaseQuery(operation, table, startTime) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        const key = `${operation}:${table}`;
        if (!this.metrics.database.has(key)) {
            this.metrics.database.set(key, {
                count: 0,
                totalTime: 0,
                avgTime: 0,
                minTime: Infinity,
                maxTime: 0
            });
        }

        const metric = this.metrics.database.get(key);
        metric.count++;
        metric.totalTime += duration;
        metric.avgTime = metric.totalTime / metric.count;
        metric.minTime = Math.min(metric.minTime, duration);
        metric.maxTime = Math.max(metric.maxTime, duration);

        // Log slow queries
        if (duration > 500) { // Slower than 500ms
            console.warn(`Slow database query: ${key} took ${duration.toFixed(2)}ms`);
        }

        return duration;
    }

    /**
     * Get performance metrics
     */
    getMetrics() {
        return {
            cache: {
                ...this.metrics.cache,
                hitRate: this.metrics.cache.hits / (this.metrics.cache.hits + this.metrics.cache.misses) || 0,
                size: this.cache.keys().length
            },
            requests: Object.fromEntries(
                Array.from(this.metrics.requests.entries()).map(([key, value]) => [
                    key,
                    {
                        ...value,
                        avgTime: parseFloat(value.avgTime.toFixed(2)),
                        minTime: value.minTime === Infinity ? 0 : parseFloat(value.minTime.toFixed(2)),
                        maxTime: parseFloat(value.maxTime.toFixed(2))
                    }
                ])
            ),
            database: Object.fromEntries(
                Array.from(this.metrics.database.entries()).map(([key, value]) => [
                    key,
                    {
                        ...value,
                        avgTime: parseFloat(value.avgTime.toFixed(2)),
                        minTime: value.minTime === Infinity ? 0 : parseFloat(value.minTime.toFixed(2)),
                        maxTime: parseFloat(value.maxTime.toFixed(2))
                    }
                ])
            ),
            memory: process.memoryUsage(),
            uptime: process.uptime()
        };
    }

    /**
     * Health check with performance data
     */
    getHealthStatus() {
        const metrics = this.getMetrics();
        const memoryUsage = metrics.memory;
        const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: metrics.uptime,
            memory: {
                used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                usage: parseFloat(memoryUsagePercent.toFixed(2))
            },
            cache: {
                hitRate: parseFloat((metrics.cache.hitRate * 100).toFixed(2)),
                size: metrics.cache.size
            },
            performance: {
                avgResponseTime: this.getAverageResponseTime(),
                slowRequests: this.getSlowRequestsCount()
            }
        };
    }

    /**
     * Get average response time across all requests
     */
    getAverageResponseTime() {
        const requests = Array.from(this.metrics.requests.values());
        if (requests.length === 0) return 0;

        const totalTime = requests.reduce((sum, req) => sum + req.totalTime, 0);
        const totalCount = requests.reduce((sum, req) => sum + req.count, 0);
        
        return totalCount > 0 ? parseFloat((totalTime / totalCount).toFixed(2)) : 0;
    }

    /**
     * Get count of slow requests (>1000ms)
     */
    getSlowRequestsCount() {
        return Array.from(this.metrics.requests.values())
            .reduce((count, req) => count + (req.maxTime > 1000 ? 1 : 0), 0);
    }

    /**
     * Reset metrics (useful for testing)
     */
    resetMetrics() {
        this.metrics.requests.clear();
        this.metrics.database.clear();
        this.metrics.cache = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
    }

    /**
     * Cleanup expired cache entries manually
     */
    cleanup() {
        const beforeSize = this.cache.keys().length;
        this.cache.flushAll();
        const afterSize = this.cache.keys().length;
        
        console.log(`Cache cleanup: removed ${beforeSize - afterSize} expired entries`);
    }
}

// Create singleton instance
const performanceOptimizer = new PerformanceOptimizer();

module.exports = performanceOptimizer;
