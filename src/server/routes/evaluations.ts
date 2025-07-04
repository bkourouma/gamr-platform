import express from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware, requireEvaluatorRole } from '../middleware/auth'
import { validatePagination } from '../middleware/validation'

const router = express.Router()

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware)

// GET /api/evaluations - Récupérer toutes les évaluations
router.get('/', validatePagination, async (req: any, res: any) => {
  try {
    const { tenantId } = req.user
    const { page = 1, limit = 10, status, search } = req.query

    const skip = (Number(page) - 1) * Number(limit)
    
    // Construction des filtres
    const where: any = {
      tenantId
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { template: { name: { contains: search as string, mode: 'insensitive' } } }
      ]
    }

    const [evaluations, total] = await Promise.all([
      prisma.evaluation.findMany({
        where,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          evaluator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: {
              responses: true,
              attachments: true,
              generatedRisks: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.evaluation.count({ where })
    ])

    res.json({
      data: evaluations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des évaluations:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des évaluations' })
  }
})

// GET /api/evaluations/:id - Récupérer une évaluation spécifique
router.get('/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { tenantId } = req.user

    const evaluation = await prisma.evaluation.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        template: {
          include: {
            questionGroups: {
              include: {
                objectives: {
                  include: {
                    questions: {
                      orderBy: { orderIndex: 'asc' }
                    }
                  },
                  orderBy: { orderIndex: 'asc' }
                }
              },
              orderBy: { orderIndex: 'asc' }
            }
          }
        },
        evaluator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        responses: {
          include: {
            question: true
          }
        },
        attachments: true,
        generatedRisks: {
          select: {
            id: true,
            target: true,
            scenario: true,
            riskScore: true,
            priority: true,
            createdAt: true
          }
        }
      }
    })

    if (!evaluation) {
      return res.status(404).json({ error: 'Évaluation non trouvée' })
    }

    res.json(evaluation)
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'évaluation:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'évaluation' })
  }
})

// POST /api/evaluations - Créer une nouvelle évaluation
router.post('/', requireEvaluatorRole, async (req: any, res: any) => {
  try {
    const { tenantId, id: evaluatorId } = req.user
    const { title, templateId, entityInfo } = req.body

    // Validation des champs obligatoires
    if (!title || !templateId) {
      return res.status(400).json({ 
        error: 'Le titre et le template sont obligatoires' 
      })
    }

    // Vérifier que le template existe et appartient au tenant
    const template = await prisma.evaluationTemplate.findFirst({
      where: {
        id: templateId,
        tenantId,
        isActive: true
      }
    })

    if (!template) {
      return res.status(404).json({ error: 'Template d\'évaluation non trouvé' })
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        title,
        templateId,
        tenantId,
        evaluatorId,
        entityInfo,
        status: 'DRAFT',
        startedAt: new Date()
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        evaluator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    res.status(201).json(evaluation)
  } catch (error) {
    console.error('Erreur lors de la création de l\'évaluation:', error)
    res.status(500).json({ error: 'Erreur lors de la création de l\'évaluation' })
  }
})

// PUT /api/evaluations/:id - Mettre à jour une évaluation
router.put('/:id', requireEvaluatorRole, async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { tenantId } = req.user
    const { title, status, entityInfo } = req.body

    // Vérifier que l'évaluation existe et appartient au tenant
    const existingEvaluation = await prisma.evaluation.findFirst({
      where: {
        id,
        tenantId
      }
    })

    if (!existingEvaluation) {
      return res.status(404).json({ error: 'Évaluation non trouvée' })
    }

    // Préparer les données à mettre à jour
    const updateData: any = {}

    if (title) updateData.title = title
    if (entityInfo) updateData.entityInfo = entityInfo
    if (status) {
      updateData.status = status
      if (status === 'COMPLETED' && !existingEvaluation.completedAt) {
        updateData.completedAt = new Date()
      }
    }

    const updatedEvaluation = await prisma.evaluation.update({
      where: { id },
      data: updateData,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        evaluator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    res.json(updatedEvaluation)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'évaluation:', error)
    res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'évaluation' })
  }
})

// DELETE /api/evaluations/:id - Supprimer une évaluation
router.delete('/:id', requireEvaluatorRole, async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { tenantId } = req.user

    console.log(`🗑️ Tentative de suppression de l'évaluation ${id} pour le tenant ${tenantId}`)

    // Vérifier que l'évaluation existe et appartient au tenant
    const existingEvaluation = await prisma.evaluation.findFirst({
      where: {
        id,
        tenantId
      }
    })

    console.log(`📋 Évaluation trouvée:`, existingEvaluation ? 'OUI' : 'NON')

    if (!existingEvaluation) {
      // Vérifier si l'évaluation existe mais pour un autre tenant
      const evaluationOtherTenant = await prisma.evaluation.findUnique({
        where: { id },
        select: { id: true, tenantId: true, title: true }
      })

      if (evaluationOtherTenant) {
        console.log(`⚠️ Évaluation existe mais pour un autre tenant: ${evaluationOtherTenant.tenantId}`)
      } else {
        console.log(`❌ Évaluation ${id} n'existe pas du tout`)
      }

      return res.status(404).json({ error: 'Évaluation non trouvée' })
    }

    console.log(`✅ Suppression de l'évaluation ${existingEvaluation.title}`)

    // Supprimer l'évaluation (cascade supprimera les réponses et attachments)
    await prisma.evaluation.delete({
      where: { id }
    })

    console.log(`🎉 Évaluation ${id} supprimée avec succès`)
    res.status(204).send()
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'évaluation:', error)
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'évaluation' })
  }
})

export { router as evaluationsRouter }


