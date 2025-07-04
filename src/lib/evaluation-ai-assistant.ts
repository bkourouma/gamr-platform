// Assistant IA pour les évaluations sécuritaires

export interface AIContext {
  sector: string
  companySize: string
  location: string
  previousResponses: Record<string, any>
  currentQuestion: {
    id: string
    text: string
    type: string
    objectiveId: number
  }
}

export interface AISuggestion {
  type: 'recommendation' | 'warning' | 'info' | 'best_practice'
  title: string
  message: string
  confidence: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  relatedQuestions?: string[]
  actions?: string[]
}

export interface AIAnalysis {
  suggestions: AISuggestion[]
  inconsistencies: string[]
  completionTips: string[]
  riskAlerts: string[]
}

export class EvaluationAIAssistant {
  private knowledgeBase: Record<string, any>
  
  constructor() {
    this.knowledgeBase = this.initializeKnowledgeBase()
  }

  private initializeKnowledgeBase() {
    return {
      // Bonnes pratiques par secteur
      sectorBestPractices: {
        'Technologie': {
          access: ['Authentification multi-facteurs', 'Contrôle d\'accès basé sur les rôles'],
          infrastructure: ['Redondance électrique', 'Sauvegarde hors site'],
          communication: ['Chiffrement des données', 'Surveillance réseau 24/7']
        },
        'Santé': {
          access: ['Contrôle d\'accès strict', 'Traçabilité des accès'],
          compliance: ['Conformité RGPD', 'Audit régulier'],
          emergency: ['Plan d\'évacuation', 'Équipement médical d\'urgence']
        },
        'Finance': {
          access: ['Sécurité renforcée', 'Surveillance continue'],
          compliance: ['Conformité réglementaire', 'Audit financier'],
          infrastructure: ['Haute disponibilité', 'Sécurité physique']
        }
      },

      // Corrélations entre questions
      questionCorrelations: {
        'voie_acces_publique': {
          related: ['eclairage_adequat', 'surveillance_publique'],
          implications: 'Une voie publique nécessite un éclairage et une surveillance renforcés'
        },
        'cloture_hauteur': {
          related: ['dispositif_anti_intrusion', 'surveillance_perimetrique'],
          implications: 'Une clôture haute doit être complétée par des dispositifs anti-intrusion'
        }
      },

      // Seuils de risque par objectif
      riskThresholds: {
        access_control: { critical: 30, high: 50, medium: 70 },
        perimeter_security: { critical: 40, high: 60, medium: 75 },
        infrastructure: { critical: 35, high: 55, medium: 70 }
      },

      // Recommandations contextuelles
      contextualRecommendations: {
        'PME': {
          budget_friendly: ['Solutions de surveillance IP', 'Contrôle d\'accès par badge'],
          priorities: ['Sécurité périmétrique', 'Contrôle d\'accès']
        },
        'ETI': {
          advanced_solutions: ['Système intégré', 'Surveillance intelligente'],
          priorities: ['Infrastructure critique', 'Continuité d\'activité']
        }
      }
    }
  }

  /**
   * Analyse contextuelle d'une réponse
   */
  public analyzeResponse(context: AIContext, response: any): AISuggestion[] {
    const suggestions: AISuggestion[] = []
    const { sector, companySize, currentQuestion } = context

    // Suggestions basées sur le secteur
    const sectorPractices = this.knowledgeBase.sectorBestPractices[sector]
    if (sectorPractices) {
      suggestions.push(...this.generateSectorSuggestions(currentQuestion, sectorPractices))
    }

    // Suggestions basées sur la taille de l'entreprise
    const sizePractices = this.knowledgeBase.contextualRecommendations[companySize]
    if (sizePractices) {
      suggestions.push(...this.generateSizeSuggestions(currentQuestion, sizePractices))
    }

    // Analyse de cohérence
    suggestions.push(...this.analyzeConsistency(context, response))

    // Suggestions de bonnes pratiques
    suggestions.push(...this.generateBestPractices(currentQuestion, response))

    return suggestions.sort((a, b) => b.confidence - a.confidence)
  }

  private generateSectorSuggestions(question: any, practices: any): AISuggestion[] {
    const suggestions: AISuggestion[] = []
    
    if (question.text.toLowerCase().includes('accès')) {
      suggestions.push({
        type: 'best_practice',
        title: 'Bonnes pratiques sectorielles',
        message: `Pour votre secteur, considérez: ${practices.access?.join(', ') || 'Contrôle d\'accès renforcé'}`,
        confidence: 0.8,
        priority: 'medium',
        actions: practices.access || []
      })
    }

    return suggestions
  }

  private generateSizeSuggestions(question: any, practices: any): AISuggestion[] {
    const suggestions: AISuggestion[] = []
    
    if (practices.budget_friendly && question.text.toLowerCase().includes('surveillance')) {
      suggestions.push({
        type: 'recommendation',
        title: 'Solutions adaptées à votre taille',
        message: `Solutions recommandées: ${practices.budget_friendly.join(', ')}`,
        confidence: 0.75,
        priority: 'medium',
        actions: practices.budget_friendly
      })
    }

    return suggestions
  }

