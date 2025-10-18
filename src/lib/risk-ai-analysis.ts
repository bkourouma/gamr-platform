// Service d'analyse IA pour les fiches de risques basé sur les évaluations

interface AIRecommendation {
  score: number
  explanation: string
  positivePoints: string[]
  negativePoints: string[]
  confidence: number
}

interface AIAnalysisResult {
  probability: AIRecommendation
  vulnerability: AIRecommendation
  impact: AIRecommendation
  overallAssessment: string
  basedOnEvaluations: string[]
  questionnaireRecommendations: QuestionnaireRecommendation[]
}

interface QuestionnaireRecommendation {
  category: string
  reason: string
  suggestedQuestions: string[]
}

interface RiskFormData {
  target: string
  scenario: string
  category?: string
}

interface Evaluation {
  id: string
  title: string
  responses?: any[]
  entityInfo?: any
  template?: any
}

interface EvaluationResponse {
  questionText: string
  booleanValue?: boolean
  textValue?: string
  numericValue?: number
  objectiveId?: number
}

/**
 * Génère une analyse IA complète basée sur les réponses aux évaluations
 */
export async function generateAIAnalysis(
  riskData: RiskFormData, 
  evaluations: Evaluation[]
): Promise<AIAnalysisResult> {
  
  // Analyser les réponses des évaluations pour extraire des insights
  const evaluationInsights = analyzeEvaluationResponses(evaluations)
  
  // Analyser la probabilité
  const probabilityAnalysis = analyzeProbability(riskData, evaluationInsights)
  
  // Analyser la vulnérabilité
  const vulnerabilityAnalysis = analyzeVulnerability(riskData, evaluationInsights)
  
  // Analyser l'impact
  const impactAnalysis = analyzeImpact(riskData, evaluationInsights)
  
  // Évaluation globale
  const overallAssessment = generateOverallAssessment(
    riskData,
    probabilityAnalysis,
    vulnerabilityAnalysis,
    impactAnalysis,
    evaluationInsights
  )

  // Recommandations de questionnaires
  const questionnaireRecommendations = generateQuestionnaireRecommendations(
    riskData,
    evaluationInsights
  )

  return {
    probability: probabilityAnalysis,
    vulnerability: vulnerabilityAnalysis,
    impact: impactAnalysis,
    overallAssessment,
    basedOnEvaluations: evaluations.map(e => e.title),
    questionnaireRecommendations
  }
}

/**
 * Analyse les réponses des évaluations pour extraire des insights
 */
function analyzeEvaluationResponses(evaluations: Evaluation[]) {
  const insights = {
    securityLevel: 'medium',
    criticalWeaknesses: [] as string[],
    strengths: [] as string[],
    accessControlScore: 0,
    perimeterSecurityScore: 0,
    personnelTrainingScore: 0,
    incidentHistoryScore: 0,
    surveillanceScore: 0,
    lightingScore: 0,
    proceduresScore: 0,
    totalResponses: 0,
    negativeResponses: 0,
    positiveResponses: [] as EvaluationResponse[],
    negativeResponsesList: [] as EvaluationResponse[],
    responsesByCategory: {
      access: [] as EvaluationResponse[],
      perimeter: [] as EvaluationResponse[],
      surveillance: [] as EvaluationResponse[],
      lighting: [] as EvaluationResponse[],
      training: [] as EvaluationResponse[],
      procedures: [] as EvaluationResponse[],
      incidents: [] as EvaluationResponse[],
      infrastructure: [] as EvaluationResponse[]
    }
  }
  
  evaluations.forEach(evaluation => {
    if (evaluation.responses) {
      evaluation.responses.forEach((response: any) => {
        insights.totalResponses++
        const questionLower = response.questionText?.toLowerCase() || ''

        // Catégoriser les réponses
        if (questionLower.includes('contrôle d\'accès') || questionLower.includes('accès') || questionLower.includes('badge')) {
          insights.responsesByCategory.access.push(response)
        }
        if (questionLower.includes('clôture') || questionLower.includes('périmètre') || questionLower.includes('barrière')) {
          insights.responsesByCategory.perimeter.push(response)
        }
        if (questionLower.includes('surveillance') || questionLower.includes('caméra') || questionLower.includes('vidéo')) {
          insights.responsesByCategory.surveillance.push(response)
        }
        if (questionLower.includes('éclairage') || questionLower.includes('lumière')) {
          insights.responsesByCategory.lighting.push(response)
        }
        if (questionLower.includes('formation') || questionLower.includes('sensibilisation') || questionLower.includes('entraînement')) {
          insights.responsesByCategory.training.push(response)
        }
        if (questionLower.includes('procédure') || questionLower.includes('protocole') || questionLower.includes('consigne')) {
          insights.responsesByCategory.procedures.push(response)
        }
        if (questionLower.includes('incident') || questionLower.includes('intrusion') || questionLower.includes('vol')) {
          insights.responsesByCategory.incidents.push(response)
        }
        if (questionLower.includes('infrastructure') || questionLower.includes('électricité') || questionLower.includes('eau')) {
          insights.responsesByCategory.infrastructure.push(response)
        }

        // Analyser les réponses négatives (indicateurs de faiblesse)
        if (response.booleanValue === false) {
          insights.negativeResponses++
          insights.negativeResponsesList.push(response)

          // Identifier les faiblesses critiques avec scores détaillés
          if (questionLower.includes('contrôle d\'accès') || questionLower.includes('accès')) {
            insights.criticalWeaknesses.push(`Contrôle d'accès défaillant: "${response.questionText}"`)
            insights.accessControlScore -= 15
          }

          if (questionLower.includes('clôture') || questionLower.includes('périmètre')) {
            insights.criticalWeaknesses.push(`Sécurité périmétrique insuffisante: "${response.questionText}"`)
            insights.perimeterSecurityScore -= 12
          }

          if (questionLower.includes('surveillance') || questionLower.includes('caméra')) {
            insights.criticalWeaknesses.push(`Surveillance défaillante: "${response.questionText}"`)
            insights.surveillanceScore -= 10
          }

          if (questionLower.includes('éclairage')) {
            insights.criticalWeaknesses.push(`Éclairage insuffisant: "${response.questionText}"`)
            insights.lightingScore -= 8
          }

          if (questionLower.includes('formation') || questionLower.includes('sensibilisation')) {
            insights.criticalWeaknesses.push(`Formation du personnel insuffisante: "${response.questionText}"`)
            insights.personnelTrainingScore -= 12
          }

          if (questionLower.includes('procédure') || questionLower.includes('protocole')) {
            insights.criticalWeaknesses.push(`Procédures de sécurité manquantes: "${response.questionText}"`)
            insights.proceduresScore -= 10
          }

          if (questionLower.includes('incident') || questionLower.includes('intrusion')) {
            insights.criticalWeaknesses.push(`Historique d'incidents préoccupant: "${response.questionText}"`)
            insights.incidentHistoryScore -= 18
          }
        } else if (response.booleanValue === true) {
          insights.positiveResponses.push(response)

          // Identifier les points forts avec détails
          if (questionLower.includes('surveillance') || questionLower.includes('caméra')) {
            insights.strengths.push(`Système de surveillance opérationnel: "${response.questionText}"`)
            insights.surveillanceScore += 10
          }

          if (questionLower.includes('éclairage')) {
            insights.strengths.push(`Éclairage de sécurité adéquat: "${response.questionText}"`)
            insights.lightingScore += 8
          }

          if (questionLower.includes('procédure') || questionLower.includes('protocole')) {
            insights.strengths.push(`Procédures de sécurité documentées: "${response.questionText}"`)
            insights.proceduresScore += 10
          }

          if (questionLower.includes('contrôle d\'accès') || questionLower.includes('accès')) {
            insights.strengths.push(`Contrôle d'accès fonctionnel: "${response.questionText}"`)
            insights.accessControlScore += 12
          }

          if (questionLower.includes('clôture') || questionLower.includes('périmètre')) {
            insights.strengths.push(`Sécurité périmétrique en place: "${response.questionText}"`)
            insights.perimeterSecurityScore += 10
          }

          if (questionLower.includes('formation') || questionLower.includes('sensibilisation')) {
            insights.strengths.push(`Personnel formé aux procédures: "${response.questionText}"`)
            insights.personnelTrainingScore += 12
          }
        }
      })
    }
  })
  
  // Calculer le niveau de sécurité global
  const negativeRatio = insights.totalResponses > 0 ? 
    insights.negativeResponses / insights.totalResponses : 0
  
  if (negativeRatio > 0.6) {
    insights.securityLevel = 'low'
  } else if (negativeRatio > 0.3) {
    insights.securityLevel = 'medium'
  } else {
    insights.securityLevel = 'high'
  }
  
  return insights
}

