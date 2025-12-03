// Load testing script for GAMRDIGITALE Platform
// Tests application performance under various load conditions

const axios = require('axios');
const { performance } = require('perf_hooks');

class LoadTester {
    constructor(baseUrl, options = {}) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.concurrency = options.concurrency || 10;
        this.duration = options.duration || 60000; // 1 minute
        this.rampUp = options.rampUp || 10000; // 10 seconds
        this.timeout = options.timeout || 30000;
        
        this.stats = {
            requests: 0,
            responses: 0,
            errors: 0,
            timeouts: 0,
            responseTimes: [],
            errorTypes: new Map(),
            statusCodes: new Map()
        };

        this.isRunning = false;
        this.workers = [];
    }

    /**
     * Log with timestamp
     */
    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${level}] ${message}`);
    }

    /**
     * Make HTTP request
     */
    async makeRequest(endpoint, method = 'GET', data = null) {
        const startTime = performance.now();
        
        try {
            this.stats.requests++;
            
            const response = await axios({
                method,
                url: `${this.baseUrl}${endpoint}`,
                data,
                timeout: this.timeout,
                validateStatus: () => true // Don't throw on HTTP errors
            });

            const responseTime = performance.now() - startTime;
            this.stats.responses++;
            this.stats.responseTimes.push(responseTime);
            
            // Track status codes
            const statusCode = response.status;
            this.stats.statusCodes.set(statusCode, (this.stats.statusCodes.get(statusCode) || 0) + 1);
            
            return { success: true, responseTime, statusCode };
        } catch (error) {
            const responseTime = performance.now() - startTime;
            this.stats.errors++;
            
            // Track error types
            const errorType = error.code || error.message || 'Unknown';
            this.stats.errorTypes.set(errorType, (this.stats.errorTypes.get(errorType) || 0) + 1);
            
            if (error.code === 'ECONNABORTED') {
                this.stats.timeouts++;
            }
            
            return { success: false, responseTime, error: errorType };
        }
    }

    /**
     * Worker function that continuously makes requests
     */
    async worker(workerId) {
        this.log(`Worker ${workerId} started`);
        
        while (this.isRunning) {
            // Mix of different endpoints to simulate real usage
            const endpoints = [
                { path: '/health', method: 'GET', weight: 30 },
                { path: '/api/auth/login', method: 'POST', data: { email: 'test@example.com', password: 'test' }, weight: 10 },
                { path: '/api/evaluations', method: 'GET', weight: 20 },
                { path: '/api/fiches', method: 'GET', weight: 20 },
                { path: '/api/actions', method: 'GET', weight: 15 },
                { path: '/api/models', method: 'GET', weight: 5 }
            ];
            
            // Weighted random selection
            const totalWeight = endpoints.reduce((sum, ep) => sum + ep.weight, 0);
            let random = Math.random() * totalWeight;
            let selectedEndpoint = endpoints[0];
            
            for (const endpoint of endpoints) {
                random -= endpoint.weight;
                if (random <= 0) {
                    selectedEndpoint = endpoint;
                    break;
                }
            }
            
            await this.makeRequest(selectedEndpoint.path, selectedEndpoint.method, selectedEndpoint.data);
            
            // Small delay to prevent overwhelming the server
            await this.sleep(Math.random() * 100 + 50); // 50-150ms
        }
        
        this.log(`Worker ${workerId} stopped`);
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Calculate statistics
     */
    calculateStats() {
        if (this.stats.responseTimes.length === 0) {
            return {
                requests: this.stats.requests,
                responses: this.stats.responses,
                errors: this.stats.errors,
                errorRate: 0,
                avgResponseTime: 0,
                minResponseTime: 0,
                maxResponseTime: 0,
                p50: 0,
                p95: 0,
                p99: 0
            };
        }

        const sortedTimes = [...this.stats.responseTimes].sort((a, b) => a - b);
        const total = sortedTimes.length;
        
        return {
            requests: this.stats.requests,
            responses: this.stats.responses,
            errors: this.stats.errors,
            timeouts: this.stats.timeouts,
            errorRate: ((this.stats.errors / this.stats.requests) * 100).toFixed(2),
            avgResponseTime: (sortedTimes.reduce((sum, time) => sum + time, 0) / total).toFixed(2),
            minResponseTime: sortedTimes[0].toFixed(2),
            maxResponseTime: sortedTimes[total - 1].toFixed(2),
            p50: sortedTimes[Math.floor(total * 0.5)].toFixed(2),
            p95: sortedTimes[Math.floor(total * 0.95)].toFixed(2),
            p99: sortedTimes[Math.floor(total * 0.99)].toFixed(2),
            statusCodes: Object.fromEntries(this.stats.statusCodes),
            errorTypes: Object.fromEntries(this.stats.errorTypes)
        };
    }

    /**
     * Print real-time statistics
     */
    printStats() {
        const stats = this.calculateStats();
        
        console.clear();
        console.log('🔥 GAMRDIGITALE Platform Load Test - Real-time Statistics');
        console.log('='.repeat(60));
        console.log(`📊 Requests: ${stats.requests} | Responses: ${stats.responses} | Errors: ${stats.errors}`);
        console.log(`📈 Error Rate: ${stats.errorRate}% | Timeouts: ${stats.timeouts}`);
        console.log(`⏱️  Avg Response: ${stats.avgResponseTime}ms | Min: ${stats.minResponseTime}ms | Max: ${stats.maxResponseTime}ms`);
        console.log(`📊 P50: ${stats.p50}ms | P95: ${stats.p95}ms | P99: ${stats.p99}ms`);
        
        if (Object.keys(stats.statusCodes).length > 0) {
            console.log('📋 Status Codes:');
            Object.entries(stats.statusCodes).forEach(([code, count]) => {
                console.log(`   ${code}: ${count}`);
            });
        }
        
        if (Object.keys(stats.errorTypes).length > 0) {
            console.log('❌ Error Types:');
            Object.entries(stats.errorTypes).forEach(([type, count]) => {
                console.log(`   ${type}: ${count}`);
            });
        }
        
        console.log('='.repeat(60));
        console.log('Press Ctrl+C to stop the test');
    }

    /**
     * Run load test
     */
    async runLoadTest() {
        this.log(`🚀 Starting load test against ${this.baseUrl}`);
        this.log(`⚙️  Configuration: ${this.concurrency} concurrent users, ${this.duration/1000}s duration, ${this.rampUp/1000}s ramp-up`);
        
        // Test connectivity first
        try {
            await this.makeRequest('/health');
            this.log('✅ Connectivity test passed');
        } catch (error) {
            this.log(`❌ Connectivity test failed: ${error.message}`, 'ERROR');
            return;
        }

        this.isRunning = true;
        
        // Start workers with ramp-up
        const rampUpDelay = this.rampUp / this.concurrency;
        
        for (let i = 0; i < this.concurrency; i++) {
            setTimeout(() => {
                if (this.isRunning) {
                    const worker = this.worker(i + 1);
                    this.workers.push(worker);
                }
            }, i * rampUpDelay);
        }

        // Print statistics every 5 seconds
        const statsInterval = setInterval(() => {
            if (this.isRunning) {
                this.printStats();
            }
        }, 5000);

        // Stop test after duration
        setTimeout(() => {
            this.isRunning = false;
            clearInterval(statsInterval);
            this.printFinalResults();
        }, this.duration + this.rampUp);

        // Handle Ctrl+C
        process.on('SIGINT', () => {
            this.log('🛑 Stopping load test...');
            this.isRunning = false;
            clearInterval(statsInterval);
            this.printFinalResults();
            process.exit(0);
        });

        // Wait for all workers to complete
        await Promise.all(this.workers);
    }

    /**
     * Print final test results
     */
    printFinalResults() {
        const stats = this.calculateStats();
        const rps = (stats.responses / ((this.duration + this.rampUp) / 1000)).toFixed(2);
        
        console.clear();
        console.log('🏁 GAMRDIGITALE Platform Load Test - Final Results');
        console.log('='.repeat(60));
        console.log(`🎯 Target: ${this.baseUrl}`);
        console.log(`⚙️  Config: ${this.concurrency} users, ${this.duration/1000}s duration`);
        console.log('');
        console.log('📊 Request Statistics:');
        console.log(`   Total Requests: ${stats.requests}`);
        console.log(`   Successful Responses: ${stats.responses}`);
        console.log(`   Errors: ${stats.errors}`);
        console.log(`   Timeouts: ${stats.timeouts}`);
        console.log(`   Error Rate: ${stats.errorRate}%`);
        console.log(`   Requests/sec: ${rps}`);
        console.log('');
        console.log('⏱️  Response Time Statistics:');
        console.log(`   Average: ${stats.avgResponseTime}ms`);
        console.log(`   Minimum: ${stats.minResponseTime}ms`);
        console.log(`   Maximum: ${stats.maxResponseTime}ms`);
        console.log(`   50th Percentile: ${stats.p50}ms`);
        console.log(`   95th Percentile: ${stats.p95}ms`);
        console.log(`   99th Percentile: ${stats.p99}ms`);
        
        if (Object.keys(stats.statusCodes).length > 0) {
            console.log('');
            console.log('📋 HTTP Status Codes:');
            Object.entries(stats.statusCodes)
                .sort(([a], [b]) => a.localeCompare(b))
                .forEach(([code, count]) => {
                    const percentage = ((count / stats.responses) * 100).toFixed(1);
                    console.log(`   ${code}: ${count} (${percentage}%)`);
                });
        }
        
        if (Object.keys(stats.errorTypes).length > 0) {
            console.log('');
            console.log('❌ Error Types:');
            Object.entries(stats.errorTypes)
                .sort(([, a], [, b]) => b - a)
                .forEach(([type, count]) => {
                    const percentage = ((count / stats.errors) * 100).toFixed(1);
                    console.log(`   ${type}: ${count} (${percentage}%)`);
                });
        }
        
        console.log('');
        console.log('🎯 Performance Assessment:');
        
        // Performance assessment
        const avgTime = parseFloat(stats.avgResponseTime);
        const errorRate = parseFloat(stats.errorRate);
        const p95Time = parseFloat(stats.p95);
        
        if (errorRate > 5) {
            console.log('   ❌ High error rate detected (>5%)');
        } else if (errorRate > 1) {
            console.log('   ⚠️  Moderate error rate (>1%)');
        } else {
            console.log('   ✅ Low error rate (<1%)');
        }
        
        if (avgTime > 2000) {
            console.log('   ❌ High average response time (>2s)');
        } else if (avgTime > 1000) {
            console.log('   ⚠️  Moderate average response time (>1s)');
        } else {
            console.log('   ✅ Good average response time (<1s)');
        }
        
        if (p95Time > 5000) {
            console.log('   ❌ High 95th percentile response time (>5s)');
        } else if (p95Time > 2000) {
            console.log('   ⚠️  Moderate 95th percentile response time (>2s)');
        } else {
            console.log('   ✅ Good 95th percentile response time (<2s)');
        }
        
        console.log('='.repeat(60));
        
        // Return results for programmatic use
        return stats;
    }
}

// CLI usage
if (require.main === module) {
    const baseUrl = process.argv[2] || 'http://localhost:3002';
    const concurrency = parseInt(process.argv[3]) || 10;
    const duration = parseInt(process.argv[4]) * 1000 || 60000; // Convert to ms
    
    const loadTester = new LoadTester(baseUrl, { concurrency, duration });
    
    loadTester.runLoadTest().catch(error => {
        console.error('Load test failed:', error.message);
        process.exit(1);
    });
}

module.exports = LoadTester;
