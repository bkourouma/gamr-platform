// Service d'analyse IA amélioré utilisant le moteur de raisonnement avancé

import { AdvancedRiskReasoningEngine } from './advanced-risk-reasoning'
import { StructuredPromptBuilder } from './structured-prompt-builder'
import { EvidenceCitationTracker } from './evidence-citation-tracker'
import { OpenAIRiskAnalysisService, createAnalysisRequest } from './openai-risk-analysis'
import { getOpenAIConfig, isAIAnalysisEnabled, shouldUseMockResponses } from './ai-config'
import { classifyEvaluationResponses } from './semantic-impact-classifier'


interface AIRecommendation {
  score: number
  explanation: string
  positivePoints: string[]
  negativePoints: string[]
  confidence: number
  reasoning?: string
  contextualFactors?: any[]
  evidence?: any[]
}

interface AIAnalysisResult {
  probability: AIRecommendation
  vulnerability: AIRecommendation
  impact: AIRecommendation
  overallAssessment: string
  basedOnEvaluations: string[]
  questionnaireRecommendations: QuestionnaireRecommendation[]
  questionnaireImprovements?: string[]
  contextualInsights?: any[]
  crossEvaluationPatterns?: any[]
  confidenceLevel?: number
  reasoningQuality: 'high' | 'medium' | 'low'
}

interface QuestionnaireRecommendation {
  category: string
  reason: string
  suggestedQuestions: string[]
  priority?: 'high' | 'medium' | 'low'
  expectedInsight?: string
}

interface RiskFormData {
  target: string
  scenario: string
  category?: string
}

interface Evaluation {
  id: string
  title: string
  status?: string
  totalScore?: number
  riskLevel?: string
  entityInfo?: any
  template?: any
  responses?: any[]
  completedAt?: string
}

// ===== ENHANCED DATA EXTRACTION ENGINE =====

interface ExtractedMetric {
  type: 'percentage' | 'boolean' | 'score' | 'text' | 'count'
  value: any
  source: string
  questionText: string
  confidence: number
  relevanceToRisk: number
  category: SecurityDomain
}

interface SecurityDomain {
  name: string
  keywords: string[]
  weight: number
}

interface EvaluationInsights {
  totalResponses: number
  totalEvaluations: number
  averageScore: number
  criticalWeaknesses: string[]
  strengthAreas: string[]
  extractedMetrics: ExtractedMetric[]
  domainScores: Record<string, number>
  patterns: CrossEvaluationPattern[]
  evidenceQuality: number
  sectorContext: string
  companyMaturity: 'low' | 'medium' | 'high'
}

interface CrossEvaluationPattern {
  pattern: string
  frequency: number
  evaluationsInvolved: string[]
  riskRelevance: string[]
  strength: number
  implication: string
}

/**
 * Enhanced Data Extraction Engine
 * Processes evaluation data to extract meaningful insights for risk analysis
 */
class EnhancedDataExtractionEngine {

  private securityDomains: SecurityDomain[] = [
    {
      name: 'infrastructure',
      keywords: ['infrastructure', 'équipement', 'système', 'installation', 'maintenance', 'technique'],
      weight: 1.0
    },
    {
      name: 'personnel',
      keywords: ['personnel', 'employé', 'formation', 'training', 'compétence', 'sensibilisation'],
      weight: 0.9
    },
    {
      name: 'procedures',
      keywords: ['procédure', 'processus', 'protocole', 'instruction', 'manuel', 'documentation'],
      weight: 0.8
    },
    {
      name: 'physical_security',
      keywords: ['sécurité', 'accès', 'contrôle', 'surveillance', 'clôture', 'périmètre', 'protection'],
      weight: 1.0
    },
    {
      name: 'emergency_response',
      keywords: ['urgence', 'emergency', 'incident', 'crise', 'évacuation', 'secours', 'communication'],
      weight: 0.9
    },
    {
      name: 'maintenance',
      keywords: ['maintenance', 'entretien', 'réparation', 'service', 'vérification', 'contrôle'],
      weight: 0.7
    }
  ]

  /**
   * Extracts comprehensive insights from all evaluations
   */
  public extractEvaluationInsights(evaluations: Evaluation[]): EvaluationInsights {
    const insights: EvaluationInsights = {
      totalResponses: 0,
      totalEvaluations: evaluations.length,
      averageScore: 0,
      criticalWeaknesses: [],
      strengthAreas: [],
      extractedMetrics: [],
      domainScores: {},
      patterns: [],
      evidenceQuality: 0,
      sectorContext: this.determineSectorContext(evaluations),
      companyMaturity: 'medium'
    }

    // Process all responses across evaluations
    const allResponses: any[] = []
    evaluations.forEach(evaluation => {
      if (evaluation.responses) {
        allResponses.push(...evaluation.responses.map(r => ({
          ...r,
          evaluationId: evaluation.id,
          evaluationTitle: evaluation.title,
          evaluationScore: evaluation.totalScore,
          ouiMeansPositive: r?.question?.ouiMeansPositive !== false
        })))
      }
    })

    insights.totalResponses = allResponses.length

    // Extract metrics from responses
    insights.extractedMetrics = this.extractMetricsFromResponses(allResponses)

    // Calculate domain scores
    insights.domainScores = this.calculateDomainScores(allResponses)

    // Identify patterns
    insights.patterns = this.identifyPatterns(evaluations, allResponses)

    // Determine critical weaknesses and strengths
    insights.criticalWeaknesses = this.identifyCriticalWeaknesses(allResponses, insights.extractedMetrics)
    insights.strengthAreas = this.identifyStrengthAreas(allResponses, insights.extractedMetrics)

    // Calculate average score
    const scoredEvaluations = evaluations.filter(e => e.totalScore !== undefined)
    if (scoredEvaluations.length > 0) {
      insights.averageScore = scoredEvaluations.reduce((sum, e) => sum + (e.totalScore || 0), 0) / scoredEvaluations.length
    }

    // Assess evidence quality
    insights.evidenceQuality = this.assessEvidenceQuality(insights.extractedMetrics)

    // Determine company maturity
    insights.companyMaturity = this.determineCompanyMaturity(insights)

    return insights
  }

