// Structured Prompt Builder for Enhanced AI Risk Analysis

interface PromptContext {
  target: string
  scenario: string
  category?: string
  evaluationInsights?: any
  analysisType: 'probability' | 'vulnerability' | 'impact' | 'overall'
}

interface PromptTemplate {
  systemPrompt: string
  userPrompt: string
  outputFormat: string
  examples: string[]
}

interface EvidenceContext {
  positiveEvidence: any[]
  negativeEvidence: any[]
  domainScores: Record<string, number>
  patterns: any[]
  metrics: any[]
}

/**
 * Structured Prompt Builder for AI Risk Analysis
 * Creates detailed, evidence-based prompts for each analysis criterion
 */
export class StructuredPromptBuilder {
  
  /**
   * Builds a comprehensive prompt for probability analysis
   */
  public buildProbabilityPrompt(context: PromptContext): PromptTemplate {
    const systemPrompt = this.buildSystemPrompt('probability')
    const userPrompt = this.buildProbabilityUserPrompt(context)
    const outputFormat = this.buildProbabilityOutputFormat()
    const examples = this.buildProbabilityExamples()
    
    return {
      systemPrompt,
      userPrompt,
      outputFormat,
      examples
    }
  }

  /**
   * Builds a comprehensive prompt for vulnerability analysis
   */
  public buildVulnerabilityPrompt(context: PromptContext): PromptTemplate {
    const systemPrompt = this.buildSystemPrompt('vulnerability')
    const userPrompt = this.buildVulnerabilityUserPrompt(context)
    const outputFormat = this.buildVulnerabilityOutputFormat()
    const examples = this.buildVulnerabilityExamples()
    
    return {
      systemPrompt,
      userPrompt,
      outputFormat,
      examples
    }
  }

  /**
   * Builds a comprehensive prompt for impact analysis
   */
  public buildImpactPrompt(context: PromptContext): PromptTemplate {
    const systemPrompt = this.buildSystemPrompt('impact')
    const userPrompt = this.buildImpactUserPrompt(context)
    const outputFormat = this.buildImpactOutputFormat()
    const examples = this.buildImpactExamples()
    
    return {
      systemPrompt,
      userPrompt,
      outputFormat,
      examples
    }
  }

  /**
   * Builds system prompt for specific analysis type
   */
  private buildSystemPrompt(analysisType: string): string {
    const basePrompt = `Vous êtes un expert en analyse de risques sécuritaires spécialisé dans l'évaluation ${analysisType === 'probability' ? 'de probabilité' : analysisType === 'vulnerability' ? 'de vulnérabilité' : 'des répercussions'}.

Votre rôle est d'analyser des données d'évaluations sécuritaires réelles pour fournir une évaluation précise et justifiée.

PRINCIPES DIRECTEURS:
1. Basez TOUJOURS vos conclusions sur les données d'évaluation fournies
2. Citez des éléments spécifiques des évaluations dans vos points forts/faibles
3. Utilisez des pourcentages et métriques exactes quand disponibles
4. Évitez les généralités - soyez précis et factuel
5. Si aucune donnée n'est disponible, indiquez clairement "Aucun élément disponible"
6. Ne mentionnez jamais le mode développement ou l'indexation

ÉCHELLE D'ÉVALUATION:`

    if (analysisType === 'probability') {
      return basePrompt + `
- 1: FAIBLE - Événement peu probable dans les conditions actuelles
- 2: MODÉRÉE - Événement possible dans certaines circonstances  
- 3: ÉLEVÉE - Événement probable dans les conditions actuelles`
    } else if (analysisType === 'vulnerability') {
      return basePrompt + `
- 1: TRÈS FAIBLE - Protections robustes et redondantes
- 2: FAIBLE - Protections adéquates avec améliorations mineures
- 3: MODÉRÉE - Protections partielles, améliorations nécessaires
- 4: ÉLEVÉE - Protections insuffisantes, actions urgentes requises`
    } else {
      return basePrompt + `
- 1: NÉGLIGEABLE - Conséquences mineures et facilement gérables
- 2: FAIBLE - Conséquences limitées avec récupération rapide
- 3: MODÉRÉ - Conséquences significatives nécessitant des mesures
- 4: ÉLEVÉ - Conséquences importantes avec perturbations majeures
- 5: CRITIQUE - Conséquences catastrophiques menaçant la continuité`
    }
  }

