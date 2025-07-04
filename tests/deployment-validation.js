// Deployment validation script for GAMR Platform
// Comprehensive testing of deployed application functionality

const axios = require('axios');
const { performance } = require('perf_hooks');

class DeploymentValidator {
    constructor(baseUrl, options = {}) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.timeout = options.timeout || 30000; // 30 seconds default
        this.retries = options.retries || 3;
        this.verbose = options.verbose || false;
        
        // Test results storage
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            tests: []
        };

        // Authentication tokens
        this.tokens = {
            superadmin: null,
            admin: null,
            user: null
        };
    }

    /**
     * Log message with timestamp
     */
    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level}]`;
        
        if (level === 'ERROR') {
            console.error(`${prefix} ${message}`);
        } else if (level === 'WARN') {
            console.warn(`${prefix} ${message}`);
        } else if (this.verbose || level === 'RESULT') {
            console.log(`${prefix} ${message}`);
        }
    }

    /**
     * Make HTTP request with retry logic
     */
    async makeRequest(method, endpoint, data = null, headers = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        let lastError;

        for (let attempt = 1; attempt <= this.retries; attempt++) {
            try {
                const startTime = performance.now();
                
                const response = await axios({
                    method,
                    url,
                    data,
                    headers: {
                        'Content-Type': 'application/json',
                        ...headers
                    },
                    timeout: this.timeout,
                    validateStatus: () => true // Don't throw on HTTP errors
                });

                const duration = performance.now() - startTime;
                
                this.log(`${method} ${endpoint} - ${response.status} (${duration.toFixed(2)}ms)`, 'DEBUG');
                
                return {
                    status: response.status,
                    data: response.data,
                    headers: response.headers,
                    duration
                };
            } catch (error) {
                lastError = error;
                this.log(`Attempt ${attempt}/${this.retries} failed: ${error.message}`, 'WARN');
                
                if (attempt < this.retries) {
                    await this.sleep(1000 * attempt); // Exponential backoff
                }
            }
        }

        throw lastError;
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Run a test with error handling
     */
    async runTest(testName, testFunction) {
        this.log(`Running test: ${testName}`);
        const startTime = performance.now();

        try {
            await testFunction();
            const duration = performance.now() - startTime;
            
            this.results.passed++;
            this.results.tests.push({
                name: testName,
                status: 'PASSED',
                duration: duration.toFixed(2),
                error: null
            });
            
            this.log(`✅ ${testName} - PASSED (${duration.toFixed(2)}ms)`, 'RESULT');
        } catch (error) {
            const duration = performance.now() - startTime;
            
            this.results.failed++;
            this.results.tests.push({
                name: testName,
                status: 'FAILED',
                duration: duration.toFixed(2),
                error: error.message
            });
            
            this.log(`❌ ${testName} - FAILED: ${error.message}`, 'RESULT');
        }
    }

    /**
     * Test basic connectivity and health
     */
    async testHealthCheck() {
        const response = await this.makeRequest('GET', '/health');
        
        if (response.status !== 200) {
            throw new Error(`Health check failed with status ${response.status}`);
        }

        if (!response.data || response.data.status !== 'healthy') {
            throw new Error('Health check returned unhealthy status');
        }

        // Validate response time
        if (response.duration > 5000) {
            throw new Error(`Health check too slow: ${response.duration.toFixed(2)}ms`);
        }
    }

    /**
     * Test API endpoints availability
     */
    async testApiEndpoints() {
        const endpoints = [
            { path: '/api/auth/login', method: 'POST', expectedStatus: 400 }, // Bad request without data
            { path: '/api/evaluations', method: 'GET', expectedStatus: 401 }, // Unauthorized
            { path: '/api/fiches', method: 'GET', expectedStatus: 401 }, // Unauthorized
            { path: '/api/actions', method: 'GET', expectedStatus: 401 }, // Unauthorized
        ];

        for (const endpoint of endpoints) {
            const response = await this.makeRequest(endpoint.method, endpoint.path);
            
            if (response.status !== endpoint.expectedStatus) {
                throw new Error(
                    `${endpoint.method} ${endpoint.path} returned ${response.status}, expected ${endpoint.expectedStatus}`
                );
            }
        }
    }

    /**
     * Test user authentication
     */
    async testAuthentication() {
        // Test login with invalid credentials
        const invalidLogin = await this.makeRequest('POST', '/api/auth/login', {
            email: 'invalid@example.com',
            password: 'wrongpassword'
        });

        if (invalidLogin.status !== 401) {
            throw new Error(`Invalid login should return 401, got ${invalidLogin.status}`);
        }

        // Test login without credentials
        const noCredentials = await this.makeRequest('POST', '/api/auth/login', {});
        
        if (noCredentials.status !== 400) {
            throw new Error(`Login without credentials should return 400, got ${noCredentials.status}`);
        }
    }

    /**
     * Test rate limiting
     */
    async testRateLimit() {
        const requests = [];
        const endpoint = '/api/auth/login';
        
        // Make multiple rapid requests to trigger rate limiting
        for (let i = 0; i < 10; i++) {
            requests.push(
                this.makeRequest('POST', endpoint, {
                    email: 'test@example.com',
                    password: 'password'
                })
            );
        }

        const responses = await Promise.all(requests);
        const rateLimitedResponses = responses.filter(r => r.status === 429);

        if (rateLimitedResponses.length === 0) {
            throw new Error('Rate limiting not working - no 429 responses received');
        }

        this.log(`Rate limiting working: ${rateLimitedResponses.length}/10 requests rate limited`);
    }

    /**
     * Test security headers
     */
    async testSecurityHeaders() {
        const response = await this.makeRequest('GET', '/health');
        const headers = response.headers;

        const requiredHeaders = [
            'x-content-type-options',
            'x-frame-options',
            'x-xss-protection',
            'strict-transport-security'
        ];

        const missingHeaders = requiredHeaders.filter(header => !headers[header]);
        
        if (missingHeaders.length > 0) {
            throw new Error(`Missing security headers: ${missingHeaders.join(', ')}`);
        }

        // Check specific header values
        if (headers['x-frame-options'] !== 'DENY') {
            throw new Error(`X-Frame-Options should be DENY, got ${headers['x-frame-options']}`);
        }

        if (headers['x-content-type-options'] !== 'nosniff') {
            throw new Error(`X-Content-Type-Options should be nosniff, got ${headers['x-content-type-options']}`);
        }
    }

    /**
     * Test CORS configuration
     */
    async testCors() {
        // Test preflight request
        const preflightResponse = await this.makeRequest('OPTIONS', '/api/auth/login', null, {
            'Origin': 'https://example.com',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        });

        // Should reject unauthorized origins
        if (preflightResponse.status === 200 && preflightResponse.headers['access-control-allow-origin']) {
            const allowedOrigin = preflightResponse.headers['access-control-allow-origin'];
            if (allowedOrigin === '*' || allowedOrigin === 'https://example.com') {
                throw new Error('CORS is too permissive - allowing unauthorized origins');
            }
        }
    }

    /**
     * Test database connectivity
     */
    async testDatabaseConnectivity() {
        // This test assumes there's a health endpoint that checks database
        const response = await this.makeRequest('GET', '/health');
        
        if (!response.data.database || response.data.database.status !== 'connected') {
            throw new Error('Database connectivity check failed');
        }
    }

    /**
     * Test performance benchmarks
     */
    async testPerformance() {
        const endpoints = [
            '/health',
            '/api/auth/login' // POST with invalid data
        ];

        for (const endpoint of endpoints) {
            const method = endpoint === '/health' ? 'GET' : 'POST';
            const data = method === 'POST' ? { email: 'test', password: 'test' } : null;
            
            const response = await this.makeRequest(method, endpoint, data);
            
            // Check response time
            if (response.duration > 2000) { // 2 seconds threshold
                throw new Error(`${method} ${endpoint} too slow: ${response.duration.toFixed(2)}ms`);
            }
        }
    }

    /**
     * Test error handling
     */
    async testErrorHandling() {
        // Test 404 handling
        const notFoundResponse = await this.makeRequest('GET', '/api/nonexistent');
        if (notFoundResponse.status !== 404) {
            throw new Error(`404 handling failed, got status ${notFoundResponse.status}`);
        }

        // Test malformed JSON
        try {
            await axios.post(`${this.baseUrl}/api/auth/login`, 'invalid json', {
                headers: { 'Content-Type': 'application/json' },
                timeout: this.timeout,
                validateStatus: () => true
            });
        } catch (error) {
            // This is expected for malformed JSON
        }
    }

    /**
     * Run all validation tests
     */
    async runAllTests() {
        this.log('🚀 Starting deployment validation tests', 'RESULT');
        this.log(`Target URL: ${this.baseUrl}`, 'RESULT');

        const tests = [
            ['Health Check', () => this.testHealthCheck()],
            ['API Endpoints', () => this.testApiEndpoints()],
            ['Authentication', () => this.testAuthentication()],
            ['Rate Limiting', () => this.testRateLimit()],
            ['Security Headers', () => this.testSecurityHeaders()],
            ['CORS Configuration', () => this.testCors()],
            ['Database Connectivity', () => this.testDatabaseConnectivity()],
            ['Performance', () => this.testPerformance()],
            ['Error Handling', () => this.testErrorHandling()]
        ];

        const startTime = performance.now();

        for (const [testName, testFunction] of tests) {
            await this.runTest(testName, testFunction);
        }

        const totalTime = performance.now() - startTime;

        // Print summary
        this.log('', 'RESULT');
        this.log('📊 Test Results Summary:', 'RESULT');
        this.log(`✅ Passed: ${this.results.passed}`, 'RESULT');
        this.log(`❌ Failed: ${this.results.failed}`, 'RESULT');
        this.log(`⏱️  Total Time: ${totalTime.toFixed(2)}ms`, 'RESULT');
        this.log('', 'RESULT');

        if (this.results.failed > 0) {
            this.log('❌ Deployment validation FAILED', 'RESULT');
            this.log('Failed tests:', 'RESULT');
            
            this.results.tests
                .filter(test => test.status === 'FAILED')
                .forEach(test => {
                    this.log(`  - ${test.name}: ${test.error}`, 'RESULT');
                });
            
            process.exit(1);
        } else {
            this.log('✅ Deployment validation PASSED', 'RESULT');
            this.log('🎉 All tests completed successfully!', 'RESULT');
        }

        return this.results;
    }
}

// CLI usage
if (require.main === module) {
    const baseUrl = process.argv[2] || 'http://localhost:3002';
    const verbose = process.argv.includes('--verbose');
    
    const validator = new DeploymentValidator(baseUrl, { verbose });
    
    validator.runAllTests().catch(error => {
        console.error('Validation failed:', error.message);
        process.exit(1);
    });
}

module.exports = DeploymentValidator;
