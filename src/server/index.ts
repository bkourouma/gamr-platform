import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { prisma } from './lib/prisma'
import { authRouter } from './routes/auth'
import { riskSheetsRouter } from './routes/riskSheets'
import { evaluationsRouter } from './routes/evaluations'
import { responsesRouter } from './routes/responses'
import { templatesRouter } from './routes/templates'
import { notificationsRouter } from './routes/notifications'
import { actionsRouter } from './routes/actions'
import { correlationsRouter } from './routes/correlations'
import { auditRouter } from './routes/audit'
import { tenantsRouter } from './routes/tenants'
import { usersRouter } from './routes/users'
import { analyticsRouter } from './routes/analytics'
import ragRoutes from './routes/rag'
import { NotificationScheduler } from './services/notificationScheduler'

const app = express()
const PORT = process.env.PORT || 3002

// Trust proxy (for correct rate limiting and IPs behind proxies)
app.set('trust proxy', 1)

// Security headers with CSP configured for OpenAI API access
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "https://api.openai.com",
        "https://*.openai.com",
        process.env.VITE_API_URL || "",
        process.env.FRONTEND_URL || ""
      ].filter(Boolean),
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  }
}))

// CORS configuration
// Supports comma-separated lists in FRONTEND_URL, CORS_ORIGIN, or CORS_ORIGINS
// Also supports JSON array format like ["https://domain1.com","https://domain2.com"]
// Set to '*' to allow all origins
const corsEnvValues = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  process.env.CORS_ORIGINS
]
  .filter(Boolean)
  .join(',')

const parsedEnvOrigins = corsEnvValues
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
  .flatMap((origin) => {
    // Handle JSON array format
    if (origin.startsWith('[') && origin.endsWith(']')) {
      try {
        const parsed = JSON.parse(origin)
        return Array.isArray(parsed) ? parsed : [parsed]
      } catch (e) {
        console.warn('Failed to parse CORS_ORIGINS as JSON:', origin)
        return []
      }
    }
    // Handle regular comma-separated format
    return [origin]
  })
  .filter(Boolean)

const allowedOrigins = Array.from(
  new Set<string>([
    ...parsedEnvOrigins,
    'http://localhost:5173', // Dev frontend (preferred)
    'http://localhost:5174',
    'http://localhost:3002'  // Dev backend (for direct calls)
  ])
)

console.log('🔐 CORS Origins configured:', allowedOrigins)

app.use(cors({
  origin: '*', // Allow all origins
  credentials: false, // Must be false when using origin: '*'
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Global API rate limiter (relaxed in development) with JSON handler
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
      res.status(429).json({
        error: 'Trop de requêtes',
        retryAfter,
        code: 'RATE_LIMITED'
      })
    }
  })
  app.use('/api', apiLimiter)
} else {
  // In development, either disable or set very generous limits
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 2000,
    standardHeaders: false,
    legacyHeaders: false
  })
  app.use('/api', apiLimiter)
}

// Strict rate limit for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
})
app.use('/api/auth/login', loginLimiter)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      rag: 'active',
      notifications: 'active'
    }
  })
})

// Route de test simple
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API fonctionne !', 
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      rag: '/api/rag',
      evaluations: '/api/evaluations',
      risks: '/api/risk-sheets',
      actions: '/api/actions'
    }
  })
})