  /**
   * Builds user prompt for vulnerability analysis
   */
  private buildVulnerabilityUserPrompt(context: PromptContext): string {
    let prompt = `ANALYSE DE VULNÉRABILITÉ

CIBLE: ${context.target}
SCÉNARIO: ${context.scenario}
${context.category ? `CATÉGORIE: ${context.category}` : ''}

`

    if (context.evaluationInsights) {
      prompt += this.buildEvaluationDataSection(context.evaluationInsights, 'vulnerability')
    } else {
      prompt += `DONNÉES D'ÉVALUATION: Aucune donnée d'évaluation disponible pour cette analyse.

`
    }

    prompt += `INSTRUCTIONS SPÉCIFIQUES:
1. Analysez la vulnérabilité de la cible face au scénario
2. Identifiez les PROTECTIONS en place (systèmes, procédures, contrôles)
3. Identifiez les VULNÉRABILITÉS (lacunes, faiblesses, points d'entrée)
4. Citez des éléments précis des évaluations avec leurs sources
5. Proposez un score de 1 à 4 avec justification détaillée

FOCUS VULNÉRABILITÉ:
- Protections physiques (clôtures, barrières, contrôles d'accès)
- Systèmes de surveillance et détection
- Procédures de sécurité et contrôles
- Redondance et systèmes de sauvegarde
- Points faibles et lacunes identifiées`

    return prompt
  }

  /**
   * Builds user prompt for impact analysis
   */
  private buildImpactUserPrompt(context: PromptContext): string {
    let prompt = `ANALYSE DES RÉPERCUSSIONS

CIBLE: ${context.target}
SCÉNARIO: ${context.scenario}
${context.category ? `CATÉGORIE: ${context.category}` : ''}

`

    if (context.evaluationInsights) {
      prompt += this.buildEvaluationDataSection(context.evaluationInsights, 'impact')
    } else {
      prompt += `DONNÉES D'ÉVALUATION: Aucune donnée d'évaluation disponible pour cette analyse.

`
    }

    prompt += `INSTRUCTIONS SPÉCIFIQUES:
1. Analysez les répercussions potentielles si le scénario se réalise
2. Identifiez les facteurs ATTÉNUANTS (plans de continuité, redondances)
3. Identifiez les facteurs AGGRAVANTS (criticité, dépendances, coûts)
4. Citez des éléments précis des évaluations avec leurs sources
5. Proposez un score de 1 à 5 avec justification détaillée

FOCUS RÉPERCUSSIONS:
- Impact opérationnel (arrêt production, services)
- Impact financier (pertes directes, coûts de récupération)
- Impact humain (sécurité, santé)
- Impact réputationnel et réglementaire
- Capacité de récupération et continuité`

    return prompt
  }

  /**
   * Builds user prompt for probability analysis
   */
  private buildProbabilityUserPrompt(context: PromptContext): string {
    let prompt = `ANALYSE DE PROBABILITÉ

CIBLE: ${context.target}
SCÉNARIO: ${context.scenario}
${context.category ? `CATÉGORIE: ${context.category}` : ''}

`

    if (context.evaluationInsights) {
      prompt += this.buildEvaluationDataSection(context.evaluationInsights, 'probability')
    } else {
      prompt += `DONNÉES D'ÉVALUATION: Aucune donnée d'évaluation disponible pour cette analyse.

`
    }

    prompt += `INSTRUCTIONS SPÉCIFIQUES:
1. Analysez la probabilité que ce scénario se produise
2. Identifiez les facteurs qui AUGMENTENT la probabilité (maintenance défaillante, formation insuffisante, etc.)
3. Identifiez les facteurs qui RÉDUISENT la probabilité (procédures robustes, formation régulière, etc.)
4. Citez des éléments précis des évaluations avec leurs sources
5. Proposez un score de 1 à 3 avec justification détaillée

FOCUS PROBABILITÉ:
- Maintenance et entretien des équipements
- Formation et compétence du personnel  
- Procédures et contrôles en place
- Historique d'incidents similaires
- Facteurs environnementaux et opérationnels`

    return prompt
  }

