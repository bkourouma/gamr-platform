import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Toast } from './ui/Toast'
import { useAuth } from '../contexts/AuthContext'
import {
  Save,
  X,
  AlertTriangle,
  Shield,
  TrendingUp,
  Sparkles,
  Calculator,
  Brain,
  Target,
  Zap,
  Lightbulb,
  HelpCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Info,
  Plus,
  Calendar,
  User,
  Clock,
  Edit,
  Trash2
} from 'lucide-react'
import { calculateRiskScore, getPriorityFromScore, translatePriority } from '../lib/utils'
import { evaluationsApi, actionsApi } from '../lib/api'
import type { Action } from '../types'
import { generateEnhancedAIAnalysis, generateAnalysisWithCitations } from '../lib/enhanced-risk-ai-analysis'
import { isAIAnalysisEnabled, shouldUseMockResponses, validateAIConfig } from '../lib/ai-config'

// Messages affichés dans la fenêtre d'analyse IA
const ANALYSIS_STEPS: string[] = [
  "Connexion au moteur d'analyse...",
  "Collecte des évaluations pertinentes...",
  "Extraction des signaux clés et anomalies...",
  "Agrégation contextuelle multi-sources...",
  "Analyse des corrélations et tendances...",
  "Évaluation probabiliste des facteurs de risque...",
  "Synthèse et génération des recommandations..."
]

interface AIRecommendation {
  score: number
  explanation: string
  positivePoints: string[]
  negativePoints: string[]
  confidence: number
}

interface AIAnalysisResult {
  probability: AIRecommendation
  vulnerability: AIRecommendation
  impact: AIRecommendation
  overallAssessment: string
  basedOnEvaluations: string[]
  questionnaireImprovements?: string[]
}

interface RiskSheetFormProps {
  initialData?: any
  onSave?: (data: any) => void
  onCancel?: () => void
  mode?: 'create' | 'edit'
  isLoading?: boolean
}

