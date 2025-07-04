import type { EmbeddingDocument, VectorSearchResult } from './types'

// Mock ChromaDB service for development
export class ChromaService {
  private collections: Map<string, EmbeddingDocument[]> = new Map()
  
  constructor() {
    console.log('🔧 Using mock ChromaDB service for development')
  }
  
  async initializeCollection(tenantId: string) {
    const collectionName = `gamr_tenant_${tenantId}`
    
    if (!this.collections.has(collectionName)) {
      this.collections.set(collectionName, [])
    }
    
    return {
      name: collectionName,
      tenantId
    }
  }
  
  async indexDocuments(tenantId: string, documents: EmbeddingDocument[]) {
    const collectionName = `gamr_tenant_${tenantId}`
    this.collections.set(collectionName, documents)
    
    console.log(`📚 Indexed ${documents.length} documents for tenant ${tenantId}`)
    
    return {
      indexed: documents.length,
      collectionName
    }
  }
  
  async searchSimilar(
    tenantId: string, 
    query: string, 
    limit: number = 5,
    filters?: Record<string, any>
  ): Promise<VectorSearchResult[]> {
    const collectionName = `gamr_tenant_${tenantId}`
    const documents = this.collections.get(collectionName) || []
    
    // Simple text-based search for development
    const queryLower = query.toLowerCase()
    const results = documents
      .map(doc => ({
        document: doc,
        score: this.calculateSimpleScore(doc.content, queryLower),
        distance: 1 - this.calculateSimpleScore(doc.content, queryLower)
      }))
      .filter(result => result.score > 0.1) // Only include somewhat relevant results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
    
    console.log(`🔍 Found ${results.length} results for query: "${query}"`)
    
    return results
  }
  
  private calculateSimpleScore(content: string, query: string): number {
    const contentLower = content.toLowerCase()
    const queryWords = query.split(' ').filter(word => word.length > 2)
    
    let score = 0
    let totalWords = queryWords.length
    
    queryWords.forEach(word => {
      if (contentLower.includes(word)) {
        score += 1
      }
    })
    
    return totalWords > 0 ? score / totalWords : 0
  }
  
  async deleteDocument(tenantId: string, documentId: string) {
    const collectionName = `gamr_tenant_${tenantId}`
    const documents = this.collections.get(collectionName) || []
    
    const filtered = documents.filter(doc => doc.id !== documentId)
    this.collections.set(collectionName, filtered)
    
    console.log(`🗑️ Deleted document ${documentId} from tenant ${tenantId}`)
  }
  
  async clearTenantData(tenantId: string) {
    const collectionName = `gamr_tenant_${tenantId}`
    this.collections.delete(collectionName)
    
    console.log(`🧹 Cleared all data for tenant ${tenantId}`)
  }
  
  async getCollectionStats(tenantId: string) {
    const collectionName = `gamr_tenant_${tenantId}`
    const documents = this.collections.get(collectionName) || []
    
    return {
      documentCount: documents.length,
      tenantId,
      collectionName
    }
  }
}