  /**
   * Builds evaluation data section for prompts
   */
  private buildEvaluationDataSection(insights: any, analysisType: string): string {
    let section = `DONNÉES D'ÉVALUATION ANALYSÉES:
- ${insights.totalEvaluations} évaluations complètes
- ${insights.totalResponses} réponses d'évaluation
- Secteur d'activité: ${insights.sectorContext}
- Maturité sécuritaire: ${insights.companyMaturity}
- Qualité des preuves: ${Math.round(insights.evidenceQuality)}%

`

    // Add domain scores
    if (insights.domainScores && Object.keys(insights.domainScores).length > 0) {
      section += `SCORES PAR DOMAINE SÉCURITAIRE:
`
      Object.entries(insights.domainScores).forEach(([domain, score]: [string, any]) => {
        section += `- ${domain}: ${Math.round(score)}%
`
      })
      section += `
`
    }

    // Add relevant metrics
    if (insights.extractedMetrics && insights.extractedMetrics.length > 0) {
      const relevantMetrics = insights.extractedMetrics
        .filter((m: any) => this.isMetricRelevantToAnalysis(m, analysisType))
        .slice(0, 10) // Limit to top 10 most relevant

      if (relevantMetrics.length > 0) {
        section += `MÉTRIQUES PERTINENTES EXTRAITES:
`
        relevantMetrics.forEach((metric: any) => {
          section += `- ${metric.questionText}: ${this.formatMetricValue(metric)} (Source: ${metric.source})
`
        })
        section += `
`
      }
    }

    // Add critical weaknesses
    if (insights.criticalWeaknesses && insights.criticalWeaknesses.length > 0) {
      section += `FAIBLESSES CRITIQUES IDENTIFIÉES:
`
      insights.criticalWeaknesses.slice(0, 5).forEach((weakness: string) => {
        section += `- ${weakness}
`
      })
      section += `
`
    }

    // Add strength areas
    if (insights.strengthAreas && insights.strengthAreas.length > 0) {
      section += `POINTS FORTS IDENTIFIÉS:
`
      insights.strengthAreas.slice(0, 5).forEach((strength: string) => {
        section += `- ${strength}
`
      })
      section += `
`
    }

    // Add patterns
    if (insights.patterns && insights.patterns.length > 0) {
      const relevantPatterns = insights.patterns
        .filter((p: any) => p.riskRelevance.includes(analysisType) || p.riskRelevance.includes('général'))
        .slice(0, 3)

      if (relevantPatterns.length > 0) {
        section += `PATTERNS CROSS-ÉVALUATIONS:
`
        relevantPatterns.forEach((pattern: any) => {
          section += `- ${pattern.pattern} (${Math.round(pattern.frequency * 100)}% des évaluations)
`
        })
        section += `
`
      }
    }

    return section
  }

  /**
   * Helper methods
   */
  private isMetricRelevantToAnalysis(metric: any, analysisType: string): boolean {
    const questionText = metric.questionText.toLowerCase()
    
    if (analysisType === 'probability') {
      const keywords = ['maintenance', 'entretien', 'formation', 'procédure', 'contrôle', 'incident']
      return keywords.some(keyword => questionText.includes(keyword))
    } else if (analysisType === 'vulnerability') {
      const keywords = ['protection', 'sécurité', 'surveillance', 'accès', 'clôture', 'alarme']
      return keywords.some(keyword => questionText.includes(keyword))
    } else if (analysisType === 'impact') {
      const keywords = ['critique', 'essentiel', 'important', 'continuité', 'récupération']
      return keywords.some(keyword => questionText.includes(keyword))
    }
    
    return false
  }

  private formatMetricValue(metric: any): string {
    if (metric.type === 'boolean') {
      return metric.value ? 'Oui' : 'Non'
    } else if (metric.type === 'percentage') {
      return `${metric.value}%`
    } else if (metric.type === 'score') {
      return `Score: ${metric.value.facility || 0}/${metric.value.constraint || 0}`
    } else if (metric.type === 'text') {
      return metric.value.substring(0, 100) + (metric.value.length > 100 ? '...' : '')
    }
    return String(metric.value)
  }