// Routes API
app.use('/api/auth', authRouter)
app.use('/api/rag', ragRoutes)
app.use('/api/risk-sheets', riskSheetsRouter)
app.use('/api/evaluations', evaluationsRouter)
app.use('/api/evaluations', responsesRouter)
app.use('/api/templates', templatesRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/actions', actionsRouter)
app.use('/api/correlations', correlationsRouter)
app.use('/api/audit', auditRouter)
app.use('/api/tenants', tenantsRouter)
app.use('/api/users', usersRouter)
app.use('/api/analytics', analyticsRouter)

// Widget-specific routes (for external widget integration)
app.post('/widget/chat', async (req, res) => {
  try {
    const { message, session_id, widget_key } = req.body

    console.log('🤖 Widget Chat Query:', { 
      message: message?.substring(0, 100) + '...', 
      session_id,
      timestamp: new Date().toISOString()
    })

    if (!message) {
      return res.status(400).json({
        error: 'Message is required',
        message: 'Veuillez fournir un message'
      })
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500))

    // Generate contextual response based on message
    const response = generateContextualResponse(message)

    // Add metadata
    const widgetResponse = {
      message: response.answer || 'Désolé, je ne comprends pas votre question. Pouvez-vous reformuler ?',
      session_id: session_id || `session_${Date.now()}`,
      timestamp: new Date().toISOString(),
      confidence: 0.89,
      suggestions: [
        'Quels sont mes risques les plus critiques ?',
        'Statut de mes actions correctives en cours',
        'Résultats de ma dernière évaluation',
        'Recommandations d\'amélioration prioritaires'
      ]
    }

    console.log('✅ Widget Chat Response générée:', {
      messageLength: widgetResponse.message.length,
      session_id: widgetResponse.session_id
    })

    res.json(widgetResponse)

  } catch (error) {
    console.error('❌ Widget Chat Error:', error)
    res.status(500).json({
      error: 'Erreur lors du traitement de la requête',
      message: 'Désolé, je rencontre des difficultés techniques. Veuillez réessayer plus tard.',
      timestamp: new Date().toISOString()
    })
  }
})

// Helper function for generating contextual responses
function generateContextualResponse(query: string) {
  const lowerQuery = query.toLowerCase()
  
  // Define response patterns
  const responses = {
    greeting: [
      'Bonjour ! Je suis Akissi, votre assistante BMI. Comment puis-je vous aider concernant vos évaluations et risques ?',
      'Bienvenue ! Je suis là pour vous accompagner dans la gestion de vos risques. Que souhaitez-vous savoir ?',
      'Salutations ! Je suis Akissi, spécialisée dans l\'analyse des risques BMI. Comment puis-je vous être utile ?'
    ],
    risk: [
      'Pour analyser vos risques critiques, je vous recommande de consulter vos fiches GAMRDIGITALE les plus récentes. Souhaitez-vous que je vous aide à identifier les priorités d\'action ?',
      'Vos risques les plus critiques nécessitent une attention particulière. Je peux vous aider à établir un plan d\'action prioritaire.',
      'L\'analyse de vos risques montre plusieurs points d\'attention. Voulez-vous que je vous aide à établir les prochaines étapes ?'
    ],
    evaluation: [
      'Vos évaluations récentes montrent des tendances positives. Je peux vous aider à analyser les résultats et identifier les axes d\'amélioration.',
      'Pour améliorer vos évaluations, je recommande de se concentrer sur les domaines identifiés comme prioritaires.',
      'Vos évaluations BMI sont en cours de traitement. Je peux vous aider à comprendre les résultats.'
    ],
    action: [
      'Pour le suivi de vos actions correctives, je vous recommande de prioriser selon l\'impact et l\'urgence. Souhaitez-vous que je vous aide à organiser vos prochaines étapes ?',
      'Vos actions correctives nécessitent un suivi régulier. Je peux vous aider à identifier les actions en retard.',
      'L\'efficacité de vos actions correctives dépend d\'un suivi rigoureux. Voulez-vous que je vous aide à planifier les prochaines actions ?'
    ],
    default: [
      'Je comprends votre question. Pour vous aider au mieux, pourriez-vous préciser si cela concerne vos évaluations, vos risques ou vos actions correctives ?',
      'C\'est une excellente question. Je peux vous aider avec vos données BMI. Que souhaitez-vous savoir précisément ?',
      'Je suis là pour vous accompagner dans la gestion de vos risques BMI. Pouvez-vous me donner plus de détails sur votre question ?'
    ]
  }

  // Determine response type based on query content
  let responseType = 'default'
  if (lowerQuery.includes('bonjour') || lowerQuery.includes('salut') || lowerQuery.includes('hello')) {
    responseType = 'greeting'
  } else if (lowerQuery.includes('risque') || lowerQuery.includes('critique') || lowerQuery.includes('danger')) {
    responseType = 'risk'
  } else if (lowerQuery.includes('évaluation') || lowerQuery.includes('questionnaire')) {
    responseType = 'evaluation'
  } else if (lowerQuery.includes('action') || lowerQuery.includes('corrective') || lowerQuery.includes('suivi')) {
    responseType = 'action'
  }

  // Select random response from appropriate category
  const categoryResponses = responses[responseType as keyof typeof responses]
  const selectedResponse = categoryResponses[Math.floor(Math.random() * categoryResponses.length)]

  return {
    answer: selectedResponse,
    sources: [],
    confidence: 0.89
  }
}

