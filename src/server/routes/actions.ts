import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware, requireRole } from '../middleware/auth'
import { validatePagination } from '../middleware/validation'

const router = Router()

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware)

// GET /api/actions - Récupérer les actions correctives
router.get('/', validatePagination, async (req, res) => {
  try {
    const { tenantId } = req.user!
    const { 
      page = 1, 
      limit = 20, 
      search, 
      status, 
      priority, 
      assigneeId, 
      riskSheetId,
      overdue 
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)
    
    // Construction des filtres
    const where: any = { tenantId }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (assigneeId) {
      where.assigneeId = assigneeId
    }

    if (riskSheetId) {
      where.riskSheetId = riskSheetId
    }

    if (overdue === 'true') {
      where.dueDate = { lt: new Date() }
      where.status = { in: ['TODO', 'IN_PROGRESS'] }
    }

    const [actions, total] = await Promise.all([
      prisma.action.findMany({
        where,
        include: {
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          riskSheet: {
            select: {
              id: true,
              target: true,
              scenario: true,
              priority: true,
              riskScore: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: Number(limit)
      }),
      prisma.action.count({ where })
    ])

    res.json({
      data: actions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des actions:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des actions' })
  }
})

// GET /api/actions/stats - Statistiques des actions
router.get('/stats', async (req, res) => {
  try {
    const { tenantId } = req.user!

    const [
      totalActions,
      todoActions,
      inProgressActions,
      completedActions,
      overdueActions,
      actionsByPriority,
      actionsByStatus
    ] = await Promise.all([
      prisma.action.count({
        where: { tenantId }
      }),
      prisma.action.count({
        where: { tenantId, status: 'TODO' }
      }),
      prisma.action.count({
        where: { tenantId, status: 'IN_PROGRESS' }
      }),
      prisma.action.count({
        where: { tenantId, status: 'COMPLETED' }
      }),
      prisma.action.count({
        where: {
          tenantId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: { lt: new Date() }
        }
      }),
      prisma.action.groupBy({
        by: ['priority'],
        where: { tenantId },
        _count: true
      }),
      prisma.action.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true
      })
    ])

    res.json({
      totalActions,
      todoActions,
      inProgressActions,
      completedActions,
      overdueActions,
      actionsByPriority: actionsByPriority.map(item => ({
        priority: item.priority,
        count: item._count
      })),
      actionsByStatus: actionsByStatus.map(item => ({
        status: item.status,
        count: item._count
      }))
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' })
  }
})

// GET /api/actions/:id - Récupérer une action spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId } = req.user!

    const action = await prisma.action.findFirst({
      where: { id, tenantId },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        riskSheet: {
          select: {
            id: true,
            target: true,
            scenario: true,
            priority: true,
            riskScore: true,
            category: true
          }
        }
      }
    })

    if (!action) {
      return res.status(404).json({ error: 'Action non trouvée' })
    }

    res.json(action)
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'action:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'action' })
  }
})

// POST /api/actions - Créer une nouvelle action
router.post('/', requireRole(['ADMIN', 'AI_ANALYST', 'EVALUATOR']), async (req, res) => {
  try {
    const { tenantId } = req.user!
    const { 
      title, 
      description, 
      dueDate, 
      priority = 'MEDIUM', 
      assigneeId, 
      riskSheetId,
      successProbability,
      estimatedCost,
      estimatedDuration
    } = req.body

    // Validation des champs requis
    if (!title || !description || !riskSheetId) {
      return res.status(400).json({ 
        error: 'Les champs title, description et riskSheetId sont requis' 
      })
    }

    // Vérifier que la fiche de risque existe et appartient au tenant
    const riskSheet = await prisma.riskSheet.findFirst({
      where: { id: riskSheetId, tenantId }
    })

    if (!riskSheet) {
      return res.status(404).json({ error: 'Fiche de risque non trouvée' })
    }

    // Vérifier que l'assigné existe et appartient au tenant (si spécifié)
    if (assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: { id: assigneeId, tenantId }
      })

      if (!assignee) {
        return res.status(404).json({ error: 'Utilisateur assigné non trouvé' })
      }
    }

    const action = await prisma.action.create({
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        assigneeId,
        riskSheetId,
        tenantId,
        successProbability,
        estimatedCost,
        estimatedDuration
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        riskSheet: {
          select: {
            id: true,
            target: true,
            scenario: true,
            priority: true,
            riskScore: true
          }
        }
      }
    })

    res.status(201).json(action)
  } catch (error) {
    console.error('Erreur lors de la création de l\'action:', error)
    res.status(500).json({ error: 'Erreur lors de la création de l\'action' })
  }
})

// PUT /api/actions/:id - Mettre à jour une action
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId, role, id: userId } = req.user!
    const {
      title,
      description,
      dueDate,
      status,
      priority,
      assigneeId,
      successProbability,
      estimatedCost,
      estimatedDuration
    } = req.body

    // Vérifier que l'action existe et appartient au tenant
    const existingAction = await prisma.action.findFirst({
      where: { id, tenantId }
    })

    if (!existingAction) {
      return res.status(404).json({ error: 'Action non trouvée' })
    }

    // Vérifier les permissions
    const canUpdate =
      // L'assigné peut toujours mettre à jour
      existingAction.assigneeId === userId ||
      // Les admins et analystes peuvent mettre à jour
      ['ADMIN', 'AI_ANALYST', 'EVALUATOR'].includes(role)

    if (!canUpdate) {
      return res.status(403).json({
        error: 'Permissions insuffisantes pour modifier cette action',
        details: 'Seuls l\'assigné ou les administrateurs peuvent modifier cette action'
      })
    }

    // Vérifier que l'assigné existe et appartient au tenant (si spécifié)
    if (assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: { id: assigneeId, tenantId }
      })

      if (!assignee) {
        return res.status(404).json({ error: 'Utilisateur assigné non trouvé' })
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (status !== undefined) {
      updateData.status = status
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date()
      }
    }
    if (priority !== undefined) updateData.priority = priority
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId
    if (successProbability !== undefined) updateData.successProbability = successProbability
    if (estimatedCost !== undefined) updateData.estimatedCost = estimatedCost
    if (estimatedDuration !== undefined) updateData.estimatedDuration = estimatedDuration

    const action = await prisma.action.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        riskSheet: {
          select: {
            id: true,
            target: true,
            scenario: true,
            priority: true,
            riskScore: true
          }
        }
      }
    })

    res.json(action)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'action:', error)
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'action' })
  }
})

// DELETE /api/actions/:id - Supprimer une action
router.delete('/:id', requireRole(['ADMIN', 'AI_ANALYST']), async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId } = req.user!

    // Vérifier que l'action existe et appartient au tenant
    const action = await prisma.action.findFirst({
      where: { id, tenantId }
    })

    if (!action) {
      return res.status(404).json({ error: 'Action non trouvée' })
    }

    await prisma.action.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'action:', error)
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'action' })
  }
})

export { router as actionsRouter }