export const RiskSheetForm: React.FC<RiskSheetFormProps> = ({
  initialData,
  onSave,
  onCancel,
  mode = 'create',
  isLoading: externalLoading = false
}) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    target: initialData?.target || '',
    scenario: initialData?.scenario || '',
    probability: initialData?.probability || 1,
    vulnerability: initialData?.vulnerability || 1,
    impact: initialData?.impact || 1,
    ...initialData
  })

  // États pour l'analyse IA
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAiRecommendations, setShowAiRecommendations] = useState(false)
  const [evaluations, setEvaluations] = useState<any[]>([])
  const [hasEvaluations, setHasEvaluations] = useState(false)
  
  const [isLoading, setIsLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showGamrGuide, setShowGamrGuide] = useState(false)
  const [suggestedScenarios, setSuggestedScenarios] = useState<string[]>([])
  const [showScenarioSuggestions, setShowScenarioSuggestions] = useState<boolean>(false)
  const [analysisMessageIndex, setAnalysisMessageIndex] = useState<number>(0)

  // États pour les actions
  const [actions, setActions] = useState<Action[]>([])
  const [isLoadingActions, setIsLoadingActions] = useState(false)
  const [showAddAction, setShowAddAction] = useState(false)
  const [newAction, setNewAction] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as const,
    dueDate: '',
    assigneeId: ''
  })

  // Charger les évaluations au montage du composant
  useEffect(() => {
    const loadEvaluations = async () => {
      try {
        // First get the list of evaluations
        const response = await evaluationsApi.getAll({ limit: 100 })

        // Then fetch each evaluation with its responses
        const evaluationsWithResponses = await Promise.all(
          response.data.map(async (evaluation) => {
            try {
              const fullEvaluation = await evaluationsApi.getById(evaluation.id)
              return fullEvaluation
            } catch (error) {
              console.error(`Erreur lors du chargement de l'évaluation ${evaluation.id}:`, error)
              return evaluation // Return basic evaluation if detailed fetch fails
            }
          })
        )

        setEvaluations(evaluationsWithResponses)
        setHasEvaluations(evaluationsWithResponses.length > 0)
      } catch (error) {
        console.error('Erreur lors du chargement des évaluations:', error)
      }
    }

    loadEvaluations()
  }, [])

  // Charger les actions si on édite un risque existant
  useEffect(() => {
    if (mode === 'edit' && initialData?.id) {
      loadActions(initialData.id)
    }
  }, [mode, initialData?.id])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const generateThreatScenarios = (targetText: string): string[] => {
    const t = (targetText || '').trim()
    if (!t) return []
    const lower = t.toLowerCase()
    const capitalized = t.charAt(0).toUpperCase() + t.slice(1)

    // Basic heuristics for scenario tailoring
    const isData = /donn[eé]es|data|client|base|bd|pii|personnel/.test(lower)
    const isIt = /serveur|syst[eè]me|si|informatique|app|application|cloud|infra|reseau|réseau/.test(lower)
    const isPhysical = /site|locaux|b[aâ]timent|entrep[oô]t|bureau|atelier|parking|local/.test(lower)

    const baseScenarios: string[] = [
      `Intrusion ciblée visant ${t} pour accéder à des zones sensibles et contourner les contrôles physiques, avec repérage préalable et complicité possible d'un intervenant externe.`,
      `Vol organisé ciblant ${t} lors d'une fenêtre de vulnérabilité (changement d'équipe, affluence, livraison), avec neutralisation des systèmes de surveillance.`,
      `Sabotage coordonné impactant ${t} afin de perturber l'activité (coupure d'alimentation, dégradation matérielle, brouillage), suivi d'une tentative d'extorsion.`,
      `Incendie accidentel ou provoqué affectant ${t}, aggravé par la présence de matériaux inflammables et l'absence de compartimentage adéquat.`,
      `Menace interne (insider) exploitant des droits d'accès légitimes pour compromettre ${t}, avec exfiltration d'informations et effacement des traces.`,
    ]

    const cyberScenarios: string[] = [
      `Campagne de phishing ciblée conduisant à l'infection des postes administratifs et au déploiement d'un ransomware chiffrant ${t}, avec demande de rançon et menace de divulgation.`,
      `Exploitation d'une vulnérabilité non corrigée sur un service exposé pour pivoter latéralement et compromettre ${t}, avec élévation de privilèges et persistance.`,
      `Attaque DDoS et intrusion combinées visant les services critiques pour détourner l'attention, puis accès frauduleux à ${t} et altération des configurations.`,
      `Intrusion via fournisseur (supply chain) ou accès VPN mal sécurisé permettant l'accès à ${t} et l'exfiltration silencieuse de données sensibles.`,
      `Ingénierie sociale ciblant les opérateurs pour obtenir des identifiants privilégiés et modifier les paramètres de ${t}, créant des indisponibilités planifiées.`,
    ]

    const dataScenarios: string[] = [
      `Exfiltration progressive de ${t} via canaux chiffrés et comptes compromis, suivie d'une mise en vente sur des places de marché clandestines.`,
      `Accès non autorisé à ${t} dû à un partage excessif de droits, aboutissant à une fuite de données personnelles et non-conformité réglementaire.`,
      `Sauvegardes de ${t} chiffrées/supprimées après compromission de l'outil de sauvegarde, empêchant la restauration et prolongeant l'indisponibilité.`,
      `Altération silencieuse de ${t} (intégrité) entraînant des décisions erronées et un risque opérationnel majeur avant détection.`,
      `Perte de support chiffré contenant ${t} (supports amovibles) avec contournement des procédures de sortie et absence de journalisation.`,
    ]

    const physicalScenarios: string[] = [
      `Intrusion physique hors heures ouvrées par contournement des clôtures et angles morts pour atteindre ${t}, avec neutralisation basique des capteurs.`,
      `Conflit social ou attroupement à proximité de ${t} entraînant blocage d'accès, menaces et risque accru d'incident délibéré.`,
      `Incident de sécurité incendie dans les locaux abritant ${t} avec évacuation complexe et impact prolongé sur l'activité.`,
      `Détérioration d'équipements critiques alimentant ${t} (énergie, climatisation, réseau) provoquant indisponibilité et dégradation de service.`,
      `Accès prestataire non supervisé menant à une mauvaise manipulation et un dommage matériel sur ${t}.`,
    ]

    if (isIt) return cyberScenarios.slice(0, 5).map(s => s.replace('${t}', capitalized))
    if (isData) return dataScenarios.slice(0, 5).map(s => s.replace('${t}', capitalized))
    if (isPhysical) return physicalScenarios.slice(0, 5).map(s => s.replace('${t}', capitalized))
    return baseScenarios.slice(0, 5).map(s => s.replace('${t}', capitalized))
  }

  useEffect(() => {
    const suggestions = generateThreatScenarios(formData.target)
    setSuggestedScenarios(suggestions)
    setShowScenarioSuggestions(!!formData.target && suggestions.length > 0)
  }, [formData.target])

  // Animation des messages pendant l'analyse IA
  useEffect(() => {
    if (!isAnalyzing) return
    setAnalysisMessageIndex(0)
    const interval = setInterval(() => {
      setAnalysisMessageIndex(prev => (prev + 1) % ANALYSIS_STEPS.length)
    }, 1200)
    return () => clearInterval(interval)
  }, [isAnalyzing])

  // Fonction pour analyser le risque avec l'IA
  const performAIAnalysis = async () => {
    if (!formData.target || !formData.scenario) {
      setToastMessage('Veuillez renseigner la cible et le scénario avant l\'analyse IA')
      setShowToast(true)
      return
    }

    if (!hasEvaluations) {
      setToastMessage('Aucune évaluation trouvée. L\'analyse IA nécessite des données d\'évaluations.')
      setShowToast(true)
      return
    }

    setIsAnalyzing(true)

    try {
      // Check AI configuration
      const configValidation = validateAIConfig()
      if (!configValidation.isValid && !shouldUseMockResponses()) {
        setToastMessage('Configuration IA invalide. Vérifiez les paramètres.')
        setShowToast(true)
        return
      }

      // Analyse IA avancée avec citations et preuves
      await new Promise(resolve => setTimeout(resolve, 3000)) // Temps plus long pour l'analyse avancée

      const analysis = await generateAnalysisWithCitations(formData, evaluations)
      setAiAnalysis(analysis)
      setShowAiRecommendations(true)

      // Success message based on mode
      if (shouldUseMockResponses()) {
        setToastMessage('Analyse IA terminée (mode simulation)')
      } else {
        setToastMessage('Analyse IA terminée avec succès - Citations OpenAI incluses')
      }
      setShowToast(true)
    } catch (error) {
      console.error('Erreur lors de l\'analyse IA:', error)

      // Provide specific error messages
      let errorMessage = 'Erreur lors de l\'analyse IA'
      if (error.message.includes('API key')) {
        errorMessage = 'Clé API OpenAI manquante ou invalide'
      } else if (error.message.includes('quota')) {
        errorMessage = 'Quota OpenAI dépassé'
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Erreur de connexion à OpenAI'
      }

      // Fallback to basic analysis if enhanced analysis fails
      try {
        console.log('Tentative de fallback vers l\'analyse de base...')
        const basicAnalysis = await generateEnhancedAIAnalysis(formData, evaluations)
        setAiAnalysis(basicAnalysis)
        setShowAiRecommendations(true)
        setToastMessage(`${errorMessage} - Mode de base utilisé`)
        setShowToast(true)
      } catch (fallbackError) {
        console.error('Erreur lors de l\'analyse IA de base:', fallbackError)
        setToastMessage(errorMessage)
        setShowToast(true)
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Appliquer les recommandations IA
  const applyAIRecommendations = () => {
    if (!aiAnalysis) return

    setFormData(prev => ({
      ...prev,
      probability: aiAnalysis.probability.score,
      vulnerability: aiAnalysis.vulnerability.score,
      impact: aiAnalysis.impact.score
    }))

    setToastMessage('Recommandations IA appliquées')
    setShowToast(true)
  }

  // Charger les actions liées au risque
  const loadActions = async (riskSheetId: string) => {
    if (!riskSheetId) return

    setIsLoadingActions(true)
    try {
      const response = await actionsApi.getAll({ riskSheetId })
      setActions(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des actions:', error)
    } finally {
      setIsLoadingActions(false)
    }
  }

  // Ajouter une nouvelle action
  const handleAddAction = async () => {
    if (!newAction.title || !newAction.description) {
      setToastMessage('Le titre et la description sont requis')
      setShowToast(true)
      return
    }

    try {
      const actionData = {
        ...newAction,
        riskSheetId: initialData?.id || 'temp-id', // Utiliser l'ID du risque existant ou temporaire
        dueDate: newAction.dueDate ? new Date(newAction.dueDate) : undefined
      }

      const createdAction = await actionsApi.create(actionData)
      setActions(prev => [...prev, createdAction])
      setNewAction({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
        assigneeId: ''
      })
      setShowAddAction(false)
      setToastMessage('Action créée avec succès')
      setShowToast(true)
    } catch (error) {
      console.error('Erreur lors de la création de l\'action:', error)
      setToastMessage('Erreur lors de la création de l\'action')
      setShowToast(true)
    }
  }

  // Supprimer une action
  const handleDeleteAction = async (actionId: string) => {
    try {
      await actionsApi.delete(actionId)
      setActions(prev => prev.filter(action => action.id !== actionId))
      setToastMessage('Action supprimée avec succès')
      setShowToast(true)
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'action:', error)
      setToastMessage('Erreur lors de la suppression de l\'action')
      setShowToast(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulation d'une sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000))

      const dataToSave = {
        ...formData,
        riskScore,
        priority,
        tenantId: user?.tenant?.id,
        authorId: user?.id,
        aiAnalysis: aiAnalysis // Inclure l'analyse IA dans la sauvegarde
      }

      onSave?.(dataToSave)
      setToastMessage(`Fiche ${mode === 'create' ? 'créée' : 'mise à jour'} avec succès`)
      setShowToast(true)
    } catch (error) {
      setToastMessage('Erreur lors de la sauvegarde')
      setShowToast(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculs des scores et priorité
  const riskScore = calculateRiskScore(formData.probability, formData.vulnerability, formData.impact)
  const priority = getPriorityFromScore(riskScore)

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return { color: 'text-danger-700 bg-gradient-to-r from-danger-100 to-danger-200', icon: AlertTriangle }
      case 'HIGH':
        return { color: 'text-warning-700 bg-gradient-to-r from-warning-100 to-warning-200', icon: TrendingUp }
      case 'MEDIUM':
        return { color: 'text-primary-700 bg-gradient-to-r from-primary-100 to-primary-200', icon: Shield }
      default:
        return { color: 'text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200', icon: Shield }
    }
  }

  const priorityConfig = getPriorityConfig(priority)
  const PriorityIcon = priorityConfig.icon



  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gradient">
            {mode === 'create' ? 'Nouvelle fiche GAMR' : 'Modifier la fiche GAMR'}
          </h2>
          <p className="text-gray-600">
            Analyse des risques pour {user?.tenant.name}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="gradient" pulse>
            <Brain className="w-3 h-3 mr-1" />
            IA Active
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations de base */}
            <Card variant="glass" className="overflow-visible">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-primary-600" />
                  <span>Identification du risque</span>
                </CardTitle>
                <CardDescription>
                  Définissez la cible et le scénario de menace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative overflow-visible">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cible potentielle *
                  </label>
                  <input
                    type="text"
                    value={formData.target}
                    onChange={(e) => handleChange('target', e.target.value)}
                    onFocus={() => setShowScenarioSuggestions(!!formData.target && suggestedScenarios.length > 0)}
                    placeholder="Ex: Serveurs de production, Données clients..."
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/60 backdrop-blur-sm"
                  />

                  {/* Dropdown suggestions under target */}
                  {showScenarioSuggestions && suggestedScenarios.length > 0 && formData.target && (
                    <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      <div className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-100">
                        Scénarios suggérés par IA (cliquez pour remplir)
                      </div>
                      <ul className="max-h-64 overflow-auto divide-y divide-gray-100">
                        {suggestedScenarios.map((s, idx) => (
                          <li key={idx}>
                            <button
                              type="button"
                              onClick={() => {
                                handleChange('scenario', s)
                                setShowScenarioSuggestions(false)
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors"
                            >
                              {s}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>



                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scénario de menace *
                  </label>
                  <textarea
                    value={formData.scenario}
                    onChange={(e) => handleChange('scenario', e.target.value)}
                    placeholder="Décrivez le scénario de menace en détail..."
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/60 backdrop-blur-sm resize-none"
                  />

                  {/* Sélecteur de suggestions (ancien comportement en bas) */}
                  {formData.target && suggestedScenarios.length > 0 && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Suggestions de scénarios (sélection rapide)
                      </label>
                      <select
                        value=""
                        onChange={(e) => {
                          const value = e.target.value
                          if (value) {
                            handleChange('scenario', value)
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/60"
                      >
                        <option value="">— Choisir une suggestion —</option>
                        {suggestedScenarios.map((s, idx) => (
                          <option key={idx} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* GAME (Grille d'analyse des menaces et risques) */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calculator className="w-5 h-5 text-primary-600" />
                    <span>GAME (Grille d'analyse des menaces et risques)</span>
                  </div>

                  {/* Bouton Analyse IA */}
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="gradient"
                      size="sm"
                      onClick={performAIAnalysis}
                      disabled={isAnalyzing || !formData.target || !formData.scenario || !isAIAnalysisEnabled()}
                      className="flex items-center space-x-2"
                    >
                      {isAnalyzing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Brain className="w-4 h-4" />
                      )}
                      <span>{isAnalyzing ? 'Analyse en cours...' : 'Analyse IA'}</span>
                    </Button>

                    {/* AI Configuration Status */}
                    {shouldUseMockResponses() && (
                      <Badge variant="outline" className="text-xs">
                        Mode Simulation
                      </Badge>
                    )}
                    {!isAIAnalysisEnabled() && (
                      <Badge variant="destructive" className="text-xs">
                        IA Désactivée
                      </Badge>
                    )}
                  </div>
                </CardTitle>

                <div className="flex justify-between items-center mb-2">
                  <CardDescription>
                    Probabilité, vulnérabilité et Repercussions
                  </CardDescription>
                  <button
                    type="button"
                    onClick={() => setShowGamrGuide(true)}
                    className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span>Comment faire la GAMR?</span>
                  </button>
                </div>

                {/* Indicateur d'évaluations disponibles */}
                <div className="mb-4">
                  {hasEvaluations ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>{evaluations.length} évaluation(s) disponible(s) pour l'analyse IA avancée</span>
                      </div>
                      {aiAnalysis && aiAnalysis.reasoningQuality && (
                        <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
                          aiAnalysis.reasoningQuality === 'high' ? 'bg-green-100 text-green-700' :
                          aiAnalysis.reasoningQuality === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          <Brain className="w-3 h-3" />
                          <span>Qualité: {aiAnalysis.reasoningQuality === 'high' ? 'Élevée' :
                                         aiAnalysis.reasoningQuality === 'medium' ? 'Moyenne' : 'Faible'}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-sm text-amber-600">
                      <Info className="w-4 h-4" />
                      <span>Aucune évaluation trouvée. L'analyse IA sera limitée.</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Probabilité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Probabilité (1-3)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(value => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleChange('probability', value)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.probability === value
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-lg font-bold">{value}</div>
                          <div className="text-xs">
                            {value === 1 ? 'Faible' : value === 2 ? 'Moyen' : 'Élevé'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Recommandations IA pour Probabilité - Version Améliorée */}
                  {aiAnalysis && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Brain className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            Analyse IA Probabilité: {aiAnalysis.probability.score}/3
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(aiAnalysis.probability.confidence * 100)}% confiance
                          </Badge>
                        </div>
                        {aiAnalysis.reasoningQuality && (
                          <Badge
                            variant={aiAnalysis.reasoningQuality === 'high' ? 'default' : aiAnalysis.reasoningQuality === 'medium' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            Qualité: {aiAnalysis.reasoningQuality === 'high' ? 'Élevée' : aiAnalysis.reasoningQuality === 'medium' ? 'Moyenne' : 'Faible'}
                          </Badge>
                        )}
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-blue-700">{aiAnalysis.probability.explanation}</p>
                      </div>

                      {/* Points positifs avec citations */}
                      {aiAnalysis.probability.positivePoints.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center space-x-1 mb-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span className="text-xs font-medium text-green-700">Points forts identifiés:</span>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                            <ul className="text-xs text-green-700 space-y-1">
                              {aiAnalysis.probability.positivePoints.map((point, idx) => (
                                <li key={idx} className="flex items-start space-x-1">
                                  <span className="text-green-500 mt-0.5">•</span>
                                  <span className="flex-1">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Points négatifs avec citations */}
                      {aiAnalysis.probability.negativePoints.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center space-x-1 mb-2">
                            <XCircle className="w-3 h-3 text-red-600" />
                            <span className="text-xs font-medium text-red-700">Points faibles identifiés:</span>
                          </div>
                          <div className="bg-red-50 rounded-lg p-2 border border-red-200">
                            <ul className="text-xs text-red-700 space-y-1">
                              {aiAnalysis.probability.negativePoints.map((point, idx) => (
                                <li key={idx} className="flex items-start space-x-1">
                                  <span className="text-red-500 mt-0.5">•</span>
                                  <span className="flex-1">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Informations supplémentaires */}
                      {aiAnalysis.basedOnEvaluations && aiAnalysis.basedOnEvaluations.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-blue-200">
                          <div className="flex items-center space-x-1 mb-1">
                            <Info className="w-3 h-3 text-blue-500" />
                            <span className="text-xs font-medium text-blue-600">Basé sur les évaluations:</span>
                          </div>
                          <div className="text-xs text-blue-600">
                            {aiAnalysis.basedOnEvaluations.slice(0, 3).join(', ')}
                            {aiAnalysis.basedOnEvaluations.length > 3 && ` et ${aiAnalysis.basedOnEvaluations.length - 3} autres`}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Vulnérabilité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Vulnérabilité (1-4)
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(value => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleChange('vulnerability', value)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.vulnerability === value
                            ? 'border-warning-500 bg-warning-50 text-warning-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-lg font-bold">{value}</div>
                          <div className="text-xs">
                            {value === 1 ? 'Très faible' : value === 2 ? 'Faible' : value === 3 ? 'Moyen' : 'Élevé'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Analyse IA pour Vulnérabilité */}
                  {aiAnalysis && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">Analyse IA - Vulnérabilité</span>
                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                          {Math.round(aiAnalysis.vulnerability.confidence * 100)}% confiance
                        </Badge>
                      </div>

                      <div className="text-xs text-orange-700 mb-3">
                        {aiAnalysis.vulnerability.explanation}
                      </div>

                      {/* Points positifs avec citations */}
                      {aiAnalysis.vulnerability.positivePoints.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center space-x-1 mb-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span className="text-xs font-medium text-green-700">Points forts identifiés:</span>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                            <ul className="text-xs text-green-700 space-y-1">
                              {aiAnalysis.vulnerability.positivePoints.map((point, idx) => (
                                <li key={idx} className="flex items-start space-x-1">
                                  <span className="text-green-500 mt-0.5">•</span>
                                  <span className="flex-1">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Points négatifs avec citations */}
                      {aiAnalysis.vulnerability.negativePoints.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center space-x-1 mb-2">
                            <XCircle className="w-3 h-3 text-red-600" />
                            <span className="text-xs font-medium text-red-700">Points faibles identifiés:</span>
                          </div>
                          <div className="bg-red-50 rounded-lg p-2 border border-red-200">
                            <ul className="text-xs text-red-700 space-y-1">
                              {aiAnalysis.vulnerability.negativePoints.map((point, idx) => (
                                <li key={idx} className="flex items-start space-x-1">
                                  <span className="text-red-500 mt-0.5">•</span>
                                  <span className="flex-1">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Repercussions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Repercussions (1-5)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map(value => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleChange('impact', value)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          formData.impact === value
                            ? 'border-danger-500 bg-danger-50 text-danger-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-lg font-bold">{value}</div>
                          <div className="text-xs">
                            {value === 1 ? 'Négligeable' : value === 2 ? 'Mineur' : value === 3 ? 'Modéré' : value === 4 ? 'Majeur' : 'Critique'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Analyse IA pour Repercussions */}
                  {aiAnalysis && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg border border-red-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">Analyse IA - Repercussions</span>
                        <Badge variant="outline" className="text-xs border-red-300 text-red-600">
                          {Math.round(aiAnalysis.impact.confidence * 100)}% confiance
                        </Badge>
                      </div>

                      <div className="text-xs text-red-700 mb-3">
                        {aiAnalysis.impact.explanation}
                      </div>

                      {/* Points positifs avec citations */}
                      {aiAnalysis.impact.positivePoints.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center space-x-1 mb-2">
                            <CheckCircle className="w-3 h-3 text-green-600" />
                            <span className="text-xs font-medium text-green-700">Points forts identifiés:</span>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                            <ul className="text-xs text-green-700 space-y-1">
                              {aiAnalysis.impact.positivePoints.map((point, idx) => (
                                <li key={idx} className="flex items-start space-x-1">
                                  <span className="text-green-500 mt-0.5">•</span>
                                  <span className="flex-1">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Points négatifs avec citations */}
                      {aiAnalysis.impact.negativePoints.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center space-x-1 mb-2">
                            <XCircle className="w-3 h-3 text-red-600" />
                            <span className="text-xs font-medium text-red-700">Points faibles identifiés:</span>
                          </div>
                          <div className="bg-red-50 rounded-lg p-2 border border-red-200">
                            <ul className="text-xs text-red-700 space-y-1">
                              {aiAnalysis.impact.negativePoints.map((point, idx) => (
                                <li key={idx} className="flex items-start space-x-1">
                                  <span className="text-red-500 mt-0.5">•</span>
                                  <span className="flex-1">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bouton pour appliquer les recommandations IA */}
                {aiAnalysis && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-green-800 mb-1">
                          Appliquer les recommandations IA
                        </h4>
                        <p className="text-xs text-green-600">
                          Probabilité: {aiAnalysis.probability.score}, Vulnérabilité: {aiAnalysis.vulnerability.score}, Repercussions: {aiAnalysis.impact.score}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={applyAIRecommendations}
                        className="border-green-300 text-green-700 hover:bg-green-100"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Appliquer
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panneau de résultats */}
          <div className="space-y-6">
            {/* Score calculé */}
            <Card variant="gradient" className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Résultat GAMR</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {riskScore}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">Score de risque</div>
                  
                  <Badge className={`${priorityConfig.color} border`}>
                    <PriorityIcon className="w-4 h-4 mr-1" />
                    {translatePriority(priority)}
                  </Badge>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/20">
                  <div className="flex justify-between text-sm">
                    <span>Probabilité:</span>
                    <span className="font-medium">{formData.probability}/3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Vulnérabilité:</span>
                    <span className="font-medium">{formData.vulnerability}/4</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Impact:</span>
                    <span className="font-medium">{formData.impact}/5</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/20">
                  <div className="text-xs text-gray-600 text-center">
                    Calcul: {formData.probability} × {formData.vulnerability} × {formData.impact}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Évaluation globale IA */}
            {aiAnalysis && (
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      <span>Évaluation IA Avancée</span>
                    </div>
                    {aiAnalysis.reasoningQuality && (
                      <Badge
                        variant={aiAnalysis.reasoningQuality === 'high' ? 'default' : aiAnalysis.reasoningQuality === 'medium' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        Qualité: {aiAnalysis.reasoningQuality === 'high' ? 'Élevée' : aiAnalysis.reasoningQuality === 'medium' ? 'Moyenne' : 'Faible'}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Évaluation globale avec formatage amélioré */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center space-x-2 mb-3">
                        <Brain className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">Évaluation globale</span>
                      </div>
                      <div className="text-sm text-gray-700">
                        <div className="whitespace-pre-line font-mono text-xs leading-relaxed">{aiAnalysis.overallAssessment}</div>
                      </div>
                    </div>

                    {/* Amélioration Questionnaire */}
                    {aiAnalysis.questionnaireImprovements && aiAnalysis.questionnaireImprovements.length > 0 && (
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <div className="flex items-center space-x-2 mb-3">
                          <Lightbulb className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-800">Amélioration Questionnaire</span>
                          <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 ml-2">
                            5 propositions IA
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          {aiAnalysis.questionnaireImprovements.slice(0, 5).map((q, idx) => (
                            <div key={idx} className="text-xs text-emerald-800 pl-2 border-l-2 border-emerald-300">
                              {q}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommandations de questionnaires */}
                    {aiAnalysis.questionnaireRecommendations && aiAnalysis.questionnaireRecommendations.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-3">
                          <Lightbulb className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Recommandations d'évaluations</span>
                        </div>
                        <div className="space-y-2">
                          {aiAnalysis.questionnaireRecommendations.slice(0, 3).map((rec, idx) => (
                            <div key={idx} className="text-xs">
                              <div className="font-medium text-blue-700">{rec.category}</div>
                              <div className="text-blue-600 ml-2">• {rec.reason}</div>
                              {rec.priority === 'high' && (
                                <Badge variant="destructive" className="text-xs ml-2">Priorité élevée</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sources d'évaluation */}
                    {aiAnalysis.basedOnEvaluations.length > 0 && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="text-xs font-medium text-gray-600 mb-2">
                          Analyse basée sur {aiAnalysis.basedOnEvaluations.length} évaluation(s):
                        </div>
                        <div className="space-y-1">
                          {aiAnalysis.basedOnEvaluations.slice(0, 3).map((evaluation, idx) => (
                            <div key={idx} className="text-xs text-gray-500 flex items-center">
                              <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                              {evaluation}
                            </div>
                          ))}
                          {aiAnalysis.basedOnEvaluations.length > 3 && (
                            <div className="text-xs text-gray-400">
                              +{aiAnalysis.basedOnEvaluations.length - 3} autres évaluations
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Insights contextuels */}
            {aiAnalysis && aiAnalysis.contextualInsights && aiAnalysis.contextualInsights.length > 0 && (
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <span>Insights contextuels</span>
                  </CardTitle>
                  <CardDescription>
                    Patterns et anomalies détectés dans les évaluations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {aiAnalysis.contextualInsights.slice(0, 3).map((insight, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border ${
                        insight.significance === 'high' ? 'bg-red-50 border-red-200' :
                        insight.significance === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${
                            insight.significance === 'high' ? 'bg-red-500' :
                            insight.significance === 'medium' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`}></div>
                          <span className={`text-sm font-medium ${
                            insight.significance === 'high' ? 'text-red-800' :
                            insight.significance === 'medium' ? 'text-yellow-800' :
                            'text-blue-800'
                          }`}>
                            {insight.title}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {insight.type}
                          </Badge>
                        </div>
                        <p className={`text-xs mb-2 ${
                          insight.significance === 'high' ? 'text-red-700' :
                          insight.significance === 'medium' ? 'text-yellow-700' :
                          'text-blue-700'
                        }`}>
                          {insight.description}
                        </p>
                        {insight.evidence && insight.evidence.length > 0 && (
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Preuves: </span>
                            {insight.evidence.slice(0, 2).join(', ')}
                            {insight.evidence.length > 2 && ` (+${insight.evidence.length - 2} autres)`}
                          </div>
                        )}
                      </div>
                    ))}
                    {aiAnalysis.contextualInsights.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{aiAnalysis.contextualInsights.length - 3} autres insights disponibles
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommandations de questionnaires */}
            {aiAnalysis && aiAnalysis.questionnaireRecommendations && aiAnalysis.questionnaireRecommendations.length > 0 && (
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <HelpCircle className="w-5 h-5 text-orange-600" />
                    <span>Recommandations questionnaires</span>
                  </CardTitle>
                  <CardDescription>
                    Questions supplémentaires pour améliorer l'analyse
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {aiAnalysis.questionnaireRecommendations.map((recommendation, idx) => (
                      <div key={idx} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-sm font-medium text-orange-800">
                            {recommendation.category}
                          </span>
                          {recommendation.priority && (
                            <Badge variant="outline" className={`text-xs ${
                              recommendation.priority === 'high' ? 'border-red-300 text-red-700' :
                              recommendation.priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                              'border-blue-300 text-blue-700'
                            }`}>
                              {recommendation.priority}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-orange-700 mb-3">
                          {recommendation.reason}
                        </p>
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-orange-600 mb-1">
                            Questions suggérées:
                          </div>
                          {recommendation.suggestedQuestions.slice(0, 3).map((question, qIdx) => (
                            <div key={qIdx} className="text-xs text-orange-600 pl-2 border-l-2 border-orange-300">
                              {question}
                            </div>
                          ))}
                          {recommendation.suggestedQuestions.length > 3 && (
                            <div className="text-xs text-orange-500 italic">
                              +{recommendation.suggestedQuestions.length - 3} autres questions...
                            </div>
                          )}
                        </div>
                        {recommendation.expectedInsight && (
                          <div className="mt-2 text-xs text-orange-600 italic">
                            Insight attendu: {recommendation.expectedInsight}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Panels liés aux actions retirés */}

            {/* Actions */}
            <div className="space-y-3">
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full"
                loading={isLoading || externalLoading}
                disabled={!formData.target || !formData.scenario || externalLoading}
              >
                <Save className="w-4 h-4 mr-2" />
                {mode === 'create' ? 'Créer la fiche' : 'Sauvegarder'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full glass"
                onClick={onCancel}
                disabled={isLoading || externalLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Toast */}
      {showToast && (
        <Toast
          type="success"
          title="Succès"
          description={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Popup futuriste d'analyse IA */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Fond */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-purple-900/70 to-black/80 backdrop-blur-sm" />

          {/* Contenu */}
          <div className="relative z-10 w-[92%] max-w-xl rounded-2xl border border-purple-400/30 bg-white/10 shadow-2xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold">Analyse IA en cours</div>
                  <div className="text-xs text-purple-100/80">Veuillez patienter pendant la génération des insights</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="gradient" className="text-[10px]">Temps estimé ~ quelques secondes</Badge>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {/* Barre de scan */}
              <div className="relative h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-purple-400 via-indigo-400 to-fuchsia-400 animate-[scan_1.6s_linear_infinite]"
                />
                <style>{`@keyframes scan {0%{transform:translateX(-100%)} 100%{transform:translateX(300%)}}`}</style>
              </div>

              {/* Message courant */}
              <div className="mt-4 text-sm text-purple-100">
                {ANALYSIS_STEPS[analysisMessageIndex]}
              </div>

              {/* Etapes */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ANALYSIS_STEPS.map((step, idx) => {
                  const reached = idx <= analysisMessageIndex
                  return (
                    <div
                      key={idx}
                      className={`flex items-center space-x-2 rounded-lg px-3 py-2 border ${reached ? 'border-purple-300/40 bg-white/10' : 'border-white/10 bg-white/5'}`}
                    >
                      <div className={`h-2 w-2 rounded-full ${reached ? 'bg-purple-400 animate-pulse' : 'bg-white/20'}`} />
                      <div className={`text-xs ${reached ? 'text-white' : 'text-purple-100/70'}`}>{step}</div>
                    </div>
                  )
                })}
              </div>

              {/* Progression */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-[11px] text-purple-100/80 mb-1">
                  <span>Progression</span>
                  <span>{Math.round(((analysisMessageIndex + 1) / ANALYSIS_STEPS.length) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-fuchsia-500 transition-all duration-500"
                    style={{ width: `${((analysisMessageIndex + 1) / ANALYSIS_STEPS.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Guide GAMR */}
      {showGamrGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl max-h-[75vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <Lightbulb className="w-6 h-6 text-yellow-500" />
                <span>LA GRILLE D'ANALYSE DES MENACES ET RISQUES (GAMR)</span>
              </h2>
              <button
                onClick={() => setShowGamrGuide(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Introduction */}
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  La «Grille d'Analyse des Menaces et Risques» (GAMR) est une méthodologie simplifiée et un outil pratique axé sur les facteurs de risques de l'entreprise (structure, outil de production et personnel), pour aider à l'exécution d'une Evaluation de Sécurité. Il s'agit d'un outil parmi d'autres qui est présenté ici à titre d'exemple.
                </p>
              </div>

              {/* Objectifs */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3">Objectifs de la GAMR</h3>
                <ul className="space-y-2 text-blue-800">
                  <li className="flex items-start space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Cerner les menaces et identifier les facteurs de risques</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Évaluer les conséquences probables de tout incident potentiel</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Proposer et recommander des mesures préventives, de surveillance et de protection</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Aide précieuse pour la répartition des ressources, la planification d'urgence et la budgétisation</span>
                  </li>
                </ul>
              </div>

              {/* Mise à jour */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-yellow-800">
                  <strong>Important :</strong> La GAMR doit être mise à jour aussi souvent que l'évolution des circonstances peut l'exiger afin de maintenir son efficacité. Cette tâche peut relever de l'autorité du Chef de la sécurité ou de l'organisme de sûreté conseil.
                </p>
              </div>

              {/* Processus d'évaluation */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Processus d'évaluation de la sécurité et de la sûreté</h3>
                <p className="text-gray-700 mb-4">
                  Le processus d'évaluation comporte 7 points : les cibles potentielles (CP), le scénario de menace, la probabilité, la vulnérabilité, les répercussions, la note attribuée au risque, la priorité d'action.
                </p>

                <div className="space-y-6">
                  {/* Cibles potentielles */}
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-green-900 mb-2">a) Cibles potentielles (CP)</h4>
                    <p className="text-gray-700 mb-2">
                      Les cibles potentielles sont celles qui, si elles sont visées par un acte illégal, peuvent influer de façon négative sur le bon fonctionnement de l'entreprise ou sur la sécurité du personnel.
                    </p>
                    <p className="text-gray-700 mb-2">On peut identifier les CP par l'évaluation :</p>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      <li>des fonctions et des activités</li>
                      <li>des points ou personnes clés</li>
                      <li>des zones vulnérables</li>
                      <li>des environs immédiats</li>
                    </ul>
                  </div>

                  {/* Scénario de menace */}
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-semibold text-orange-900 mb-2">b) Scénario de menace</h4>
                    <p className="text-gray-700 mb-2">
                      Dans l'évaluation des scénarios possibles, il faut tenir compte de l'historique des incidents de l'entreprise, déterminer, évaluer, analyser les facteurs de risques.
                    </p>
                    <p className="text-gray-700 mb-2">Exemples de scénarios de menaces :</p>
                    <div className="text-gray-700 text-sm">
                      Attaque à mains armées, vols de biens, sabotage, incendie, malaise physiologique, prise d'otage, contrefaçon, enlèvement de personne(s) et demande de rançon...
                    </div>
                  </div>

                  {/* Probabilité */}
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-blue-900 mb-2">c) Probabilité</h4>
                    <p className="text-gray-700 mb-2">La probabilité qu'un incident se produise :</p>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="space-y-1 text-sm">
                        <div><strong>3 = Élevée</strong></div>
                        <div><strong>2 = Moyenne</strong></div>
                        <div><strong>1 = Faible</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Vulnérabilité */}
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-semibold text-red-900 mb-2">d) Vulnérabilité (liée aux lignes de défense)</h4>
                    <div className="bg-gray-50 p-3 rounded space-y-2 text-sm">
                      <div><strong>4 = Absence de mesures</strong> - libre accès aux cibles, dispositifs inexistants, personnel non qualifié</div>
                      <div><strong>3 = Mesures minimales</strong> - identification insuffisante, procédures inadéquates, surveillance sporadique</div>
                      <div><strong>2 = Mesures satisfaisantes</strong> - zones identifiées, accès contrôlé, personnel qualifié, surveillance adéquate</div>
                      <div><strong>1 = Mesures entièrement efficaces</strong> - plan cohérent, prévention efficace, gestion de crises adaptée</div>
                    </div>
                  </div>

                  {/* Répercussions */}
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold text-purple-900 mb-2">e) Répercussions</h4>
                    <p className="text-gray-700 mb-2">Évaluation des conséquences de chaque incident potentiel :</p>
                    <div className="bg-gray-50 p-3 rounded space-y-2 text-sm">
                      <div><strong>5 = Préjudiciable pour la sécurité des personnes</strong> - décès, graves blessures, menace pour la sécurité publique</div>
                      <div><strong>4 = Préjudiciable pour la santé publique</strong> - dommages environnementaux, menace locale</div>
                      <div><strong>3 = Préjudiciable pour l'environnement/économie</strong> - perturbations durables, pertes importantes</div>
                      <div><strong>2 = Préjudiciable pour les biens/infrastructures</strong> - perturbations limitées</div>
                      <div><strong>1 = Préjudiciable pour la confiance/image</strong> - impact sur la réputation</div>
                    </div>
                  </div>

                  {/* Note attribuée au risque */}
                  <div className="border-l-4 border-indigo-500 pl-4">
                    <h4 className="font-semibold text-indigo-900 mb-2">f) Note attribuée au risque</h4>
                    <div className="bg-indigo-50 p-4 rounded">
                      <p className="text-indigo-900 font-semibold text-center mb-3">
                        Probabilité × Vulnérabilité × Répercussions
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-red-100 p-3 rounded">
                          <div className="font-semibold text-red-900">Scénario le plus élevé :</div>
                          <div className="text-red-800">3 × 4 × 5 = <strong>60</strong></div>
                        </div>
                        <div className="bg-green-100 p-3 rounded">
                          <div className="font-semibold text-green-900">Scénario le plus faible :</div>
                          <div className="text-green-800">1 × 1 × 1 = <strong>1</strong></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Priorité d'action */}
                  <div className="border-l-4 border-gray-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">g) Priorité d'action</h4>
                    <p className="text-gray-700">
                      Le calcul et l'énumération des pointages aideront à évaluer la priorité à accorder au traitement de chaque incident potentiel et donneront des indications sur les interventions nécessaires pour la prévention, la surveillance et les plans de contingence.
                    </p>
                  </div>
                </div>
              </div>

              {/* Conclusions */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-3">Conclusions</h3>
                <ul className="space-y-2 text-green-800">
                  <li className="flex items-start space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>La GAMR donne des indications précises sur les menaces, l'identification des cibles potentielles et leur degré de vulnérabilité</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>La GAMR dûment remplie constitue la base de l'élaboration d'un plan de sécurité et de sûreté de l'entreprise</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