  /**
   * Extracts specific metrics from evaluation responses
   */
  private extractMetricsFromResponses(responses: any[]): ExtractedMetric[] {
    const metrics: ExtractedMetric[] = []

    responses.forEach(response => {
      const questionText = response.question?.text || response.questionText || ''

      // Extract percentage values
      const percentageMatch = response.textValue?.match(/(\d+)%/) ||
                             response.description?.match(/(\d+)%/)
      if (percentageMatch) {
        metrics.push({
          type: 'percentage',
          value: parseInt(percentageMatch[1]),
          source: response.evaluationTitle || 'Unknown',
          questionText,
          confidence: 0.9,
          relevanceToRisk: this.calculateRelevanceToRisk(questionText),
          category: this.categorizeQuestion(questionText)
        })
      }

      // Extract boolean responses (interpretation based on template setting)
      if (response.booleanValue !== undefined) {
        const yesMeansPositive = response.ouiMeansPositive !== false
        const interpretedAsProtective = yesMeansPositive ? response.booleanValue : !response.booleanValue
        metrics.push({
          type: 'boolean',
          value: interpretedAsProtective,
          source: response.evaluationTitle || 'Unknown',
          questionText,
          confidence: 1.0,
          relevanceToRisk: this.calculateRelevanceToRisk(questionText),
          category: this.categorizeQuestion(questionText)
        })
      }

      // Extract numerical scores
      if (response.facilityScore !== undefined || response.constraintScore !== undefined) {
        metrics.push({
          type: 'score',
          value: {
            facility: response.facilityScore,
            constraint: response.constraintScore
          },
          source: response.evaluationTitle || 'Unknown',
          questionText,
          confidence: 0.8,
          relevanceToRisk: this.calculateRelevanceToRisk(questionText),
          category: this.categorizeQuestion(questionText)
        })
      }

      // Extract text insights
      if (response.textValue && response.textValue.length > 10) {
        metrics.push({
          type: 'text',
          value: response.textValue,
          source: response.evaluationTitle || 'Unknown',
          questionText,
          confidence: 0.6,
          relevanceToRisk: this.calculateRelevanceToRisk(questionText),
          category: this.categorizeQuestion(questionText)
        })
      }
    })

    return metrics.sort((a, b) => b.relevanceToRisk - a.relevanceToRisk)
  }

  /**
   * Calculates domain scores based on responses
   */
  private calculateDomainScores(responses: any[]): Record<string, number> {
    const domainScores: Record<string, number> = {}

    this.securityDomains.forEach(domain => {
      const relevantResponses = responses.filter(r =>
        this.isResponseRelevantToDomain(r, domain)
      )

      if (relevantResponses.length > 0) {
        const positiveResponses = relevantResponses.filter(r =>
          r.booleanValue === true || (r.facilityScore && r.facilityScore > r.constraintScore)
        ).length

        domainScores[domain.name] = (positiveResponses / relevantResponses.length) * 100
      } else {
        domainScores[domain.name] = 50 // Default neutral score
      }
    })

    return domainScores
  }

  /**
   * Identifies patterns across evaluations
   */
  private identifyPatterns(evaluations: Evaluation[], responses: any[]): CrossEvaluationPattern[] {
    const patterns: CrossEvaluationPattern[] = []

    // Pattern 1: Recurring negative responses
    const negativeResponsesByQuestion = new Map<string, string[]>()
    responses.forEach(response => {
      if (response.booleanValue === false) {
        const questionKey = response.question?.text || response.questionText || 'unknown'
        if (!negativeResponsesByQuestion.has(questionKey)) {
          negativeResponsesByQuestion.set(questionKey, [])
        }
        negativeResponsesByQuestion.get(questionKey)!.push(response.evaluationId)
      }
    })

    negativeResponsesByQuestion.forEach((evaluationIds, questionText) => {
      if (evaluationIds.length >= 2) { // Pattern if appears in 2+ evaluations
        const frequency = evaluationIds.length / evaluations.length
        patterns.push({
          pattern: `Réponse négative récurrente: ${questionText}`,
          frequency,
          evaluationsInvolved: evaluationIds,
          riskRelevance: this.determineRiskRelevance(questionText),
          strength: frequency,
          implication: `Cette faiblesse apparaît dans ${Math.round(frequency * 100)}% des évaluations`
        })
      }
    })

    // Pattern 2: Low domain scores across evaluations
    const domainScoresByEvaluation = evaluations.map(evaluation => ({
      id: evaluation.id,
      scores: this.calculateDomainScores(responses.filter(r => r.evaluationId === evaluation.id))
    }))

    this.securityDomains.forEach(domain => {
      const lowScoreEvaluations = domainScoresByEvaluation.filter(evaluation =>
        evaluation.scores[domain.name] < 40
      )

      if (lowScoreEvaluations.length >= 2) {
        const frequency = lowScoreEvaluations.length / evaluations.length
        patterns.push({
          pattern: `Score faible récurrent en ${domain.name}`,
          frequency,
          evaluationsInvolved: lowScoreEvaluations.map(e => e.id),
          riskRelevance: [domain.name, 'vulnerability'],
          strength: frequency,
          implication: `Faiblesse systémique en ${domain.name} (${Math.round(frequency * 100)}% des évaluations)`
        })
      }
    })

    return patterns.sort((a, b) => b.strength - a.strength)
  }

  /**
   * Helper methods
   */
  private categorizeQuestion(questionText: string): SecurityDomain {
    const text = questionText.toLowerCase()

    for (const domain of this.securityDomains) {
      if (domain.keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
        return domain
      }
    }

    return this.securityDomains[0] // Default to infrastructure
  }

  private calculateRelevanceToRisk(questionText: string): number {
    const riskKeywords = [
      'sécurité', 'risque', 'menace', 'vulnérabilité', 'protection', 'contrôle',
      'surveillance', 'accès', 'incident', 'urgence', 'maintenance', 'défaillance'
    ]

    const text = questionText.toLowerCase()
    const matchCount = riskKeywords.filter(keyword => text.includes(keyword)).length

    return Math.min(1.0, matchCount / 3) // Normalize to 0-1 scale
  }

  private isResponseRelevantToDomain(response: any, domain: SecurityDomain): boolean {
    const questionText = (response.question?.text || response.questionText || '').toLowerCase()
    return domain.keywords.some(keyword => questionText.includes(keyword.toLowerCase()))
  }

  private determineRiskRelevance(questionText: string): string[] {
    const relevance: string[] = []
    const text = questionText.toLowerCase()

    if (text.includes('maintenance') || text.includes('entretien') || text.includes('défaillance')) {
      relevance.push('probabilité')
    }
    if (text.includes('protection') || text.includes('sécurité') || text.includes('contrôle')) {
      relevance.push('vulnérabilité')
    }
    if (text.includes('critique') || text.includes('important') || text.includes('essentiel')) {
      relevance.push('impact')
    }

    return relevance.length > 0 ? relevance : ['général']
  }

  private identifyCriticalWeaknesses(responses: any[], metrics: ExtractedMetric[]): string[] {
    const weaknesses: string[] = []

    // Identify from boolean responses
    const criticalNegatives = responses.filter(r =>
      r.booleanValue === false && this.calculateRelevanceToRisk(r.question?.text || r.questionText || '') > 0.7
    )

    criticalNegatives.forEach(response => {
      const questionText = response.question?.text || response.questionText || ''
      weaknesses.push(`Absence: ${questionText}`)
    })

    // Identify from low percentages
    const lowPercentages = metrics.filter(m =>
      m.type === 'percentage' && m.value < 50 && m.relevanceToRisk > 0.6
    )

    lowPercentages.forEach(metric => {
      weaknesses.push(`Faible taux: ${metric.questionText} (${metric.value}%)`)
    })

    return weaknesses.slice(0, 5) // Limit to top 5
  }

  private identifyStrengthAreas(responses: any[], metrics: ExtractedMetric[]): string[] {
    const strengths: string[] = []

    // Identify from boolean responses
    const positives = responses.filter(r =>
      r.booleanValue === true && this.calculateRelevanceToRisk(r.question?.text || r.questionText || '') > 0.7
    )

    positives.forEach(response => {
      const questionText = response.question?.text || response.questionText || ''
      strengths.push(`Présence: ${questionText}`)
    })

    // Identify from high percentages
    const highPercentages = metrics.filter(m =>
      m.type === 'percentage' && m.value > 80 && m.relevanceToRisk > 0.6
    )

    highPercentages.forEach(metric => {
      strengths.push(`Bon taux: ${metric.questionText} (${metric.value}%)`)
    })

    return strengths.slice(0, 5) // Limit to top 5
  }