/**
 * Analyse la probabilité basée sur les données d'évaluation
 */
function analyzeProbability(riskData: RiskFormData, insights: any): AIRecommendation {
  let score = 2 // Score par défaut (moyen)
  let explanation = ''
  const positivePoints: string[] = []
  const negativePoints: string[] = []

  // Analyser selon le type de cible et scénario
  const targetLower = riskData.target.toLowerCase()
  const scenarioLower = riskData.scenario.toLowerCase()

  // === ANALYSE DES FACTEURS NÉGATIFS (augmentent la probabilité) ===

  // Niveau de sécurité général
  if (insights.securityLevel === 'low') {
    score = Math.min(3, score + 1)
    negativePoints.push(`Niveau de sécurité général faible (${insights.negativeResponses}/${insights.totalResponses} réponses négatives)`)
  }

  // Contrôle d'accès spécifique au risque
  if (insights.accessControlScore < -10 &&
      (targetLower.includes('accès') || targetLower.includes('serveur') || targetLower.includes('données') ||
       scenarioLower.includes('intrusion') || scenarioLower.includes('accès'))) {
    score = Math.min(3, score + 1)
    const accessResponses = insights.responsesByCategory.access.filter((r: any) => r.booleanValue === false)
    negativePoints.push(`Contrôle d'accès défaillant pour ce type de cible (${accessResponses.length} défaillances identifiées)`)
    if (accessResponses.length > 0) {
      negativePoints.push(`Exemple: "${accessResponses[0].questionText}" - Réponse: Non`)
    }
  }

  // Sécurité périmétrique
  if (insights.perimeterSecurityScore < -8 &&
      (scenarioLower.includes('périmètre') || scenarioLower.includes('intrusion') || scenarioLower.includes('externe'))) {
    score = Math.min(3, score + 0.5)
    const perimeterResponses = insights.responsesByCategory.perimeter.filter((r: any) => r.booleanValue === false)
    negativePoints.push(`Sécurité périmétrique insuffisante (${perimeterResponses.length} faiblesses)`)
    if (perimeterResponses.length > 0) {
      negativePoints.push(`Référence: "${perimeterResponses[0].questionText}" - Réponse: Non`)
    }
  }

  // Surveillance défaillante
  if (insights.surveillanceScore < -5) {
    score = Math.min(3, score + 0.5)
    const surveillanceResponses = insights.responsesByCategory.surveillance.filter((r: any) => r.booleanValue === false)
    negativePoints.push(`Système de surveillance défaillant (score: ${insights.surveillanceScore})`)
    if (surveillanceResponses.length > 0) {
      negativePoints.push(`Détail: "${surveillanceResponses[0].questionText}" - Réponse: Non`)
    }
  }

  // Formation du personnel
  if (insights.personnelTrainingScore < -8 &&
      (scenarioLower.includes('personnel') || scenarioLower.includes('interne') || scenarioLower.includes('social'))) {
    score = Math.min(3, score + 0.5)
    const trainingResponses = insights.responsesByCategory.training.filter((r: any) => r.booleanValue === false)
    negativePoints.push(`Formation du personnel insuffisante pour ce type de menace`)
    if (trainingResponses.length > 0) {
      negativePoints.push(`Constat: "${trainingResponses[0].questionText}" - Réponse: Non`)
    }
  }

  // Historique d'incidents
  if (insights.incidentHistoryScore < -10) {
    score = Math.min(3, score + 0.5)
    const incidentResponses = insights.responsesByCategory.incidents.filter((r: any) => r.booleanValue === true)
    negativePoints.push(`Historique d'incidents préoccupant (score: ${insights.incidentHistoryScore})`)
    if (incidentResponses.length > 0) {
      negativePoints.push(`Historique: "${incidentResponses[0].questionText}" - Réponse: Oui`)
    }
  }

  // === ANALYSE DES FACTEURS POSITIFS (réduisent la probabilité) ===

  // Système de surveillance opérationnel
  if (insights.surveillanceScore > 5) {
    score = Math.max(1, score - 0.5)
    const surveillanceResponses = insights.responsesByCategory.surveillance.filter((r: any) => r.booleanValue === true)
    positivePoints.push(`Système de surveillance opérationnel (score: +${insights.surveillanceScore})`)
    if (surveillanceResponses.length > 0) {
      positivePoints.push(`Confirmation: "${surveillanceResponses[0].questionText}" - Réponse: Oui`)
    }
  }

  // Contrôle d'accès robuste
  if (insights.accessControlScore > 8) {
    score = Math.max(1, score - 0.5)
    const accessResponses = insights.responsesByCategory.access.filter((r: any) => r.booleanValue === true)
    positivePoints.push(`Contrôle d'accès robuste (score: +${insights.accessControlScore})`)
    if (accessResponses.length > 0) {
      positivePoints.push(`Validation: "${accessResponses[0].questionText}" - Réponse: Oui`)
    }
  }

  // Procédures de sécurité documentées
  if (insights.proceduresScore > 8) {
    score = Math.max(1, score - 0.3)
    const procedureResponses = insights.responsesByCategory.procedures.filter((r: any) => r.booleanValue === true)
    positivePoints.push(`Procédures de sécurité bien documentées (score: +${insights.proceduresScore})`)
    if (procedureResponses.length > 0) {
      positivePoints.push(`Référence: "${procedureResponses[0].questionText}" - Réponse: Oui`)
    }
  }

  // Sécurité périmétrique solide
  if (insights.perimeterSecurityScore > 8) {
    score = Math.max(1, score - 0.3)
    const perimeterResponses = insights.responsesByCategory.perimeter.filter((r: any) => r.booleanValue === true)
    positivePoints.push(`Sécurité périmétrique solide (score: +${insights.perimeterSecurityScore})`)
    if (perimeterResponses.length > 0) {
      positivePoints.push(`Validation: "${perimeterResponses[0].questionText}" - Réponse: Oui`)
    }
  }

  // Niveau de sécurité général élevé
  if (insights.securityLevel === 'high' && insights.totalResponses > 0) {
    score = Math.max(1, score - 0.3)
    const positiveCount = insights.totalResponses - insights.negativeResponses
    positivePoints.push(`Niveau de sécurité général élevé (${positiveCount}/${insights.totalResponses} réponses positives)`)
  }

  // === GARANTIR LA COHÉRENCE AVEC LES DONNÉES DISPONIBLES ===
  if (positivePoints.length === 0) {
    if (insights.positiveResponses.length > 0) {
      positivePoints.push(`Mesures de sécurité identifiées (${insights.positiveResponses.length} réponses positives)`)
      positivePoints.push(`Exemple: "${insights.positiveResponses[0].questionText}" - Réponse: Oui`)
    } else if (insights.totalResponses > 0) {
      positivePoints.push('Aucun élément positif disponible dans les évaluations')
    } else {
      positivePoints.push('Aucune évaluation disponible pour identifier les éléments positifs')
    }
  }

  if (negativePoints.length === 0) {
    if (insights.negativeResponsesList.length > 0) {
      negativePoints.push(`Faiblesses identifiées (${insights.negativeResponsesList.length} défaillances)`)
      negativePoints.push(`Exemple: "${insights.negativeResponsesList[0].questionText}" - Réponse: Non`)
    } else if (insights.totalResponses > 0) {
      negativePoints.push('Aucun élément négatif disponible dans les évaluations')
    } else {
      negativePoints.push('Aucune évaluation disponible pour identifier les éléments négatifs')
    }
  }

  // Générer l'explication détaillée avec les mesures spécifiques
  const protectionLevel = insights.totalResponses > 0 ?
    Math.round(((insights.totalResponses - insights.negativeResponses) / insights.totalResponses) * 100) : 0

  if (score >= 3) {
    explanation = `Probabilité ÉLEVÉE (${score}/3). Les évaluations révèlent des faiblesses significatives qui facilitent la matérialisation de ce risque. ${insights.negativeResponses} défaillances identifiées sur ${insights.totalResponses} points contrôlés.`
  } else if (score >= 2) {
    explanation = `Probabilité MODÉRÉE (${score}/3). Les mesures de sécurité actuelles offrent une protection partielle, mais des améliorations sont nécessaires. Ratio sécurité: ${protectionLevel}%.`
  } else {
    // Identifier les mesures spécifiques qui réduisent la probabilité
    const specificMeasures = []
    if (insights.surveillanceScore > 5) specificMeasures.push('surveillance opérationnelle')
    if (insights.accessControlScore > 8) specificMeasures.push('contrôle d\'accès robuste')
    if (insights.proceduresScore > 8) specificMeasures.push('procédures documentées')
    if (insights.perimeterSecurityScore > 8) specificMeasures.push('sécurité périmétrique')

    const measuresText = specificMeasures.length > 0 ?
      `Les mesures identifiées (${specificMeasures.join(', ')}) réduisent` :
      'Les évaluations disponibles suggèrent que les mesures en place réduisent'

    explanation = `Probabilité FAIBLE (${score}/3). ${measuresText} significativement la probabilité de matérialisation. Niveau de protection: ${protectionLevel}%.`
  }

  return {
    score: Math.round(score),
    explanation,
    positivePoints,
    negativePoints,
    confidence: 0.88
  }
}

