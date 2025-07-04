import { prisma } from '../prisma'
import { EmbeddingDocument, DocumentMetadata } from './types'

export class DataExtractor {
  
  async extractTenantData(tenantId: string): Promise<EmbeddingDocument[]> {
    const documents: EmbeddingDocument[] = []
    
    // Extract evaluations
    const evaluations = await this.extractEvaluations(tenantId)
    documents.push(...evaluations)
    
    // Extract risk sheets
    const riskSheets = await this.extractRiskSheets(tenantId)
    documents.push(...riskSheets)
    
    // Extract actions
    const actions = await this.extractActions(tenantId)
    documents.push(...actions)
    
    // Extract responses
    const responses = await this.extractResponses(tenantId)
    documents.push(...responses)
    
    return documents
  }
  
  private async extractEvaluations(tenantId: string): Promise<EmbeddingDocument[]> {
    const evaluations = await prisma.evaluation.findMany({
      where: { tenantId },
      include: {
        evaluator: true,
        template: true,
        responses: {
          include: {
            question: {
              include: {
                objective: true
              }
            }
          }
        }
      }
    })
    
    return evaluations.map(evaluation => ({
      id: `evaluation_${evaluation.id}`,
      content: this.buildEvaluationContent(evaluation),
      tenantId,
      metadata: {
        type: 'evaluation' as const,
        entityId: evaluation.id,
        title: evaluation.title,
        createdAt: evaluation.createdAt.toISOString(),
        updatedAt: evaluation.updatedAt.toISOString(),
        author: {
          id: evaluation.evaluator.id,
          name: `${evaluation.evaluator.firstName} ${evaluation.evaluator.lastName}`
        },
        evaluation: {
          status: evaluation.status,
          progress: evaluation.progress,
          totalScore: evaluation.totalScore || undefined,
          riskLevel: evaluation.riskLevel || undefined
        }
      }
    }))
  }
  
  private async extractRiskSheets(tenantId: string): Promise<EmbeddingDocument[]> {
    const riskSheets = await prisma.riskSheet.findMany({
      where: { tenantId, isArchived: false },
      include: {
        author: true,
        actions: true
      }
    })
    
    return riskSheets.map(riskSheet => ({
      id: `risk_sheet_${riskSheet.id}`,
      content: this.buildRiskSheetContent(riskSheet),
      tenantId,
      metadata: {
        type: 'risk_sheet' as const,
        entityId: riskSheet.id,
        title: `${riskSheet.target} - ${riskSheet.scenario}`,
        createdAt: riskSheet.createdAt.toISOString(),
        updatedAt: riskSheet.updatedAt.toISOString(),
        author: {
          id: riskSheet.author.id,
          name: `${riskSheet.author.firstName} ${riskSheet.author.lastName}`
        },
        riskSheet: {
          target: riskSheet.target,
          scenario: riskSheet.scenario,
          riskScore: riskSheet.riskScore,
          priority: riskSheet.priority,
          category: riskSheet.category || undefined
        }
      }
    }))
  }
  
  private async extractActions(tenantId: string): Promise<EmbeddingDocument[]> {
    const actions = await prisma.action.findMany({
      where: { tenantId },
      include: {
        author: true,
        assignee: true,
        riskSheet: true
      }
    })
    
    return actions.map(action => ({
      id: `action_${action.id}`,
      content: this.buildActionContent(action),
      tenantId,
      metadata: {
        type: 'action' as const,
        entityId: action.id,
        title: action.title,
        createdAt: action.createdAt.toISOString(),
        updatedAt: action.updatedAt.toISOString(),
        author: {
          id: action.author.id,
          name: `${action.author.firstName} ${action.author.lastName}`
        },
        action: {
          status: action.status,
          priority: action.priority,
          dueDate: action.dueDate?.toISOString(),
          assigneeId: action.assigneeId || undefined
        }
      }
    }))
  }
  
  private async extractResponses(tenantId: string): Promise<EmbeddingDocument[]> {
    const responses = await prisma.response.findMany({
      where: {
        evaluation: { tenantId }
      },
      include: {
        question: {
          include: {
            objective: true
          }
        },
        evaluation: true
      }
    })
    
    return responses.map(response => ({
      id: `response_${response.id}`,
      content: this.buildResponseContent(response),
      tenantId,
      metadata: {
        type: 'response' as const,
        entityId: response.id,
        title: `Réponse: ${response.question.text}`,
        createdAt: response.answeredAt.toISOString(),
        updatedAt: response.updatedAt.toISOString(),
        response: {
          questionId: response.question.id,
          questionText: response.question.text,
          objectiveTitle: response.question.objective.title,
          facilityScore: response.facilityScore || undefined,
          constraintScore: response.constraintScore || undefined
        }
      }
    }))
  }
  