  private assessEvidenceQuality(metrics: ExtractedMetric[]): number {
    if (metrics.length === 0) return 0

    const avgConfidence = metrics.reduce((sum, m) => sum + m.confidence, 0) / metrics.length
    const avgRelevance = metrics.reduce((sum, m) => sum + m.relevanceToRisk, 0) / metrics.length
    const diversityScore = new Set(metrics.map(m => m.category.name)).size / this.securityDomains.length

    return (avgConfidence * 0.4 + avgRelevance * 0.4 + diversityScore * 0.2) * 100
  }

  private determineCompanyMaturity(insights: EvaluationInsights): 'low' | 'medium' | 'high' {
    const avgDomainScore = Object.values(insights.domainScores).reduce((sum, score) => sum + score, 0) / Object.keys(insights.domainScores).length

    if (avgDomainScore > 75) return 'high'
    if (avgDomainScore > 50) return 'medium'
    return 'low'
  }

  private determineSectorContext(evaluations: Evaluation[]): string {
    const sectors = evaluations
      .map(e => e.entityInfo?.sector)
      .filter(s => s)
      .reduce((acc: Record<string, number>, sector: string) => {
        acc[sector] = (acc[sector] || 0) + 1
        return acc
      }, {})

    const mostCommonSector = Object.entries(sectors).sort(([,a], [,b]) => b - a)[0]
    return mostCommonSector ? mostCommonSector[0] : 'Non spécifié'
  }
}

/**
 * Génère une analyse IA avancée basée sur le moteur de raisonnement
 */
export async function generateEnhancedAIAnalysis(
  riskData: RiskFormData,
  evaluations: Evaluation[]
): Promise<AIAnalysisResult> {

  // Initialize the enhanced data extraction engine
  const dataExtractor = new EnhancedDataExtractionEngine()

  // Extract comprehensive insights from evaluations
  const evaluationInsights = dataExtractor.extractEvaluationInsights(evaluations)

  // Initialize the structured prompt builder
  const promptBuilder = new StructuredPromptBuilder()

  // Initialize the evidence citation tracker
  const evidenceTracker = new EvidenceCitationTracker()
  evidenceTracker.addEvidenceFromEvaluations(evaluations)

  // If no meaningful data, return basic analysis
  if (evaluationInsights.totalResponses === 0) {
    return generateBasicAnalysis(riskData, evaluations)
  }

  // Use the advanced reasoning engine with enhanced context
  const reasoningEngine = new AdvancedRiskReasoningEngine()

  // Conversion des évaluations au format attendu par le moteur
  const evaluationContexts = evaluations.map(evaluation => ({
    id: evaluation.id,
    title: evaluation.title,
    status: evaluation.status || 'COMPLETED',
    totalScore: evaluation.totalScore,
    riskLevel: evaluation.riskLevel,
    entityInfo: evaluation.entityInfo,
    template: evaluation.template,
    responses: (evaluation.responses || []).map(response => ({
      questionId: response.questionId || `q_${Math.random()}`,
      questionText: response.questionText || response.question?.text || '',
      booleanValue: response.booleanValue,
      textValue: response.textValue,
      numberValue: response.numberValue,
      facilityScore: response.facilityScore,
      constraintScore: response.constraintScore,
      objectiveId: response.objectiveId,
      sectionId: response.sectionId
    })),
    completedAt: evaluation.completedAt,
    sector: evaluation.entityInfo?.sector,
    companySize: evaluation.entityInfo?.companySize
  }))

  // Contexte du risque enrichi avec les insights
  const riskContext = {
    target: riskData.target,
    scenario: riskData.scenario,
    category: riskData.category,
    evaluationInsights // Add the extracted insights
  }

  try {
    // Analyse avec le moteur de raisonnement avancé
    const reasoningResult = await reasoningEngine.analyzeRisk(riskContext, evaluationContexts)

    // Enhanced conversion with better evidence formatting
    // Map by semantics (no swapping). Support both keys from OpenAI (positiveEvidence/negativeEvidence)
    // and simulation (positivePoints/negativePoints)
    let probPositive = reasoningResult.probability.positiveEvidence || reasoningResult.probability.positivePoints || []
    let probNegative = reasoningResult.probability.negativeEvidence || reasoningResult.probability.negativePoints || []
    let vulnPositive = reasoningResult.vulnerability.positiveEvidence || reasoningResult.vulnerability.positivePoints || []
    let vulnNegative = reasoningResult.vulnerability.negativeEvidence || reasoningResult.vulnerability.negativePoints || []
    let impactPositive = reasoningResult.impact.positiveEvidence || reasoningResult.impact.positivePoints || []
    let impactNegative = reasoningResult.impact.negativeEvidence || reasoningResult.impact.negativePoints || []

    // NEW: Reclassify based on item-wise semantic classification when we have evaluation responses
    try {
      const { classifyEvaluationResponses } = await import('./semantic-impact-classifier')
      const probCls = await classifyEvaluationResponses(evaluations as any[], 'probability')
      const vulnCls = await classifyEvaluationResponses(evaluations as any[], 'vulnerability')
      const impCls = await classifyEvaluationResponses(evaluations as any[], 'impact')
      if (probCls.positives.length + probCls.negatives.length > 0) {
        // Prefer deterministic item-level classification output
        ;(reasoningResult as any).probability = {
          ...reasoningResult.probability,
          positiveEvidence: probCls.positives,
          negativeEvidence: probCls.negatives
        }
        probPositive = (reasoningResult as any).probability.positiveEvidence
        probNegative = (reasoningResult as any).probability.negativeEvidence
      }
      if (vulnCls.positives.length + vulnCls.negatives.length > 0) {
        ;(reasoningResult as any).vulnerability = {
          ...reasoningResult.vulnerability,
          positiveEvidence: vulnCls.positives,
          negativeEvidence: vulnCls.negatives
        }
        vulnPositive = (reasoningResult as any).vulnerability.positiveEvidence
        vulnNegative = (reasoningResult as any).vulnerability.negativeEvidence
      }
      if (impCls.positives.length + impCls.negatives.length > 0) {
        ;(reasoningResult as any).impact = {
          ...reasoningResult.impact,
          positiveEvidence: impCls.positives,
          negativeEvidence: impCls.negatives
        }
        impactPositive = (reasoningResult as any).impact.positiveEvidence
        impactNegative = (reasoningResult as any).impact.negativeEvidence
      }
    } catch {
      // optional
    }

    const result: AIAnalysisResult = {
      probability: {
        score: reasoningResult.probability.score,
        explanation: enhanceExplanationWithInsights(reasoningResult.probability.explanation, evaluationInsights, 'probability'),
        positivePoints: formatEvidencePoints(probPositive, evaluationInsights),
        negativePoints: formatEvidencePoints(probNegative, evaluationInsights),
        confidence: reasoningResult.probability.confidence,
        reasoning: reasoningResult.probability.reasoning,
        contextualFactors: reasoningResult.probability.contextualFactors,
        evidence: probPositive.concat(probNegative)
      },

      vulnerability: {
        score: reasoningResult.vulnerability.score,
        explanation: enhanceExplanationWithInsights(reasoningResult.vulnerability.explanation, evaluationInsights, 'vulnerability'),
        positivePoints: formatEvidencePoints(vulnPositive, evaluationInsights),
        negativePoints: formatEvidencePoints(vulnNegative, evaluationInsights),
        confidence: reasoningResult.vulnerability.confidence,
        reasoning: reasoningResult.vulnerability.reasoning,
        contextualFactors: reasoningResult.vulnerability.contextualFactors,
        evidence: vulnPositive.concat(vulnNegative)
      },

      impact: {
        score: reasoningResult.impact.score,
        explanation: enhanceExplanationWithInsights(reasoningResult.impact.explanation, evaluationInsights, 'impact'),
        positivePoints: formatEvidencePoints(impactPositive, evaluationInsights),
        negativePoints: formatEvidencePoints(impactNegative, evaluationInsights),
        confidence: reasoningResult.impact.confidence,
        reasoning: reasoningResult.impact.reasoning,
        contextualFactors: reasoningResult.impact.contextualFactors,
        evidence: impactPositive.concat(impactNegative)
      },

      overallAssessment: generateEnhancedOverallAssessment(riskData, reasoningResult, evaluationInsights),
      basedOnEvaluations: evaluations.map(e => e.title),
      questionnaireRecommendations: (reasoningResult.questionnaireRecommendations || []).map(rec => ({
        category: rec.category,
        reason: rec.reason,
        suggestedQuestions: rec.suggestedQuestions,
        priority: rec.priority,
        expectedInsight: rec.expectedInsight
      })),
      contextualInsights: reasoningResult.contextualInsights,
      crossEvaluationPatterns: reasoningResult.crossEvaluationPatterns,
      confidenceLevel: reasoningResult.confidenceLevel,
      reasoningQuality: determineReasoningQuality(reasoningResult, evaluationContexts)
    }
    // Ensure both positive and negative points have substance for each criterion.
    // If the LLM returned only one side, complement using simulated insight-based generation.
    const probFallback = generateSimulatedProbabilityResponse(evaluationInsights)
    if (!result.probability.positivePoints || result.probability.positivePoints.length === 0 || result.probability.positivePoints[0].includes('Aucun élément')) {
      result.probability.positivePoints = probFallback.positivePoints
    }
    if (!result.probability.negativePoints || result.probability.negativePoints.length === 0 || result.probability.negativePoints[0].includes('Aucun élément')) {
      result.probability.negativePoints = probFallback.negativePoints
    }

    const vulnFallback = generateSimulatedVulnerabilityResponse(evaluationInsights)
    if (!result.vulnerability.positivePoints || result.vulnerability.positivePoints.length === 0 || result.vulnerability.positivePoints[0].includes('Aucun élément')) {
      result.vulnerability.positivePoints = vulnFallback.positivePoints
    }
    if (!result.vulnerability.negativePoints || result.vulnerability.negativePoints.length === 0 || result.vulnerability.negativePoints[0].includes('Aucun élément')) {
      result.vulnerability.negativePoints = vulnFallback.negativePoints
    }

    const impactFallback = generateSimulatedImpactResponse(evaluationInsights)
    if (!result.impact.positivePoints || result.impact.positivePoints.length === 0 || result.impact.positivePoints[0].includes('Aucun élément')) {
      result.impact.positivePoints = impactFallback.positivePoints
    }
    if (!result.impact.negativePoints || result.impact.negativePoints.length === 0 || result.impact.negativePoints[0].includes('Aucun élément')) {
      result.impact.negativePoints = impactFallback.negativePoints
    }

    // Validation et amélioration des résultats
    return validateAndEnhanceResults(result, riskData, evaluations)

  } catch (error) {
    console.error('Erreur dans l\'analyse IA avancée:', error)

    // Fallback vers l'analyse simple en cas d'erreur
    return generateFallbackAnalysis(riskData, evaluations)
  }
}