/**
 * Analyse la vulnérabilité basée sur les données d'évaluation
 */
function analyzeVulnerability(riskData: RiskFormData, insights: any): AIRecommendation {
  let score = 2 // Score par défaut (faible à moyen)
  let explanation = ''
  const positivePoints: string[] = []
  const negativePoints: string[] = []

  const targetLower = riskData.target.toLowerCase()
  const scenarioLower = riskData.scenario.toLowerCase()

  // === ANALYSE DES VULNÉRABILITÉS (facteurs négatifs) ===

  // Vulnérabilités critiques dans le contrôle d'accès
  if (insights.accessControlScore < -12) {
    score = Math.min(4, score + 1.5)
    const accessResponses = insights.responsesByCategory.access.filter((r: any) => r.booleanValue === false)
    negativePoints.push(`Vulnérabilités critiques dans le contrôle d'accès (score: ${insights.accessControlScore})`)
    if (accessResponses.length > 0) {
      negativePoints.push(`Défaillance identifiée: "${accessResponses[0].questionText}" - Réponse: Non`)
    }
  }

  // Vulnérabilités périmètriques
  if (insights.perimeterSecurityScore < -10) {
    score = Math.min(4, score + 1)
    const perimeterResponses = insights.responsesByCategory.perimeter.filter((r: any) => r.booleanValue === false)
    negativePoints.push(`Vulnérabilités dans la sécurité périmétrique (score: ${insights.perimeterSecurityScore})`)
    if (perimeterResponses.length > 0) {
      negativePoints.push(`Faiblesse constatée: "${perimeterResponses[0].questionText}" - Réponse: Non`)
    }
  }

  // Vulnérabilités liées au personnel
  if (insights.personnelTrainingScore < -8) {
    score = Math.min(4, score + 1)
    const trainingResponses = insights.responsesByCategory.training.filter((r: any) => r.booleanValue === false)
    negativePoints.push(`Personnel insuffisamment formé (score: ${insights.personnelTrainingScore})`)
    if (trainingResponses.length > 0) {
      negativePoints.push(`Lacune identifiée: "${trainingResponses[0].questionText}" - Réponse: Non`)
    }
  }

  // Vulnérabilités de surveillance
  if (insights.surveillanceScore < -8) {
    score = Math.min(4, score + 1)
    const surveillanceResponses = insights.responsesByCategory.surveillance.filter((r: any) => r.booleanValue === false)
    negativePoints.push(`Système de surveillance défaillant (score: ${insights.surveillanceScore})`)
    if (surveillanceResponses.length > 0) {
      negativePoints.push(`Défaut observé: "${surveillanceResponses[0].questionText}" - Réponse: Non`)
    }
  }

  // Vulnérabilités procédurales
  if (insights.proceduresScore < -8) {
    score = Math.min(4, score + 0.5)
    const procedureResponses = insights.responsesByCategory.procedures.filter((r: any) => r.booleanValue === false)
    negativePoints.push(`Procédures de sécurité insuffisantes (score: ${insights.proceduresScore})`)
    if (procedureResponses.length > 0) {
      negativePoints.push(`Manquement: "${procedureResponses[0].questionText}" - Réponse: Non`)
    }
  }

  // Vulnérabilités d'éclairage
  if (insights.lightingScore < -5) {
    score = Math.min(4, score + 0.5)
    const lightingResponses = insights.responsesByCategory.lighting.filter((r: any) => r.booleanValue === false)
    negativePoints.push(`Éclairage de sécurité insuffisant (score: ${insights.lightingScore})`)
    if (lightingResponses.length > 0) {
      negativePoints.push(`Problème relevé: "${lightingResponses[0].questionText}" - Réponse: Non`)
    }
  }

  // Vulnérabilités d'infrastructure
  if (insights.responsesByCategory.infrastructure.some((r: any) => r.booleanValue === false)) {
    score = Math.min(4, score + 0.5)
    const infraResponses = insights.responsesByCategory.infrastructure.filter((r: any) => r.booleanValue === false)
    negativePoints.push(`Vulnérabilités d'infrastructure critique`)
    if (infraResponses.length > 0) {
      negativePoints.push(`Infrastructure: "${infraResponses[0].questionText}" - Réponse: Non`)
    }
  }

  // === ANALYSE DES FACTEURS PROTECTEURS (facteurs positifs) ===

  // Procédures de sécurité robustes
  if (insights.proceduresScore > 8) {
    score = Math.max(1, score - 0.8)
    const procedureResponses = insights.responsesByCategory.procedures.filter((r: any) => r.booleanValue === true)
    positivePoints.push(`Procédures de sécurité bien documentées et appliquées (score: +${insights.proceduresScore})`)
    if (procedureResponses.length > 0) {
      positivePoints.push(`Procédure validée: "${procedureResponses[0].questionText}" - Réponse: Oui`)
    }
  }

  // Contrôle d'accès robuste
  if (insights.accessControlScore > 10) {
    score = Math.max(1, score - 0.8)
    const accessResponses = insights.responsesByCategory.access.filter((r: any) => r.booleanValue === true)
    positivePoints.push(`Système de contrôle d'accès robuste (score: +${insights.accessControlScore})`)
    if (accessResponses.length > 0) {
      positivePoints.push(`Contrôle validé: "${accessResponses[0].questionText}" - Réponse: Oui`)
    }
  }

  // Surveillance efficace
  if (insights.surveillanceScore > 8) {
    score = Math.max(1, score - 0.5)
    const surveillanceResponses = insights.responsesByCategory.surveillance.filter((r: any) => r.booleanValue === true)
    positivePoints.push(`Système de surveillance efficace (score: +${insights.surveillanceScore})`)
    if (surveillanceResponses.length > 0) {
      positivePoints.push(`Surveillance confirmée: "${surveillanceResponses[0].questionText}" - Réponse: Oui`)
    }
  }

  // Formation du personnel adéquate
  if (insights.personnelTrainingScore > 8) {
    score = Math.max(1, score - 0.5)
    const trainingResponses = insights.responsesByCategory.training.filter((r: any) => r.booleanValue === true)
    positivePoints.push(`Personnel bien formé aux procédures (score: +${insights.personnelTrainingScore})`)
    if (trainingResponses.length > 0) {
      positivePoints.push(`Formation validée: "${trainingResponses[0].questionText}" - Réponse: Oui`)
    }
  }

  // Sécurité périmétrique solide
  if (insights.perimeterSecurityScore > 8) {
    score = Math.max(1, score - 0.5)
    const perimeterResponses = insights.responsesByCategory.perimeter.filter((r: any) => r.booleanValue === true)
    positivePoints.push(`Sécurité périmétrique solide (score: +${insights.perimeterSecurityScore})`)
    if (perimeterResponses.length > 0) {
      positivePoints.push(`Protection confirmée: "${perimeterResponses[0].questionText}" - Réponse: Oui`)
    }
  }

  // Éclairage de sécurité adéquat
  if (insights.lightingScore > 5) {
    score = Math.max(1, score - 0.3)
    const lightingResponses = insights.responsesByCategory.lighting.filter((r: any) => r.booleanValue === true)
    positivePoints.push(`Éclairage de sécurité adéquat (score: +${insights.lightingScore})`)
    if (lightingResponses.length > 0) {
      positivePoints.push(`Éclairage validé: "${lightingResponses[0].questionText}" - Réponse: Oui`)
    }
  }

  // === GARANTIR LA COHÉRENCE AVEC LES DONNÉES DISPONIBLES ===
  if (positivePoints.length === 0) {
    if (insights.positiveResponses.length > 0) {
      positivePoints.push(`Mesures de protection identifiées (${insights.positiveResponses.length} éléments positifs)`)
      positivePoints.push(`Élément protecteur: "${insights.positiveResponses[0].questionText}" - Réponse: Oui`)
    } else if (insights.totalResponses > 0) {
      positivePoints.push('Aucun élément protecteur disponible dans les évaluations')
    } else {
      positivePoints.push('Aucune évaluation disponible pour identifier les éléments protecteurs')
    }
  }

  if (negativePoints.length === 0) {
    if (insights.negativeResponsesList.length > 0) {
      negativePoints.push(`Vulnérabilités identifiées (${insights.negativeResponsesList.length} points faibles)`)
      negativePoints.push(`Point d'attention: "${insights.negativeResponsesList[0].questionText}" - Réponse: Non`)
    } else if (insights.totalResponses > 0) {
      negativePoints.push('Aucune vulnérabilité disponible dans les évaluations')
    } else {
      negativePoints.push('Aucune évaluation disponible pour identifier les vulnérabilités')
    }
  }

  // Générer l'explication détaillée avec les mesures spécifiques
  const protectionLevel = insights.totalResponses > 0 ?
    Math.round(((insights.totalResponses - insights.negativeResponses) / insights.totalResponses) * 100) : 0

  if (score >= 4) {
    explanation = `Vulnérabilité ÉLEVÉE (${score}/4). De multiples faiblesses structurelles facilitent l'exploitation de ce risque. ${insights.negativeResponses} vulnérabilités sur ${insights.totalResponses} points de contrôle.`
  } else if (score >= 3) {
    explanation = `Vulnérabilité MODÉRÉE (${score}/4). Certaines faiblesses nécessitent une attention immédiate pour réduire l'exposition. Niveau de protection actuel: ${protectionLevel}%.`
  } else if (score >= 2) {
    explanation = `Vulnérabilité FAIBLE à MODÉRÉE (${score}/4). Les mesures de sécurité de base sont en place mais peuvent être renforcées. Couverture sécuritaire: ${protectionLevel}%.`
  } else {
    // Identifier les mesures spécifiques qui réduisent la vulnérabilité
    const specificMeasures = []
    if (insights.proceduresScore > 8) specificMeasures.push('procédures robustes')
    if (insights.accessControlScore > 10) specificMeasures.push('contrôle d\'accès solide')
    if (insights.surveillanceScore > 8) specificMeasures.push('surveillance efficace')
    if (insights.personnelTrainingScore > 8) specificMeasures.push('personnel formé')

    const measuresText = specificMeasures.length > 0 ?
      `Les mesures identifiées (${specificMeasures.join(', ')}) offrent` :
      'Les évaluations disponibles suggèrent que les mesures en place offrent'

    explanation = `Vulnérabilité TRÈS FAIBLE (${score}/4). ${measuresText} une protection robuste contre ce type de risque. Niveau de protection: ${protectionLevel}%.`
  }

  return {
    score: Math.round(score),
    explanation,
    positivePoints,
    negativePoints,
    confidence: 0.90
  }
}

