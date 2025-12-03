// Modèle de raisonnement avancé pour l'analyse des risques GAMRDIGITALE
// Utilise le contexte complet de toutes les évaluations pour une analyse sophistiquée

interface EvaluationContext {
  id: string
  title: string
  status: string
  totalScore?: number
  riskLevel?: string
  entityInfo?: any
  template?: {
    name: string
    description?: string
  }
  responses: EvaluationResponse[]
  completedAt?: string
  sector?: string
  companySize?: string
}

interface EvaluationResponse {
  questionId: string
  questionText: string
  booleanValue?: boolean
  textValue?: string
  numberValue?: number
  facilityScore?: number
  constraintScore?: number
  objectiveId?: string
  sectionId?: string
}

interface RiskContext {
  target: string
  scenario: string
  category?: string
}

interface ReasoningResult {
  probability: AdvancedRecommendation
  vulnerability: AdvancedRecommendation
  impact: AdvancedRecommendation
  overallAssessment: string
  contextualInsights: ContextualInsight[]
  crossEvaluationPatterns: CrossEvaluationPattern[]
  questionnaireRecommendations: QuestionnaireRecommendation[]
  confidenceLevel: number
}

interface AdvancedRecommendation {
  score: number
  explanation: string
  positiveEvidence: Evidence[]
  negativeEvidence: Evidence[]
  contextualFactors: ContextualFactor[]
  confidence: number
  reasoning: string
}

interface Evidence {
  source: string // ID de l'évaluation
  questionText: string
  response: string
  weight: number
  relevanceScore: number
  context: string
}

interface ContextualFactor {
  factor: string
  impact: 'positive' | 'negative' | 'neutral'
  magnitude: number
  explanation: string
  supportingEvidence: string[]
}

interface ContextualInsight {
  type: 'pattern' | 'anomaly' | 'trend' | 'correlation'
  title: string
  description: string
  significance: 'high' | 'medium' | 'low'
  affectedCriteria: ('probability' | 'vulnerability' | 'impact')[]
  evidence: string[]
}

interface CrossEvaluationPattern {
  pattern: string
  evaluationsInvolved: string[]
  strength: number
  implication: string
  riskRelevance: string
}

interface QuestionnaireRecommendation {
  category: string
  reason: string
  suggestedQuestions: string[]
  priority: 'high' | 'medium' | 'low'
  expectedInsight: string
}

/**
 * Moteur de raisonnement avancé pour l'analyse des risques
 */
export class AdvancedRiskReasoningEngine {
  
  /**
   * Analyse un risque en utilisant le contexte complet de toutes les évaluations
   */
  public async analyzeRisk(
    riskContext: RiskContext,
    evaluations: EvaluationContext[]
  ): Promise<ReasoningResult> {
    
    // 1. Préparation du contexte d'analyse
    const analysisContext = this.prepareAnalysisContext(riskContext, evaluations)
    
    // 2. Identification des patterns cross-évaluations
    const crossPatterns = this.identifyCrossEvaluationPatterns(evaluations, riskContext)
    
    // 3. Analyse contextuelle avancée
    const contextualInsights = this.generateContextualInsights(evaluations, riskContext)
    
    // 4. Analyse de la probabilité avec raisonnement
    const probabilityAnalysis = this.analyzeProbabilityWithReasoning(
      riskContext, 
      analysisContext, 
      crossPatterns,
      contextualInsights
    )
    
    // 5. Analyse de la vulnérabilité avec raisonnement
    const vulnerabilityAnalysis = this.analyzeVulnerabilityWithReasoning(
      riskContext, 
      analysisContext, 
      crossPatterns,
      contextualInsights
    )
    
    // 6. Analyse de l'impact avec raisonnement
    const impactAnalysis = this.analyzeImpactWithReasoning(
      riskContext, 
      analysisContext, 
      crossPatterns,
      contextualInsights
    )
    
    // 7. Évaluation globale avec synthèse
    const overallAssessment = this.generateOverallAssessment(
      riskContext,
      probabilityAnalysis,
      vulnerabilityAnalysis,
      impactAnalysis,
      contextualInsights,
      crossPatterns
    )
    
    // 8. Recommandations de questionnaires intelligentes
    const questionnaireRecommendations = this.generateIntelligentQuestionnaireRecommendations(
      riskContext,
      analysisContext,
      contextualInsights
    )
    
    // 9. Calcul du niveau de confiance global
    const confidenceLevel = this.calculateOverallConfidence(
      probabilityAnalysis,
      vulnerabilityAnalysis,
      impactAnalysis,
      analysisContext
    )
    
    return {
      probability: probabilityAnalysis,
      vulnerability: vulnerabilityAnalysis,
      impact: impactAnalysis,
      overallAssessment,
      contextualInsights,
      crossEvaluationPatterns: crossPatterns,
      questionnaireRecommendations,
      confidenceLevel
    }
  }
  
  /**
   * Prépare le contexte d'analyse en structurant les données
   */
  private prepareAnalysisContext(
    riskContext: RiskContext,
    evaluations: EvaluationContext[]
  ): any {
    const context = {
      totalEvaluations: evaluations.length,
      completedEvaluations: evaluations.filter(e => e.status === 'COMPLETED').length,
      averageScore: 0,
      sectorDistribution: {} as Record<string, number>,
      templateDistribution: {} as Record<string, number>,
      responsesByCategory: {} as Record<string, EvaluationResponse[]>,
      timelineAnalysis: this.analyzeEvaluationTimeline(evaluations),
      riskRelevantResponses: [] as EvaluationResponse[],
      evidenceQuality: 0
    }
    
    // Calcul du score moyen
    const scoredEvaluations = evaluations.filter(e => e.totalScore !== undefined)
    if (scoredEvaluations.length > 0) {
      context.averageScore = scoredEvaluations.reduce((sum, e) => sum + (e.totalScore || 0), 0) / scoredEvaluations.length
    }

    // Distribution par secteur
    evaluations.forEach(evaluation => {
      const sector = evaluation.sector || evaluation.entityInfo?.sector || 'Non spécifié'
      context.sectorDistribution[sector] = (context.sectorDistribution[sector] || 0) + 1
    })

    // Distribution par template
    evaluations.forEach(evaluation => {
      const template = evaluation.template?.name || 'Template inconnu'
      context.templateDistribution[template] = (context.templateDistribution[template] || 0) + 1
    })

    // Catégorisation des réponses
    evaluations.forEach(evaluation => {
      evaluation.responses.forEach(response => {
        const category = this.categorizeResponse(response, riskContext)
        if (!context.responsesByCategory[category]) {
          context.responsesByCategory[category] = []
        }
        context.responsesByCategory[category].push(response)
        
        // Identifier les réponses pertinentes pour le risque
        if (this.isResponseRelevantToRisk(response, riskContext)) {
          context.riskRelevantResponses.push(response)
        }
      })
    })
    
    // Qualité des preuves
    context.evidenceQuality = this.assessEvidenceQuality(context.riskRelevantResponses)
    
    return context
  }
  