/**
 * Détermine la qualité du raisonnement basé sur les résultats
 */
function determineReasoningQuality(reasoningResult: any, evaluations: any[]): 'high' | 'medium' | 'low' {
  // Handle both OpenAI response format (positiveEvidence/negativeEvidence) and simulation format (positivePoints/negativePoints)
  const probabilityPositive = reasoningResult.probability.positiveEvidence || reasoningResult.probability.positivePoints || []
  const probabilityNegative = reasoningResult.probability.negativeEvidence || reasoningResult.probability.negativePoints || []

  const factors = {
    evidenceQuantity: (probabilityPositive.length + probabilityNegative.length) / 10,
    confidenceLevel: reasoningResult.confidenceLevel || reasoningResult.probability.confidence || 0.5,
    evaluationCount: Math.min(1, evaluations.length / 5),
    insightCount: (reasoningResult.contextualInsights || []).length / 5
  }

  const qualityScore = (factors.evidenceQuantity * 0.3 +
                       factors.confidenceLevel * 0.4 +
                       factors.evaluationCount * 0.2 +
                       factors.insightCount * 0.1)

  if (qualityScore >= 0.8) return 'high'
  if (qualityScore >= 0.6) return 'medium'
  return 'low'
}

/**
 * Valide et améliore les résultats de l'analyse
 */
function validateAndEnhanceResults(
  result: AIAnalysisResult,
  riskData: RiskFormData,
  evaluations: Evaluation[]
): AIAnalysisResult {

  // Validation des scores (doivent être dans les bonnes plages)
  result.probability.score = Math.max(1, Math.min(3, result.probability.score))
  result.vulnerability.score = Math.max(1, Math.min(4, result.vulnerability.score))
  result.impact.score = Math.max(1, Math.min(5, result.impact.score))

  // Assurer qu'il y a au moins un point positif et négatif
  if (result.probability.positivePoints.length === 0) {
    result.probability.positivePoints.push('Aucun élément positif disponible dans les évaluations')
  }
  if (result.probability.negativePoints.length === 0) {
    result.probability.negativePoints.push('Aucun élément négatif disponible dans les évaluations')
  }

  // Même validation pour vulnérabilité et impact
  if (result.vulnerability.positivePoints.length === 0) {
    result.vulnerability.positivePoints.push('Aucun élément protecteur disponible dans les évaluations')
  }
  if (result.vulnerability.negativePoints.length === 0) {
    result.vulnerability.negativePoints.push('Aucune vulnérabilité disponible dans les évaluations')
  }

  if (result.impact.positivePoints.length === 0) {
    result.impact.positivePoints.push('Aucun élément atténuant disponible dans les évaluations')
  }
  if (result.impact.negativePoints.length === 0) {
    result.impact.negativePoints.push('Aucun facteur aggravant disponible dans les évaluations')
  }

  return result
}

/**
 * Analyse de fallback en cas d'erreur du moteur avancé
 */
