import express from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware, requireAdminRole } from '../middleware/auth'
import { validatePagination } from '../middleware/validation'

const router = express.Router()

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware)

// GET /api/templates - Récupérer tous les templates d'évaluation
router.get('/', validatePagination, async (req: any, res: any) => {
  try {
    const { tenantId } = req.user
    const { page = 1, limit = 10, search, isActive } = req.query

    const skip = (Number(page) - 1) * Number(limit)
    
    // Construction des filtres
    const where: any = {
      tenantId
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    if (typeof isActive === 'string') {
      where.isActive = isActive === 'true'
    }

    const [templates, total] = await Promise.all([
      prisma.evaluationTemplate.findMany({
        where,
        include: {
          _count: {
            select: {
              evaluations: true,
              questionGroups: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.evaluationTemplate.count({ where })
    ])

    res.json({
      data: templates,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des templates:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des templates' })
  }
})

// GET /api/templates/:id - Récupérer un template spécifique avec toutes ses questions
router.get('/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { tenantId } = req.user

    const template = await prisma.evaluationTemplate.findFirst({
      where: {
        id,
        tenantId
      },
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
        },
        _count: {
          select: {
            evaluations: true
          }
        }
      }
    })

    if (!template) {
      return res.status(404).json({ error: 'Template non trouvé' })
    }

    res.json(template)
  } catch (error) {
    console.error('Erreur lors de la récupération du template:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération du template' })
  }
})

// POST /api/templates - Créer un nouveau template (admin seulement)
router.post('/', requireAdminRole, async (req: any, res: any) => {
  try {
    const { tenantId } = req.user
    const { name, description, version, questionGroups } = req.body

    // Validation des champs obligatoires
    if (!name) {
      return res.status(400).json({ 
        error: 'Le nom du template est obligatoire' 
      })
    }

    const template = await prisma.evaluationTemplate.create({
      data: {
        name,
        description,
        version: version || '1.0',
        tenantId,
        questionGroups: questionGroups ? {
          create: questionGroups.map((group: any, groupIndex: number) => ({
            name: group.name,
            description: group.description,
            orderIndex: groupIndex,
            objectives: {
              create: group.objectives?.map((objective: any, objIndex: number) => ({
                objectiveNumber: objective.objectiveNumber,
                title: objective.title,
                description: objective.description,
                category: objective.category,
                orderIndex: objIndex,
                questions: {
                  create: objective.questions?.map((question: any, qIndex: number) => ({
                    text: question.text,
                    type: question.type,
                    isRequired: question.isRequired || false,
                    orderIndex: qIndex,
                    options: question.options,
                    conditionalLogic: question.conditionalLogic
                  })) || []
                }
              })) || []
            }
          }))
        } : undefined
      },
      include: {
        questionGroups: {
          include: {
            objectives: {
              include: {
                questions: true
              }
            }
          }
        }
      }
    })

    res.status(201).json(template)
  } catch (error) {
    console.error('Erreur lors de la création du template:', error)
    res.status(500).json({ error: 'Erreur lors de la création du template' })
  }
})

// PUT /api/templates/:id - Mettre à jour un template (admin seulement)
router.put('/:id', requireAdminRole, async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { tenantId } = req.user
    const { name, description, version, isActive } = req.body

    // Vérifier que le template existe et appartient au tenant
    const existingTemplate = await prisma.evaluationTemplate.findFirst({
      where: {
        id,
        tenantId
      }
    })

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Template non trouvé' })
    }

    // Préparer les données à mettre à jour
    const updateData: any = {}

    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (version) updateData.version = version
    if (typeof isActive === 'boolean') updateData.isActive = isActive

    const updatedTemplate = await prisma.evaluationTemplate.update({
      where: { id },
      data: updateData,
      include: {
        questionGroups: {
          include: {
            objectives: {
              include: {
                questions: true
              }
            }
          }
        }
      }
    })

    res.json(updatedTemplate)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du template:', error)
    res.status(500).json({ error: 'Erreur lors de la mise à jour du template' })
  }
})

