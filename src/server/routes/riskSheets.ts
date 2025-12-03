import express from 'express'
import { prisma } from '../lib/prisma'
import { calculateRiskScore, getPriorityFromScore } from '../../lib/utils'
import { authMiddleware } from '../middleware/auth'
import { validateRiskSheet } from '../middleware/validation'
import { SecurityIndexService } from '../services/securityIndexService'

const router = express.Router()

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware)

// GET /api/risk-sheets - Récupérer toutes les fiches de risque
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.user
    const { page = 1, limit = 10, search, category, priority } = req.query

    const skip = (Number(page) - 1) * Number(limit)
    
    // Construction des filtres
    const where: any = {
      tenantId,
      isArchived: false
    }

    if (search) {
      where.OR = [
        { target: { contains: search as string, mode: 'insensitive' } },
        { scenario: { contains: search as string, mode: 'insensitive' } },
        { category: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    if (category) {
      where.category = category
    }

    if (priority) {
      where.priority = priority
    }

    const [riskSheets, total] = await Promise.all([
      prisma.riskSheet.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.riskSheet.count({ where })
    ])

    res.json({
      data: riskSheets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des fiches:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des fiches de risque' })
  }
})

// GET /api/risk-sheets/:id - Récupérer une fiche de risque spécifique
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId } = req.user

    const riskSheet = await prisma.riskSheet.findFirst({
      where: {
        id,
        tenantId,
        isArchived: false
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        actions: {
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    if (!riskSheet) {
      return res.status(404).json({ error: 'Fiche de risque non trouvée' })
    }

    res.json(riskSheet)
  } catch (error) {
    console.error('Erreur lors de la récupération de la fiche:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération de la fiche de risque' })
  }
})

// POST /api/risk-sheets - Créer une nouvelle fiche de risque
router.post('/', validateRiskSheet, async (req, res) => {
  try {
    const { tenantId, id: authorId } = req.user
    const { target, scenario, probability, vulnerability, impact, category, aiSuggestions } = req.body

    // Calcul automatique du score et de la priorité
    const riskScore = calculateRiskScore(probability, vulnerability, impact)
    const priority = getPriorityFromScore(riskScore)

    const riskSheet = await prisma.riskSheet.create({
      data: {
        target,
        scenario,
        probability,
        vulnerability,
        impact,
        riskScore,
        priority,
        category,
        aiSuggestions: aiSuggestions || null, // Sauvegarder les recommandations IA
        tenantId,
        authorId,
        reviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // +90 jours
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    res.status(201).json(riskSheet)
  } catch (error) {
    console.error('Erreur lors de la création de la fiche:', error)
    res.status(500).json({ error: 'Erreur lors de la création de la fiche de risque' })
  }
})

// PUT /api/risk-sheets/:id - Mettre à jour une fiche de risque
router.put('/:id', validateRiskSheet, async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId } = req.user
    const { target, scenario, probability, vulnerability, impact, category, aiSuggestions } = req.body

    // Vérifier que la fiche existe et appartient au tenant
    const existingRiskSheet = await prisma.riskSheet.findFirst({
      where: {
        id,
        tenantId,
        isArchived: false
      }
    })

    if (!existingRiskSheet) {
      return res.status(404).json({ error: 'Fiche de risque non trouvée' })
    }

    // Calcul automatique du score et de la priorité
    const riskScore = calculateRiskScore(probability, vulnerability, impact)
    const priority = getPriorityFromScore(riskScore)

    const updatedRiskSheet = await prisma.riskSheet.update({
      where: { id },
      data: {
        target,
        scenario,
        probability,
        vulnerability,
        impact,
        riskScore,
        priority,
        category,
        aiSuggestions: aiSuggestions !== undefined ? aiSuggestions : existingRiskSheet.aiSuggestions, // Préserver les recommandations IA existantes si non fournies
        version: existingRiskSheet.version + 1
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    res.json(updatedRiskSheet)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la fiche:', error)
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la fiche de risque' })
  }
})

// DELETE /api/risk-sheets/:id - Supprimer une fiche de risque (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { tenantId } = req.user

    // Vérifier que la fiche existe et appartient au tenant
    const existingRiskSheet = await prisma.riskSheet.findFirst({
      where: {
        id,
        tenantId,
        isArchived: false
      }
    })

    if (!existingRiskSheet) {
      return res.status(404).json({ error: 'Fiche de risque non trouvée' })
    }

    // Soft delete
    await prisma.riskSheet.update({
      where: { id },
      data: { isArchived: true }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Erreur lors de la suppression de la fiche:', error)
    res.status(500).json({ error: 'Erreur lors de la suppression de la fiche de risque' })
  }
})

// GET /api/risk-sheets/stats/dashboard - Statistiques pour le dashboard
router.get('/stats/dashboard', async (req, res) => {
  try {
    const { tenantId } = req.user

    const [
      totalRisks,
      criticalRisks,
      highRisks,
      recentRisks,
      risksByCategory,
      averageAggregation,
      securityIndexComponents
    ] = await Promise.all([
      prisma.riskSheet.count({
        where: { tenantId, isArchived: false }
      }),
      prisma.riskSheet.count({
        where: { tenantId, isArchived: false, priority: 'CRITICAL' }
      }),
      prisma.riskSheet.count({
        where: { tenantId, isArchived: false, priority: 'HIGH' }
      }),
      prisma.riskSheet.count({
        where: {
          tenantId,
          isArchived: false,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
          }
        }
      }),
      prisma.riskSheet.groupBy({
        by: ['category'],
        where: { tenantId, isArchived: false },
        _count: true
      }),
      prisma.riskSheet.aggregate({
        where: { tenantId, isArchived: false },
        _avg: { riskScore: true }
      }),
      SecurityIndexService.calculateSecurityIndex(tenantId)
    ])

    // Calculer l'indice de sécurité selon la méthodologie GAMRDIGITALE (échelle 1-60)
    // Si pas assez de données pour le calcul complexe, utiliser l'ancien calcul comme fallback
    const averageRiskScoreValue = Math.round(((averageAggregation._avg.riskScore || 0)) * 10) / 10
    // Le averageRiskScore est déjà sur l'échelle GAMRDIGITALE (1-60) selon la formule P × V × I
    const oldGamrIndex = Math.max(1, Math.min(60, averageRiskScoreValue))
    
    // Utiliser le nouveau calcul seulement si on a des évaluations ou des risques critiques
    // Sinon, utiliser l'ancien calcul (moyenne des riskScore, déjà sur échelle GAMRDIGITALE 1-60)
    const hasEnoughData = securityIndexComponents.evaluationScore > 1 || criticalRisks > 0
    const finalSecurityIndex = hasEnoughData 
      ? securityIndexComponents.globalSecurityIndex
      : oldGamrIndex

    res.json({
      totalRisks,
      criticalRisks,
      highRisks,
      recentRisks,
      risksByCategory: risksByCategory.map(item => ({
        category: item.category,
        count: item._count
      })),
      averageRiskScore: averageRiskScoreValue,
      // Indice Global de Sécurité calculé selon l'algorithme complexe (ou ancien calcul si données insuffisantes)
      averageSecurityIndex: Math.round(finalSecurityIndex * 100) / 100,
      securityIndexDetails: {
        evaluationScore: securityIndexComponents.evaluationScore,
        correctiveActionCoverage: securityIndexComponents.correctiveActionCoverage,
        criticalRisksResolutionRate: securityIndexComponents.criticalRisksResolutionRate,
        securityObjectivesCompliance: securityIndexComponents.securityObjectivesCompliance
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' })
  }
})

export { router as riskSheetsRouter }
