// Simple RAG types and services
export interface EmbeddingDocument {
  id: string
  content: string
  metadata: any
  tenantId: string
}

export interface VectorSearchResult {
  document: EmbeddingDocument
  score: number
  distance: number
}

export interface RAGQuery {
  query: string
  tenantId: string
  userId: string
  context?: any
  filters?: any
}

export interface RAGResponse {
  answer: string
  sources: any[]
  confidence: number
  suggestions?: string[]
}

// Simple in-memory vector store
export class ChromaService {
  private collections: Map<string, EmbeddingDocument[]> = new Map()
  
  constructor() {
    console.log('🔧 Using simple in-memory vector store')
  }
  
  async initializeCollection(tenantId: string) {
    const collectionName = `gamr_tenant_${tenantId}`
    if (!this.collections.has(collectionName)) {
      this.collections.set(collectionName, [])
    }
    return { name: collectionName, tenantId }
  }
  
  async indexDocuments(tenantId: string, documents: EmbeddingDocument[]) {
    const collectionName = `gamr_tenant_${tenantId}`
    this.collections.set(collectionName, documents)
    console.log(`📚 Indexed ${documents.length} documents for tenant ${tenantId}`)
    return { indexed: documents.length, collectionName }
  }
  
  async searchSimilar(
    tenantId: string, 
    query: string, 
    limit: number = 5
  ): Promise<VectorSearchResult[]> {
    const collectionName = `gamr_tenant_${tenantId}`
    const documents = this.collections.get(collectionName) || []
    
    const queryLower = query.toLowerCase()
    const results = documents
      .map(doc => ({
        document: doc,
        score: this.calculateScore(doc.content, queryLower),
        distance: 1 - this.calculateScore(doc.content, queryLower)
      }))
      .filter(result => result.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
    
    return results
  }
  
  private calculateScore(content: string, query: string): number {
    const contentLower = content.toLowerCase()
    const queryWords = query.split(' ').filter(word => word.length > 2)
    
    if (queryWords.length === 0) return 0
    
    let score = 0
    queryWords.forEach(word => {
      if (contentLower.includes(word)) score += 1
    })
    
    return score / queryWords.length
  }
  
  async clearTenantData(tenantId: string) {
    const collectionName = `gamr_tenant_${tenantId}`
    this.collections.delete(collectionName)
  }
}

// Simple RAG service
export class RAGService {
  private chromaService: ChromaService
  
  constructor() {
    this.chromaService = new ChromaService()
  }
  
  async indexTenantData(tenantId: string) {
    // Mock data for testing
    const mockDocuments: EmbeddingDocument[] = [
      {
        id: 'doc1',
        content: 'Évaluation de sécurité en cours avec un score de 75/100',
        metadata: { type: 'evaluation', title: 'Évaluation Test' },
        tenantId
      },
      {
        id: 'doc2', 
        content: 'Risque critique identifié sur la sécurité périmétrique',
        metadata: { type: 'risk_sheet', title: 'Risque Périmètre' },
        tenantId
      }
    ]
    
    return await this.chromaService.indexDocuments(tenantId, mockDocuments)
  }
  
  async query(ragQuery: RAGQuery): Promise<RAGResponse> {
    const { query, tenantId } = ragQuery
    
    const searchResults = await this.chromaService.searchSimilar(tenantId, query, 3)
    
    if (searchResults.length === 0) {
      return {
        answer: "Je n'ai pas trouvé d'informations pertinentes. Essayez de reformuler votre question.",
        sources: [],
        confidence: 0,
        suggestions: ["Quels sont mes risques ?", "État des évaluations", "Actions en cours"]
      }
    }
    
    const answer = `Voici ce que j'ai trouvé concernant "${query}":\n\n` +
      searchResults.map((result, i) => 
        `${i + 1}. ${result.document.metadata.title}: ${result.document.content}`
      ).join('\n\n')
    
    return {
      answer,
      sources: searchResults.map(r => ({
        id: r.document.id,
        title: r.document.metadata.title,
        type: r.document.metadata.type,
        excerpt: r.document.content.substring(0, 100) + '...',
        relevanceScore: r.score,
        metadata: r.document.metadata
      })),
      confidence: searchResults.length > 0 ? searchResults[0].score : 0,
      suggestions: ["Quels sont mes risques critiques ?", "État de mes évaluations", "Actions correctives"]
    }
  }
}