// PUT /api/templates/:id/questionGroups - Mettre à jour les groupes de questions d'un template
router.put('/:id/questionGroups', requireAdminRole, async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { tenantId } = req.user
    const { questionGroups } = req.body

    // Vérifier que le template existe et appartient au tenant
    const existingTemplate = await prisma.evaluationTemplate.findFirst({
      where: {
        id,
        tenantId
      }
    })

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Template non trouvé' })
    }

    // Supprimer tous les groupes de questions existants
    await prisma.questionGroup.deleteMany({
      where: {
        templateId: id
      }
    })

    // Créer les nouveaux groupes de questions
    if (questionGroups && questionGroups.length > 0) {
      for (const [groupIndex, group] of questionGroups.entries()) {
        const createdGroup = await prisma.questionGroup.create({
          data: {
            title: group.title,
            description: group.description,
            orderIndex: groupIndex,
            templateId: id,
            icon: group.icon,
            color: group.color
          }
        })

        // Créer les objectifs pour ce groupe
        if (group.objectives && group.objectives.length > 0) {
          for (const [objIndex, objective] of group.objectives.entries()) {
            const createdObjective = await prisma.objective.create({
              data: {
                title: objective.title,
                description: objective.description,
                orderIndex: objIndex,
                weight: objective.weight || 1.0,
                groupId: createdGroup.id
              }
            })

            // Créer les questions pour cet objectif
            if (objective.questions && objective.questions.length > 0) {
              for (const [qIndex, question] of objective.questions.entries()) {
                await prisma.question.create({
                  data: {
                    text: question.text,
                    type: question.type,
                    orderIndex: qIndex,
                    isRequired: question.isRequired || false,
                    helpText: question.helpText,
                    placeholder: question.placeholder,
                    weight: question.weight || 1.0,
                    options: question.options,
                    dependsOn: question.dependsOn,
                    objectiveId: createdObjective.id
                  }
                })
              }
            }
          }
        }
      }
    }

    // Récupérer le template mis à jour avec toutes ses relations
    const updatedTemplate = await prisma.evaluationTemplate.findFirst({
      where: { id },
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
    })

    res.json(updatedTemplate)
  } catch (error) {
    console.error('Erreur lors de la mise à jour des groupes de questions:', error)
    res.status(500).json({ error: 'Erreur lors de la mise à jour des groupes de questions' })
  }
})

// DELETE /api/templates/:id - Supprimer un template (admin seulement)
router.delete('/:id', requireAdminRole, async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { tenantId } = req.user

    // Vérifier que le template existe et appartient au tenant
    const existingTemplate = await prisma.evaluationTemplate.findFirst({
      where: {
        id,
        tenantId
      }
    })

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Template non trouvé' })
    }

    // Vérifier qu'il n'y a pas d'évaluations en cours avec ce template
    const evaluationsCount = await prisma.evaluation.count({
      where: {
        templateId: id,
        status: { in: ['DRAFT', 'IN_PROGRESS'] }
      }
    })

    if (evaluationsCount > 0) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer un template utilisé par des évaluations en cours' 
      })
    }

    // Désactiver le template au lieu de le supprimer
    await prisma.evaluationTemplate.update({
      where: { id },
      data: { isActive: false }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Erreur lors de la suppression du template:', error)
    res.status(500).json({ error: 'Erreur lors de la suppression du template' })
  }
})

// GET /api/templates/:id/statistics - Statistiques d'utilisation d'un template
router.get('/:id/statistics', async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { tenantId } = req.user

    // Vérifier que le template existe et appartient au tenant
    const template = await prisma.evaluationTemplate.findFirst({
      where: {
        id,
        tenantId
      }
    })

    if (!template) {
      return res.status(404).json({ error: 'Template non trouvé' })
    }

    const [
      totalEvaluations,
      completedEvaluations,
      inProgressEvaluations,
      averageCompletionTime,
      evaluationsByMonth
    ] = await Promise.all([
      prisma.evaluation.count({
        where: { templateId: id }
      }),
      prisma.evaluation.count({
        where: { templateId: id, status: 'COMPLETED' }
      }),
      prisma.evaluation.count({
        where: { templateId: id, status: 'IN_PROGRESS' }
      }),
      prisma.evaluation.aggregate({
        where: { 
          templateId: id, 
          status: 'COMPLETED',
          completedAt: { not: null },
          startedAt: { not: null }
        },
        _avg: {
          // Calculer la durée moyenne en heures
          // Note: Prisma ne supporte pas directement le calcul de durée
          // Nous devrons le faire côté application
        }
      }),
      prisma.evaluation.groupBy({
        by: ['createdAt'],
        where: { templateId: id },
        _count: true
      })
    ])

    res.json({
      totalEvaluations,
      completedEvaluations,
      inProgressEvaluations,
      completionRate: totalEvaluations > 0 ? (completedEvaluations / totalEvaluations) * 100 : 0,
      evaluationsByMonth: evaluationsByMonth.map(item => ({
        month: item.createdAt,
        count: item._count
      }))
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' })
  }
})

export { router as templatesRouter }