function generateFallbackAnalysis(
  riskData: RiskFormData,
  evaluations: Evaluation[]
): AIAnalysisResult {

  return {
    probability: {
      score: 2,
      explanation: 'Analyse de base - Probabilité modérée par défaut',
      positivePoints: ['Analyse de base utilisée en raison d\'une erreur technique'],
      negativePoints: ['Données insuffisantes pour une analyse approfondie'],
      confidence: 0.5
    },
    vulnerability: {
      score: 2,
      explanation: 'Analyse de base - Vulnérabilité modérée par défaut',
      positivePoints: ['Analyse de base utilisée en raison d\'une erreur technique'],
      negativePoints: ['Données insuffisantes pour une analyse approfondie'],
      confidence: 0.5
    },
    impact: {
      score: 3,
      explanation: 'Analyse de base - Impact modéré par défaut',
      positivePoints: ['Analyse de base utilisée en raison d\'une erreur technique'],
      negativePoints: ['Données insuffisantes pour une analyse approfondie'],
      confidence: 0.5
    },
    overallAssessment: 'Analyse de base utilisée. Veuillez vérifier la qualité des données d\'évaluation.',
    basedOnEvaluations: evaluations.map(e => e.title),
    questionnaireRecommendations: [],
    reasoningQuality: 'low'
  }
}

/**
 * Helper functions for enhanced analysis
 */

function formatEvidencePoints(evidence: any[], insights: EvaluationInsights, evidenceTracker?: EvidenceCitationTracker): string[] {
  if (!evidence || evidence.length === 0) {
    return ['Aucun élément disponible dans les évaluations']
  }

  return evidence.map(e => {
    // Find corresponding metric for additional context
    const relatedMetric = insights.extractedMetrics.find(m =>
      m.questionText.includes(e.questionText) || e.questionText.includes(m.questionText)
    )

    let formattedPoint = `${e.questionText}`

    if (e.response) {
      formattedPoint += ` - ${e.response}`
    }

    if (relatedMetric && relatedMetric.type === 'percentage') {
      formattedPoint += ` (${relatedMetric.value}%)`
    }

    formattedPoint += ` (Source: ${e.source})`

    // Add confidence indicator if available
    if (e.weight && e.weight < 0.5) {
      formattedPoint += ` [Confiance: ${Math.round(e.weight * 100)}%]`
    }

    return formattedPoint
  })
}

function enhanceExplanationWithInsights(
  baseExplanation: string,
  insights: EvaluationInsights,
  criterion: string
): string {
  let enhanced = baseExplanation

  // Add context about data quality
  enhanced += `\n\n**Contexte d'analyse:**`
  enhanced += `\n- ${insights.totalResponses} réponses analysées sur ${insights.totalEvaluations} évaluations`
  enhanced += `\n- Qualité des preuves: ${Math.round(insights.evidenceQuality)}%`
  enhanced += `\n- Secteur: ${insights.sectorContext}`
  enhanced += `\n- Maturité sécuritaire: ${insights.companyMaturity}`

  // Add relevant domain scores
  const relevantDomains = Object.entries(insights.domainScores)
    .filter(([domain, score]) => score < 60 || score > 80)
    .sort(([,a], [,b]) => Math.abs(50 - b) - Math.abs(50 - a))
    .slice(0, 3)

  if (relevantDomains.length > 0) {
    enhanced += `\n\n**Scores par domaine:**`
    relevantDomains.forEach(([domain, score]) => {
      enhanced += `\n- ${domain}: ${Math.round(score)}%`
    })
  }

  return enhanced
}

function generateEnhancedOverallAssessment(
  riskData: RiskFormData,
  reasoningResult: any,
  insights: EvaluationInsights
): string {
  const riskScore = reasoningResult.probability.score * reasoningResult.vulnerability.score * reasoningResult.impact.score
  const normalizedScore = Math.round((riskScore / 60) * 100)

  let assessment = `Analyse IA Avancée - GAMR Platform\n\n`

  assessment += `Cible analysée: ${riskData.target}\n`
  assessment += `Scénario: ${riskData.scenario}\n\n`

  assessment += `Score de risque: ${normalizedScore}/100 (${riskScore}/60)\n`
  assessment += `Qualité de l'analyse: ${reasoningResult.reasoningQuality || 'Standard'}\n`
  assessment += `Niveau de confiance: ${Math.round(reasoningResult.confidenceLevel || 70)}%\n\n`

  assessment += `Données analysées:\n`
  assessment += `- ${insights.totalEvaluations} évaluations complètes\n`
  assessment += `- ${insights.totalResponses} réponses d'évaluation\n`
  assessment += `- ${insights.extractedMetrics.length} métriques extraites\n`
  assessment += `- ${insights.patterns.length} patterns identifiés\n\n`

  if (insights.patterns.length > 0) {
    assessment += `Patterns cross-évaluations:\n`
    insights.patterns.slice(0, 2).forEach(pattern => {
      assessment += `• ${pattern.pattern} (${Math.round(pattern.frequency * 100)}% des évaluations)\n`
    })
    assessment += `\n`
  }

  assessment += `Recommandations prioritaires:\n`
  if (normalizedScore > 70) {
    assessment += `• Risque élevé - Actions immédiates requises\n`
    assessment += `• Révision des mesures de sécurité existantes\n`
    assessment += `• Mise en place de contrôles additionnels\n`
  } else if (normalizedScore > 40) {
    assessment += `• Risque modéré - Surveillance renforcée\n`
    assessment += `• Amélioration des procédures existantes\n`
    assessment += `• Formation du personnel\n`
  } else {
    assessment += `• Risque faible - Maintien des mesures actuelles\n`
    assessment += `• Surveillance continue\n`
    assessment += `• Optimisation des processus\n`
  }

  return assessment
}

function generateBasicAnalysis(riskData: RiskFormData, evaluations: Evaluation[]): AIAnalysisResult {
  return {
    probability: {
      score: 2,
      explanation: 'Analyse de base - données d\'évaluation limitées disponibles',
      positivePoints: ['Aucun élément disponible dans les évaluations'],
      negativePoints: ['Données insuffisantes pour une analyse détaillée'],
      confidence: 0.3
    },
    vulnerability: {
      score: 2,
      explanation: 'Analyse de base - données d\'évaluation limitées disponibles',
      positivePoints: ['Aucun élément disponible dans les évaluations'],
      negativePoints: ['Données insuffisantes pour une analyse détaillée'],
      confidence: 0.3
    },
    impact: {
      score: 3,
      explanation: 'Analyse de base - évaluation générique basée sur le type de cible',
      positivePoints: ['Aucun élément disponible dans les évaluations'],
      negativePoints: ['Données insuffisantes pour une analyse détaillée'],
      confidence: 0.3
    },
    overallAssessment: `**Analyse limitée**\n\nCible: ${riskData.target}\nScénario: ${riskData.scenario}\n\nAnalyse limitée en raison de données d'évaluation insuffisantes. Pour une analyse plus précise, veuillez compléter des évaluations sécuritaires détaillées.`,
    basedOnEvaluations: evaluations.map(e => e.title),
    questionnaireRecommendations: [
      {
        category: 'Évaluation générale',
        reason: 'Données insuffisantes pour l\'analyse',
        suggestedQuestions: [
          'Évaluation complète de sécurité physique',
          'Audit des procédures de sécurité',
          'Évaluation de la formation du personnel'
        ],
        priority: 'high'
      }
    ],
    reasoningQuality: 'low'
  }
}

/**
 * Generates structured prompts for AI analysis using the prompt builder
 */
