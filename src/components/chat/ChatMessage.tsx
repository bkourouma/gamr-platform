import React from 'react'
import { User, Bot, ExternalLink, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ChatMessageType {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  sources?: {
    id: string
    title: string
    type: string
    excerpt: string
    relevanceScore: number
    url?: string
    metadata?: any
  }[]
}

interface ChatMessageProps {
  message: ChatMessageType
}

// Improved markdown parser
const parseMarkdown = (text: string) => {
  const lines = text.split('\n')
  const elements: React.ReactElement[] = []
  let currentIndex = 0

  lines.forEach((line, index) => {
    const trimmedLine = line.trim()
    
    // Skip empty lines
    if (!trimmedLine) {
      elements.push(<div key={`empty-${index}`} className="h-2" />)
      return
    }

    // Main headers with emojis (🤖, 📊, etc.)
    if (/^[🤖📊🔴📋🏢👥💻📈🔍💡⚡✅⚠️🚨📈🔄].+\*\*$/.test(trimmedLine)) {
      const content = trimmedLine.replace(/\*\*/g, '')
      elements.push(
        <div key={index} className="flex items-center gap-3 text-xl font-bold text-blue-700 mb-4 mt-6 first:mt-0">
          {content}
        </div>
      )
      return
    }

    // Section headers (**text:**)
    if (/^\*\*[^*]+:\*\*$/.test(trimmedLine)) {
      const content = trimmedLine.replace(/\*\*/g, '').replace(':', '')
      elements.push(
        <h3 key={index} className="text-lg font-semibold text-gray-800 mt-5 mb-3 first:mt-0 border-b border-gray-200 pb-1">
          {content}
        </h3>
      )
      return
    }

    // Subsection headers with emojis (🏢 Text:, 👥 Text:, etc.)
    if (/^[🏢👥💻📈🔄✅⚠️🚨].+:$/.test(trimmedLine)) {
      elements.push(
        <h4 key={index} className="text-base font-semibold text-gray-700 mt-4 mb-2 flex items-center gap-2">
          {trimmedLine}
        </h4>
      )
      return
    }

    // Bullet points with checkmarks (✅ text)
    if (/^✅/.test(trimmedLine)) {
      const content = trimmedLine.substring(2).trim()
      elements.push(
        <div key={index} className="flex items-start gap-3 mb-2 ml-4">
          <span className="text-green-500 text-lg mt-0.5">✅</span>
          <span className="text-gray-700">{content}</span>
        </div>
      )
      return
    }

    // Bullet points with dots (• text)
    if (/^•/.test(trimmedLine)) {
      const content = trimmedLine.substring(1).trim()
      
      // Handle bold text within bullet points
      if (content.includes('**')) {
        const parts = content.split('**')
        elements.push(
          <div key={index} className="flex items-start gap-3 mb-2 ml-4">
            <span className="text-blue-500 text-lg mt-0.5">•</span>
            <div className="text-gray-700">
              {parts.map((part, partIndex) => 
                partIndex % 2 === 1 ? (
                  <strong key={partIndex} className="font-semibold text-gray-900">{part}</strong>
                ) : (
                  <span key={partIndex}>{part}</span>
                )
              )}
            </div>
          </div>
        )
      } else {
        elements.push(
          <div key={index} className="flex items-start gap-3 mb-2 ml-4">
            <span className="text-blue-500 text-lg mt-0.5">•</span>
            <span className="text-gray-700">{content}</span>
          </div>
        )
      }
      return
    }

    // Regular paragraphs with bold text
    if (trimmedLine.includes('**')) {
      const parts = trimmedLine.split('**')
      elements.push(
        <p key={index} className="mb-3 text-gray-700 leading-relaxed">
          {parts.map((part, partIndex) => 
            partIndex % 2 === 1 ? (
              <strong key={partIndex} className="font-semibold text-gray-900">{part}</strong>
            ) : (
              <span key={partIndex}>{part}</span>
            )
          )}
        </p>
      )
      return
    }

    // Regular paragraphs
    elements.push(
      <p key={index} className="mb-3 text-gray-700 leading-relaxed">
        {trimmedLine}
      </p>
    )
  })

  return elements
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-4 p-6 ${isUser ? 'bg-blue-50' : 'bg-white'} border-b border-gray-100`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-500 text-white' : 'bg-gradient-to-br from-purple-500 to-blue-600 text-white'
      }`}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-semibold text-base text-gray-900">
            {isUser ? 'Vous' : 'Assistant GAMR'}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {formatDistanceToNow(message.timestamp, { addSuffix: true, locale: fr })}
          </span>
        </div>
        
        <div className="prose prose-sm max-w-none">
          {parseMarkdown(message.content)}
        </div>
        
        {message.sources && message.sources.length > 0 && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              📚 Sources consultées ({message.sources.length})
            </h4>
            <div className="grid gap-4">
              {message.sources.map((source) => (
                <div key={source.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-gray-900 text-sm">{source.title}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          source.type === 'evaluation' ? 'bg-blue-100 text-blue-700' :
                          source.type === 'risk-sheet' ? 'bg-red-100 text-red-700' :
                          source.type === 'action' ? 'bg-green-100 text-green-700' :
                          source.type === 'dashboard' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {source.type === 'evaluation' ? 'Évaluation' :
                           source.type === 'risk-sheet' ? 'Fiche de risque' :
                           source.type === 'action' ? 'Action' :
                           source.type === 'dashboard' ? 'Tableau de bord' : 
                           source.type}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 leading-relaxed">{source.excerpt}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${
                              source.relevanceScore > 0.9 ? 'bg-green-500' :
                              source.relevanceScore > 0.8 ? 'bg-yellow-500' : 'bg-gray-400'
                            }`}></div>
                            Pertinence: {Math.round(source.relevanceScore * 100)}%
                          </span>
                          {source.metadata?.status && (
                            <span className="flex items-center gap-1">
                              {source.metadata.status === 'Complétée' || source.metadata.status === 'Actif' ? 
                                <CheckCircle size={12} className="text-green-500" /> :
                               source.metadata.status === 'EN_COURS' ? 
                                <Clock size={12} className="text-orange-500" /> :
                                <AlertTriangle size={12} className="text-red-500" />}
                              {source.metadata.status}
                            </span>
                          )}
                        </div>
                        {source.url && (
                          <a 
                            href={source.url} 
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                          >
                            <ExternalLink size={14} />
                            Voir détails
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}