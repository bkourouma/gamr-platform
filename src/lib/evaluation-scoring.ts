// Moteur de scoring intelligent pour les évaluations sécuritaires

export interface ScoringWeights {
  // Pondération par section
  entity: number
  perimeter: number
  access: number
  infrastructure: number
  ergonomics: number
  communication: number
  transport: number
  emergency: number
  training: number
  compliance: number
}

export interface SectorWeights {
  [sector: string]: ScoringWeights
}

export interface EvaluationResponse {
  questionId: string
  booleanValue?: boolean
  textValue?: string
  numberValue?: number
  facilityScore?: number    // 1-3 (réduction vulnérabilité)
  constraintScore?: number  // 1-3 (augmentation vulnérabilité)
  description?: string
  comment?: string
}

export interface ScoringResult {
  totalScore: number
  sectionScores: Record<string, number>
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  recommendations: string[]
  criticalIssues: string[]
  strengths: string[]
  improvementAreas: string[]
}

// Pondérations par secteur d'activité
const SECTOR_WEIGHTS: SectorWeights = {
  'Technologie': {
    entity: 0.05,
    perimeter: 0.15,
    access: 0.20,
    infrastructure: 0.25, // Plus important pour tech
    ergonomics: 0.10,
    communication: 0.15,  // Critique pour tech
    transport: 0.05,
    emergency: 0.10,
    training: 0.10,
    compliance: 0.15
  },
  'Santé': {
    entity: 0.05,
    perimeter: 0.20,      // Très important pour santé
    access: 0.25,         // Contrôle d'accès critique
    infrastructure: 0.15,
    ergonomics: 0.15,     // Important pour personnel médical
    communication: 0.10,
    transport: 0.05,
    emergency: 0.20,      // Critique pour santé
    training: 0.15,       // Formation du personnel
    compliance: 0.20      // Réglementations strictes
  },
  'Finance': {
    entity: 0.05,
    perimeter: 0.20,
    access: 0.25,         // Sécurité d'accès critique
    infrastructure: 0.20,
    ergonomics: 0.05,
    communication: 0.15,
    transport: 0.05,
    emergency: 0.10,
    training: 0.15,
    compliance: 0.25      // Réglementations financières
  },
  'Industrie': {
    entity: 0.05,
    perimeter: 0.15,
    access: 0.15,
    infrastructure: 0.20,
    ergonomics: 0.15,     // Sécurité du travail
    communication: 0.10,
    transport: 0.15,      // Logistique importante
    emergency: 0.25,      // Risques industriels
    training: 0.20,       // Formation sécurité
    compliance: 0.15
  },
  'default': {
    entity: 0.05,
    perimeter: 0.15,
    access: 0.20,
    infrastructure: 0.15,
    ergonomics: 0.10,
    communication: 0.10,
    transport: 0.10,
    emergency: 0.15,
    training: 0.15,
    compliance: 0.15
  }
}

// Mapping des objectifs vers les sections
const OBJECTIVE_SECTIONS: Record<number, keyof ScoringWeights> = {
  1: 'entity',           // Identification entité
  2: 'perimeter',        // Voie d'accès
  3: 'perimeter',        // Clôture
  4: 'access',           // Entrée principale
  5: 'access',           // Parking
  6: 'access',           // Entrée arrière
  7: 'access',           // Locaux
  8: 'access',           // Réfectoire
  9: 'access',           // Balcon
  10: 'access',          // Bureaux
  11: 'access',          // Salle d'eau
  12: 'access',          // Bureau communication
  13: 'access',          // Bureau directeur
  14: 'access',          // Fenêtres
  15: 'access',          // Gestion accès
  16: 'infrastructure',  // Électricité
  17: 'infrastructure',  // Eau
  18: 'ergonomics',      // Matériel travail
  19: 'ergonomics',      // Salubrité
  20: 'ergonomics',      // Température
  21: 'ergonomics',      // Commodités
  22: 'communication',   // Réseau communication
  23: 'communication',   // Continuité communication
  24: 'communication',   // Réseau informatique
  25: 'communication',   // Données informatiques
  26: 'transport',       // Transport-logistique
  27: 'emergency',       // Accès restreints / Incendie
  28: 'emergency',       // Matériel médical
  29: 'training',        // Formation employés
  30: 'emergency',       // Interventions soutien
  31: 'training',        // Plan sécurité
  32: 'emergency',       // Capacité intervention
  33: 'training',        // Habilité employés
  34: 'training',        // Communication sécurité
  35: 'compliance',      // Historique incidents
  36: 'compliance',      // Comptabilité
  37: 'compliance',      // Assurances
  38: 'compliance',      // Protection documents
  39: 'compliance',      // Responsabilité sociétale
  40: 'compliance',      // Abonnements
  41: 'compliance',      // Respect lois
  42: 'compliance'       // Protection environnementale
}