export function generateStructuredPrompts(
  riskData: RiskFormData,
  evaluationInsights: EvaluationInsights
): {
  probabilityPrompt: any,
  vulnerabilityPrompt: any,
  impactPrompt: any
} {
  const promptBuilder = new StructuredPromptBuilder()

  const promptContext = {
    target: riskData.target,
    scenario: riskData.scenario,
    category: riskData.category,
    evaluationInsights,
    analysisType: 'probability' as const
  }

  const probabilityPrompt = promptBuilder.buildProbabilityPrompt({
    ...promptContext,
    analysisType: 'probability'
  })

  const vulnerabilityPrompt = promptBuilder.buildVulnerabilityPrompt({
    ...promptContext,
    analysisType: 'vulnerability'
  })

  const impactPrompt = promptBuilder.buildImpactPrompt({
    ...promptContext,
    analysisType: 'impact'
  })

  return {
    probabilityPrompt,
    vulnerabilityPrompt,
    impactPrompt
  }
}

/**
 * Performs real AI analysis using OpenAI with structured prompts
 */
export async function performOpenAIAnalysis(
  prompts: any,
  evaluationInsights: EvaluationInsights,
  openAIService?: OpenAIRiskAnalysisService
): Promise<{
  probability: any,
  vulnerability: any,
  impact: any
}> {
  // Check if AI analysis is enabled and configured
  if (!isAIAnalysisEnabled() || shouldUseMockResponses()) {
    console.log('🔄 Using simulated AI analysis (disabled or mock mode)')
    return simulateAIAnalysisWithPrompts(prompts, evaluationInsights)
  }

  // Use provided service or create configured instance
  const aiService = openAIService || new OpenAIRiskAnalysisService(getOpenAIConfig())

  try {
    // Create analysis requests from structured prompts
    const probabilityRequest = createAnalysisRequest(prompts.probabilityPrompt, 'probability')
    const vulnerabilityRequest = createAnalysisRequest(prompts.vulnerabilityPrompt, 'vulnerability')
    const impactRequest = createAnalysisRequest(prompts.impactPrompt, 'impact')

    console.log('🤖 Starting OpenAI analysis...')

    // Perform real AI analysis
    const results = await aiService.analyzeAllCriteria(
      probabilityRequest,
      vulnerabilityRequest,
      impactRequest
    )

    console.log('✅ OpenAI analysis completed successfully')
    console.log('🔍 OpenAI Results:', results)
    console.log('🔍 Probability:', JSON.stringify(results.probability, null, 2))
    console.log('🔍 Vulnerability:', JSON.stringify(results.vulnerability, null, 2))
    console.log('🔍 Impact:', JSON.stringify(results.impact, null, 2))

    return {
      probability: results.probability,
      vulnerability: results.vulnerability,
      impact: results.impact
    }

  } catch (error) {
    console.error('❌ OpenAI analysis failed, falling back to simulation:', error.message)

    // Fallback to simulation if OpenAI fails
    return simulateAIAnalysisWithPrompts(prompts, evaluationInsights)
  }
}

/**
 * Simulates AI analysis using structured prompts (fallback)
 */
export async function simulateAIAnalysisWithPrompts(
  prompts: any,
  evaluationInsights: EvaluationInsights
): Promise<{
  probability: any,
  vulnerability: any,
  impact: any
}> {
  console.log('⚠️ Using simulated AI analysis (fallback mode)')

  // Generate realistic responses based on the evaluation data
  const probability = generateSimulatedProbabilityResponse(evaluationInsights)
  const vulnerability = generateSimulatedVulnerabilityResponse(evaluationInsights)
  const impact = generateSimulatedImpactResponse(evaluationInsights)

  return {
    probability,
    vulnerability,
    impact
  }
}

function generateSimulatedProbabilityResponse(insights: EvaluationInsights): any {
  // Generate a realistic probability analysis based on insights
  const score = insights.averageScore < 50 ? 3 : insights.averageScore < 75 ? 2 : 1

  const positivePoints: string[] = []
  const negativePoints: string[] = []

  // Extract positive points from strength areas
  insights.strengthAreas.slice(0, 3).forEach(strength => {
    positivePoints.push(`${strength} (Source: Analyse des évaluations)`)
  })

  // Extract negative points from critical weaknesses
  insights.criticalWeaknesses.slice(0, 3).forEach(weakness => {
    negativePoints.push(`${weakness} (Source: Analyse des évaluations)`)
  })

  // Add domain-specific points
  Object.entries(insights.domainScores).forEach(([domain, score]) => {
    if (score > 80) {
      positivePoints.push(`Score élevé en ${domain}: ${Math.round(score)}% (Source: Analyse des domaines)`)
    } else if (score < 40) {
      negativePoints.push(`Score faible en ${domain}: ${Math.round(score)}% (Source: Analyse des domaines)`)
    }
  })

  return {
    score,
    explanation: `Probabilité ${score === 1 ? 'FAIBLE' : score === 2 ? 'MODÉRÉE' : 'ÉLEVÉE'} basée sur l'analyse de ${insights.totalResponses} réponses d'évaluation.`,
    positivePoints: positivePoints.length > 0 ? positivePoints : ['Aucun élément disponible dans les évaluations'],
    negativePoints: negativePoints.length > 0 ? negativePoints : ['Aucun élément disponible dans les évaluations'],
    confidence: insights.evidenceQuality / 100
  }
}

function generateSimulatedVulnerabilityResponse(insights: EvaluationInsights): any {
  // Generate a realistic vulnerability analysis based on insights
  const avgDomainScore = Object.values(insights.domainScores).reduce((sum, score) => sum + score, 0) / Object.keys(insights.domainScores).length
  const score = avgDomainScore < 30 ? 4 : avgDomainScore < 50 ? 3 : avgDomainScore < 75 ? 2 : 1

  const positivePoints: string[] = []
  const negativePoints: string[] = []

  // Extract points from domain scores
  Object.entries(insights.domainScores).forEach(([domain, domainScore]) => {
    if (domainScore > 75) {
      positivePoints.push(`Protection robuste en ${domain}: ${Math.round(domainScore)}% (Source: Analyse des domaines)`)
    } else if (domainScore < 50) {
      negativePoints.push(`Vulnérabilité en ${domain}: ${Math.round(domainScore)}% (Source: Analyse des domaines)`)
    }
  })

  // Add pattern-based points
  insights.patterns.forEach(pattern => {
    if (pattern.riskRelevance.includes('vulnérabilité')) {
      negativePoints.push(`${pattern.pattern} (Source: Analyse des patterns)`)
    }
  })

  return {
    score,
    explanation: `Vulnérabilité ${score === 1 ? 'TRÈS FAIBLE' : score === 2 ? 'FAIBLE' : score === 3 ? 'MODÉRÉE' : 'ÉLEVÉE'} basée sur l'analyse des domaines sécuritaires.`,
    positivePoints: positivePoints.length > 0 ? positivePoints : ['Aucun élément disponible dans les évaluations'],
    negativePoints: negativePoints.length > 0 ? negativePoints : ['Aucun élément disponible dans les évaluations'],
    confidence: insights.evidenceQuality / 100
  }
}

