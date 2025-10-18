import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'
import { prisma } from './lib/prisma'
import { authRouter } from './routes/auth'
import { riskSheetsRouter } from './routes/riskSheets'
import { evaluationsRouter } from './routes/evaluations'
import { responsesRouter } from './routes/responses'
import { templatesRouter } from './routes/templates'
import { actionsRouter } from './routes/actions'
import { correlationsRouter } from './routes/correlations'
import { auditRouter } from './routes/audit'
import { tenantsRouter } from './routes/tenants'
import { notificationsRouter } from './routes/notifications'
import ragRoutes from './routes/rag'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3002

// Trust proxy
app.set('trust proxy', 1)

// Security headers
app.use(helmet())

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001'
].filter(Boolean) as string[]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('CORS: Origin not allowed'))
  },
  credentials: true
}))

// Rate limiting (relaxed in development) with JSON handler
if (process.env.NODE_ENV === 'production') {
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '') || 15 * 60 * 1000
  const max = parseInt(process.env.RATE_LIMIT_MAX || '') || 300
  const apiLimiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      const retryAfter = Math.ceil(windowMs / 1000)
      res.set('Retry-After', String(retryAfter))
      res.status(429).json({ error: 'Trop de requêtes', retryAfter, code: 'RATE_LIMITED' })
    }
  })
  app.use('/api', apiLimiter)
} else {
  const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 2000, standardHeaders: false, legacyHeaders: false })
  app.use('/api', apiLimiter)
}

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, skipSuccessfulRequests: true })
app.use('/api/auth/login', loginLimiter)

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Serve static files from the React app build directory
const distPath = path.join(__dirname, '../../dist')
app.use(express.static(distPath))

// API info endpoint (moved to /api/info)
app.get('/api/info', (req, res) => {
  res.status(200).json({
    name: 'GAMR Platform API',
    version: '1.0.0',
    description: 'Intelligent Risk Management Platform',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      api: {
        auth: '/api/auth',
        riskSheets: '/api/risk-sheets',
        evaluations: '/api/evaluations',
        responses: '/api/responses',
        templates: '/api/templates',
        actions: '/api/actions',
        correlations: '/api/correlations',
        audit: '/api/audit',
        tenants: '/api/tenants',
        notifications: '/api/notifications',
        rag: '/api/rag'
      }
    }
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Debug middleware to log all API requests
app.use('/api', (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  console.log('Headers:', req.headers.authorization ? 'Bearer token present' : 'No auth header')
  next()
})

// API Routes
app.use('/api/auth', authRouter)
app.use('/api/risk-sheets', riskSheetsRouter)
app.use('/api/evaluations', evaluationsRouter)
app.use('/api/evaluations', responsesRouter)
app.use('/api/templates', templatesRouter)
app.use('/api/actions', actionsRouter)
app.use('/api/correlations', correlationsRouter)
app.use('/api/audit', auditRouter)
app.use('/api/tenants', tenantsRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/rag', ragRoutes)

// Catch-all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err)
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details || []
    })
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token'
    })
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  })
})

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`)
  
  try {
    await prisma.$disconnect()
    console.log('Database connection closed.')
    process.exit(0)
  } catch (error) {
    console.error('Error during shutdown:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health`)
})

export { app }
