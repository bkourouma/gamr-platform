import { ChromaService } from './chromaService'
import { DataExtractor } from './dataExtractor'
import type { RAGQuery, RAGResponse, DocumentSource } from './types'

export class RAGService {
  private chromaService: ChromaService
  private dataExtractor: DataExtractor
  
  constructor() {
    this.chromaService = new ChromaService()
    this.dataExtractor = new DataExtractor()
  }
  
  async indexTenantData(tenantId: string) {
    console.log(`🚀 Starting indexing for tenant: ${tenantId}`)
    
    try {
      // Extract all tenant data
      const documents = await this.dataExtractor.extractTenantData(tenantId)
      console.log(`📊 Extracted ${documents.length} documents`)
      
      // Clear existing data
      await this.chromaService.clearTenantData(tenantId)
      
      // Index new data
      const result = await this.chromaService.indexDocuments(tenantId, documents)
      
      console.log(`✅ Successfully indexed ${result.indexed} documents for tenant ${tenantId}`)
      return result
    } catch (error) {
      console.error('❌ Error during indexing:', error)
      throw error
    }
  }
  
  async query(ragQuery: RAGQuery): Promise<RAGResponse> {
    const { query, tenantId, filters } = ragQuery
    
    try {
      console.log(`🤔 Processing query: "${query}" for tenant ${tenantId}`)
      
      // Search for relevant documents
      const searchResults = await this.chromaService.searchSimilar(
        tenantId,
        query,
        5, // Top 5 results
        filters
      )
      
      if (searchResults.length === 0) {
        return {
          answer: "Je n'ai pas trouvé d'informations pertinentes pour répondre à votre question dans les données de votre tenant. Essayez de reformuler votre question ou assurez-vous que vos données sont bien indexées.",
          sources: [],
          confidence: 0,
          suggestions: [
            "Quels sont mes risques les plus critiques ?",
            "Quel est le statut de mes évaluations ?",
            "Quelles actions sont en retard ?"
          ]
        }
      }
      
      // Build context from search results
      const context = this.buildContext(searchResults)
      
      // Generate response
      const answer = await this.generateResponse(query, context, searchResults)
      
      // Build sources
      const sources: DocumentSource[] = searchResults.map(result => ({
        id: result.document.id,
        title: result.document.metadata.title,
        type: result.document.metadata.type,
        excerpt: this.extractExcerpt(result.document.content, query),
        relevanceScore: result.score,
        metadata: result.document.metadata
      }))
      
      const confidence = this.calculateConfidence(searchResults)
      
      console.log(`✅ Generated response with confidence: ${confidence}`)
      
      return {
        answer,
        sources,
        confidence,
        suggestions: this.generateSuggestions(ragQuery, searchResults)
      }
    } catch (error) {
      console.error('❌ Error processing query:', error)
      return {
        answer: "Désolé, une erreur s'est produite lors du traitement de votre question. Veuillez réessayer.",
        sources: [],
        confidence: 0
      }
    }
  }
  
  private buildContext(searchResults: any[]): string {
    let context = "Contexte basé sur les données GAMR:\n\n"
    
    searchResults.forEach((result, index) => {
      context += `Document ${index + 1} (${result.document.metadata.type}):\n`
      context += `Titre: ${result.document.metadata.title}\n`
      context += `Contenu: ${result.document.content.substring(0, 500)}...\n\n`
    })
    
    return context
  }
  
  private async generateResponse(query: string, context: string, searchResults: any[]): Promise<string> {
    // Enhanced response generation based on query type and context
    const queryLower = query.toLowerCase()
    
    // Analyze query intent
    if (queryLower.includes('risque') || queryLower.includes('critique') || queryLower.includes('priorité')) {
      return this.generateRiskResponse(query, searchResults)
    }
    
    if (queryLower.includes('évaluation') || queryLower.includes('score') || queryLower.includes('progrès')) {
      return this.generateEvaluationResponse(query, searchResults)
    }
    
    if (queryLower.includes('action') || queryLower.includes('corrective') || queryLower.includes('retard')) {
      return this.generateActionResponse(query, searchResults)
    }
    
    if (queryLower.includes('recommandation') || queryLower.includes('conseil') || queryLower.includes('améliorer')) {
      return this.generateRecommendationResponse(query, searchResults)
    }
    
    // General response
    return this.generateGeneralResponse(query, searchResults)
  }
  