/**
 * Analyse l'impact basé sur les données d'évaluation
 */
function analyzeImpact(riskData: RiskFormData, insights: any): AIRecommendation {
  let score = 3 // Score par défaut (modéré)
  let explanation = ''
  const positivePoints: string[] = []
  const negativePoints: string[] = []

  const targetLower = riskData.target.toLowerCase()
  const scenarioLower = riskData.scenario.toLowerCase()

  // === ANALYSE DES FACTEURS AGGRAVANTS (augmentent l'impact) ===

  // Impact sur les données sensibles
  if (targetLower.includes('données') || targetLower.includes('information') || targetLower.includes('base de données')) {
    score = Math.min(5, score + 1.5)
    negativePoints.push('Impact élevé sur les données sensibles et la confidentialité')
    if (insights.responsesByCategory.procedures.some((r: any) => r.booleanValue === false)) {
      negativePoints.push('Aggravé par l\'absence de procédures de protection des données')
    }
  }

  // Impact sur l'infrastructure critique
  if (targetLower.includes('infrastructure') || targetLower.includes('système') || targetLower.includes('serveur')) {
    score = Math.min(5, score + 1.5)
    negativePoints.push('Impact sur l\'infrastructure critique et la continuité d\'activité')
    const infraResponses = insights.responsesByCategory.infrastructure.filter((r: any) => r.booleanValue === false)
    if (infraResponses.length > 0) {
      negativePoints.push(`Infrastructure vulnérable: "${infraResponses[0].questionText}" - Réponse: Non`)
    }
  }

  // Impact sur la sécurité du personnel
  if (targetLower.includes('personnel') || targetLower.includes('employé') || targetLower.includes('accès')) {
    score = Math.min(5, score + 1)
    negativePoints.push('Impact sur la sécurité du personnel et l\'environnement de travail')
    const trainingResponses = insights.responsesByCategory.training.filter((r: any) => r.booleanValue === false)
    if (trainingResponses.length > 0) {
      negativePoints.push(`Personnel non préparé: "${trainingResponses[0].questionText}" - Réponse: Non`)
    }
  }

  // Impact financier et opérationnel
  if (targetLower.includes('production') || targetLower.includes('opération') || scenarioLower.includes('arrêt')) {
    score = Math.min(5, score + 1)
    negativePoints.push('Impact financier majeur et arrêt des opérations critiques')
  }

  // Historique d'incidents aggravant
  if (insights.incidentHistoryScore < -12) {
    score = Math.min(5, score + 1)
    const incidentResponses = insights.responsesByCategory.incidents.filter((r: any) => r.booleanValue === true)
    negativePoints.push(`Historique d'incidents aggrave l'impact potentiel (score: ${insights.incidentHistoryScore})`)
    if (incidentResponses.length > 0) {
      negativePoints.push(`Précédent: "${incidentResponses[0].questionText}" - Réponse: Oui`)
    }
  }

  // Absence de mesures de récupération
  if (insights.proceduresScore < -8) {
    score = Math.min(5, score + 0.5)
    negativePoints.push('Absence de procédures de récupération et de continuité d\'activité')
  }

  // Vulnérabilités multiples amplifiant l'impact
  if (insights.negativeResponses > insights.totalResponses * 0.6) {
    score = Math.min(5, score + 0.5)
    negativePoints.push(`Vulnérabilités multiples amplifient l'impact (${insights.negativeResponses}/${insights.totalResponses} faiblesses)`)
  }

  // === ANALYSE DES FACTEURS ATTÉNUANTS (réduisent l'impact) ===

  // Procédures de réponse aux incidents
  if (insights.proceduresScore > 8) {
    score = Math.max(1, score - 0.8)
    const procedureResponses = insights.responsesByCategory.procedures.filter((r: any) => r.booleanValue === true)
    positivePoints.push(`Procédures de réponse aux incidents bien établies (score: +${insights.proceduresScore})`)
    if (procedureResponses.length > 0) {
      positivePoints.push(`Procédure validée: "${procedureResponses[0].questionText}" - Réponse: Oui`)
    }
  }

  // Système de surveillance pour détection rapide
  if (insights.surveillanceScore > 8) {
    score = Math.max(1, score - 0.5)
    const surveillanceResponses = insights.responsesByCategory.surveillance.filter((r: any) => r.booleanValue === true)
    positivePoints.push(`Système de surveillance permet une détection rapide (score: +${insights.surveillanceScore})`)
    if (surveillanceResponses.length > 0) {
      positivePoints.push(`Surveillance active: "${surveillanceResponses[0].questionText}" - Réponse: Oui`)
    }
  }

  // Personnel formé pour la gestion de crise
  if (insights.personnelTrainingScore > 8) {
    score = Math.max(1, score - 0.5)
    const trainingResponses = insights.responsesByCategory.training.filter((r: any) => r.booleanValue === true)
    positivePoints.push(`Personnel formé pour la gestion de crise (score: +${insights.personnelTrainingScore})`)
    if (trainingResponses.length > 0) {
      positivePoints.push(`Formation confirmée: "${trainingResponses[0].questionText}" - Réponse: Oui`)
    }
  }

  // Mesures de protection robustes
  if (insights.securityLevel === 'high') {
    score = Math.max(1, score - 0.5)
    positivePoints.push(`Mesures de mitigation robustes réduisent l'impact (${Math.round(((insights.totalResponses - insights.negativeResponses) / insights.totalResponses) * 100)}% de protection)`)
  }

  // Contrôle d'accès limitant la propagation
  if (insights.accessControlScore > 8) {
    score = Math.max(1, score - 0.3)
    const accessResponses = insights.responsesByCategory.access.filter((r: any) => r.booleanValue === true)
    positivePoints.push(`Contrôle d'accès limite la propagation des dommages (score: +${insights.accessControlScore})`)
    if (accessResponses.length > 0) {
      positivePoints.push(`Contrôle efficace: "${accessResponses[0].questionText}" - Réponse: Oui`)
    }
  }

  // Infrastructure redondante
  if (insights.responsesByCategory.infrastructure.some((r: any) => r.booleanValue === true)) {
    score = Math.max(1, score - 0.3)
    const infraResponses = insights.responsesByCategory.infrastructure.filter((r: any) => r.booleanValue === true)
    positivePoints.push('Infrastructure redondante et mesures de continuité')
    if (infraResponses.length > 0) {
      positivePoints.push(`Redondance: "${infraResponses[0].questionText}" - Réponse: Oui`)
    }
  }

  // === GARANTIR LA COHÉRENCE AVEC LES DONNÉES DISPONIBLES ===
  if (positivePoints.length === 0) {
    if (insights.positiveResponses.length > 0) {
      positivePoints.push(`Capacités de récupération identifiées (${insights.positiveResponses.length} mesures positives)`)
      positivePoints.push(`Mesure atténuante: "${insights.positiveResponses[0].questionText}" - Réponse: Oui`)
    } else if (insights.totalResponses > 0) {
      positivePoints.push('Aucun élément atténuant disponible dans les évaluations')
    } else {
      positivePoints.push('Aucune évaluation disponible pour identifier les éléments atténuants')
    }
  }

  if (negativePoints.length === 0) {
    if (insights.negativeResponsesList.length > 0) {
      negativePoints.push(`Facteurs d'amplification identifiés (${insights.negativeResponsesList.length} points de vulnérabilité)`)
      negativePoints.push(`Facteur aggravant: "${insights.negativeResponsesList[0].questionText}" - Réponse: Non`)
    } else if (insights.totalResponses > 0) {
      negativePoints.push('Aucun facteur aggravant disponible dans les évaluations')
    } else {
      negativePoints.push('Aucune évaluation disponible pour identifier les facteurs aggravants')
    }
  }

  // Générer l'explication détaillée avec les mesures spécifiques
  const vulnerabilityLevel = insights.totalResponses > 0 ?
    Math.round((insights.negativeResponses / insights.totalResponses) * 100) : 0
  const recoveryLevel = insights.totalResponses > 0 ?
    Math.round(((insights.totalResponses - insights.negativeResponses) / insights.totalResponses) * 100) : 0

  if (score >= 5) {
    explanation = `Impact CRITIQUE (${score}/5). Les conséquences seraient catastrophiques pour l'organisation avec des dommages durables. Niveau de vulnérabilité: ${vulnerabilityLevel}%.`
  } else if (score >= 4) {
    explanation = `Impact MAJEUR (${score}/5). Des conséquences importantes et durables sont à prévoir, nécessitant des ressources significatives pour la récupération. Exposition actuelle: ${vulnerabilityLevel}%.`
  } else if (score >= 3) {
    explanation = `Impact MODÉRÉ (${score}/5). Des perturbations significatives mais gérables avec les ressources appropriées. Capacité de récupération: ${recoveryLevel}%.`
  } else if (score >= 2) {
    // Identifier les mesures spécifiques qui réduisent l'impact
    const specificMeasures = []
    if (insights.proceduresScore > 8) specificMeasures.push('procédures de réponse')
    if (insights.surveillanceScore > 8) specificMeasures.push('détection rapide')
    if (insights.personnelTrainingScore > 8) specificMeasures.push('personnel formé')
    if (insights.accessControlScore > 8) specificMeasures.push('contrôle des dommages')

    const measuresText = specificMeasures.length > 0 ?
      `grâce aux mesures identifiées (${specificMeasures.join(', ')})` :
      'selon les évaluations disponibles'

    explanation = `Impact MINEUR (${score}/5). Les conséquences seraient limitées et rapidement maîtrisables ${measuresText}. Niveau de protection: ${recoveryLevel}%.`
  } else {
    // Identifier les mesures spécifiques qui minimisent l'impact
    const specificMeasures = []
    if (insights.proceduresScore > 8) specificMeasures.push('procédures de réponse robustes')
    if (insights.surveillanceScore > 8) specificMeasures.push('surveillance efficace')
    if (insights.accessControlScore > 8) specificMeasures.push('contrôle d\'accès limitant la propagation')

    const measuresText = specificMeasures.length > 0 ?
      `grâce aux mesures de protection identifiées (${specificMeasures.join(', ')})` :
      'selon les évaluations disponibles'

    explanation = `Impact NÉGLIGEABLE (${score}/5). Les conséquences seraient minimales ${measuresText}. Couverture sécuritaire: ${recoveryLevel}%.`
  }

  return {
    score: Math.round(score),
    explanation,
    positivePoints,
    negativePoints,
    confidence: 0.87
  }
}