  /**
   * Identifie les patterns entre les évaluations
   */
  private identifyCrossEvaluationPatterns(
    evaluations: EvaluationContext[],
    riskContext: RiskContext
  ): CrossEvaluationPattern[] {
    const patterns: CrossEvaluationPattern[] = []
    
    // Pattern 1: Faiblesses récurrentes
    const recurringWeaknesses = this.findRecurringWeaknesses(evaluations)
    recurringWeaknesses.forEach(weakness => {
      if (this.isWeaknessRelevantToRisk(weakness, riskContext)) {
        patterns.push({
          pattern: `Faiblesse récurrente: ${weakness.area}`,
          evaluationsInvolved: weakness.evaluationIds,
          strength: weakness.frequency,
          implication: `Cette faiblesse apparaît dans ${weakness.frequency * 100}% des évaluations`,
          riskRelevance: weakness.riskRelevance
        })
      }
    })
    
    // Pattern 2: Évolution temporelle
    const temporalPatterns = this.analyzeTemporalPatterns(evaluations, riskContext)
    patterns.push(...temporalPatterns)
    
    // Pattern 3: Corrélations sectorielles
    const sectoralPatterns = this.analyzeSectoralPatterns(evaluations, riskContext)
    patterns.push(...sectoralPatterns)
    
    return patterns
  }
  
  /**
   * Génère des insights contextuels
   */
  private generateContextualInsights(
    evaluations: EvaluationContext[],
    riskContext: RiskContext
  ): ContextualInsight[] {
    const insights: ContextualInsight[] = []
    
    // Insight 1: Analyse de maturité sécuritaire
    const maturityInsight = this.analyzeSecurityMaturity(evaluations, riskContext)
    if (maturityInsight) insights.push(maturityInsight)
    
    // Insight 2: Détection d'anomalies
    const anomalies = this.detectAnomalies(evaluations, riskContext)
    insights.push(...anomalies)
    
    // Insight 3: Analyse de tendances
    const trends = this.analyzeTrends(evaluations, riskContext)
    insights.push(...trends)
    
    // Insight 4: Corrélations entre domaines
    const correlations = this.findDomainCorrelations(evaluations, riskContext)
    insights.push(...correlations)
    
    return insights
  }
  
  /**
   * Analyse la probabilité avec raisonnement avancé et données d'évaluation
   */
  private analyzeProbabilityWithReasoning(
    riskContext: RiskContext,
    analysisContext: any,
    crossPatterns: CrossEvaluationPattern[],
    insights: ContextualInsight[]
  ): AdvancedRecommendation {

    let score = 2 // Score de base
    const positiveEvidence: Evidence[] = []
    const negativeEvidence: Evidence[] = []
    const contextualFactors: ContextualFactor[] = []

    // Utiliser les insights d'évaluation si disponibles
    const evaluationInsights = riskContext.evaluationInsights
    if (evaluationInsights) {
      // Analyser les métriques extraites pour la probabilité
      evaluationInsights.extractedMetrics.forEach(metric => {
        if (this.isMetricRelevantToProbability(metric)) {
          if (metric.type === 'boolean') {
            if (metric.value === false) {
              score = Math.min(3, score + 0.3)
              negativeEvidence.push({
                source: metric.source,
                questionText: metric.questionText,
                response: 'Non',
                weight: metric.confidence,
                relevanceScore: metric.relevanceToRisk,
                context: `Absence confirmée dans ${metric.source}`
              })
            } else {
              score = Math.max(1, score - 0.2)
              positiveEvidence.push({
                source: metric.source,
                questionText: metric.questionText,
                response: 'Oui',
                weight: metric.confidence,
                relevanceScore: metric.relevanceToRisk,
                context: `Présence confirmée dans ${metric.source}`
              })
            }
          } else if (metric.type === 'percentage') {
            if (metric.value < 50) {
              score = Math.min(3, score + 0.4)
              negativeEvidence.push({
                source: metric.source,
                questionText: metric.questionText,
                response: `${metric.value}%`,
                weight: metric.confidence,
                relevanceScore: metric.relevanceToRisk,
                context: `Taux faible (${metric.value}%) dans ${metric.source}`
              })
            } else if (metric.value > 80) {
              score = Math.max(1, score - 0.3)
              positiveEvidence.push({
                source: metric.source,
                questionText: metric.questionText,
                response: `${metric.value}%`,
                weight: metric.confidence,
                relevanceScore: metric.relevanceToRisk,
                context: `Taux élevé (${metric.value}%) dans ${metric.source}`
              })
            }
          }
        }
      })

      // Analyser les faiblesses critiques
      evaluationInsights.criticalWeaknesses.forEach(weakness => {
        if (this.isWeaknessRelevantToProbability(weakness)) {
          score = Math.min(3, score + 0.5)
          negativeEvidence.push({
            source: 'Analyse des faiblesses',
            questionText: weakness,
            response: 'Faiblesse identifiée',
            weight: 0.9,
            relevanceScore: 0.8,
            context: 'Faiblesse critique identifiée dans l\'analyse'
          })
        }
      })

      // Analyser les patterns cross-évaluations
      evaluationInsights.patterns.forEach(pattern => {
        if (pattern.riskRelevance.includes('probabilité')) {
          score = Math.min(3, score + (pattern.frequency * 0.6))
          negativeEvidence.push({
            source: 'Analyse des patterns',
            questionText: pattern.pattern,
            response: pattern.implication,
            weight: pattern.strength,
            relevanceScore: 0.9,
            context: `Pattern récurrent dans ${Math.round(pattern.frequency * 100)}% des évaluations`
          })
        }
      })
    }

    // Analyse basée sur les patterns cross-évaluations (méthode originale)
    crossPatterns.forEach(pattern => {
      if (pattern.riskRelevance.includes('probabilité')) {
        if (pattern.strength > 0.7) {
          score = Math.min(3, score + 0.5)
          negativeEvidence.push({
            source: 'Cross-pattern analysis',
            questionText: pattern.pattern,
            response: pattern.implication,
            weight: pattern.strength,
            relevanceScore: 0.9,
            context: `Pattern identifié dans ${pattern.evaluationsInvolved.length} évaluations`
          })
        }
      }
    })

    // Analyse des insights contextuels
    insights.forEach(insight => {
      if (insight.affectedCriteria.includes('probability')) {
        const factor: ContextualFactor = {
          factor: insight.title,
          impact: insight.significance === 'high' ? 'negative' : 'neutral',
          magnitude: insight.significance === 'high' ? 0.8 : 0.4,
          explanation: insight.description,
          supportingEvidence: insight.evidence
        }
        contextualFactors.push(factor)

        if (insight.significance === 'high') {
          score = insight.type === 'anomaly' ? Math.min(3, score + 0.5) : Math.max(1, score - 0.3)
        }
      }
    })

    // Raisonnement basé sur la qualité des preuves
    const reasoning = this.generateProbabilityReasoning(
      score,
      analysisContext,
      positiveEvidence,
      negativeEvidence,
      contextualFactors
    )

    return {
      score: Math.round(score),
      explanation: this.generateProbabilityExplanation(score, analysisContext, evaluationInsights),
      positiveEvidence,
      negativeEvidence,
      contextualFactors,
      confidence: this.calculateConfidence(positiveEvidence, negativeEvidence, analysisContext),
      reasoning
    }
  }

