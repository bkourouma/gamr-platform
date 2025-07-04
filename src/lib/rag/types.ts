// Types pour le système RAG (Retrieval-Augmented Generation)

export interface EmbeddingDocument {
  id: string
  content: string
  metadata: DocumentMetadata
  embedding?: number[]
  tenantId: string
}

export interface DocumentMetadata {
  type: 'evaluation' | 'risk_sheet' | 'action' | 'response' | 'template'
  entityId: string
  title: string
  createdAt: string
  updatedAt: string
  author?: {
    id: string
    name: string
  }
  // Métadonnées spécifiques par type
  evaluation?: {
    status: string
    progress: number
    totalScore?: number
    riskLevel?: string
  }
  riskSheet?: {
    target: string
    scenario: string
    riskScore: number
    priority: string
    category?: string
  }
  action?: {
    status: string
    priority: string
    dueDate?: string
    assigneeId?: string
  }
  response?: {
    questionId: string
    questionText: string
    objectiveTitle: string
    facilityScore?: number
    constraintScore?: number
  }
}

export interface RAGQuery {
  query: string
  tenantId: string
  userId: string
  context?: {
    evaluationId?: string
    riskSheetId?: string
    actionId?: string
  }
  filters?: {
    type?: DocumentMetadata['type'][]
    dateRange?: {
      start: string
      end: string
    }
    priority?: string[]
    status?: string[]
  }
}

export interface RAGResponse {
  answer: string
  sources: DocumentSource[]
  confidence: number
  suggestions?: string[]
  relatedQueries?: string[]
}

export interface DocumentSource {
  id: string
  title: string
  type: DocumentMetadata['type']
  excerpt: string
  relevanceScore: number
  url?: string
  metadata: DocumentMetadata
}

export interface VectorSearchResult {
  document: EmbeddingDocument
  score: number
  distance: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  sources?: DocumentSource[]
}

export interface ChatSession {
  id: string
  tenantId: string
  userId: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}