/**
 * Génère une évaluation globale
 */
function generateOverallAssessment(
  riskData: RiskFormData,
  probability: AIRecommendation,
  vulnerability: AIRecommendation,
  impact: AIRecommendation,
  insights: any
): string {
  const riskScore = probability.score * vulnerability.score * impact.score
  
  let assessment = `**Analyse IA basée sur ${insights.totalResponses} réponses d'évaluations**\n\n`
  
  assessment += `**Cible analysée:** ${riskData.target}\n`
  assessment += `**Scénario:** ${riskData.scenario}\n\n`
  
  assessment += `**Score de risque calculé:** ${riskScore}/60\n\n`
  
  assessment += `**Principales conclusions:**\n`
  
  if (insights.criticalWeaknesses.length > 0) {
    assessment += `• **Faiblesses identifiées:** ${insights.criticalWeaknesses.join(', ')}\n`
  }
  
  if (insights.strengths.length > 0) {
    assessment += `• **Points forts:** ${insights.strengths.join(', ')}\n`
  }
  
  assessment += `• **Niveau de sécurité global:** ${insights.securityLevel === 'high' ? 'Élevé' : insights.securityLevel === 'medium' ? 'Moyen' : 'Faible'}\n\n`
  
  assessment += `**Recommandations prioritaires:**\n`
  
  if (probability.score >= 3) {
    assessment += `• Réduire la probabilité en renforçant les mesures préventives\n`
  }
  
  if (vulnerability.score >= 3) {
    assessment += `• Corriger les vulnérabilités identifiées dans les évaluations\n`
  }
  
  if (impact.score >= 4) {
    assessment += `• Mettre en place des mesures de mitigation d'impact\n`
  }
  
  return assessment
}

