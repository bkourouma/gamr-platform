// Evidence Citation Tracker for AI Risk Analysis

interface EvidenceItem {
  id: string
  source: string
  questionText: string
  response: string
  responseType: 'boolean' | 'percentage' | 'text' | 'score'
  value: any
  confidence: number
  relevanceScore: number
  category: string
  timestamp: string
  evaluationId: string
  questionId: string
}

interface Citation {
  evidenceId: string
  citationText: string
  context: string
  weight: number
  usedInCriterion: 'probability' | 'vulnerability' | 'impact'
  supportType: 'positive' | 'negative' | 'neutral'
}

interface EvidenceMap {
  [criterionType: string]: {
    positive: Citation[]
    negative: Citation[]
    neutral: Citation[]
  }
}

/**
 * Evidence Citation Tracker
 * Manages evidence collection, citation formatting, and traceability
 */
export class EvidenceCitationTracker {
  private evidenceItems: Map<string, EvidenceItem> = new Map()
  private citations: Citation[] = []
  private evidenceMap: EvidenceMap = {
    probability: { positive: [], negative: [], neutral: [] },
    vulnerability: { positive: [], negative: [], neutral: [] },
    impact: { positive: [], negative: [], neutral: [] }
  }

  /**
   * Adds evidence from evaluation responses
   */
  public addEvidenceFromEvaluations(evaluations: any[]): void {
    evaluations.forEach(evaluation => {
      if (evaluation.responses) {
        evaluation.responses.forEach((response: any) => {
          const evidenceItem = this.createEvidenceItem(response, evaluation)
          this.evidenceItems.set(evidenceItem.id, evidenceItem)
        })
      }
    })
  }

  /**
   * Creates a citation for a specific evidence item
   */
  public createCitation(
    evidenceId: string,
    criterion: 'probability' | 'vulnerability' | 'impact',
    supportType: 'positive' | 'negative' | 'neutral',
    context?: string
  ): Citation | null {
    const evidence = this.evidenceItems.get(evidenceId)
    if (!evidence) return null

    const citation: Citation = {
      evidenceId,
      citationText: this.formatCitationText(evidence),
      context: context || this.generateContext(evidence),
      weight: evidence.confidence * evidence.relevanceScore,
      usedInCriterion: criterion,
      supportType
    }

    this.citations.push(citation)
    this.evidenceMap[criterion][supportType].push(citation)

    return citation
  }

  /**
   * Finds relevant evidence for a specific criterion
   */
  public findRelevantEvidence(
    criterion: 'probability' | 'vulnerability' | 'impact',
    limit: number = 10
  ): EvidenceItem[] {
    const relevantEvidence = Array.from(this.evidenceItems.values())
      .filter(evidence => this.isEvidenceRelevantToCriterion(evidence, criterion))
      .sort((a, b) => (b.confidence * b.relevanceScore) - (a.confidence * a.relevanceScore))
      .slice(0, limit)

    return relevantEvidence
  }

  /**
   * Generates formatted citations for a criterion
   */
  public getFormattedCitations(
    criterion: 'probability' | 'vulnerability' | 'impact'
  ): {
    positive: string[]
    negative: string[]
    neutral: string[]
  } {
    const criterionMap = this.evidenceMap[criterion]
    
    return {
      positive: criterionMap.positive.map(citation => this.formatCitationForDisplay(citation)),
      negative: criterionMap.negative.map(citation => this.formatCitationForDisplay(citation)),
      neutral: criterionMap.neutral.map(citation => this.formatCitationForDisplay(citation))
    }
  }

  /**
   * Gets evidence summary statistics
   */
  public getEvidenceSummary(): {
    totalEvidence: number
    byCategory: Record<string, number>
    bySource: Record<string, number>
    averageConfidence: number
    averageRelevance: number
  } {
    const evidenceArray = Array.from(this.evidenceItems.values())
    
    const byCategory: Record<string, number> = {}
    const bySource: Record<string, number> = {}
    
    evidenceArray.forEach(evidence => {
      byCategory[evidence.category] = (byCategory[evidence.category] || 0) + 1
      bySource[evidence.source] = (bySource[evidence.source] || 0) + 1
    })

    const averageConfidence = evidenceArray.length > 0 
      ? evidenceArray.reduce((sum, e) => sum + e.confidence, 0) / evidenceArray.length 
      : 0

    const averageRelevance = evidenceArray.length > 0
      ? evidenceArray.reduce((sum, e) => sum + e.relevanceScore, 0) / evidenceArray.length
      : 0

    return {
      totalEvidence: evidenceArray.length,
      byCategory,
      bySource,
      averageConfidence,
      averageRelevance
    }
  }

