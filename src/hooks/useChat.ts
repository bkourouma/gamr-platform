import { useState, useCallback } from 'react'

// API URL configuration - use relative path for production (handled by reverse proxy)
const isDev = import.meta.env.DEV
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Define types directly in this file
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

export interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (message: string) => Promise<void>
  clearChat: () => void
  session: ChatSession | null
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<ChatSession | null>(null)

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return

    setIsLoading(true)
    setError(null)

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    try {
      // Get auth token
      const token = localStorage.getItem('token')
      
      // Call RAG API with simplified request
      const response = await fetch(`${API_BASE_URL}/rag/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          query: message,
          tenantId: 'techcorp'
        })
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server error:', errorText)
        throw new Error(`Erreur serveur (${response.status}): ${errorText}`)
      }

      const result = await response.json()
      console.log('RAG Response:', result)

      // Handle different response formats
      let ragResponse: RAGResponse
      if (result.data) {
        ragResponse = result.data
      } else if (result.answer) {
        ragResponse = result
      } else {
        // Fallback for unexpected response format
        ragResponse = {
          answer: result.message || 'Réponse reçue du serveur',
          sources: [],
          confidence: 0.5
        }
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: ragResponse.answer || 'Désolé, je n\'ai pas pu générer une réponse.',
        timestamp: new Date(),
        sources: ragResponse.sources || []
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (err) {
      console.error('Chat error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(errorMessage)
      
      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'Désolé, je rencontre des difficultés techniques. Veuillez réessayer dans quelques instants.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorChatMessage])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
    setSession(null)
  }, [])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    session
  }
}