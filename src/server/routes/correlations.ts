import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware, requireRole } from '../middleware/auth'
import { validatePagination } from '../middleware/validation'

const router = Router()

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware)

// GET /api/correlations - Récupérer les corrélations de risques
router.get('/', validatePagination, async (req, res) => {
  try {
    const { tenantId } = req.user!
    const { 
      page = 1, 
      limit = 20, 
      correlationType, 
      minCoefficient,
      sourceRiskId,
      targetRiskId,
      isActive = 'true'
    } = req.query

    const skip = (Number(page) - 1) * Number(limit)
    
    // Construction des filtres
    const where: any = {
      sourceRisk: { tenantId },
      targetRisk: { tenantId }
    }

    if (correlationType) {
      where.correlationType = correlationType
    }

    if (minCoefficient) {
      where.coefficient = { gte: Number(minCoefficient) }
    }

    if (sourceRiskId) {
      where.sourceRiskId = sourceRiskId
    }

    if (targetRiskId) {
      where.targetRiskId = targetRiskId
    }

    if (isActive !== 'all') {
      where.isActive = isActive === 'true'
    }

    const [correlations, total] = await Promise.all([
      prisma.riskCorrelation.findMany({
        where,
        include: {
          sourceRisk: {
            select: {
              id: true,
              target: true,
              scenario: true,
              priority: true,
              riskScore: true,
              category: true
            }
          },
          targetRisk: {
            select: {
              id: true,
              target: true,
              scenario: true,
              priority: true,
              riskScore: true,
              category: true
            }
          }
        },
        orderBy: [
          { coefficient: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: Number(limit)
      }),
      prisma.riskCorrelation.count({ where })
    ])

    res.json({
      data: correlations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des corrélations:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des corrélations' })
  }
})

// GET /api/correlations/stats - Statistiques des corrélations
router.get('/stats', async (req, res) => {
  try {
    const { tenantId } = req.user!

    const [
      totalCorrelations,
      strongCorrelations,
      correlationsByType,
      averageCoefficient,
      topCorrelatedRisks
    ] = await Promise.all([
      prisma.riskCorrelation.count({
        where: {
          sourceRisk: { tenantId },
          isActive: true
        }
      }),
      prisma.riskCorrelation.count({
        where: {
          sourceRisk: { tenantId },
          isActive: true,
          coefficient: { gte: 0.7 }
        }
      }),
      prisma.riskCorrelation.groupBy({
        by: ['correlationType'],
        where: {
          sourceRisk: { tenantId },
          isActive: true
        },
        _count: true
      }),
      prisma.riskCorrelation.aggregate({
        where: {
          sourceRisk: { tenantId },
          isActive: true
        },
        _avg: {
          coefficient: true
        }
      }),
      prisma.riskCorrelation.findMany({
        where: {
          sourceRisk: { tenantId },
          isActive: true
        },
        include: {
          sourceRisk: {
            select: {
              id: true,
              target: true,
              priority: true
            }
          },
          targetRisk: {
            select: {
              id: true,
              target: true,
              priority: true
            }
          }
        },
        orderBy: { coefficient: 'desc' },
        take: 10
      })
    ])

    res.json({
      totalCorrelations,
      strongCorrelations,
      correlationsByType: correlationsByType.map(item => ({
        type: item.correlationType,
        count: item._count
      })),
      averageCoefficient: averageCoefficient._avg.coefficient || 0,
      topCorrelatedRisks
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' })
  }
})

// GET /api/correlations/network/:riskId - Réseau de corrélations pour un risque
router.get('/network/:riskId', async (req, res) => {
  try {
    const { riskId } = req.params
    const { tenantId } = req.user!
    const { depth = 2, minCoefficient = 0.3 } = req.query

    // Vérifier que le risque appartient au tenant
    const risk = await prisma.riskSheet.findFirst({
      where: { id: riskId, tenantId }
    })

    if (!risk) {
      return res.status(404).json({ error: 'Risque non trouvé' })
    }

    // Récupérer les corrélations directes
    const directCorrelations = await prisma.riskCorrelation.findMany({
      where: {
        OR: [
          { sourceRiskId: riskId },
          { targetRiskId: riskId }
        ],
        isActive: true,
        coefficient: { gte: Number(minCoefficient) }
      },
      include: {
        sourceRisk: {
          select: {
            id: true,
            target: true,
            scenario: true,
            priority: true,
            riskScore: true,
            category: true
          }
        },
        targetRisk: {
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

    // Construire le réseau de corrélations
    const nodes = new Map()
    const edges = []

    // Ajouter le nœud central
    nodes.set(risk.id, {
      id: risk.id,
      target: risk.target,
      scenario: risk.scenario,
      priority: risk.priority,
      riskScore: risk.riskScore,
      category: risk.category,
      level: 0
    })

    // Ajouter les corrélations directes
    directCorrelations.forEach(correlation => {
      const sourceNode = correlation.sourceRisk
      const targetNode = correlation.targetRisk

      if (!nodes.has(sourceNode.id)) {
        nodes.set(sourceNode.id, { ...sourceNode, level: 1 })
      }
      if (!nodes.has(targetNode.id)) {
        nodes.set(targetNode.id, { ...targetNode, level: 1 })
      }

      edges.push({
        id: correlation.id,
        source: sourceNode.id,
        target: targetNode.id,
        coefficient: correlation.coefficient,
        type: correlation.correlationType
      })
    })

    res.json({
      nodes: Array.from(nodes.values()),
      edges,
      centerNode: risk.id
    })
  } catch (error) {
    console.error('Erreur lors de la récupération du réseau:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération du réseau' })
  }
})

// POST /api/correlations - Créer une nouvelle corrélation
router.post('/', requireRole(['ADMIN', 'AI_ANALYST']), async (req, res) => {
  try {
    const { tenantId } = req.user!
    const { 
      sourceRiskId, 
      targetRiskId, 
      coefficient, 
      correlationType 
    } = req.body

    // Validation des champs requis
    if (!sourceRiskId || !targetRiskId || coefficient === undefined || !correlationType) {
      return res.status(400).json({ 
        error: 'Les champs sourceRiskId, targetRiskId, coefficient et correlationType sont requis' 
      })
    }

    // Validation du coefficient (-1 à 1)
    if (coefficient < -1 || coefficient > 1) {
      return res.status(400).json({ 
        error: 'Le coefficient doit être entre -1 et 1' 
      })
    }

    // Vérifier que les risques existent et appartiennent au tenant
    const [sourceRisk, targetRisk] = await Promise.all([
      prisma.riskSheet.findFirst({
        where: { id: sourceRiskId, tenantId }
      }),
      prisma.riskSheet.findFirst({
        where: { id: targetRiskId, tenantId }
      })
    ])

    if (!sourceRisk || !targetRisk) {
      return res.status(404).json({ error: 'Un ou plusieurs risques non trouvés' })
    }

    // Vérifier qu'une corrélation n'existe pas déjà
    const existingCorrelation = await prisma.riskCorrelation.findFirst({
      where: {
        OR: [
          { sourceRiskId, targetRiskId },
          { sourceRiskId: targetRiskId, targetRiskId: sourceRiskId }
        ]
      }
    })

    if (existingCorrelation) {
      return res.status(409).json({ error: 'Une corrélation existe déjà entre ces risques' })
    }

    const correlation = await prisma.riskCorrelation.create({
      data: {
        sourceRiskId,
        targetRiskId,
        coefficient,
        correlationType
      },
      include: {
        sourceRisk: {
          select: {
            id: true,
            target: true,
            scenario: true,
            priority: true,
            riskScore: true
          }
        },
        targetRisk: {
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

    res.status(201).json(correlation)
  } catch (error) {
    console.error('Erreur lors de la création de la corrélation:', error)
    res.status(500).json({ error: 'Erreur lors de la création de la corrélation' })
  }
})

// PUT /api/correlations/:id - Mettre à jour une corrélation
router.put('/:id', requireRole(['ADMIN', 'AI_ANALYST']), async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId } = req.user!
    const { coefficient, correlationType, isActive } = req.body

    // Vérifier que la corrélation existe et appartient au tenant
    const existingCorrelation = await prisma.riskCorrelation.findFirst({
      where: {
        id,
        sourceRisk: { tenantId }
      }
    })

    if (!existingCorrelation) {
      return res.status(404).json({ error: 'Corrélation non trouvée' })
    }

    // Validation du coefficient si fourni
    if (coefficient !== undefined && (coefficient < -1 || coefficient > 1)) {
      return res.status(400).json({ 
        error: 'Le coefficient doit être entre -1 et 1' 
      })
    }

    const updateData: any = {}
    if (coefficient !== undefined) updateData.coefficient = coefficient
    if (correlationType !== undefined) updateData.correlationType = correlationType
    if (isActive !== undefined) updateData.isActive = isActive

    const correlation = await prisma.riskCorrelation.update({
      where: { id },
      data: updateData,
      include: {
        sourceRisk: {
          select: {
            id: true,
            target: true,
            scenario: true,
            priority: true,
            riskScore: true
          }
        },
        targetRisk: {
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

    res.json(correlation)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la corrélation:', error)
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la corrélation' })
  }
})

// DELETE /api/correlations/:id - Supprimer une corrélation
router.delete('/:id', requireRole(['ADMIN', 'AI_ANALYST']), async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId } = req.user!

    // Vérifier que la corrélation existe et appartient au tenant
    const correlation = await prisma.riskCorrelation.findFirst({
      where: {
        id,
        sourceRisk: { tenantId }
      }
    })

    if (!correlation) {
      return res.status(404).json({ error: 'Corrélation non trouvée' })
    }

    await prisma.riskCorrelation.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Erreur lors de la suppression de la corrélation:', error)
    res.status(500).json({ error: 'Erreur lors de la suppression de la corrélation' })
  }
})

export { router as correlationsRouter }


