import type { SecurityObjective, SecurityQuestion } from '../data/securityQuestionnaire'

export interface GAMRScore {
  totalScore: number
  facilityScore: number
  constraintScore: number
  vulnerabilityLevel: 'TRÈS_FAIBLE' | 'FAIBLE' | 'MOYEN' | 'ÉLEVÉ' | 'TRÈS_ÉLEVÉ'
  riskLevel: 'ACCEPTABLE' | 'TOLÉRABLE' | 'INACCEPTABLE'
  categoryScores: CategoryScore[]
  recommendations: Recommendation[]
}

export interface CategoryScore {
  category: string
  score: number
  facilityScore: number
  constraintScore: number
  vulnerabilityLevel: string
  completionRate: number
  criticalIssues: string[]
}

export interface Recommendation {
  priority: 'ÉLEVÉ' | 'MOYEN' | 'FAIBLE'
  category: string
  title: string
  description: string
  impact: string
  effort: 'FAIBLE' | 'MOYEN' | 'ÉLEVÉ'
  objectiveId?: string
}

export interface EvaluationResponse {
  questionId: string
  booleanValue?: boolean
  textValue?: string
  numberValue?: number
  facilityScore?: number
  constraintScore?: number
  comment?: string
}

export class GAMRScoringEngine {
  
  /**
   * Calculate the complete GAMR score for an evaluation
   */
  static calculateGAMRScore(
    objectives: SecurityObjective[], 
    responses: Record<string, EvaluationResponse>
  ): GAMRScore {
    const categoryScores = this.calculateCategoryScores(objectives, responses)
    const totalFacilityScore = categoryScores.reduce((sum, cat) => sum + cat.facilityScore, 0)
    const totalConstraintScore = categoryScores.reduce((sum, cat) => sum + cat.constraintScore, 0)
    const totalScore = totalFacilityScore - totalConstraintScore
    
    const vulnerabilityLevel = this.determineVulnerabilityLevel(totalScore)
    const riskLevel = this.determineRiskLevel(vulnerabilityLevel, categoryScores)
    const recommendations = this.generateRecommendations(categoryScores, objectives, responses)

    return {
      totalScore,
      facilityScore: totalFacilityScore,
      constraintScore: totalConstraintScore,
      vulnerabilityLevel,
      riskLevel,
      categoryScores,
      recommendations
    }
  }

  /**
   * Calculate scores by category
   */
  private static calculateCategoryScores(
    objectives: SecurityObjective[], 
    responses: Record<string, EvaluationResponse>
  ): CategoryScore[] {
    const categories = new Map<string, {
      facilityScore: number
      constraintScore: number
      totalQuestions: number
      answeredQuestions: number
      criticalIssues: string[]
    }>()

    objectives.forEach(objective => {
      const category = objective.category
      if (!categories.has(category)) {
        categories.set(category, {
          facilityScore: 0,
          constraintScore: 0,
          totalQuestions: 0,
          answeredQuestions: 0,
          criticalIssues: []
        })
      }

      const categoryData = categories.get(category)!
      
      objective.questions.forEach(question => {
        categoryData.totalQuestions++
        const response = responses[question.id]
        
        if (response) {
          categoryData.answeredQuestions++
          
          // Calculate facility and constraint scores
          const facilityScore = response.facilityScore || 0
          const constraintScore = response.constraintScore || 0
          
          // Apply weights from objective scoring criteria
          const weightedFacility = facilityScore * objective.scoringCriteria.facilityWeight
          const weightedConstraint = constraintScore * objective.scoringCriteria.constraintWeight
          
          categoryData.facilityScore += weightedFacility
          categoryData.constraintScore += weightedConstraint
          
          // Check for critical issues
          if (this.isCriticalIssue(question, response, objective)) {
            categoryData.criticalIssues.push(objective.title)
          }
        }
      })
    })

    return Array.from(categories.entries()).map(([category, data]) => ({
      category,
      score: data.facilityScore - data.constraintScore,
      facilityScore: data.facilityScore,
      constraintScore: data.constraintScore,
      vulnerabilityLevel: this.determineVulnerabilityLevel(data.facilityScore - data.constraintScore),
      completionRate: data.totalQuestions > 0 ? (data.answeredQuestions / data.totalQuestions) * 100 : 0,
      criticalIssues: data.criticalIssues
    }))
  }