  private analyzeConsistency(context: AIContext, response: any): AISuggestion[] {
    const suggestions: AISuggestion[] = []
    const { previousResponses, currentQuestion } = context

    // Vérifier les incohérences
    if (currentQuestion.text.includes('clôture') && response.booleanValue === false) {
      const hasPerimeterSecurity = Object.values(previousResponses).some((r: any) => 
        r.questionText?.includes('surveillance') && r.booleanValue === true
      )
      
      if (hasPerimeterSecurity) {
        suggestions.push({
          type: 'warning',
          title: 'Incohérence détectée',
          message: 'Vous avez indiqué avoir de la surveillance mais pas de clôture. Cela peut créer une vulnérabilité.',
          confidence: 0.9,
          priority: 'high',
          actions: ['Vérifier la cohérence des mesures de sécurité périmétrique']
        })
      }
    }

    return suggestions
  }

  private generateBestPractices(question: any, response: any): AISuggestion[] {
    const suggestions: AISuggestion[] = []

    // Suggestions basées sur le type de question
    if (question.text.toLowerCase().includes('éclairage')) {
      if (response.booleanValue === false) {
        suggestions.push({
          type: 'recommendation',
          title: 'Amélioration de l\'éclairage',
          message: 'Un éclairage adéquat est essentiel pour la sécurité. Considérez l\'installation d\'éclairage LED avec détecteurs de mouvement.',
          confidence: 0.85,
          priority: 'medium',
          actions: [
            'Installer un éclairage LED économique',
            'Ajouter des détecteurs de mouvement',
            'Prévoir un éclairage de secours'
          ]
        })
      }
    }

    if (question.text.toLowerCase().includes('caméra') || question.text.toLowerCase().includes('surveillance')) {
      if (response.booleanValue === true) {
        suggestions.push({
          type: 'info',
          title: 'Optimisation de la surveillance',
          message: 'Excellent ! Assurez-vous que vos caméras couvrent tous les angles morts et que l\'enregistrement est sécurisé.',
          confidence: 0.8,
          priority: 'low',
          actions: [
            'Vérifier la couverture complète',
            'Sécuriser le stockage des enregistrements',
            'Tester régulièrement le système'
          ]
        })
      }
    }

    return suggestions
  }

  /**
   * Détecte les incohérences dans les réponses
   */
  public detectInconsistencies(responses: Record<string, any>): string[] {
    const inconsistencies: string[] = []

    // Logique de détection d'incohérences
    const responseArray = Object.values(responses)
    
    // Exemple: Surveillance sans électricité
    const hasSurveillance = responseArray.some((r: any) => 
      r.questionText?.includes('surveillance') && r.booleanValue === true
    )
    const hasElectricity = responseArray.some((r: any) => 
      r.questionText?.includes('électrique') && r.booleanValue === true
    )

    if (hasSurveillance && !hasElectricity) {
      inconsistencies.push('Surveillance vidéo sans alimentation électrique fiable détectée')
    }

    return inconsistencies
  }

  /**
   * Génère des conseils pour compléter l'évaluation
   */
  public generateCompletionTips(
    responses: Record<string, any>,
    totalQuestions: number
  ): string[] {
    const tips: string[] = []
    const completionRate = Object.keys(responses).length / totalQuestions

    if (completionRate < 0.3) {
      tips.push('Commencez par les sections critiques: accès et périmètre')
    } else if (completionRate < 0.6) {
      tips.push('N\'oubliez pas les infrastructures critiques (électricité, eau)')
    } else if (completionRate < 0.9) {
      tips.push('Complétez les sections formation et conformité pour une évaluation complète')
    }

    // Conseils spécifiques basés sur les réponses manquantes
    const hasAccessResponses = Object.values(responses).some((r: any) => 
      r.questionText?.includes('accès') || r.questionText?.includes('entrée')
    )
    
    if (!hasAccessResponses) {
      tips.push('Section contrôle d\'accès non évaluée - critique pour la sécurité')
    }

    return tips
  }

  /**
   * Génère des alertes de risque en temps réel
   */
  public generateRiskAlerts(
    responses: Record<string, any>,
    context: AIContext
  ): string[] {
    const alerts: string[] = []
    const responseArray = Object.values(responses)

    // Alertes basées sur les réponses critiques
    const criticalNegativeResponses = responseArray.filter((r: any) => 
      r.booleanValue === false && (
        r.questionText?.includes('clôture') ||
        r.questionText?.includes('surveillance') ||
        r.questionText?.includes('contrôle')
      )
    )

    if (criticalNegativeResponses.length >= 3) {
      alerts.push('⚠️ Niveau de risque élevé détecté - Mesures de sécurité insuffisantes')
    }

    // Alertes sectorielles
    if (context.sector === 'Santé') {
      const hasAccessControl = responseArray.some((r: any) => 
        r.questionText?.includes('contrôle') && r.booleanValue === true
      )
      if (!hasAccessControl) {
        alerts.push('🏥 Secteur santé: Contrôle d\'accès obligatoire pour la conformité')
      }
    }

    return alerts
  }

  /**
   * Analyse complète avec suggestions contextuelles
   */
  public performFullAnalysis(
    context: AIContext,
    allResponses: Record<string, any>
  ): AIAnalysis {
    const suggestions = this.analyzeResponse(context, allResponses[context.currentQuestion.id])
    const inconsistencies = this.detectInconsistencies(allResponses)
    const completionTips = this.generateCompletionTips(allResponses, 200) // Estimation
    const riskAlerts = this.generateRiskAlerts(allResponses, context)

    return {
      suggestions,
      inconsistencies,
      completionTips,
      riskAlerts
    }
  }
}