export class EvaluationScoringEngine {
  private sectorWeights: ScoringWeights
  
  constructor(sector: string = 'default') {
    this.sectorWeights = SECTOR_WEIGHTS[sector] || SECTOR_WEIGHTS['default']
  }

  /**
   * Calcule le score d'une question individuelle
   */
  private calculateQuestionScore(response: EvaluationResponse): number {
    if (response.booleanValue === undefined) {
      return 0 // Question non répondue
    }

    let baseScore = response.booleanValue ? 100 : 0
    
    // Ajustement basé sur les scores de facilité/contrainte
    if (response.facilityScore && response.constraintScore) {
      // Score de facilité augmente le score positif
      const facilityBonus = response.booleanValue ? (response.facilityScore - 1) * 10 : 0
      
      // Score de contrainte diminue le score
      const constraintPenalty = response.constraintScore * 5
      
      baseScore = Math.max(0, Math.min(100, baseScore + facilityBonus - constraintPenalty))
    }

    return baseScore
  }

  /**
   * Calcule le score d'un objectif (groupe de questions)
   */
  private calculateObjectiveScore(
    objectiveId: number, 
    responses: EvaluationResponse[]
  ): number {
    if (responses.length === 0) return 0

    const questionScores = responses.map(r => this.calculateQuestionScore(r))
    const averageScore = questionScores.reduce((sum, score) => sum + score, 0) / questionScores.length

    return averageScore
  }

  /**
   * Calcule le score d'une section
   */
  private calculateSectionScore(
    section: keyof ScoringWeights,
    objectiveScores: Record<number, number>
  ): number {
    const sectionObjectives = Object.entries(OBJECTIVE_SECTIONS)
      .filter(([_, sectionName]) => sectionName === section)
      .map(([objectiveId]) => parseInt(objectiveId))

    if (sectionObjectives.length === 0) return 0

    const sectionScores = sectionObjectives
      .map(objId => objectiveScores[objId] || 0)
      .filter(score => score > 0) // Ignorer les objectifs non évalués

    if (sectionScores.length === 0) return 0

    return sectionScores.reduce((sum, score) => sum + score, 0) / sectionScores.length
  }

  /**
   * Détermine le niveau de risque basé sur le score
   */
  private determineRiskLevel(score: number): ScoringResult['riskLevel'] {
    if (score >= 80) return 'LOW'
    if (score >= 60) return 'MEDIUM'
    if (score >= 40) return 'HIGH'
    return 'CRITICAL'
  }