  /**
   * Determine if a response indicates a critical security issue
   */
  private static isCriticalIssue(
    question: SecurityQuestion, 
    response: EvaluationResponse, 
    objective: SecurityObjective
  ): boolean {
    // Critical issues for YES/NO questions
    if (question.type === 'YES_NO') {
      // High-risk scenarios where "No" indicates critical vulnerability
      const criticalNoQuestions = [
        'clôture', 'contrôle d\'accès', 'surveillance', 'extincteur', 
        'détection incendie', 'groupe électrogène', 'sauvegarde', 'antivirus'
      ]
      
      if (response.booleanValue === false) {
        return criticalNoQuestions.some(keyword => 
          question.text.toLowerCase().includes(keyword)
        )
      }
    }

    // Critical constraint scores
    if (response.constraintScore && response.constraintScore >= 3) {
      return objective.scoringCriteria.criticalityLevel === 'CRITICAL'
    }

    return false
  }

  /**
   * Determine vulnerability level based on total score
   */
  private static determineVulnerabilityLevel(score: number): GAMRScore['vulnerabilityLevel'] {
    if (score >= 80) return 'TRÈS_FAIBLE'
    if (score >= 60) return 'FAIBLE'
    if (score >= 40) return 'MOYEN'
    if (score >= 20) return 'ÉLEVÉ'
    return 'TRÈS_ÉLEVÉ'
  }

  /**
   * Determine risk level based on vulnerability and critical issues
   */
  private static determineRiskLevel(
    vulnerabilityLevel: GAMRScore['vulnerabilityLevel'],
    categoryScores: CategoryScore[]
  ): GAMRScore['riskLevel'] {
    const hasCriticalIssues = categoryScores.some(cat => cat.criticalIssues.length > 0)

    if (vulnerabilityLevel === 'TRÈS_ÉLEVÉ' || hasCriticalIssues) {
      return 'INACCEPTABLE'
    }

    if (vulnerabilityLevel === 'ÉLEVÉ' || vulnerabilityLevel === 'MOYEN') {
      return 'TOLÉRABLE'
    }

    return 'ACCEPTABLE'
  }

  /**
   * Generate actionable recommendations based on the evaluation
   */
  private static generateRecommendations(
    categoryScores: CategoryScore[],
    objectives: SecurityObjective[],
    responses: Record<string, EvaluationResponse>
  ): Recommendation[] {
    const recommendations: Recommendation[] = []

    // High-priority recommendations for critical issues
    categoryScores.forEach(category => {
      if (category.criticalIssues.length > 0) {
        recommendations.push({
          priority: 'ÉLEVÉ',
          category: category.category,
          title: `Résoudre les problèmes critiques en ${category.category}`,
          description: `${category.criticalIssues.length} problème(s) critique(s) identifié(s) nécessitant une action immédiate`,
          impact: 'Réduction significative des vulnérabilités',
          effort: 'ÉLEVÉ'
        })
      }
    })

    // Medium-priority recommendations for low scores
    categoryScores
      .filter(cat => cat.score < 40 && cat.criticalIssues.length === 0)
      .forEach(category => {
        recommendations.push({
          priority: 'MOYEN',
          category: category.category,
          title: `Améliorer la sécurité en ${category.category}`,
          description: `Score faible détecté (${Math.round(category.score)}/100). Révision des mesures recommandée`,
          impact: 'Amélioration de la posture sécuritaire',
          effort: 'MOYEN'
        })
      })

    // Low-priority recommendations for incomplete evaluations
    categoryScores
      .filter(cat => cat.completionRate < 80)
      .forEach(category => {
        recommendations.push({
          priority: 'FAIBLE',
          category: category.category,
          title: `Compléter l'évaluation en ${category.category}`,
          description: `Évaluation incomplète (${Math.round(category.completionRate)}%). Compléter pour une analyse précise`,
          impact: 'Amélioration de la précision de l\'évaluation',
          effort: 'FAIBLE'
        })
      })

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'ÉLEVÉ': 3, 'MOYEN': 2, 'FAIBLE': 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * Get color class for vulnerability level
   */
  static getVulnerabilityColor(level: GAMRScore['vulnerabilityLevel']): string {
    const colors = {
      'TRÈS_FAIBLE': 'text-green-600 bg-green-50',
      'FAIBLE': 'text-green-500 bg-green-50',
      'MOYEN': 'text-yellow-600 bg-yellow-50',
      'ÉLEVÉ': 'text-orange-600 bg-orange-50',
      'TRÈS_ÉLEVÉ': 'text-red-600 bg-red-50'
    }
    return colors[level]
  }

  /**
   * Get color class for risk level
   */
  static getRiskColor(level: GAMRScore['riskLevel']): string {
    const colors = {
      'ACCEPTABLE': 'text-green-600 bg-green-50',
      'TOLÉRABLE': 'text-yellow-600 bg-yellow-50',
      'INACCEPTABLE': 'text-red-600 bg-red-50'
    }
    return colors[level]
  }
}