  /**
   * Helper methods for evidence-based scoring
   */
  private isMetricRelevantToProbability(metric: any): boolean {
    const probabilityKeywords = [
      'maintenance', 'entretien', 'défaillance', 'panne', 'incident',
      'formation', 'training', 'compétence', 'procédure', 'contrôle'
    ]

    const questionText = metric.questionText.toLowerCase()
    return probabilityKeywords.some(keyword => questionText.includes(keyword))
  }

  private isWeaknessRelevantToProbability(weakness: string): boolean {
    const probabilityKeywords = [
      'maintenance', 'entretien', 'formation', 'procédure', 'contrôle',
      'surveillance', 'vérification', 'test', 'inspection'
    ]

    const weaknessText = weakness.toLowerCase()
    return probabilityKeywords.some(keyword => weaknessText.includes(keyword))
  }
  
  // Méthodes utilitaires détaillées
  private analyzeEvaluationTimeline(evaluations: EvaluationContext[]): any {
    const timeline = {
      totalSpan: 0,
      evaluationFrequency: 0,
      recentEvaluations: 0,
      improvementTrend: 'stable' as 'improving' | 'declining' | 'stable',
      consistencyScore: 0
    }

    const completedEvals = evaluations
      .filter(e => e.completedAt)
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime())

    if (completedEvals.length > 1) {
      const firstDate = new Date(completedEvals[0].completedAt!)
      const lastDate = new Date(completedEvals[completedEvals.length - 1].completedAt!)
      timeline.totalSpan = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24) // jours

