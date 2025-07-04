import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { 
  Brain, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle,
  Info,
  TrendingUp,
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react'
// Types définis localement pour éviter les problèmes d'import
interface AIContext {
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

interface AISuggestion {
  type: 'recommendation' | 'warning' | 'info' | 'best_practice'
  title: string
  message: string
  confidence: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  relatedQuestions?: string[]
  actions?: string[]
}

// Assistant IA simplifié intégré
const generateMockAnalysis = (context: AIContext, responses: Record<string, any>) => {
  const suggestions: AISuggestion[] = [
    {
      type: 'recommendation',
      title: 'Amélioration de la sécurité périmétrique',
      message: 'Considérez l\'installation d\'un éclairage LED avec détecteurs de mouvement pour renforcer la sécurité.',
      confidence: 0.85,
      priority: 'medium',
      actions: ['Installer éclairage LED', 'Ajouter détecteurs de mouvement']
    },
    {
      type: 'best_practice',
      title: 'Bonnes pratiques sectorielles',
      message: `Pour le secteur ${context.sector}, nous recommandons un contrôle d'accès renforcé.`,
      confidence: 0.9,
      priority: 'high',
      actions: ['Authentification multi-facteurs', 'Contrôle d\'accès par badge']
    }
  ]

  const riskAlerts = Object.keys(responses).length < 5
    ? ['⚠️ Évaluation incomplète - Continuez pour une analyse précise']
    : []

  const completionTips = [
    'Complétez les sections critiques pour une évaluation optimale',
    'N\'oubliez pas les infrastructures critiques (électricité, eau)'
  ]

  return {
    suggestions,
    riskAlerts,
    completionTips,
    inconsistencies: []
  }
}

interface AIAssistantPanelProps {
  context: AIContext
  responses: Record<string, any>
  onSuggestionApply?: (suggestion: AISuggestion) => void
  className?: string
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  context,
  responses,
  onSuggestionApply,
  className = ''
}) => {
  const [analysis, setAnalysis] = useState<any>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState<'suggestions' | 'alerts' | 'tips'>('suggestions')

  useEffect(() => {
    const performAnalysis = async () => {
      try {
        const result = generateMockAnalysis(context, responses)
        setAnalysis(result)
      } catch (error) {
        console.error('Erreur lors de l\'analyse IA:', error)
      }
    }

    performAnalysis()
  }, [context, responses])

  const getSuggestionIcon = (type: AISuggestion['type']) => {
    switch (type) {
      case 'recommendation': return Lightbulb
      case 'warning': return AlertTriangle
      case 'info': return Info
      case 'best_practice': return CheckCircle
      default: return Info
    }
  }

  const getSuggestionColor = (type: AISuggestion['type'], priority: string) => {
    if (priority === 'critical') return 'from-danger-500 to-danger-600'
    if (priority === 'high') return 'from-warning-500 to-warning-600'
    
    switch (type) {
      case 'recommendation': return 'from-primary-500 to-primary-600'
      case 'warning': return 'from-warning-500 to-warning-600'
      case 'info': return 'from-accent-500 to-accent-600'
      case 'best_practice': return 'from-success-500 to-success-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getPriorityBadge = (priority: string) => {
    const configs = {
      critical: { color: 'bg-danger-100 text-danger-800 border-danger-200', label: 'Critique' },
      high: { color: 'bg-warning-100 text-warning-800 border-warning-200', label: 'Élevé' },
      medium: { color: 'bg-primary-100 text-primary-800 border-primary-200', label: 'Moyen' },
      low: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Faible' }
    }
    return configs[priority as keyof typeof configs] || configs.low
  }

  if (!analysis) {
    return (
      <Card variant="glass" className={`${className} animate-pulse`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
              <div className="h-3 bg-gray-100 rounded w-32"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="glass" className={`${className} transition-all duration-300`}>
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-soft">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle size="sm" className="flex items-center space-x-2">
                <span>Assistant IA</span>
                <Badge variant="gradient" size="sm" pulse>
                  <Sparkles className="w-3 h-3 mr-1" />
                  Actif
                </Badge>
              </CardTitle>
              <p className="text-xs text-gray-500">
                {analysis.suggestions.length} suggestions • {analysis.riskAlerts.length} alertes
              </p>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'suggestions', label: 'Suggestions', count: analysis.suggestions.length },
              { id: 'alerts', label: 'Alertes', count: analysis.riskAlerts.length },
              { id: 'tips', label: 'Conseils', count: analysis.completionTips.length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-primary-100' : 'bg-gray-200'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activeTab === 'suggestions' && (
              <div className="space-y-3">
                {analysis.suggestions.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success-500" />
                    <p className="text-sm">Aucune suggestion pour le moment</p>
                  </div>
                ) : (
                  analysis.suggestions.map((suggestion: AISuggestion, index: number) => {
                    const SuggestionIcon = getSuggestionIcon(suggestion.type)
                    const colorClass = getSuggestionColor(suggestion.type, suggestion.priority)
                    const priorityBadge = getPriorityBadge(suggestion.priority)

                    return (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClass} flex-shrink-0`}>
                            <SuggestionIcon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {suggestion.title}
                              </h4>
                              <Badge size="sm" className={priorityBadge.color}>
                                {priorityBadge.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              {suggestion.message}
                            </p>
                            {suggestion.actions && suggestion.actions.length > 0 && (
                              <div className="space-y-1">
                                {suggestion.actions.slice(0, 2).map((action, actionIndex) => (
                                  <div key={actionIndex} className="flex items-center space-x-2 text-xs">
                                    <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                    <span className="text-gray-600">{action}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <TrendingUp className="w-3 h-3" />
                                <span>Confiance: {Math.round(suggestion.confidence * 100)}%</span>
                              </div>
                              {onSuggestionApply && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onSuggestionApply(suggestion)}
                                  className="text-xs"
                                >
                                  Appliquer
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="space-y-3">
                {analysis.riskAlerts.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success-500" />
                    <p className="text-sm">Aucune alerte de risque</p>
                  </div>
                ) : (
                  analysis.riskAlerts.map((alert: string, index: number) => (
                    <div key={index} className="p-3 bg-gradient-to-r from-warning-50 to-danger-50 rounded-lg border border-warning-200">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{alert}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'tips' && (
              <div className="space-y-3">
                {analysis.completionTips.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <Target className="w-8 h-8 mx-auto mb-2 text-primary-500" />
                    <p className="text-sm">Évaluation bien avancée !</p>
                  </div>
                ) : (
                  analysis.completionTips.map((tip: string, index: number) => (
                    <div key={index} className="p-3 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg border border-primary-200">
                      <div className="flex items-start space-x-3">
                        <Zap className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{tip}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Inconsistencies */}
            {analysis.inconsistencies.length > 0 && (
              <div className="mt-4 p-3 bg-gradient-to-r from-danger-50 to-warning-50 rounded-lg border border-danger-200">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-danger-900 mb-2">
                      Incohérences détectées
                    </h4>
                    <div className="space-y-1">
                      {analysis.inconsistencies.map((inconsistency: string, index: number) => (
                        <p key={index} className="text-xs text-danger-800">
                          • {inconsistency}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
