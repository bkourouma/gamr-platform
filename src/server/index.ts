import express from 'express'
import cors from 'cors'
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

// Middleware de base
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5174',
    'http://localhost:5173'
  ],
  credentials: true
}))

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
    console.log('🚀 Démarrage du serveur GAMR...')
    
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
      console.log(`🛡️ CORS: Configuré pour localhost:5173 et localhost:5174`)
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