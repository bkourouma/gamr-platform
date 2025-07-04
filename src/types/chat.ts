export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  sources?: DocumentSource[]
}

export interface DocumentSource {
  id: string
  title: string
  type: string
  excerpt: string
  relevanceScore: number
  url?: string
  metadata?: any
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

export interface RAGResponse {
  answer: string
  sources: DocumentSource[]
  confidence: number
  suggestions?: string[]
  relatedQueries?: string[]
}