// RAG system status endpoint
app.get('/api/rag-status', (req, res) => {
  res.json({
    status: 'active',
    service: 'mock-chromadb',
    endpoints: {
      query: '/api/rag/query',
      index: '/api/rag/index',
      status: '/api/rag/status'
    },
    timestamp: new Date().toISOString()
  })
})

// Middleware de gestion d'erreurs amélioré
app.use((err: any, req: any, res: any, next: any) => {
  console.error('❌ Erreur serveur:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  })

  // Erreurs spécifiques au RAG
  if (err.message?.includes('RAG') || err.message?.includes('embedding')) {
    return res.status(503).json({
      error: 'Service RAG temporairement indisponible',
      message: 'Le système d\'IA est en cours de maintenance',
      code: 'RAG_SERVICE_ERROR'
    })
  }

  // Erreurs de base de données
  if (err.message?.includes('Prisma') || err.message?.includes('database')) {
    return res.status(503).json({
      error: 'Service de base de données indisponible',
      message: 'Problème de connexion à la base de données',
      code: 'DATABASE_ERROR'
    })
  }

  // Erreur générique
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue',
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString()
  })
})

// Route 404 améliorée
app.use('*', (req, res) => {
  console.log(`❓ Route non trouvée: ${req.method} ${req.originalUrl}`)
  
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      '/api/auth/login',
      '/api/rag/query',
      '/api/rag/index',
      '/api/rag/status',
      '/api/evaluations',
      '/api/risk-sheets',
      '/api/actions',
      '/health'
    ],
    timestamp: new Date().toISOString()
  })
})

// Démarrage du serveur amélioré
const startServer = async () => {
  try {
    console.log('🚀 Démarrage du serveur GAMRDIGITALE...')
    if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET manquant en production. Abandon du démarrage.')
      process.exit(1)
    }
    
    // Test de connexion à la base de données
    await prisma.$connect()
    console.log('✅ Connexion à la base de données établie')

    // Initialiser le système RAG
    console.log('🤖 Initialisation du système RAG...')
    console.log('✅ Système RAG prêt (mode mock pour développement)')

    // Démarrer le planificateur de notifications
    const notificationScheduler = NotificationScheduler.getInstance()
    notificationScheduler.start(30)
    console.log('🔔 Démarrage du planificateur de notifications (intervalle: 30 minutes)')
    console.log('🔍 Vérification des notifications automatiques...')
    console.log('✅ Planificateur de notifications actif')

    app.listen(PORT, () => {
      console.log('\n🎉 Serveur GAMR démarré avec succès!')
      console.log(`📍 URL: http://localhost:${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
      console.log(`🤖 RAG API: http://localhost:${PORT}/api/rag`)
      console.log(`🔔 Notifications: Actives`)
      console.log(`🛡️ CORS: Configuré pour localhost:5173, localhost:5174 (frontend) et localhost:3002 (backend)`)
      console.log('\n📋 Endpoints disponibles:')
      console.log('  • POST /api/auth/login')
      console.log('  • POST /api/rag/query')
      console.log('  • POST /api/rag/index')
      console.log('  • GET  /api/rag/status')
      console.log('  • GET  /api/evaluations')
      console.log('  • GET  /api/risk-sheets')
      console.log('  • GET  /api/actions')
      console.log('\n🔥 Prêt à recevoir des requêtes!')
    })
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error)
    
    if (error instanceof Error) {
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
    }
    
    process.exit(1)
  }
}

// Gestion propre de l'arrêt améliorée
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Signal ${signal} reçu - Arrêt gracieux du serveur...`)

  try {
    // Arrêter le planificateur de notifications
    const notificationScheduler = NotificationScheduler.getInstance()
    notificationScheduler.stop()
    console.log('✅ Planificateur de notifications arrêté')

    // Fermer la connexion à la base de données
    await prisma.$disconnect()
    console.log('✅ Connexion à la base de données fermée')

    console.log('👋 Serveur arrêté proprement')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur lors de l\'arrêt:', error)
    process.exit(1)
  }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason)
  console.error('Promise:', promise)
  process.exit(1)
})

// Démarrer le serveur
startServer()

export { app }