import express from 'express'
import { prisma } from '../lib/prisma'
import { authMiddleware, requireEvaluatorRole } from '../middleware/auth'

const router = express.Router()

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware)

// GET /api/evaluations/:evaluationId/responses - Récupérer toutes les réponses d'une évaluation
router.get('/:evaluationId/responses', async (req: any, res: any) => {
  try {
    const { evaluationId } = req.params
    const { tenantId } = req.user

    // Vérifier que l'évaluation appartient au tenant
    const evaluation = await prisma.evaluation.findFirst({
      where: {
        id: evaluationId,
        tenantId
      }
    })

    if (!evaluation) {
      return res.status(404).json({ error: 'Évaluation non trouvée' })
    }

    const responses = await prisma.response.findMany({
      where: {
        evaluationId
      },
      include: {
        question: {
          include: {
            objective: {
              include: {
                group: true
              }
            }
          }
        }
      },
      orderBy: {
        question: {
          orderIndex: 'asc'
        }
      }
    })

    res.json(responses)
  } catch (error) {
    console.error('Erreur lors de la récupération des réponses:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des réponses' })
  }
})

// POST /api/evaluations/:evaluationId/responses - Sauvegarder une réponse
router.post('/:evaluationId/responses', requireEvaluatorRole, async (req: any, res: any) => {
  try {
    const { evaluationId } = req.params
    const { tenantId } = req.user
    const { 
      questionId, 
      booleanValue, 
      textValue, 
      numberValue, 
      jsonValue,
      facilityScore,
      constraintScore,
      description,
      comment 
    } = req.body

    // Validation des champs obligatoires
    if (!questionId) {
      return res.status(400).json({ 
        error: 'L\'ID de la question est obligatoire' 
      })
    }

    // Vérifier que l'évaluation appartient au tenant
    const evaluation = await prisma.evaluation.findFirst({
      where: {
        id: evaluationId,
        tenantId
      }
    })

    if (!evaluation) {
      return res.status(404).json({ error: 'Évaluation non trouvée' })
    }

    // Vérifier que la question existe
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    })

    if (!question) {
      return res.status(404).json({ error: 'Question non trouvée' })
    }

    // Créer ou mettre à jour la réponse
    const response = await prisma.response.upsert({
      where: {
        evaluationId_questionId: {
          evaluationId,
          questionId
        }
      },
      update: {
        booleanValue,
        textValue,
        numberValue,
        jsonValue,
        facilityScore,
        constraintScore,
        description,
        comment,
        updatedAt: new Date()
      },
      create: {
        evaluationId,
        questionId,
        booleanValue,
        textValue,
        numberValue,
        jsonValue,
        facilityScore,
        constraintScore,
        description,
        comment
      },
      include: {
        question: {
          include: {
            objective: {
              include: {
                group: true
              }
            }
          }
        }
      }
    })

    // Mettre à jour le progrès de l'évaluation
    await updateEvaluationProgress(evaluationId)

    res.json(response)
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la réponse:', error)
    res.status(500).json({ error: 'Erreur lors de la sauvegarde de la réponse' })
  }
})

// PUT /api/evaluations/:evaluationId/responses/:responseId - Mettre à jour une réponse
router.put('/:evaluationId/responses/:responseId', requireEvaluatorRole, async (req: any, res: any) => {
  try {
    const { evaluationId, responseId } = req.params
    const { tenantId } = req.user
    const { 
      booleanValue, 
      textValue, 
      numberValue, 
      jsonValue,
      facilityScore,
      constraintScore,
      description,
      comment 
    } = req.body

    // Vérifier que l'évaluation appartient au tenant
    const evaluation = await prisma.evaluation.findFirst({
      where: {
        id: evaluationId,
        tenantId
      }
    })

    if (!evaluation) {
      return res.status(404).json({ error: 'Évaluation non trouvée' })
    }

    // Vérifier que la réponse existe et appartient à l'évaluation
    const existingResponse = await prisma.response.findFirst({
      where: {
        id: responseId,
        evaluationId
      }
    })

    if (!existingResponse) {
      return res.status(404).json({ error: 'Réponse non trouvée' })
    }

    const updatedResponse = await prisma.response.update({
      where: { id: responseId },
      data: {
        booleanValue,
        textValue,
        numberValue,
        jsonValue,
        facilityScore,
        constraintScore,
        description,
        comment,
        updatedAt: new Date()
      },
      include: {
        question: {
          include: {
            objective: {
              include: {
                group: true
              }
            }
          }
        }
      }
    })

    // Mettre à jour le progrès de l'évaluation
    await updateEvaluationProgress(evaluationId)

    res.json(updatedResponse)
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réponse:', error)
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la réponse' })
  }
})

// DELETE /api/evaluations/:evaluationId/responses/:responseId - Supprimer une réponse
router.delete('/:evaluationId/responses/:responseId', requireEvaluatorRole, async (req: any, res: any) => {
  try {
    const { evaluationId, responseId } = req.params
    const { tenantId } = req.user

    // Vérifier que l'évaluation appartient au tenant
    const evaluation = await prisma.evaluation.findFirst({
      where: {
        id: evaluationId,
        tenantId
      }
    })

    if (!evaluation) {
      return res.status(404).json({ error: 'Évaluation non trouvée' })
    }

    // Vérifier que la réponse existe et appartient à l'évaluation
    const existingResponse = await prisma.response.findFirst({
      where: {
        id: responseId,
        evaluationId
      }
    })

    if (!existingResponse) {
      return res.status(404).json({ error: 'Réponse non trouvée' })
    }

    await prisma.response.delete({
      where: { id: responseId }
    })

    // Mettre à jour le progrès de l'évaluation
    await updateEvaluationProgress(evaluationId)

    res.status(204).send()
  } catch (error) {
    console.error('Erreur lors de la suppression de la réponse:', error)
    res.status(500).json({ error: 'Erreur lors de la suppression de la réponse' })
  }
})

// Fonction utilitaire pour mettre à jour le progrès d'une évaluation
async function updateEvaluationProgress(evaluationId: string) {
  try {
    // Compter le nombre total de questions dans le template
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        template: {
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
        }
      }
    })

    if (!evaluation) return

    const totalQuestions = evaluation.template.questionGroups.reduce((total, group) => 
      total + group.objectives.reduce((objTotal, obj) => objTotal + obj.questions.length, 0), 0
    )

    // Compter le nombre de réponses
    const answeredQuestions = await prisma.response.count({
      where: { evaluationId }
    })

    const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0

    // Mettre à jour le progrès
    await prisma.evaluation.update({
      where: { id: evaluationId },
      data: { progress }
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du progrès:', error)
  }
}

export { router as responsesRouter }