/**
 * Génère des recommandations de questionnaires pour combler les lacunes d'information
 */
function generateQuestionnaireRecommendations(
  riskData: RiskFormData,
  insights: any
): QuestionnaireRecommendation[] {
  const recommendations: QuestionnaireRecommendation[] = []
  const targetLower = riskData.target.toLowerCase()
  const scenarioLower = riskData.scenario.toLowerCase()

  // Analyser les catégories manquantes ou insuffisamment couvertes

  // Recommandations pour le contrôle d'accès
  if (insights.responsesByCategory.access.length < 3 &&
      (targetLower.includes('accès') || targetLower.includes('données') || targetLower.includes('serveur') ||
       scenarioLower.includes('intrusion') || scenarioLower.includes('accès'))) {
    recommendations.push({
      category: 'Contrôle d\'accès',
      reason: 'Informations insuffisantes sur le contrôle d\'accès pour ce type de cible/menace',
      suggestedQuestions: [
        'Le site dispose-t-il d\'un système de contrôle d\'accès électronique (badges, codes) ?',
        'Les accès sont-ils enregistrés et tracés dans un journal ?',
        'Y a-t-il une procédure de gestion des droits d\'accès (attribution, révocation) ?',
        'Les zones sensibles sont-elles protégées par un contrôle d\'accès renforcé ?',
        'Le système de contrôle d\'accès est-il régulièrement testé et maintenu ?'
      ]
    })
  }

  // Recommandations pour la sécurité périmétrique
  if (insights.responsesByCategory.perimeter.length < 2 &&
      (scenarioLower.includes('périmètre') || scenarioLower.includes('intrusion') || scenarioLower.includes('externe'))) {
    recommendations.push({
      category: 'Sécurité périmétrique',
      reason: 'Évaluation insuffisante de la sécurité périmétrique pour ce scénario d\'intrusion',
      suggestedQuestions: [
        'Le site est-il entièrement clôturé avec une hauteur appropriée ?',
        'La clôture est-elle en bon état et régulièrement inspectée ?',
        'Y a-t-il des points d\'accès contrôlés au périmètre ?',
        'Le périmètre est-il équipé de systèmes de détection d\'intrusion ?',
        'L\'éclairage périmétrique est-il suffisant pour la surveillance nocturne ?'
      ]
    })
  }

  // Recommandations pour la surveillance
  if (insights.responsesByCategory.surveillance.length < 2) {
    recommendations.push({
      category: 'Surveillance et détection',
      reason: 'Données manquantes sur les capacités de surveillance et de détection',
      suggestedQuestions: [
        'Le site dispose-t-il d\'un système de vidéosurveillance opérationnel ?',
        'Les caméras couvrent-elles tous les points critiques et d\'accès ?',
        'Y a-t-il une surveillance humaine permanente ou des rondes régulières ?',
        'Le système de surveillance dispose-t-il d\'alertes automatiques ?',
        'Les enregistrements sont-ils conservés et facilement accessibles ?'
      ]
    })
  }

  // Recommandations pour la formation du personnel
  if (insights.responsesByCategory.training.length < 2 &&
      (scenarioLower.includes('personnel') || scenarioLower.includes('interne') || scenarioLower.includes('social'))) {
    recommendations.push({
      category: 'Formation et sensibilisation',
      reason: 'Formation du personnel critique pour ce type de menace impliquant le facteur humain',
      suggestedQuestions: [
        'Le personnel a-t-il reçu une formation sur les procédures de sécurité ?',
        'Y a-t-il des sessions de sensibilisation régulières aux risques de sécurité ?',
        'Le personnel sait-il comment réagir en cas d\'incident de sécurité ?',
        'Les nouveaux employés reçoivent-ils une formation sécurité obligatoire ?',
        'Y a-t-il des tests réguliers des connaissances sécurité du personnel ?'
      ]
    })
  }

  // Recommandations pour les procédures
  if (insights.responsesByCategory.procedures.length < 2) {
    recommendations.push({
      category: 'Procédures et protocoles',
      reason: 'Procédures de sécurité essentielles pour la gestion et la réponse aux incidents',
      suggestedQuestions: [
        'Existe-t-il des procédures écrites de sécurité et d\'urgence ?',
        'Les procédures sont-elles régulièrement mises à jour et communiquées ?',
        'Y a-t-il un plan de réponse aux incidents de sécurité ?',
        'Les procédures d\'évacuation sont-elles définies et testées ?',
        'Existe-t-il une procédure de notification des incidents aux autorités ?'
      ]
    })
  }

  // Recommandations pour l'infrastructure critique
  if (insights.responsesByCategory.infrastructure.length < 2 &&
      (targetLower.includes('infrastructure') || targetLower.includes('système') || targetLower.includes('électricité'))) {
    recommendations.push({
      category: 'Infrastructure critique',
      reason: 'Évaluation de l\'infrastructure critique nécessaire pour ce type de cible',
      suggestedQuestions: [
        'Les systèmes électriques critiques sont-ils sécurisés et redondants ?',
        'Y a-t-il des systèmes de sauvegarde (générateurs, UPS) opérationnels ?',
        'L\'accès aux infrastructures critiques est-il restreint et contrôlé ?',
        'Les systèmes de communication d\'urgence sont-ils fonctionnels ?',
        'Y a-t-il une maintenance préventive régulière des équipements critiques ?'
      ]
    })
  }

  // Recommandations pour l'historique d'incidents
  if (insights.responsesByCategory.incidents.length < 1) {
    recommendations.push({
      category: 'Historique et gestion des incidents',
      reason: 'Connaissance de l\'historique d\'incidents essentielle pour évaluer les risques',
      suggestedQuestions: [
        'Y a-t-il eu des incidents de sécurité au cours des 12 derniers mois ?',
        'Les incidents sont-ils documentés et analysés pour prévenir leur récurrence ?',
        'Y a-t-il eu des tentatives d\'intrusion ou de vol récentes ?',
        'Les incidents sont-ils rapportés aux autorités compétentes ?',
        'Des mesures correctives ont-elles été mises en place suite aux incidents ?'
      ]
    })
  }

  // Recommandations spécifiques selon le type de cible
  if (targetLower.includes('données') || targetLower.includes('information')) {
    recommendations.push({
      category: 'Protection des données',
      reason: 'Mesures spécifiques requises pour la protection des données sensibles',
      suggestedQuestions: [
        'Les données sensibles sont-elles chiffrées et sauvegardées ?',
        'L\'accès aux données est-il contrôlé et tracé ?',
        'Y a-t-il des procédures de classification et de protection des données ?',
        'Les supports de stockage sont-ils sécurisés physiquement ?',
        'Existe-t-il un plan de récupération des données en cas d\'incident ?'
      ]
    })
  }

  if (targetLower.includes('personnel') || scenarioLower.includes('agression')) {
    recommendations.push({
      category: 'Sécurité du personnel',
      reason: 'Mesures de protection du personnel critiques pour ce type de risque',
      suggestedQuestions: [
        'Y a-t-il des dispositifs d\'alerte d\'urgence pour le personnel ?',
        'Le personnel travaille-t-il seul dans des zones isolées ?',
        'Existe-t-il des procédures de sécurité pour les horaires atypiques ?',
        'Y a-t-il un système de communication d\'urgence accessible ?',
        'Le personnel a-t-il accès à des formations d\'autodéfense ou de gestion de conflit ?'
      ]
    })
  }

  return recommendations
}