  private generateRiskResponse(query: string, searchResults: any[]): string {
    const riskSheets = searchResults.filter(r => r.document.metadata.type === 'risk_sheet')
    
    if (riskSheets.length === 0) {
      return "Je n'ai pas trouvé de fiches de risques correspondant à votre demande. Assurez-vous d'avoir créé des fiches de risques dans votre système."
    }
    
    const criticalRisks = riskSheets.filter(r => 
      r.document.metadata.riskSheet?.priority === 'CRITICAL' || 
      r.document.metadata.riskSheet?.priority === 'HIGH'
    )
    
    let response = `📊 **Analyse des risques GAMR**\n\n`
    
    if (criticalRisks.length > 0) {
      response += `🚨 **Risques critiques identifiés (${criticalRisks.length}):**\n`
      criticalRisks.slice(0, 3).forEach((risk, index) => {
        const metadata = risk.document.metadata.riskSheet
        response += `${index + 1}. **${metadata?.target}** - Score: ${metadata?.riskScore}/100 (${metadata?.priority})\n`
        response += `   Scénario: ${metadata?.scenario}\n\n`
      })
    }
    
    response += `📈 **Recommandations:**\n`
    response += `• Priorisez le traitement des risques avec un score > 70\n`
    response += `• Créez des actions correctives pour les risques critiques\n`
    response += `• Planifiez une révision mensuelle des scores de risque\n`
    
    return response
  }
  
  private generateEvaluationResponse(query: string, searchResults: any[]): string {
    const evaluations = searchResults.filter(r => r.document.metadata.type === 'evaluation')
    
    if (evaluations.length === 0) {
      return "Je n'ai pas trouvé d'évaluations correspondant à votre demande."
    }
    
    let response = `📋 **État des évaluations de sécurité**\n\n`
    
    const completed = evaluations.filter(e => e.document.metadata.evaluation?.status === 'COMPLETED')
    const inProgress = evaluations.filter(e => e.document.metadata.evaluation?.status === 'IN_PROGRESS')
    
    response += `✅ **Évaluations terminées:** ${completed.length}\n`
    response += `🔄 **Évaluations en cours:** ${inProgress.length}\n\n`
    
    if (inProgress.length > 0) {
      response += `**Évaluations en cours:**\n`
      inProgress.slice(0, 3).forEach((evaluation, index) => {
        const metadata = evaluation.document.metadata.evaluation
        response += `${index + 1}. ${evaluation.document.metadata.title} - Progrès: ${metadata?.progress}%\n`
      })
    }
    
    return response
  }
  
  private generateActionResponse(query: string, searchResults: any[]): string {
    const actions = searchResults.filter(r => r.document.metadata.type === 'action')
    
    if (actions.length === 0) {
      return "Je n'ai pas trouvé d'actions correctives correspondant à votre demande."
    }
    
    let response = `🎯 **État des actions correctives**\n\n`
    
    const todo = actions.filter(a => a.document.metadata.action?.status === 'TODO')
    const inProgress = actions.filter(a => a.document.metadata.action?.status === 'IN_PROGRESS')
    const completed = actions.filter(a => a.document.metadata.action?.status === 'COMPLETED')
    
    response += `📝 **À faire:** ${todo.length}\n`
    response += `🔄 **En cours:** ${inProgress.length}\n`
    response += `✅ **Terminées:** ${completed.length}\n\n`
    
    const overdue = actions.filter(a => {
      const dueDate = a.document.metadata.action?.dueDate
      return dueDate && new Date(dueDate) < new Date()
    })
    
    if (overdue.length > 0) {
      response += `⚠️ **Actions en retard (${overdue.length}):**\n`
      overdue.slice(0, 3).forEach((action, index) => {
        response += `${index + 1}. ${action.document.metadata.title}\n`
      })
    }
    
    return response
  }
  
