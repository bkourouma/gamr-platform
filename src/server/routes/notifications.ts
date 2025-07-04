import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware, requireRole } from '../middleware/auth'
import { NotificationService } from '../services/notificationService'

const router = Router()

// Add this middleware function
const validatePagination = (req: any, res: any, next: any) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  
  // Ensure reasonable limits
  req.query.page = Math.max(1, page)
  req.query.limit = Math.min(100, Math.max(1, limit))
  
  next()
}

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware)

// GET /api/notifications - Récupérer les notifications de l'utilisateur
router.get('/', validatePagination, async (req, res) => {
  try {
    const { userId, tenantId } = req.user!
    const { page = 1, limit = 20, unreadOnly, type } = req.query

    const skip = (Number(page) - 1) * Number(limit)
    
    // Construction des filtres
    const where: any = {
      OR: [
        { userId }, // Notifications personnelles
        { tenantId, userId: null } // Notifications globales du tenant
      ]
    }

    if (unreadOnly === 'true') {
      where.isRead = false
    }

    if (type) {
      where.type = type
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.notification.count({ where })
    ])

    res.json({
      data: notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des notifications' })
  }
})

// GET /api/notifications/unread-count - Compter les notifications non lues
router.get('/unread-count', async (req, res) => {
  try {
    const { userId, tenantId } = req.user!

    const count = await prisma.notification.count({
      where: {
        OR: [
          { userId }, // Notifications personnelles
          { tenantId, userId: null } // Notifications globales du tenant
        ],
        isRead: false
      }
    })

    res.json({ count })
  } catch (error) {
    console.error('Erreur lors du comptage des notifications:', error)
    res.status(500).json({ error: 'Erreur lors du comptage des notifications' })
  }
})

// POST /api/notifications - Créer une nouvelle notification (admin/système)
router.post('/', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { tenantId } = req.user!
    const { title, message, type, userId: targetUserId } = req.body

    // Validation des champs requis
    if (!title || !message || !type) {
      return res.status(400).json({ 
        error: 'Les champs title, message et type sont requis' 
      })
    }

    // Validation du type
    const validTypes = ['RISK_CRITICAL', 'ACTION_OVERDUE', 'REVIEW_DUE', 'AI_ALERT', 'CORRELATION_ALERT', 'SYSTEM']
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Type de notification invalide' 
      })
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        userId: targetUserId || null,
        tenantId
      }
    })

    res.status(201).json(notification)
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error)
    res.status(500).json({ error: 'Erreur lors de la création de la notification' })
  }
})

// PUT /api/notifications/:id/read - Marquer une notification comme lue
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params
    const { userId, tenantId } = req.user!

    // Vérifier que la notification appartient à l'utilisateur ou au tenant
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { tenantId, userId: null }
        ]
      }
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' })
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    res.json(updatedNotification)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la notification:', error)
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la notification' })
  }
})

// PUT /api/notifications/mark-all-read - Marquer toutes les notifications comme lues
router.put('/mark-all-read', async (req, res) => {
  try {
    const { userId, tenantId } = req.user!

    const result = await prisma.notification.updateMany({
      where: {
        OR: [
          { userId },
          { tenantId, userId: null }
        ],
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    res.json({ updated: result.count })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des notifications:', error)
    res.status(500).json({ error: 'Erreur lors de la mise à jour des notifications' })
  }
})

// DELETE /api/notifications/:id - Supprimer une notification (admin seulement)
router.delete('/:id', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId } = req.user!

    // Vérifier que la notification appartient au tenant
    const notification = await prisma.notification.findFirst({
      where: { id, tenantId }
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notification non trouvée' })
    }

    await prisma.notification.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Erreur lors de la suppression de la notification:', error)
    res.status(500).json({ error: 'Erreur lors de la suppression de la notification' })
  }
})

export { router as notificationsRouter }