function generateSimulatedImpactResponse(insights: EvaluationInsights): any {
  // Generate a realistic impact analysis based on insights and sector
  let score = 3 // Base score

  // Adjust based on sector
  if (insights.sectorContext.toLowerCase().includes('minier') || insights.sectorContext.toLowerCase().includes('mining')) {
    score = Math.min(5, score + 1)
  } else if (insights.sectorContext.toLowerCase().includes('finance')) {
    score = Math.min(5, score + 0.5)
  }

  // Adjust based on company maturity
  if (insights.companyMaturity === 'low') {
    score = Math.min(5, score + 0.5)
  } else if (insights.companyMaturity === 'high') {
    score = Math.max(1, score - 0.5)
  }

  const positivePoints: string[] = []
  const negativePoints: string[] = []

  // Add sector-specific points
  positivePoints.push(`Secteur d'activité: ${insights.sectorContext} (Source: Analyse sectorielle)`)

  // Add maturity-based points
  if (insights.companyMaturity === 'high') {
    positivePoints.push(`Maturité sécuritaire élevée réduit l'impact potentiel (Source: Analyse de maturité)`)
  } else if (insights.companyMaturity === 'low') {
    negativePoints.push(`Maturité sécuritaire faible augmente l'impact potentiel (Source: Analyse de maturité)`)
  }

  // Add critical asset points
  if (insights.criticalWeaknesses.length > 3) {
    negativePoints.push(`Nombreuses faiblesses critiques identifiées: ${insights.criticalWeaknesses.length} éléments (Source: Analyse des faiblesses)`)
  }

  return {
    score: Math.round(score),
    explanation: `Impact ${score <= 1 ? 'NÉGLIGEABLE' : score === 2 ? 'FAIBLE' : score === 3 ? 'MODÉRÉ' : score === 4 ? 'ÉLEVÉ' : 'CRITIQUE'} considérant le contexte sectoriel et la maturité organisationnelle.`,
    positivePoints: positivePoints.length > 0 ? positivePoints : ['Aucun élément disponible dans les évaluations'],
    negativePoints: negativePoints.length > 0 ? negativePoints : ['Aucun élément disponible dans les évaluations'],
    confidence: insights.evidenceQuality / 100
  }
}

/**
 * Generates enhanced analysis with proper evidence citations
 */
export async function generateAnalysisWithCitations(
  riskData: RiskFormData,
  evaluations: Evaluation[]
): Promise<AIAnalysisResult> {

  // Initialize all engines
  const dataExtractor = new EnhancedDataExtractionEngine()
  const evidenceTracker = new EvidenceCitationTracker()

  // Extract insights and add evidence
  const evaluationInsights = dataExtractor.extractEvaluationInsights(evaluations)
  evidenceTracker.addEvidenceFromEvaluations(evaluations)

  // Generate structured prompts
  const prompts = generateStructuredPrompts(riskData, evaluationInsights)

  // Perform real AI analysis with OpenAI
  const aiResponses = await performOpenAIAnalysis(prompts, evaluationInsights)

  // Create citations for each criterion
  const probabilityEvidence = evidenceTracker.findRelevantEvidence('probability', 5)
  const vulnerabilityEvidence = evidenceTracker.findRelevantEvidence('vulnerability', 5)
  const impactEvidence = evidenceTracker.findRelevantEvidence('impact', 5)

  // Generate citations
  probabilityEvidence.forEach(evidence => {
    const supportType = aiResponses.probability.score > 2 ? 'negative' : 'positive'
    evidenceTracker.createCitation(evidence.id, 'probability', supportType)
  })

  vulnerabilityEvidence.forEach(evidence => {
    const supportType = aiResponses.vulnerability.score > 2 ? 'negative' : 'positive'
    evidenceTracker.createCitation(evidence.id, 'vulnerability', supportType)
  })

  impactEvidence.forEach(evidence => {
    const supportType = aiResponses.impact.score > 3 ? 'negative' : 'positive'
    evidenceTracker.createCitation(evidence.id, 'impact', supportType)
  })

  // Get formatted citations
  const probabilityCitations = evidenceTracker.getFormattedCitations('probability')
  const vulnerabilityCitations = evidenceTracker.getFormattedCitations('vulnerability')
  const impactCitations = evidenceTracker.getFormattedCitations('impact')

  // Validate citations
  const citationValidation = evidenceTracker.validateCitations()

  // Build final result using semantic classification only for points
  const riskContext = { target: riskData.target, scenario: riskData.scenario }
  const probCls = await classifyEvaluationResponses(evaluations as any[], 'probability', riskContext)
  const vulnCls = await classifyEvaluationResponses(evaluations as any[], 'vulnerability', riskContext)
  const impCls = await classifyEvaluationResponses(evaluations as any[], 'impact', riskContext)

  const result: AIAnalysisResult = {
    probability: {
      score: aiResponses.probability.score,
      explanation: aiResponses.probability.explanation,
      positivePoints: probCls.positives,
      negativePoints: probCls.negatives,
      confidence: aiResponses.probability.confidence
    },
    vulnerability: {
      score: aiResponses.vulnerability.score,
      explanation: aiResponses.vulnerability.explanation,
      positivePoints: vulnCls.positives,
      negativePoints: vulnCls.negatives,
      confidence: aiResponses.vulnerability.confidence
    },
    impact: {
      score: aiResponses.impact.score,
      explanation: aiResponses.impact.explanation,
      positivePoints: impCls.positives,
      negativePoints: impCls.negatives,
      confidence: aiResponses.impact.confidence
    },
    overallAssessment: generateEnhancedOverallAssessment(
      riskData,
      {
        probability: aiResponses.probability,
        vulnerability: aiResponses.vulnerability,
        impact: aiResponses.impact,
        confidenceLevel: (aiResponses.probability.confidence + aiResponses.vulnerability.confidence + aiResponses.impact.confidence) / 3
      },
      evaluationInsights
    ),
    basedOnEvaluations: evaluations.map(e => e.title),
    questionnaireRecommendations: generateQuestionnaireRecommendations(evaluationInsights, citationValidation),
    reasoningQuality: determineReasoningQuality(aiResponses, evaluations)
  }

  // Add AI-proposed questionnaire improvements (5 new, non-duplicate questions)
  try {
    result.questionnaireImprovements = await generateQuestionnaireImprovements(riskData, evaluations, evaluationInsights)
  } catch {
    result.questionnaireImprovements = generateHeuristicImprovements(riskData, evaluations, evaluationInsights)
  }

  return result
}

function generateQuestionnaireRecommendations(
  insights: EvaluationInsights,
  citationValidation: any
): QuestionnaireRecommendation[] {
  const recommendations: QuestionnaireRecommendation[] = []

  // Add recommendations based on citation validation issues
  if (citationValidation.issues.length > 0) {
    recommendations.push({
      category: 'Amélioration des données',
      reason: 'Données d\'évaluation insuffisantes pour une analyse complète',
      suggestedQuestions: [
        'Évaluation détaillée de la maintenance préventive',
        'Audit complet des systèmes de sécurité',
        'Évaluation de la formation du personnel'
      ],
      priority: 'high'
    })
  }

  // Add domain-specific recommendations based on low scores
  Object.entries(insights.domainScores).forEach(([domain, score]) => {
    if (score < 50) {
      recommendations.push({
        category: `Amélioration ${domain}`,
        reason: `Score faible détecté en ${domain} (${Math.round(score)}%)`,
        suggestedQuestions: [
          `Évaluation approfondie du domaine ${domain}`,
          `Audit spécialisé ${domain}`,
          `Plan d'amélioration ${domain}`
        ],
        priority: score < 30 ? 'high' : 'medium'
      })
    }
  })

  return recommendations
}