  /**
   * Output format specifications
   */
  private buildProbabilityOutputFormat(): string {
    return `FORMAT DE RÉPONSE REQUIS:

{
  "score": [1-3],
  "explication": "Explication détaillée du score avec justification basée sur les données",
  "points_forts": [
    "Point fort spécifique avec citation de l'évaluation (Source: nom_evaluation)",
    "Autre point fort avec pourcentage exact si disponible"
  ],
  "points_faibles": [
    "Point faible spécifique avec citation de l'évaluation (Source: nom_evaluation)", 
    "Autre point faible avec données précises"
  ],
  "conclusion": "Synthèse justifiant le score attribué",
  "confiance": [0.0-1.0]
}`
  }

  private buildVulnerabilityOutputFormat(): string {
    return `FORMAT DE RÉPONSE REQUIS:

{
  "score": [1-4],
  "explication": "Explication détaillée du score avec justification basée sur les données",
  "points_forts": [
    "Mesure de protection identifiée avec citation (Source: nom_evaluation)",
    "Autre protection avec efficacité mesurée"
  ],
  "points_faibles": [
    "Vulnérabilité identifiée avec citation (Source: nom_evaluation)",
    "Autre vulnérabilité avec impact évalué"
  ],
  "conclusion": "Synthèse justifiant le score attribué",
  "confiance": [0.0-1.0]
}`
  }

  private buildImpactOutputFormat(): string {
    return `FORMAT DE RÉPONSE REQUIS:

{
  "score": [1-5],
  "explication": "Explication détaillée du score avec justification basée sur les données",
  "points_forts": [
    "Facteur d'atténuation identifié avec citation (Source: nom_evaluation)",
    "Autre facteur réduisant l'impact"
  ],
  "points_faibles": [
    "Facteur aggravant identifié avec citation (Source: nom_evaluation)",
    "Autre facteur augmentant l'impact"
  ],
  "conclusion": "Synthèse justifiant le score attribué",
  "confiance": [0.0-1.0]
}`
  }

  /**
   * Example responses for each analysis type
   */
  private buildProbabilityExamples(): string[] {
    return [
      `Exemple pour un système de surveillance:
{
  "score": 2,
  "explication": "Probabilité modérée basée sur l'analyse de 45 réponses d'évaluation",
  "points_forts": [
    "Formation du personnel: 93% des employés formés (Source: Évaluation Sécurité Personnel)",
    "Procédures documentées: Présence confirmée (Source: Audit Procédures)"
  ],
  "points_faibles": [
    "Maintenance préventive: Aucun service d'entretien (Source: Évaluation Infrastructure)",
    "Tests réguliers: 15% seulement des équipements testés (Source: Contrôle Technique)"
  ],
  "conclusion": "Score modéré justifié par la formation élevée mais maintenance défaillante",
  "confiance": 0.85
}`
    ]
  }

  private buildVulnerabilityExamples(): string[] {
    return [
      `Exemple pour un périmètre de sécurité:
{
  "score": 3,
  "explication": "Vulnérabilité modérée avec protections partielles identifiées",
  "points_forts": [
    "Clôture périmétrique: Présente sur 80% du site (Source: Audit Périmètre)",
    "Contrôle d'accès: Système actif aux entrées principales (Source: Évaluation Accès)"
  ],
  "points_faibles": [
    "Surveillance nocturne: Aucune surveillance 22h-6h (Source: Évaluation Surveillance)",
    "Éclairage périmétrique: 40% des zones non éclairées (Source: Audit Éclairage)"
  ],
  "conclusion": "Protections de base présentes mais lacunes importantes en surveillance",
  "confiance": 0.78
}`
    ]
  }

  private buildImpactExamples(): string[] {
    return [
      `Exemple pour un système critique:
{
  "score": 4,
  "explication": "Impact élevé dans le contexte minier avec actifs de haute valeur",
  "points_forts": [
    "Plan de continuité: Procédures de récupération documentées (Source: Audit Continuité)",
    "Systèmes redondants: 60% des systèmes critiques doublés (Source: Évaluation Infrastructure)"
  ],
  "points_faibles": [
    "Temps de récupération: Estimation 48-72h pour restauration complète (Source: Test Récupération)",
    "Impact financier: Perte estimée 500K€/jour d'arrêt (Source: Analyse Financière)"
  ],
  "conclusion": "Impact élevé justifié par la criticité des opérations et coûts d'arrêt",
  "confiance": 0.82
}`
    ]
  }
}