  private generateRecommendationResponse(query: string, searchResults: any[]): string {
    let response = `💡 **Recommandations GAMR personnalisées**\n\n`
    
    response += `**Amélioration de votre posture sécuritaire:**\n\n`
    response += `🔍 **Évaluations:**\n`
    response += `• Complétez toutes les évaluations en cours\n`
    response += `• Planifiez des réévaluations trimestrielles\n`
    response += `• Documentez les changements organisationnels\n\n`
    
    response += `🛡️ **Gestion des risques:**\n`
    response += `• Traitez en priorité les risques avec un score > 70\n`
    response += `• Implémentez des mesures de mitigation\n`
    response += `• Surveillez l'évolution des scores\n\n`
    
    response += `⚡ **Actions correctives:**\n`
    response += `• Assignez des responsables pour chaque action\n`
    response += `• Définissez des échéances réalistes\n`
    response += `• Suivez régulièrement l'avancement\n`
    
    return response
  }
  
  private generateGeneralResponse(query: string, searchResults: any[]): string {
    let response = `Voici les informations que j'ai trouvées concernant "${query}" dans vos données GAMR:\n\n`
    
    const typeCount = searchResults.reduce((acc, result) => {
      const type = result.document.metadata.type
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    response += `📊 **Données analysées:**\n`
    Object.entries(typeCount).forEach(([type, count]) => {
      const typeNames = {
        'evaluation': 'Évaluations',
        'risk_sheet': 'Fiches de risques',
        'action': 'Actions correctives',
        'response': 'Réponses'
      }
      response += `• ${typeNames[type as keyof typeof typeNames] || type}: ${count}\n`
    })
    
    response += `\nConsultez les sources détaillées ci-dessous pour plus d'informations spécifiques.`
    
    return response
  }
  
  private extractExcerpt(content: string, query: string): string {
    const words = content.split(' ')
    const queryWords = query.toLowerCase().split(' ')
    
    // Find the best matching section
    let bestIndex = 0
    let bestScore = 0
    
    for (let i = 0; i < words.length - 20; i++) {
      const section = words.slice(i, i + 20).join(' ').toLowerCase()
      const score = queryWords.reduce((acc, word) => {
        return acc + (section.includes(word) ? 1 : 0)
      }, 0)
      
      if (score > bestScore) {
        bestScore = score
        bestIndex = i
      }
    }
    
    const excerpt = words.slice(bestIndex, bestIndex + 30).join(' ')
    return excerpt.length > 200 ? excerpt.substring(0, 200) + '...' : excerpt
  }
  
  private calculateConfidence(searchResults: any[]): number {
    if (searchResults.length === 0) return 0
    
    const avgScore = searchResults.reduce((sum, result) => sum + result.score, 0) / searchResults.length
    return Math.round(avgScore * 100) / 100
  }
  
  private generateSuggestions(query: RAGQuery, searchResults: any[]): string[] {
    const suggestions: string[] = []
    
    // Generate suggestions based on available data types
    const types = new Set(searchResults.map(r => r.document.metadata.type))
    
    if (types.has('evaluation')) {
      suggestions.push("Quelles sont mes évaluations en cours ?")
      suggestions.push("Quel est le score moyen de mes évaluations ?")
    }
    
    if (types.has('risk_sheet')) {
      suggestions.push("Quels sont mes risques les plus critiques ?")
      suggestions.push("Comment améliorer mes scores de risque ?")
    }
    
    if (types.has('action')) {
      suggestions.push("Quelles actions sont en retard ?")
      suggestions.push("Quel est le statut de mes actions correctives ?")
    }
    
    // Add general suggestions if no specific ones
    if (suggestions.length === 0) {
      suggestions.push("Donne-moi un aperçu de ma sécurité")
      suggestions.push("Quelles sont mes priorités ?")
      suggestions.push("Comment améliorer ma posture sécuritaire ?")
    }
    
    return suggestions.slice(0, 3) // Return max 3 suggestions
  }
}