// ===== Questionnaire Improvements (5 AI-proposed questions) =====
async function generateQuestionnaireImprovements(
  riskData: RiskFormData,
  evaluations: Evaluation[],
  insights: EvaluationInsights
): Promise<string[]> {
  const existingQuestions = new Set<string>(
    evaluations.flatMap(e => (e.responses || []).map(r => r.question?.text || r.questionText || '')).filter(Boolean)
  )

  const context = {
    target: riskData.target,
    scenario: riskData.scenario,
    sector: insights.sectorContext,
    weaknesses: insights.criticalWeaknesses.slice(0, 5),
    lowDomains: Object.entries(insights.domainScores)
      .filter(([, s]) => s < 55)
      .map(([d]) => d)
      .slice(0, 4)
  }

  // Use OpenAI if enabled
  try {
    if (!isAIAnalysisEnabled() || shouldUseMockResponses()) {
      throw new Error('AI disabled or mock mode')
    }
    const aiService = new OpenAIRiskAnalysisService(getOpenAIConfig())
    const systemPrompt = `Tu es un expert en sûreté/sécurité. Génère 5 questions de questionnaire en FRANÇAIS, non présentes dans les évaluations actuelles, utiles pour mieux évaluer le SCÉNARIO DE MENACE, la VULNÉRABILITÉ et les RÉPERCUSSIONS. Contraintes de style:\n- Chaque question commence par l’un de: "Avez-vous", "Est-ce que", "Quels sont", "Comment", "Qui"\n- Une seule phrase, concrète et vérifiable (demander preuves, procédures, fréquences, responsables)\n- Évite les formulations génériques comme "Quelles mesures de contrôle supplémentaires sont nécessaires" ou "Pourquoi"\n- Pas de redondance avec les questions existantes; adapter au contexte cible/scénario/secteur.`
    const userPrompt = `Contexte:\n- Cible: ${context.target}\n- Scénario: ${context.scenario}\n- Secteur: ${context.sector}\n- Faiblesses: ${context.weaknesses.join(', ') || 'Aucune'}\n- Domaines faibles: ${context.lowDomains.join(', ') || 'Aucun'}\n\nQuestions déjà présentes (exemples): ${Array.from(existingQuestions).slice(0, 50).join(' | ')}\n\nTâche: Propose 5 questions (style check-list) respectant les contraintes.`
    const outputFormat = `Réponds STRICTEMENT en JSON: { "questions": ["Avez-vous ...?", "Est-ce que ...?", "Quels sont ...?", "Comment ...?", "Qui ...?"] }`
    const payload: any = {
      model: aiService.getConfig().model || 'gpt-5',
      instructions: systemPrompt,
      input: `${userPrompt}\n\n${outputFormat}`,
      stream: false,
      max_output_tokens: 600,
      text: { format: 'json' }
    }
    const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(getOpenAIConfig() as any).apiKey || (import.meta as any).env?.VITE_OPENAI_API_KEY || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    if (!resp.ok) throw new Error('OpenAI error')
    const data = await resp.json()
    let content: string | undefined = data.output_text
    if (!content && Array.isArray(data.output)) {
      const first = data.output[0]
      const node = first?.content?.find?.((c: any) => c.type === 'output_text' || c.type === 'text') || first?.content?.[0]
      content = node?.text || node?.value || node?.content
    }
    if (!content) throw new Error('No content')
    const parsed = JSON.parse(content)
    const raw: string[] = Array.isArray(parsed.questions) ? parsed.questions : []
    const deduped = raw
      .map(q => String(q).trim())
      .filter(q => q.length > 0 && !existingQuestions.has(q))
      .slice(0, 5)
    if (deduped.length >= 3) return deduped
    // If AI returned too few, complement with heuristic
    return completeWithHeuristics(deduped, riskData, evaluations, insights)
  } catch {
    return generateHeuristicImprovements(riskData, evaluations, insights)
  }
}

function generateHeuristicImprovements(
  riskData: RiskFormData,
  evaluations: Evaluation[],
  insights: EvaluationInsights
): string[] {
  const seed: string[] = []
  const sector = insights.sectorContext || 'secteur'
  const target = riskData.target || 'actif critique'
  const scenario = riskData.scenario || 'scénario de menace'
  const domainLabel = (d: string) => ({
    infrastructure: 'infrastructures',
    personnel: 'personnel',
    procedures: 'procédures',
    physical_security: 'sécurité physique',
    emergency_response: "réponse d'urgence",
    maintenance: 'maintenance'
  } as Record<string, string>)[d] || d

  // Based on low domains
  const lowDomains = Object.entries(insights.domainScores)
    .filter(([, s]) => s < 55)
    .map(([d]) => d)
    .slice(0, 3)
  lowDomains.forEach(d => {
    const dl = domainLabel(d)
    seed.push(`Avez-vous des procédures formalisées en ${dl} pour ${target} face au ${scenario} (références et responsables) ?`)
  })

  // Based on critical weaknesses
  insights.criticalWeaknesses.slice(0, 2).forEach(w => {
    seed.push(`Quels sont les contrôles documentés en place pour traiter la faiblesse suivante: ${w} (fréquence de revue et preuves) ?`)
  })

  // Sector/response improvement
  seed.push(`Quels sont les indicateurs d'alerte précoce spécifiques au secteur ${sector} surveillés pour ${target} (sources et seuils) ?`)
  seed.push(`Est-ce que des procédures d'escalade et de communication d'urgence sont testées pour ${target} en cas de ${scenario} (périodicité et comptes-rendus) ?`)
  seed.push(`Comment l'accès aux zones sensibles liées à ${target} est-il autorisé, journalisé et revu pendant ${scenario} ?`)

  // Deduplicate against existing
  const existingQuestions = new Set<string>(
    evaluations.flatMap(e => (e.responses || []).map(r => r.question?.text || r.questionText || '')).filter(Boolean)
  )
  const out = seed.filter(q => q && !existingQuestions.has(q)).slice(0, 5)
  return out.length > 0 ? out : [
    `Avez-vous une procédure de contrôle d'accès formalisée pour ${target} (droits, revues, exceptions) ?`,
    `Est-ce que des exercices de réponse d'urgence sont réalisés pour ${target} (périmètre, fréquence, retours d'expérience) ?`,
    `Quels sont les journaux collectés et revus quotidiennement sur ${target} pour détecter ${scenario} ?`,
    `Comment les prestataires/intervenants sont-ils autorisés et supervisés sur ${target} (badges, escortes, registres) ?`,
    `Qui valide les accès exceptionnels à ${target} hors horaires et comment est-ce consigné ?`
  ]
}

function completeWithHeuristics(
  current: string[],
  riskData: RiskFormData,
  evaluations: Evaluation[],
  insights: EvaluationInsights
): string[] {
  const extra = generateHeuristicImprovements(riskData, evaluations, insights)
  const merged: string[] = []
  const seen = new Set<string>()
  for (const q of [...current, ...extra]) {
    const t = q.trim()
    if (t && !seen.has(t)) {
      merged.push(t)
      seen.add(t)
    }
    if (merged.length >= 5) break
  }
  return merged
}
