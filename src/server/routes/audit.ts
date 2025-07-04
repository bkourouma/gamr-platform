import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware, requireRole } from '../middleware/auth'
import { validatePagination } from '../middleware/validation'

const router = Router()

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware)

// GET /api/audit - Récupérer les logs d'audit (admin seulement)
router.get('/', requireRole(['ADMIN', 'SUPER_ADMIN']), validatePagination, async (req, res) => {
  try {
    const { tenantId, role } = req.user!
    const { 
      page = 1, 
      limit = 50, 
      action, 
      entity, 
      entityId,
      userId,
      startDate,
      endDate
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)
    
    // Construction des filtres
    const where: any = {}

    // Les super admins peuvent voir tous les logs, les admins seulement ceux de leur tenant
    if (role !== 'SUPER_ADMIN') {
      where.user = { tenantId }
    }

    if (action) {
      where.action = action
    }

    if (entity) {
      where.entity = entity
    }

    if (entityId) {
      where.entityId = entityId
    }

    if (userId) {
      where.userId = userId
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string)
      }
    }

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              tenant: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.auditLog.count({ where })
    ])

    res.json({
      data: auditLogs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des logs d\'audit:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des logs d\'audit' })
  }
})

// GET /api/audit/stats - Statistiques des logs d'audit
router.get('/stats', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { tenantId, role } = req.user!
    const { period = '7d' } = req.query

    // Calculer la date de début selon la période
    const now = new Date()
    let startDate: Date
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    const where: any = {
      createdAt: { gte: startDate }
    }

    // Les super admins peuvent voir tous les logs, les admins seulement ceux de leur tenant
    if (role !== 'SUPER_ADMIN') {
      where.user = { tenantId }
    }

    const [
      totalLogs,
      logsByAction,
      logsByEntity,
      logsByUser,
      recentActivity
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: { _count: { action: 'desc' } }
      }),
      prisma.auditLog.groupBy({
        by: ['entity'],
        where,
        _count: true,
        orderBy: { _count: { entity: 'desc' } }
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: {
          ...where,
          userId: { not: null }
        },
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ])

    // Enrichir les statistiques par utilisateur avec les noms
    const enrichedUserStats = await Promise.all(
      logsByUser.map(async (stat) => {
        if (stat.userId) {
          const user = await prisma.user.findUnique({
            where: { id: stat.userId },
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          })
          return {
            userId: stat.userId,
            count: stat._count,
            user
          }
        }
        return {
          userId: stat.userId,
          count: stat._count,
          user: null
        }
      })
    )

    res.json({
      totalLogs,
      period,
      logsByAction: logsByAction.map(item => ({
        action: item.action,
        count: item._count
      })),
      logsByEntity: logsByEntity.map(item => ({
        entity: item.entity,
        count: item._count
      })),
      logsByUser: enrichedUserStats,
      recentActivity
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' })
  }
})

// GET /api/audit/entity/:entityType/:entityId - Logs pour une entité spécifique
router.get('/entity/:entityType/:entityId', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { entityType, entityId } = req.params
    const { tenantId, role } = req.user!

    const where: any = {
      entity: entityType,
      entityId
    }

    // Les super admins peuvent voir tous les logs, les admins seulement ceux de leur tenant
    if (role !== 'SUPER_ADMIN') {
      where.user = { tenantId }
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(auditLogs)
  } catch (error) {
    console.error('Erreur lors de la récupération des logs de l\'entité:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des logs de l\'entité' })
  }
})

// POST /api/audit - Créer un log d'audit (usage interne)
router.post('/', async (req, res) => {
  try {
    const { userId } = req.user!
    const { 
      action, 
      entity, 
      entityId, 
      oldValues, 
      newValues,
      ipAddress,
      userAgent
    } = req.body

    // Validation des champs requis
    if (!action || !entity || !entityId) {
      return res.status(400).json({ 
        error: 'Les champs action, entity et entityId sont requis' 
      })
    }

    const auditLog = await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        oldValues,
        newValues,
        userId,
        ipAddress: ipAddress || req.ip,
        userAgent: userAgent || req.get('User-Agent')
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    })

    res.status(201).json(auditLog)
  } catch (error) {
    console.error('Erreur lors de la création du log d\'audit:', error)
    res.status(500).json({ error: 'Erreur lors de la création du log d\'audit' })
  }
})

// DELETE /api/audit/cleanup - Nettoyer les anciens logs (super admin seulement)
router.delete('/cleanup', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { olderThanDays = 90 } = req.query

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - Number(olderThanDays))

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    })

    res.json({
      message: `${result.count} logs d'audit supprimés`,
      deletedCount: result.count,
      cutoffDate
    })
  } catch (error) {
    console.error('Erreur lors du nettoyage des logs:', error)
    res.status(500).json({ error: 'Erreur lors du nettoyage des logs' })
  }
})

export { router as auditRouter }