  private buildEvaluationContent(evaluation: any): string {
    let content = `Évaluation: ${evaluation.title}\n`
    content += `Statut: ${evaluation.status}\n`
    content += `Progrès: ${evaluation.progress}%\n`
    
    if (evaluation.totalScore) {
      content += `Score total: ${evaluation.totalScore}\n`
    }
    
    if (evaluation.riskLevel) {
      content += `Niveau de risque: ${evaluation.riskLevel}\n`
    }
    
    if (evaluation.entityInfo) {
      content += `Informations entité: ${JSON.stringify(evaluation.entityInfo)}\n`
    }
    
    // Add responses summary
    if (evaluation.responses?.length > 0) {
      content += `\nRéponses:\n`
      evaluation.responses.forEach((response: any) => {
        content += `- ${response.question.text}: `
        if (response.booleanValue !== null) {
          content += response.booleanValue ? 'Oui' : 'Non'
        } else if (response.textValue) {
          content += response.textValue
        } else if (response.numberValue !== null) {
          content += response.numberValue.toString()
        }
        if (response.description) {
          content += ` (${response.description})`
        }
        content += '\n'
      })
    }
    
    return content
  }
  
  private buildRiskSheetContent(riskSheet: any): string {
    let content = `Fiche de risque GAMR\n`
    content += `Cible: ${riskSheet.target}\n`
    content += `Scénario: ${riskSheet.scenario}\n`
    content += `Probabilité: ${riskSheet.probability}/3\n`
    content += `Vulnérabilité: ${riskSheet.vulnerability}/4\n`
    content += `Impact: ${riskSheet.impact}/5\n`
    content += `Score de risque: ${riskSheet.riskScore}/100\n`
    content += `Priorité: ${riskSheet.priority}\n`
    
    if (riskSheet.category) {
      content += `Catégorie: ${riskSheet.category}\n`
    }
    
    if (riskSheet.actions?.length > 0) {
      content += `\nActions correctives:\n`
      riskSheet.actions.forEach((action: any) => {
        content += `- ${action.title}: ${action.status}\n`
      })
    }
    
    return content
  }
  
  private buildActionContent(action: any): string {
    let content = `Action corrective: ${action.title}\n`
    content += `Description: ${action.description}\n`
    content += `Statut: ${action.status}\n`
    content += `Priorité: ${action.priority}\n`
    
    if (action.dueDate) {
      content += `Échéance: ${action.dueDate.toLocaleDateString()}\n`
    }
    
    if (action.assignee) {
      content += `Assigné à: ${action.assignee.firstName} ${action.assignee.lastName}\n`
    }
    
    if (action.riskSheet) {
      content += `Fiche de risque associée: ${action.riskSheet.target} - ${action.riskSheet.scenario}\n`
    }
    
    if (action.successProbability) {
      content += `Probabilité de succès: ${action.successProbability}%\n`
    }
    
    if (action.estimatedCost) {
      content += `Coût estimé: ${action.estimatedCost}€\n`
    }
    
    if (action.estimatedDuration) {
      content += `Durée estimée: ${action.estimatedDuration} jours\n`
    }
    
    return content
  }
  
  private buildResponseContent(response: any): string {
    let content = `Question: ${response.question.text}\n`
    content += `Objectif: ${response.question.objective.title}\n`
    
    content += `Réponse: `
    if (response.booleanValue !== null) {
      content += response.booleanValue ? 'Oui' : 'Non'
    } else if (response.textValue) {
      content += response.textValue
    } else if (response.numberValue !== null) {
      content += response.numberValue.toString()
    }
    content += '\n'
    
    if (response.description) {
      content += `Description: ${response.description}\n`
    }
    
    if (response.comment) {
      content += `Commentaire: ${response.comment}\n`
    }
    
    if (response.facilityScore) {
      content += `Score facilité: ${response.facilityScore}\n`
    }
    
    if (response.constraintScore) {
      content += `Score contrainte: ${response.constraintScore}\n`
    }
    
    return content
  }
}