  /**
   * Génère des recommandations basées sur les scores
   */
  private generateRecommendations(
    sectionScores: Record<string, number>,
    responses: EvaluationResponse[]
  ): {
    recommendations: string[]
    criticalIssues: string[]
    strengths: string[]
    improvementAreas: string[]
  } {
    const recommendations: string[] = []
    const criticalIssues: string[] = []
    const strengths: string[] = []
    const improvementAreas: string[] = []

    // Analyse des sections
    Object.entries(sectionScores).forEach(([section, score]) => {
      if (score < 40) {
        criticalIssues.push(`Section ${section}: Score critique (${score.toFixed(1)}%)`)
        recommendations.push(`Amélioration urgente requise pour ${section}`)
      } else if (score < 60) {
        improvementAreas.push(`Section ${section}: Amélioration nécessaire (${score.toFixed(1)}%)`)
      } else if (score >= 80) {
        strengths.push(`Section ${section}: Excellent niveau (${score.toFixed(1)}%)`)
      }
    })

    // Recommandations spécifiques par section
    if (sectionScores.perimeter < 60) {
      recommendations.push('Renforcer la sécurité périmétrique (clôture, éclairage, surveillance)')
    }
    if (sectionScores.access < 60) {
      recommendations.push('Améliorer le contrôle d\'accès et la gestion des entrées')
    }
    if (sectionScores.infrastructure < 60) {
      recommendations.push('Sécuriser les infrastructures critiques (électricité, eau)')
    }
    if (sectionScores.emergency < 60) {
      recommendations.push('Développer les capacités de réponse d\'urgence')
    }
    if (sectionScores.training < 60) {
      recommendations.push('Renforcer la formation et sensibilisation du personnel')
    }

    return { recommendations, criticalIssues, strengths, improvementAreas }
  }

  /**
   * Calcule le score global de l'évaluation
   */
  public calculateEvaluationScore(
    responses: EvaluationResponse[],
    sector: string = 'default'
  ): ScoringResult {
    // Mise à jour des poids sectoriels
    this.sectorWeights = SECTOR_WEIGHTS[sector] || SECTOR_WEIGHTS['default']

    // Grouper les réponses par objectif
    const responsesByObjective: Record<number, EvaluationResponse[]> = {}
    
    responses.forEach(response => {
      // Extraire l'objectif depuis l'ID de question (simulation)
      const objectiveId = Math.floor(Math.random() * 42) + 1 // À remplacer par la vraie logique
      
      if (!responsesByObjective[objectiveId]) {
        responsesByObjective[objectiveId] = []
      }
      responsesByObjective[objectiveId].push(response)
    })

    // Calculer les scores par objectif
    const objectiveScores: Record<number, number> = {}
    Object.entries(responsesByObjective).forEach(([objectiveId, objectiveResponses]) => {
      objectiveScores[parseInt(objectiveId)] = this.calculateObjectiveScore(
        parseInt(objectiveId),
        objectiveResponses
      )
    })

    // Calculer les scores par section
    const sectionScores: Record<string, number> = {}
    Object.keys(this.sectorWeights).forEach(section => {
      sectionScores[section] = this.calculateSectionScore(
        section as keyof ScoringWeights,
        objectiveScores
      )
    })

    // Calculer le score total pondéré
    const totalScore = Object.entries(sectionScores).reduce((total, [section, score]) => {
      const weight = this.sectorWeights[section as keyof ScoringWeights]
      return total + (score * weight)
    }, 0)

    // Déterminer le niveau de risque
    const riskLevel = this.determineRiskLevel(totalScore)

    // Générer les recommandations
    const analysis = this.generateRecommendations(sectionScores, responses)

    return {
      totalScore: Math.round(totalScore * 100) / 100,
      sectionScores,
      riskLevel,
      ...analysis
    }
  }

  /**
   * Génère automatiquement des fiches GAMR depuis l'évaluation
   */
  public generateRiskSheets(
    evaluationResult: ScoringResult,
    responses: EvaluationResponse[]
  ): any[] {
    const riskSheets: any[] = []

    // Générer des fiches pour les issues critiques
    evaluationResult.criticalIssues.forEach((issue, index) => {
      const riskSheet = {
        target: `Sécurité - ${issue.split(':')[0]}`,
        scenario: `Vulnérabilité identifiée lors de l'évaluation: ${issue}`,
        probability: evaluationResult.riskLevel === 'CRITICAL' ? 3 : 2,
        vulnerability: 3,
        impact: evaluationResult.riskLevel === 'CRITICAL' ? 4 : 3,
        category: 'Évaluation Sécuritaire',
        tags: ['évaluation', 'sécurité', 'critique'],
        priority: evaluationResult.riskLevel,
        aiSuggestions: {
          recommendations: evaluationResult.recommendations.slice(index, index + 3),
          confidence: 0.85
        }
      }

      riskSheets.push(riskSheet)
    })

    return riskSheets
  }
}