      // Évaluations récentes (30 derniers jours)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      timeline.recentEvaluations = completedEvals.filter(e =>
        new Date(e.completedAt!) > thirtyDaysAgo
      ).length

      // Tendance d'amélioration basée sur les scores
      const scoredEvals = completedEvals.filter(e => e.totalScore !== undefined)
      if (scoredEvals.length >= 3) {
        const firstHalf = scoredEvals.slice(0, Math.floor(scoredEvals.length / 2))
        const secondHalf = scoredEvals.slice(Math.floor(scoredEvals.length / 2))

        const firstAvg = firstHalf.reduce((sum, e) => sum + (e.totalScore || 0), 0) / firstHalf.length
        const secondAvg = secondHalf.reduce((sum, e) => sum + (e.totalScore || 0), 0) / secondHalf.length

        if (secondAvg > firstAvg + 5) timeline.improvementTrend = 'improving'
        else if (secondAvg < firstAvg - 5) timeline.improvementTrend = 'declining'
      }
    }

    return timeline
  }

  private categorizeResponse(response: EvaluationResponse, riskContext: RiskContext): string {
    const questionLower = response.questionText.toLowerCase()
    const targetLower = riskContext.target.toLowerCase()
    const scenarioLower = riskContext.scenario.toLowerCase()

    // Catégorisation intelligente basée sur le contenu
    if (questionLower.includes('contrôle') && questionLower.includes('accès')) {
      return 'access_control'
    } else if (questionLower.includes('surveillance') || questionLower.includes('caméra')) {
      return 'surveillance'
    } else if (questionLower.includes('périmètre') || questionLower.includes('clôture')) {
      return 'perimeter'
    } else if (questionLower.includes('formation') || questionLower.includes('sensibilisation')) {
      return 'training'
    } else if (questionLower.includes('procédure') || questionLower.includes('protocole')) {
      return 'procedures'
    } else if (questionLower.includes('incident') || questionLower.includes('intrusion')) {
      return 'incidents'
    } else if (questionLower.includes('éclairage') || questionLower.includes('lumière')) {
      return 'lighting'
    } else if (questionLower.includes('infrastructure') || questionLower.includes('électricité')) {
      return 'infrastructure'
    } else if (questionLower.includes('données') || questionLower.includes('information')) {
      return 'data_protection'
    } else if (questionLower.includes('personnel') || questionLower.includes('employé')) {
      return 'personnel_security'
    }

    return 'general'
  }

  private isResponseRelevantToRisk(response: EvaluationResponse, riskContext: RiskContext): boolean {
    const questionLower = response.questionText.toLowerCase()
    const targetLower = riskContext.target.toLowerCase()
    const scenarioLower = riskContext.scenario.toLowerCase()

    // Pertinence directe par mots-clés
    const targetKeywords = this.extractKeywords(targetLower)
    const scenarioKeywords = this.extractKeywords(scenarioLower)
    const questionKeywords = this.extractKeywords(questionLower)

    // Calcul de la pertinence
    const targetRelevance = targetKeywords.some(keyword =>
      questionKeywords.includes(keyword)
    )
    const scenarioRelevance = scenarioKeywords.some(keyword =>
      questionKeywords.includes(keyword)
    )

    // Pertinence contextuelle
    const contextualRelevance = this.assessContextualRelevance(response, riskContext)

    return targetRelevance || scenarioRelevance || contextualRelevance > 0.6
  }

  private assessEvidenceQuality(responses: EvaluationResponse[]): number {
    if (responses.length === 0) return 0

    let qualityScore = 0
    let totalWeight = 0

    responses.forEach(response => {
      let responseQuality = 0
      let weight = 1

      // Qualité basée sur le type de réponse
      if (response.booleanValue !== undefined) {
        responseQuality += 0.8 // Réponse claire
      }
      if (response.textValue && response.textValue.length > 10) {
        responseQuality += 0.6 // Réponse détaillée
      }
      if (response.facilityScore && response.constraintScore) {
        responseQuality += 0.9 // Réponse avec scoring
        weight += 0.5
      }

      // Qualité basée sur la pertinence de la question
      const questionComplexity = this.assessQuestionComplexity(response.questionText)
      responseQuality += questionComplexity * 0.3

      qualityScore += responseQuality * weight
      totalWeight += weight
    })

    return totalWeight > 0 ? Math.min(1, qualityScore / totalWeight) : 0
  }
  
  private findRecurringWeaknesses(evaluations: EvaluationContext[]): any[] {
    const weaknessMap = new Map<string, {
      area: string,
      evaluationIds: string[],
      frequency: number,
      severity: number,
      riskRelevance: string
    }>()

    evaluations.forEach(evaluation => {
      evaluation.responses.forEach(response => {
        if (response.booleanValue === false) {
          const category = this.categorizeResponse(response, { target: '', scenario: '' })
          const key = `${category}_${this.normalizeQuestionText(response.questionText)}`

          if (!weaknessMap.has(key)) {
            weaknessMap.set(key, {
              area: category,
              evaluationIds: [],
              frequency: 0,
              severity: this.assessWeaknessSeverity(response),
              riskRelevance: this.assessRiskRelevance(response)
            })
          }

          const weakness = weaknessMap.get(key)!
          weakness.evaluationIds.push(evaluation.id)
          weakness.frequency = weakness.evaluationIds.length / evaluations.length
        }
      })
    })

    // Retourner seulement les faiblesses récurrentes (>= 30% des évaluations)
    return Array.from(weaknessMap.values()).filter(w => w.frequency >= 0.3)
  }

  private isWeaknessRelevantToRisk(weakness: any, riskContext: RiskContext): boolean {
    const targetLower = riskContext.target.toLowerCase()
    const scenarioLower = riskContext.scenario.toLowerCase()

    // Mapping des faiblesses aux types de risques
    const relevanceMap: Record<string, string[]> = {
      'access_control': ['accès', 'intrusion', 'données', 'serveur', 'système'],
      'surveillance': ['intrusion', 'vol', 'vandalisme', 'surveillance'],
      'perimeter': ['intrusion', 'périmètre', 'externe', 'clôture'],
      'training': ['personnel', 'interne', 'social', 'formation'],
      'procedures': ['incident', 'urgence', 'réponse', 'protocole'],
      'infrastructure': ['infrastructure', 'système', 'électricité', 'technique']
    }

    const keywords = relevanceMap[weakness.area] || []
    return keywords.some(keyword =>
      targetLower.includes(keyword) || scenarioLower.includes(keyword)
    )
  }

  private analyzeTemporalPatterns(evaluations: EvaluationContext[], riskContext: RiskContext): CrossEvaluationPattern[] {
    const patterns: CrossEvaluationPattern[] = []

    // Trier les évaluations par date
    const sortedEvals = evaluations
      .filter(e => e.completedAt)
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime())

    if (sortedEvals.length < 3) return patterns

    // Pattern 1: Dégradation temporelle
    const degradationPattern = this.detectDegradationPattern(sortedEvals, riskContext)
    if (degradationPattern) patterns.push(degradationPattern)

    // Pattern 2: Amélioration temporelle
    const improvementPattern = this.detectImprovementPattern(sortedEvals, riskContext)
    if (improvementPattern) patterns.push(improvementPattern)

    // Pattern 3: Cyclicité
    const cyclicalPattern = this.detectCyclicalPattern(sortedEvals, riskContext)
    if (cyclicalPattern) patterns.push(cyclicalPattern)

    return patterns
  }

  private analyzeSectoralPatterns(evaluations: EvaluationContext[], riskContext: RiskContext): CrossEvaluationPattern[] {
    const patterns: CrossEvaluationPattern[] = []

    // Grouper par secteur
    const sectorGroups = new Map<string, EvaluationContext[]>()
    evaluations.forEach(evaluation => {
      const sector = evaluation.sector || evaluation.entityInfo?.sector || 'Non spécifié'
      if (!sectorGroups.has(sector)) {
        sectorGroups.set(sector, [])
      }
      sectorGroups.get(sector)!.push(evaluation)
    })

    // Analyser les patterns par secteur
    sectorGroups.forEach((sectorEvals, sector) => {
      if (sectorEvals.length >= 2) {
        const sectorPattern = this.analyzeSectorSpecificPattern(sectorEvals, sector, riskContext)
        if (sectorPattern) patterns.push(sectorPattern)
      }
    })

    return patterns
  }
  
  private analyzeSecurityMaturity(evaluations: EvaluationContext[], riskContext: RiskContext): ContextualInsight | null {
    if (evaluations.length === 0) return null

    const maturityScores = evaluations
      .filter(e => e.totalScore !== undefined)
      .map(e => e.totalScore!)

    if (maturityScores.length === 0) return null

    const averageMaturity = maturityScores.reduce((sum, score) => sum + score, 0) / maturityScores.length
    const maturityVariance = this.calculateVariance(maturityScores)

    let maturityLevel: string
    let significance: 'high' | 'medium' | 'low'
    let affectedCriteria: ('probability' | 'vulnerability' | 'impact')[] = []

    if (averageMaturity >= 80) {
      maturityLevel = 'élevée'
      significance = 'high'
      affectedCriteria = ['probability', 'vulnerability']
    } else if (averageMaturity >= 60) {
      maturityLevel = 'modérée'
      significance = 'medium'
      affectedCriteria = ['vulnerability']
    } else {
      maturityLevel = 'faible'
      significance = 'high'
      affectedCriteria = ['probability', 'vulnerability', 'impact']
    }

    return {
      type: 'pattern',
      title: `Maturité sécuritaire ${maturityLevel}`,
      description: `L'analyse de ${evaluations.length} évaluations révèle une maturité sécuritaire ${maturityLevel} (score moyen: ${averageMaturity.toFixed(1)}/100). Variance: ${maturityVariance.toFixed(1)}.`,
      significance,
      affectedCriteria,
      evidence: [
        `Score moyen de maturité: ${averageMaturity.toFixed(1)}/100`,
        `Nombre d'évaluations analysées: ${evaluations.length}`,
        `Consistance des scores: ${maturityVariance < 100 ? 'élevée' : 'variable'}`
      ]
    }
  }

  private detectAnomalies(evaluations: EvaluationContext[], riskContext: RiskContext): ContextualInsight[] {
    const anomalies: ContextualInsight[] = []

    // Anomalie 1: Scores aberrants
    const scores = evaluations.filter(e => e.totalScore !== undefined).map(e => e.totalScore!)
    if (scores.length >= 3) {
      const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length
      const stdDev = Math.sqrt(this.calculateVariance(scores))

      const outliers = evaluations.filter(e =>
        e.totalScore !== undefined && Math.abs(e.totalScore - mean) > 2 * stdDev
      )

      if (outliers.length > 0) {
        anomalies.push({
          type: 'anomaly',
          title: 'Scores aberrants détectés',
          description: `${outliers.length} évaluation(s) présentent des scores significativement différents de la moyenne (écart > 2σ).`,
          significance: 'medium',
          affectedCriteria: ['probability', 'vulnerability'],
          evidence: outliers.map(o => `${o.title}: ${o.totalScore}/100`)
        })
      }
    }

    // Anomalie 2: Réponses incohérentes
    const inconsistencyAnomaly = this.detectResponseInconsistencies(evaluations, riskContext)
    if (inconsistencyAnomaly) anomalies.push(inconsistencyAnomaly)

    return anomalies
  }

  private analyzeTrends(evaluations: EvaluationContext[], riskContext: RiskContext): ContextualInsight[] {
    const trends: ContextualInsight[] = []

    // Tendance temporelle des scores
    const temporalTrend = this.analyzeTemporalScoreTrend(evaluations)
    if (temporalTrend) trends.push(temporalTrend)

    // Tendance par domaine de sécurité
    const domainTrends = this.analyzeDomainTrends(evaluations, riskContext)
    trends.push(...domainTrends)

    return trends
  }

  private findDomainCorrelations(evaluations: EvaluationContext[], riskContext: RiskContext): ContextualInsight[] {
    const correlations: ContextualInsight[] = []

    // Analyser les corrélations entre domaines de sécurité
    const domains = ['access_control', 'surveillance', 'perimeter', 'training', 'procedures']

    for (let i = 0; i < domains.length; i++) {
      for (let j = i + 1; j < domains.length; j++) {
        const correlation = this.calculateDomainCorrelation(
          evaluations,
          domains[i],
          domains[j],
          riskContext
        )

        if (Math.abs(correlation.coefficient) > 0.7) {
          correlations.push({
            type: 'correlation',
            title: `Corrélation ${domains[i]} - ${domains[j]}`,
            description: `Forte corrélation ${correlation.coefficient > 0 ? 'positive' : 'négative'} (r=${correlation.coefficient.toFixed(2)}) entre ${domains[i]} et ${domains[j]}.`,
            significance: Math.abs(correlation.coefficient) > 0.8 ? 'high' : 'medium',
            affectedCriteria: this.mapDomainsToRiskCriteria(domains[i], domains[j]),
            evidence: correlation.evidence
          })
        }
      }
    }

    return correlations
  }
  
  private analyzeVulnerabilityWithReasoning(
    riskContext: RiskContext,
    analysisContext: any,
    crossPatterns: CrossEvaluationPattern[],
    insights: ContextualInsight[]
  ): AdvancedRecommendation {

    let score = 2 // Score de base (1-4)
    const positiveEvidence: Evidence[] = []
    const negativeEvidence: Evidence[] = []
    const contextualFactors: ContextualFactor[] = []

    // Utiliser les insights d'évaluation si disponibles
    const evaluationInsights = riskContext.evaluationInsights
    if (evaluationInsights) {
      // Analyser les métriques pour la vulnérabilité
      evaluationInsights.extractedMetrics.forEach(metric => {
        if (this.isMetricRelevantToVulnerability(metric)) {
          if (metric.type === 'boolean') {
            if (metric.value === false) {
              score = Math.min(4, score + 0.5)
              negativeEvidence.push({
                source: metric.source,
                questionText: metric.questionText,
                response: 'Non',
                weight: metric.confidence,
                relevanceScore: metric.relevanceToRisk,
                context: `Protection absente dans ${metric.source}`
              })
            } else {
              score = Math.max(1, score - 0.3)
              positiveEvidence.push({
                source: metric.source,
                questionText: metric.questionText,
                response: 'Oui',
                weight: metric.confidence,
                relevanceScore: metric.relevanceToRisk,
                context: `Protection présente dans ${metric.source}`
              })
            }
          } else if (metric.type === 'percentage') {
            if (metric.value < 40) {
              score = Math.min(4, score + 0.6)
              negativeEvidence.push({
                source: metric.source,
                questionText: metric.questionText,
                response: `${metric.value}%`,
                weight: metric.confidence,
                relevanceScore: metric.relevanceToRisk,
                context: `Couverture insuffisante (${metric.value}%) dans ${metric.source}`
              })
            } else if (metric.value > 85) {
              score = Math.max(1, score - 0.4)
              positiveEvidence.push({
                source: metric.source,
                questionText: metric.questionText,
                response: `${metric.value}%`,
                weight: metric.confidence,
                relevanceScore: metric.relevanceToRisk,
                context: `Bonne couverture (${metric.value}%) dans ${metric.source}`
              })
            }
          }
        }
      })

      // Analyser les scores par domaine
      Object.entries(evaluationInsights.domainScores).forEach(([domain, domainScore]) => {
        if (this.isDomainRelevantToVulnerability(domain)) {
          if (domainScore < 40) {
            score = Math.min(4, score + 0.4)
            negativeEvidence.push({
              source: 'Analyse des domaines',
              questionText: `Score du domaine ${domain}`,
              response: `${Math.round(domainScore)}%`,
              weight: 0.8,
              relevanceScore: 0.9,
              context: `Score faible en ${domain} (${Math.round(domainScore)}%)`
            })
          } else if (domainScore > 80) {
            score = Math.max(1, score - 0.3)
            positiveEvidence.push({
              source: 'Analyse des domaines',
              questionText: `Score du domaine ${domain}`,
              response: `${Math.round(domainScore)}%`,
              weight: 0.8,
              relevanceScore: 0.9,
              context: `Score élevé en ${domain} (${Math.round(domainScore)}%)`
            })
          }
        }
      })

      // Analyser les patterns de vulnérabilité
      evaluationInsights.patterns.forEach(pattern => {
        if (pattern.riskRelevance.includes('vulnérabilité')) {
          score = Math.min(4, score + (pattern.frequency * 0.8))
          negativeEvidence.push({
            source: 'Analyse des patterns',
            questionText: pattern.pattern,
            response: pattern.implication,
            weight: pattern.strength,
            relevanceScore: 0.9,
            context: `Vulnérabilité récurrente dans ${Math.round(pattern.frequency * 100)}% des évaluations`
          })
        }
      })
    }

    // Analyse des patterns cross-évaluations
    crossPatterns.forEach(pattern => {
      if (pattern.riskRelevance.includes('vulnérabilité')) {
        if (pattern.strength > 0.6) {
          score = Math.min(4, score + 0.6)
          negativeEvidence.push({
            source: 'Cross-pattern analysis',
            questionText: pattern.pattern,
            response: pattern.implication,
            weight: pattern.strength,
            relevanceScore: 0.8,
            context: `Pattern de vulnérabilité dans ${pattern.evaluationsInvolved.length} évaluations`
          })
        }
      }
    })

    // Raisonnement basé sur la qualité des preuves
    const reasoning = this.generateVulnerabilityReasoning(
      score,
      analysisContext,
      positiveEvidence,
      negativeEvidence,
      contextualFactors
    )

    return {
      score: Math.round(score),
      explanation: this.generateVulnerabilityExplanation(score, analysisContext, evaluationInsights),
      positiveEvidence,
      negativeEvidence,
      contextualFactors,
      confidence: this.calculateConfidence(positiveEvidence, negativeEvidence, analysisContext),
      reasoning
    }
  }
  
  private analyzeImpactWithReasoning(
    riskContext: RiskContext,
    analysisContext: any,
    crossPatterns: CrossEvaluationPattern[],
    insights: ContextualInsight[]
  ): AdvancedRecommendation {

    let score = 3 // Score de base (1-5)
    const positiveEvidence: Evidence[] = []
    const negativeEvidence: Evidence[] = []
    const contextualFactors: ContextualFactor[] = []

    // Utiliser les insights d'évaluation si disponibles
    const evaluationInsights = riskContext.evaluationInsights
    if (evaluationInsights) {
      // Analyser le contexte sectoriel pour l'impact
      if (evaluationInsights.sectorContext) {
        const sectorImpactMultiplier = this.getSectorImpactMultiplier(evaluationInsights.sectorContext)
        score = Math.min(5, score * sectorImpactMultiplier)

        contextualFactors.push({
          factor: `Secteur d'activité: ${evaluationInsights.sectorContext}`,
          impact: sectorImpactMultiplier > 1 ? 'negative' : 'positive',
          magnitude: Math.abs(sectorImpactMultiplier - 1),
          explanation: `Le secteur ${evaluationInsights.sectorContext} influence l'impact potentiel`,
          supportingEvidence: [`Multiplicateur sectoriel: ${sectorImpactMultiplier}`]
        })
      }

      // Analyser les métriques critiques pour l'impact
      evaluationInsights.extractedMetrics.forEach(metric => {
        if (this.isMetricRelevantToImpact(metric)) {
          if (metric.type === 'boolean') {
            if (metric.value === false) {
              score = Math.min(5, score + 0.4)
              negativeEvidence.push({
                source: metric.source,
                questionText: metric.questionText,
                response: 'Non',
                weight: metric.confidence,
                relevanceScore: metric.relevanceToRisk,
                context: `Absence de mesure d'atténuation dans ${metric.source}`
              })
            } else {
              score = Math.max(1, score - 0.3)
              positiveEvidence.push({
                source: metric.source,
                questionText: metric.questionText,
                response: 'Oui',
                weight: metric.confidence,
                relevanceScore: metric.relevanceToRisk,
                context: `Mesure d'atténuation présente dans ${metric.source}`
              })
            }
          } else if (metric.type === 'percentage') {
            if (metric.value < 30) {
              score = Math.min(5, score + 0.5)
              negativeEvidence.push({
                source: metric.source,
                questionText: metric.questionText,
                response: `${metric.value}%`,
                weight: metric.confidence,
                relevanceScore: metric.relevanceToRisk,
                context: `Couverture insuffisante (${metric.value}%) augmente l'impact potentiel`
              })
            } else if (metric.value > 90) {
              score = Math.max(1, score - 0.4)
              positiveEvidence.push({
                source: metric.source,
                questionText: metric.questionText,
                response: `${metric.value}%`,
                weight: metric.confidence,
                relevanceScore: metric.relevanceToRisk,
                context: `Excellente couverture (${metric.value}%) réduit l'impact potentiel`
              })
            }
          }
        }
      })

      // Analyser la maturité de l'entreprise
      const maturityImpact = this.getMaturityImpactAdjustment(evaluationInsights.companyMaturity)
      score = Math.min(5, score + maturityImpact)

      if (maturityImpact !== 0) {
        contextualFactors.push({
          factor: `Maturité sécuritaire: ${evaluationInsights.companyMaturity}`,
          impact: maturityImpact > 0 ? 'negative' : 'positive',
          magnitude: Math.abs(maturityImpact),
          explanation: `La maturité sécuritaire influence la capacité de réponse et de récupération`,
          supportingEvidence: [`Score moyen: ${Math.round(evaluationInsights.averageScore)}%`]
        })
      }

      // Analyser les actifs critiques basés sur les évaluations
      const criticalAssets = this.identifyCriticalAssets(evaluationInsights.extractedMetrics)
      if (criticalAssets.length > 0) {
        score = Math.min(5, score + 0.3)
        negativeEvidence.push({
          source: 'Analyse des actifs',
          questionText: 'Présence d\'actifs critiques',
          response: criticalAssets.join(', '),
          weight: 0.9,
          relevanceScore: 0.8,
          context: `Actifs critiques identifiés: ${criticalAssets.length} éléments`
        })
      }
    }

    // Analyse contextuelle du scénario
    const scenarioImpact = this.analyzeScenarioImpact(riskContext.scenario)
    score = Math.min(5, score + scenarioImpact.adjustment)

    if (scenarioImpact.factors.length > 0) {
      scenarioImpact.factors.forEach(factor => {
        contextualFactors.push(factor)
      })
    }

    // Raisonnement basé sur la qualité des preuves
    const reasoning = this.generateImpactReasoning(
      score,
      analysisContext,
      positiveEvidence,
      negativeEvidence,
      contextualFactors
    )

    return {
      score: Math.round(score),
      explanation: this.generateImpactExplanation(score, analysisContext, evaluationInsights),
      positiveEvidence,
      negativeEvidence,
      contextualFactors,
      confidence: this.calculateConfidence(positiveEvidence, negativeEvidence, analysisContext),
      reasoning
    }
  }
  
  private generateOverallAssessment(
    riskContext: RiskContext,
    probability: AdvancedRecommendation,
    vulnerability: AdvancedRecommendation,
    impact: AdvancedRecommendation,
    insights: ContextualInsight[],
    patterns: CrossEvaluationPattern[]
  ): string {
    // Génération de l'évaluation globale
    return 'Évaluation globale basée sur le raisonnement avancé'
  }
  
  private generateIntelligentQuestionnaireRecommendations(
    riskContext: RiskContext,
    analysisContext: any,
    insights: ContextualInsight[]
  ): QuestionnaireRecommendation[] {
    // Génération de recommandations intelligentes
    return []
  }
  
  private calculateOverallConfidence(
    probability: AdvancedRecommendation,
    vulnerability: AdvancedRecommendation,
    impact: AdvancedRecommendation,
    analysisContext: any
  ): number {
    // Calcul du niveau de confiance global
    return (probability.confidence + vulnerability.confidence + impact.confidence) / 3
  }
  
  private generateProbabilityReasoning(
    score: number,
    analysisContext: any,
    positiveEvidence: Evidence[],
    negativeEvidence: Evidence[],
    contextualFactors: ContextualFactor[]
  ): string {
    // Génération du raisonnement pour la probabilité
    return 'Raisonnement basé sur l\'analyse contextuelle'
  }
  
  private generateProbabilityExplanation(score: number, analysisContext: any, insights?: any): string {
    let explanation = `**Score de probabilité: ${score}/3**\n\n`

    if (score === 1) {
      explanation += 'Probabilité **FAIBLE** - Le scénario est peu susceptible de se produire dans les conditions actuelles.'
    } else if (score === 2) {
      explanation += 'Probabilité **MODÉRÉE** - Le scénario peut se produire dans certaines circonstances.'
    } else {
      explanation += 'Probabilité **ÉLEVÉE** - Le scénario est susceptible de se produire dans les conditions actuelles.'
    }

    if (insights) {
      explanation += `\n\nBasé sur l'analyse de ${insights.totalResponses} réponses d'évaluation.`
    }

    return explanation
  }

  // Helper methods for enhanced scoring
  private isMetricRelevantToVulnerability(metric: any): boolean {
    const vulnerabilityKeywords = [
      'protection', 'sécurité', 'contrôle', 'surveillance', 'accès',
      'clôture', 'barrière', 'système', 'alarme', 'détection'
    ]

    const questionText = metric.questionText.toLowerCase()
    return vulnerabilityKeywords.some(keyword => questionText.includes(keyword))
  }

  private isDomainRelevantToVulnerability(domain: string): boolean {
    const vulnerabilityDomains = ['physical_security', 'infrastructure', 'emergency_response']
    return vulnerabilityDomains.includes(domain)
  }

  private isMetricRelevantToImpact(metric: any): boolean {
    const impactKeywords = [
      'critique', 'essentiel', 'important', 'vital', 'stratégique',
      'continuité', 'récupération', 'sauvegarde', 'redondance'
    ]

    const questionText = metric.questionText.toLowerCase()
    return impactKeywords.some(keyword => questionText.includes(keyword))
  }

  private getSectorImpactMultiplier(sector: string): number {
    const sectorMultipliers: Record<string, number> = {
      'mining': 1.4,
      'minier': 1.4,
      'finance': 1.3,
      'financier': 1.3,
      'energy': 1.3,
      'énergie': 1.3,
      'healthcare': 1.2,
      'santé': 1.2,
      'manufacturing': 1.1,
      'industrie': 1.1,
      'retail': 0.9,
      'commerce': 0.9,
      'services': 0.8
    }

    const sectorLower = sector.toLowerCase()
    return sectorMultipliers[sectorLower] || 1.0
  }

  private getMaturityImpactAdjustment(maturity: string): number {
    switch (maturity) {
      case 'low': return 0.5
      case 'medium': return 0
      case 'high': return -0.3
      default: return 0
    }
  }

  private identifyCriticalAssets(metrics: any[]): string[] {
    const criticalAssets: string[] = []

    metrics.forEach(metric => {
      const questionText = metric.questionText.toLowerCase()
      if (questionText.includes('critique') || questionText.includes('essentiel')) {
        if (metric.type === 'boolean' && metric.value === true) {
          criticalAssets.push(metric.questionText)
        }
      }
    })

    return criticalAssets
  }

  private analyzeScenarioImpact(scenario: string): { adjustment: number, factors: ContextualFactor[] } {
    const factors: ContextualFactor[] = []
    let adjustment = 0

    const scenarioLower = scenario.toLowerCase()

    // Analyser les mots-clés d'impact élevé
    const highImpactKeywords = ['explosion', 'incendie', 'vol', 'sabotage', 'intrusion', 'cyberattaque']
    const mediumImpactKeywords = ['panne', 'défaillance', 'erreur', 'négligence']

    highImpactKeywords.forEach(keyword => {
      if (scenarioLower.includes(keyword)) {
        adjustment += 0.5
        factors.push({
          factor: `Scénario à impact élevé: ${keyword}`,
          impact: 'negative',
          magnitude: 0.5,
          explanation: `Le terme "${keyword}" indique un potentiel d'impact élevé`,
          supportingEvidence: [scenario]
        })
      }
    })

    mediumImpactKeywords.forEach(keyword => {
      if (scenarioLower.includes(keyword)) {
        adjustment += 0.2
        factors.push({
          factor: `Scénario à impact modéré: ${keyword}`,
          impact: 'negative',
          magnitude: 0.2,
          explanation: `Le terme "${keyword}" indique un impact modéré`,
          supportingEvidence: [scenario]
        })
      }
    })

    return { adjustment, factors }
  }

  private generateVulnerabilityReasoning(
    score: number,
    analysisContext: any,
    positiveEvidence: Evidence[],
    negativeEvidence: Evidence[],
    contextualFactors: ContextualFactor[]
  ): string {
    return `Analyse de vulnérabilité basée sur ${positiveEvidence.length + negativeEvidence.length} éléments de preuve.`
  }

  private generateVulnerabilityExplanation(score: number, analysisContext: any, insights?: any): string {
    let explanation = `**Score de vulnérabilité: ${score}/4**\n\n`

    if (score === 1) {
      explanation += 'Vulnérabilité **TRÈS FAIBLE** - Protections robustes en place.'
    } else if (score === 2) {
      explanation += 'Vulnérabilité **FAIBLE** - Protections adéquates avec quelques améliorations possibles.'
    } else if (score === 3) {
      explanation += 'Vulnérabilité **MODÉRÉE** - Protections partielles, améliorations nécessaires.'
    } else {
      explanation += 'Vulnérabilité **ÉLEVÉE** - Protections insuffisantes, actions urgentes requises.'
    }

    if (insights) {
      explanation += `\n\nBasé sur l'analyse de ${insights.totalResponses} réponses d'évaluation.`
    }

    return explanation
  }

  private generateImpactReasoning(
    score: number,
    analysisContext: any,
    positiveEvidence: Evidence[],
    negativeEvidence: Evidence[],
    contextualFactors: ContextualFactor[]
  ): string {
    return `Analyse d'impact basée sur ${positiveEvidence.length + negativeEvidence.length} éléments de preuve et ${contextualFactors.length} facteurs contextuels.`
  }

  private generateImpactExplanation(score: number, analysisContext: any, insights?: any): string {
    let explanation = `**Score d'impact: ${score}/5**\n\n`

    if (score <= 1) {
      explanation += 'Impact **NÉGLIGEABLE** - Conséquences mineures et facilement gérables.'
    } else if (score === 2) {
      explanation += 'Impact **FAIBLE** - Conséquences limitées avec récupération rapide.'
    } else if (score === 3) {
      explanation += 'Impact **MODÉRÉ** - Conséquences significatives nécessitant des mesures de récupération.'
    } else if (score === 4) {
      explanation += 'Impact **ÉLEVÉ** - Conséquences importantes avec perturbations majeures.'
    } else {
      explanation += 'Impact **CRITIQUE** - Conséquences catastrophiques menaçant la continuité.'
    }

    if (insights) {
      explanation += `\n\nBasé sur l'analyse de ${insights.totalResponses} réponses d'évaluation et le contexte sectoriel.`
    }

    return explanation
  }
  
  private calculateConfidence(
    positiveEvidence: Evidence[],
    negativeEvidence: Evidence[],
    analysisContext: any
  ): number {
    const totalEvidence = positiveEvidence.length + negativeEvidence.length
    const evidenceQuality = analysisContext.evidenceQuality || 0
    const dataCompleteness = Math.min(1, totalEvidence / 10) // Normalisation sur 10 preuves

    // Facteurs de confiance
    const qualityFactor = evidenceQuality * 0.4
    const quantityFactor = dataCompleteness * 0.3
    const consistencyFactor = this.assessEvidenceConsistency(positiveEvidence, negativeEvidence) * 0.3

    return Math.min(0.95, Math.max(0.5, qualityFactor + quantityFactor + consistencyFactor))
  }

  // Méthodes utilitaires supplémentaires
  private extractKeywords(text: string): string[] {
    const stopWords = ['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'ou', 'à', 'dans', 'sur', 'pour', 'par']
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 10) // Limiter à 10 mots-clés
  }

  private assessContextualRelevance(response: EvaluationResponse, riskContext: RiskContext): number {
    // Évaluation de la pertinence contextuelle basée sur des règles métier
    let relevance = 0

    const questionLower = response.questionText.toLowerCase()
    const targetLower = riskContext.target.toLowerCase()
    const scenarioLower = riskContext.scenario.toLowerCase()

    // Règles de pertinence contextuelle
    if (targetLower.includes('accès') && questionLower.includes('contrôle')) relevance += 0.8
    if (scenarioLower.includes('intrusion') && questionLower.includes('surveillance')) relevance += 0.7
    if (targetLower.includes('données') && questionLower.includes('protection')) relevance += 0.9
    if (scenarioLower.includes('personnel') && questionLower.includes('formation')) relevance += 0.6

    return Math.min(1, relevance)
  }

  private assessQuestionComplexity(questionText: string): number {
    const length = questionText.length
    const wordCount = questionText.split(/\s+/).length
    const hasMultipleConcepts = questionText.includes('et') || questionText.includes('ou')

    let complexity = 0.3 // Base
    if (length > 50) complexity += 0.2
    if (wordCount > 10) complexity += 0.2
    if (hasMultipleConcepts) complexity += 0.3

    return Math.min(1, complexity)
  }

  private normalizeQuestionText(text: string): string {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50)
  }

  private assessWeaknessSeverity(response: EvaluationResponse): number {
    // Évaluation de la sévérité basée sur le contenu de la question
    const questionLower = response.questionText.toLowerCase()

    if (questionLower.includes('critique') || questionLower.includes('essentiel')) return 0.9
    if (questionLower.includes('sécurité') || questionLower.includes('protection')) return 0.8
    if (questionLower.includes('contrôle') || questionLower.includes('surveillance')) return 0.7

    return 0.5 // Sévérité par défaut
  }

  private assessRiskRelevance(response: EvaluationResponse): string {
    const questionLower = response.questionText.toLowerCase()

    if (questionLower.includes('probabilité') || questionLower.includes('fréquence')) {
      return 'probabilité élevée'
    }
    if (questionLower.includes('vulnérabilité') || questionLower.includes('faiblesse')) {
      return 'vulnérabilité critique'
    }
    if (questionLower.includes('impact') || questionLower.includes('conséquence')) {
      return 'impact majeur'
    }

    return 'pertinence générale'
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0

    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length
  }

  private detectDegradationPattern(evaluations: EvaluationContext[], riskContext: RiskContext): CrossEvaluationPattern | null {
    const scores = evaluations.filter(e => e.totalScore !== undefined).map(e => e.totalScore!)
    if (scores.length < 3) return null

    // Vérifier si les scores diminuent de manière significative
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
    const secondHalf = scores.slice(Math.floor(scores.length / 2))

    const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length

    if (firstAvg - secondAvg > 10) { // Dégradation de plus de 10 points
      return {
        pattern: 'Dégradation temporelle des scores de sécurité',
        evaluationsInvolved: evaluations.map(e => e.id),
        strength: (firstAvg - secondAvg) / 100,
        implication: `Diminution de ${(firstAvg - secondAvg).toFixed(1)} points entre les premières et dernières évaluations`,
        riskRelevance: 'Augmentation de la probabilité et de la vulnérabilité'
      }
    }

    return null
  }

  private detectImprovementPattern(evaluations: EvaluationContext[], riskContext: RiskContext): CrossEvaluationPattern | null {
    // Implémentation similaire à detectDegradationPattern mais pour l'amélioration
    return null
  }

  private detectCyclicalPattern(evaluations: EvaluationContext[], riskContext: RiskContext): CrossEvaluationPattern | null {
    // Détection de patterns cycliques dans les scores
    return null
  }

  private analyzeSectorSpecificPattern(evaluations: EvaluationContext[], sector: string, riskContext: RiskContext): CrossEvaluationPattern | null {
    // Analyse des patterns spécifiques à un secteur
    return null
  }

  private detectResponseInconsistencies(evaluations: EvaluationContext[], riskContext: RiskContext): ContextualInsight | null {
    // Détection d'incohérences dans les réponses
    return null
  }

  private analyzeTemporalScoreTrend(evaluations: EvaluationContext[]): ContextualInsight | null {
    // Analyse des tendances temporelles des scores
    return null
  }

  private analyzeDomainTrends(evaluations: EvaluationContext[], riskContext: RiskContext): ContextualInsight[] {
    // Analyse des tendances par domaine
    return []
  }

  private calculateDomainCorrelation(evaluations: EvaluationContext[], domain1: string, domain2: string, riskContext: RiskContext): any {
    // Calcul de corrélation entre domaines
    return { coefficient: 0, evidence: [] }
  }

  private mapDomainsToRiskCriteria(domain1: string, domain2: string): ('probability' | 'vulnerability' | 'impact')[] {
    // Mapping des domaines aux critères de risque
    return ['probability', 'vulnerability']
  }

  private assessEvidenceConsistency(positiveEvidence: Evidence[], negativeEvidence: Evidence[]): number {
    // Évaluation de la cohérence des preuves
    const totalEvidence = positiveEvidence.length + negativeEvidence.length
    if (totalEvidence === 0) return 0.5

    // Calculer la cohérence basée sur les poids et scores de pertinence
    const avgPositiveWeight = positiveEvidence.length > 0 ?
      positiveEvidence.reduce((sum, e) => sum + e.weight, 0) / positiveEvidence.length : 0
    const avgNegativeWeight = negativeEvidence.length > 0 ?
      negativeEvidence.reduce((sum, e) => sum + e.weight, 0) / negativeEvidence.length : 0

    // Plus les poids sont équilibrés, plus la cohérence est élevée
    const weightBalance = 1 - Math.abs(avgPositiveWeight - avgNegativeWeight)

    return Math.max(0.3, Math.min(0.9, weightBalance))
  }
}