  /**
   * Validates citation quality and completeness
   */
  public validateCitations(): {
    isValid: boolean
    issues: string[]
    recommendations: string[]
  } {
    const issues: string[] = []
    const recommendations: string[] = []

    // Check if we have citations for all criteria
    Object.keys(this.evidenceMap).forEach(criterion => {
      const criterionMap = this.evidenceMap[criterion]
      const totalCitations = criterionMap.positive.length + criterionMap.negative.length + criterionMap.neutral.length
      
      if (totalCitations === 0) {
        issues.push(`Aucune citation pour le critère ${criterion}`)
        recommendations.push(`Ajouter des citations pour ${criterion} basées sur les évaluations disponibles`)
      } else if (criterionMap.positive.length === 0 && criterionMap.negative.length === 0) {
        issues.push(`Seulement des citations neutres pour ${criterion}`)
        recommendations.push(`Identifier des éléments positifs ou négatifs pour ${criterion}`)
      }
    })

    // Check citation quality
    const lowQualityCitations = this.citations.filter(c => c.weight < 0.3)
    if (lowQualityCitations.length > this.citations.length * 0.5) {
      issues.push('Plus de 50% des citations ont une qualité faible')
      recommendations.push('Améliorer la sélection des preuves ou la qualité des évaluations')
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    }
  }

  /**
   * Private helper methods
   */
  private createEvidenceItem(response: any, evaluation: any): EvidenceItem {
    const id = `${evaluation.id}_${response.questionId || response.id || Math.random()}`
    
    return {
      id,
      source: evaluation.title || `Évaluation ${evaluation.id}`,
      questionText: response.question?.text || response.questionText || 'Question non spécifiée',
      response: this.formatResponseValue(response),
      responseType: this.determineResponseType(response),
      value: this.extractResponseValue(response),
      confidence: this.calculateConfidence(response),
      relevanceScore: this.calculateRelevanceScore(response),
      category: this.categorizeResponse(response),
      timestamp: response.answeredAt || response.updatedAt || new Date().toISOString(),
      evaluationId: evaluation.id,
      questionId: response.questionId || response.id || ''
    }
  }

  private formatCitationText(evidence: EvidenceItem): string {
    let citation = evidence.questionText
    
    if (evidence.response) {
      citation += ` - ${evidence.response}`
    }
    
    citation += ` (Source: ${evidence.source})`
    
    return citation
  }

  private generateContext(evidence: EvidenceItem): string {
    let context = ''
    
    if (evidence.responseType === 'boolean') {
      context = evidence.value ? 'Présence confirmée' : 'Absence confirmée'
    } else if (evidence.responseType === 'percentage') {
      const percentage = evidence.value
      if (percentage < 30) {
        context = 'Taux très faible'
      } else if (percentage < 50) {
        context = 'Taux faible'
      } else if (percentage < 70) {
        context = 'Taux modéré'
      } else if (percentage < 90) {
        context = 'Taux élevé'
      } else {
        context = 'Taux très élevé'
      }
    } else if (evidence.responseType === 'score') {
      context = 'Score évalué'
    } else {
      context = 'Information textuelle'
    }
    
    context += ` dans ${evidence.source}`
    
    return context
  }

  private formatCitationForDisplay(citation: Citation): string {
    return citation.citationText
  }

  private isEvidenceRelevantToCriterion(
    evidence: EvidenceItem, 
    criterion: 'probability' | 'vulnerability' | 'impact'
  ): boolean {
    const questionText = evidence.questionText.toLowerCase()
    
    if (criterion === 'probability') {
      const keywords = ['maintenance', 'entretien', 'formation', 'procédure', 'contrôle', 'incident', 'défaillance']
      return keywords.some(keyword => questionText.includes(keyword))
    } else if (criterion === 'vulnerability') {
      const keywords = ['protection', 'sécurité', 'surveillance', 'accès', 'clôture', 'alarme', 'contrôle']
      return keywords.some(keyword => questionText.includes(keyword))
    } else if (criterion === 'impact') {
      const keywords = ['critique', 'essentiel', 'important', 'continuité', 'récupération', 'vital']
      return keywords.some(keyword => questionText.includes(keyword))
    }
    
    return false
  }

  private formatResponseValue(response: any): string {
    if (response.booleanValue !== undefined) {
      return response.booleanValue ? 'Oui' : 'Non'
    } else if (response.numberValue !== undefined) {
      return response.numberValue.toString()
    } else if (response.textValue) {
      return response.textValue.length > 100 
        ? response.textValue.substring(0, 100) + '...'
        : response.textValue
    } else if (response.facilityScore !== undefined || response.constraintScore !== undefined) {
      return `Facilité: ${response.facilityScore || 0}, Contrainte: ${response.constraintScore || 0}`
    }
    return 'Valeur non spécifiée'
  }

  private determineResponseType(response: any): 'boolean' | 'percentage' | 'text' | 'score' {
    if (response.booleanValue !== undefined) return 'boolean'
    if (response.facilityScore !== undefined || response.constraintScore !== undefined) return 'score'
    if (response.textValue && response.textValue.includes('%')) return 'percentage'
    if (response.textValue) return 'text'
    return 'text'
  }

  private extractResponseValue(response: any): any {
    if (response.booleanValue !== undefined) return response.booleanValue
    if (response.numberValue !== undefined) return response.numberValue
    if (response.textValue && response.textValue.includes('%')) {
      const match = response.textValue.match(/(\d+)%/)
      return match ? parseInt(match[1]) : null
    }
    if (response.facilityScore !== undefined || response.constraintScore !== undefined) {
      return { facility: response.facilityScore, constraint: response.constraintScore }
    }
    return response.textValue || null
  }

  private calculateConfidence(response: any): number {
    // Base confidence on response completeness and type
    let confidence = 0.5
    
    if (response.booleanValue !== undefined) confidence = 1.0
    else if (response.numberValue !== undefined) confidence = 0.9
    else if (response.facilityScore !== undefined) confidence = 0.8
    else if (response.textValue && response.textValue.length > 10) confidence = 0.6
    
    // Boost confidence if there's additional context
    if (response.description && response.description.length > 20) confidence += 0.1
    if (response.comment && response.comment.length > 10) confidence += 0.1
    
    return Math.min(1.0, confidence)
  }

  private calculateRelevanceScore(response: any): number {
    const questionText = (response.question?.text || response.questionText || '').toLowerCase()
    const riskKeywords = [
      'sécurité', 'risque', 'menace', 'vulnérabilité', 'protection', 'contrôle',
      'surveillance', 'accès', 'incident', 'urgence', 'maintenance', 'défaillance',
      'critique', 'essentiel', 'important'
    ]
    
    const matchCount = riskKeywords.filter(keyword => questionText.includes(keyword)).length
    return Math.min(1.0, matchCount / 3) // Normalize to 0-1 scale
  }

  private categorizeResponse(response: any): string {
    const questionText = (response.question?.text || response.questionText || '').toLowerCase()
    
    if (questionText.includes('maintenance') || questionText.includes('entretien')) return 'maintenance'
    if (questionText.includes('formation') || questionText.includes('training')) return 'formation'
    if (questionText.includes('sécurité') || questionText.includes('protection')) return 'sécurité'
    if (questionText.includes('surveillance') || questionText.includes('contrôle')) return 'surveillance'
    if (questionText.includes('accès') || questionText.includes('entrée')) return 'accès'
    if (questionText.includes('infrastructure') || questionText.includes('équipement')) return 'infrastructure'
    if (questionText.includes('procédure') || questionText.includes('protocole')) return 'procédures'
    if (questionText.includes('incident') || questionText.includes('urgence')) return 'incidents'
    
    return 'général'
  }
}
