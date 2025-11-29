import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { riskSheetsApi, actionsApi, handleApiError, type RiskSheet, type Action } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { translatePriority, calculateRiskScore, getPriorityFromScore } from '../lib/utils'
import { PDFService } from '../lib/pdfService'
import { useToast, createSuccessToast, createErrorToast } from '../components/Toast'
import { useConfirmDialog } from '../components/ConfirmDialog'
import {
  ArrowLeft,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Shield,
  Calendar,
  User,
  Target,
  FileText,
  Brain,
  Lightbulb,
  Download,
  Plus,
  Clock,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react'

export const RiskSheetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [risk, setRisk] = useState<RiskSheet | null>(null)
  const [loading, setLoading] = useState(true)

  // Actions state
  const [actions, setActions] = useState<Action[]>([])
  const [isLoadingActions, setIsLoadingActions] = useState(false)
  const [showAddAction, setShowAddAction] = useState(false)
  const [newAction, setNewAction] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as const,
    dueDate: '',
    assignedTo: ''
  })
  const DEFENSE_LINES: Array<{ code: 'LD1' | 'LD2' | 'LD3' | 'LD4'; label: string }> = [
    { code: 'LD1', label: 'Première ligne de défense — Périphérie' },
    { code: 'LD2', label: 'Deuxième ligne de défense — Périmètre' },
    { code: 'LD3', label: 'Troisième ligne de défense — Entrées et accès' },
    { code: 'LD4', label: 'Quatrième ligne de défense — Espace névralgique' },
  ]
  const stripDefensePrefix = (title: string): { code?: 'LD1' | 'LD2' | 'LD3' | 'LD4'; text: string } => {
    const match = title.match(/^\[(LD[1-4])\]\s*(.*)$/)
    if (match) {
      return { code: match[1] as any, text: match[2] }
    }
    return { text: title }
  }
  const withDefensePrefix = (code: 'LD1' | 'LD2' | 'LD3' | 'LD4' | undefined, title: string): string => {
    const stripped = stripDefensePrefix(title).text
    return code ? `[${code}] ${stripped}` : stripped
  }
  const [newActionDefense, setNewActionDefense] = useState<'LD1' | 'LD2' | 'LD3' | 'LD4'>('LD2')
  // IA suggestions state
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [isGeneratingAISuggestions, setIsGeneratingAISuggestions] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<Array<{ title: string; description: string; priority: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }>>([])
  const [editingAction, setEditingAction] = useState<Action | null>(null)
  const [editAction, setEditAction] = useState<{
    title: string
    description: string
    priority: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    dueDate: string
    status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  }>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    status: 'TODO'
  })
  const [editActionDefense, setEditActionDefense] = useState<'LD1' | 'LD2' | 'LD3' | 'LD4'>('LD2')
  const [error, setError] = useState<string | null>(null)
  const { addToast } = useToast()
  const { openDialog, confirmDialog } = useConfirmDialog()

  // Charger la fiche depuis l'API
  useEffect(() => {
    if (id) {
      loadRisk(id)
      loadActions(id)
    }
  }, [id])

  const loadRisk = async (riskId: string) => {
    try {
      setLoading(true)
      setError(null)
      const riskData = await riskSheetsApi.getById(riskId)
      setRisk(riskData)
    } catch (err) {
      console.error('Erreur lors du chargement de la fiche:', err)
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  // Charger les actions liées à ce risque
  const loadActions = async (riskId: string) => {
    try {
      setIsLoadingActions(true)
      const response = await actionsApi.getAll({ riskSheetId: riskId })
      setActions(response.data)
    } catch (err) {
      console.error('Erreur lors du chargement des actions:', err)
      addToast(createErrorToast('Erreur', 'Impossible de charger les actions'))
    } finally {
      setIsLoadingActions(false)
    }
  }

  // Créer une nouvelle action
  const handleCreateAction = async () => {
    if (!id || !newAction.title.trim()) return

    try {
      const actionData = {
        ...newAction,
        title: withDefensePrefix(newActionDefense, newAction.title),
        riskSheetId: id,
        status: 'TODO' as const,
        dueDate: newAction.dueDate ? new Date(newAction.dueDate) : undefined
      }

      await actionsApi.create(actionData)

      addToast(createSuccessToast('Action créée', "L'action a été créée avec succès"))

      // Réinitialiser le formulaire et recharger les actions
      setNewAction({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
        assignedTo: ''
      })
      setShowAddAction(false)
      setNewActionDefense('LD2')
      loadActions(id)
    } catch (err) {
      console.error('Erreur lors de la création de l\'action:', err)
      addToast(createErrorToast('Erreur', "Impossible de créer l'action"))
    }
  }

  // Generate simple AI suggestions based on current risk
  const generateAISuggestions = (): Array<{ title: string; description: string; priority: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }> => {
    const target = risk?.target || 'cible'
    const scenario = (risk?.scenario || '').toLowerCase()
    const riskLevel = getPriorityFromScore(calculateRiskScore(risk!.probability, risk!.vulnerability, risk!.impact))
    const defaultPriority: any = riskLevel === 'CRITICAL' ? 'CRITICAL' : riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM'

    const suggestions: Array<{ title: string; description: string; priority: any }> = []

    if (/ransomware|ran[cs]on/.test(scenario) || /intrusion|compromission|phishing/.test(scenario)) {
      suggestions.push(
        {
          title: 'Renforcer la protection des accès privilégiés',
          description: `Mettre en place l'authentification multifacteur (MFA) et la rotation des mots de passe pour les comptes d'administration liés à ${target}.`,
          priority: defaultPriority
        },
        {
          title: 'Durcir la sauvegarde et la restauration',
          description: `Isoler des sauvegardes immuables et tester un plan de restauration pour ${target} afin de réduire l'impact d'un chiffrement ou sabotage.`,
          priority: defaultPriority
        },
        {
          title: 'Filtrage et sensibilisation phishing',
          description: `Déployer un filtrage renforcé des emails et une campagne de sensibilisation ciblée pour limiter l'infection menant à la compromission de ${target}.`,
          priority: 'MEDIUM'
        }
      )
    } else if (/incendie|intrusion physique|sabotage|vol/.test(scenario)) {
      suggestions.push(
        {
          title: 'Contrôles d’accès et surveillance',
          description: `Renforcer le contrôle d'accès physique et compléter la couverture de vidéosurveillance autour de ${target}.`,
          priority: defaultPriority
        },
        {
          title: 'Sécurité incendie et procédures',
          description: `Vérifier les moyens de détection/ extinction et organiser un exercice d’évacuation pour les zones critiques de ${target}.`,
          priority: 'HIGH'
        },
        {
          title: 'Gestion des prestataires',
          description: `Encadrer les accès prestataires (badges temporaires, supervision) et journaliser les interventions sur ${target}.`,
          priority: 'MEDIUM'
        }
      )
    } else {
      suggestions.push(
        {
          title: 'Mise à jour des procédures de sécurité',
          description: `Documenter et diffuser une procédure de réaction aux incidents impactant ${target}.`,
          priority: 'MEDIUM'
        },
        {
          title: 'Revue des droits d’accès',
          description: `Effectuer une revue des droits d'accès et supprimer les habilitations non nécessaires liées à ${target}.`,
          priority: defaultPriority
        },
        {
          title: 'Renforcement de la supervision',
          description: `Ajouter des alertes de surveillance spécifiques aux événements critiques liés à ${target}.`,
          priority: 'MEDIUM'
        }
      )
    }

    return suggestions.slice(0, 3) as any
  }

  const openAISuggestions = () => {
    setShowAISuggestions(true)
    setIsGeneratingAISuggestions(true)
    // Simulate brief generation time
    setTimeout(() => {
      setAiSuggestions(generateAISuggestions())
      setIsGeneratingAISuggestions(false)
    }, 600)
  }

  const createFromAISuggestion = async (s: { title: string; description: string; priority: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }) => {
    if (!id) return
    try {
      await actionsApi.create({
        title: s.title,
        description: s.description,
        priority: s.priority,
        riskSheetId: id
      })
      addToast(createSuccessToast('Action ajoutée', 'Suggestion IA appliquée'))
      setShowAISuggestions(false)
      loadActions(id)
    } catch (err) {
      console.error('Erreur lors de la création de l\'action (IA):', err)
      addToast(createErrorToast('Erreur', "Impossible d'ajouter l'action"))
    }
  }

  // Ouvrir la modale d'édition d'action
  const openEditAction = (action: Action) => {
    setEditingAction(action)
    const parsed = stripDefensePrefix(action.title || '')
    setEditAction({
      title: parsed.text,
      description: action.description || '',
      priority: action.priority || 'MEDIUM',
      dueDate: action.dueDate ? new Date(action.dueDate).toISOString().slice(0, 10) : '',
      status: action.status || 'TODO'
    })
    setEditActionDefense((parsed.code as any) || 'LD2')
  }

  // Mettre à jour une action existante
  const handleUpdateAction = async () => {
    if (!editingAction) return
    try {
      await actionsApi.update(editingAction.id, {
        title: withDefensePrefix(editActionDefense, editAction.title),
        description: editAction.description,
        priority: editAction.priority,
        status: editAction.status,
        dueDate: editAction.dueDate ? new Date(editAction.dueDate) : undefined
      })
      addToast(createSuccessToast('Action mise à jour'))
      setEditingAction(null)
      if (id) loadActions(id)
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'action:', err)
      addToast(createErrorToast('Erreur', "Impossible de mettre à jour l'action"))
    }
  }

  // Supprimer une action
  const handleDeleteAction = (action: Action) => {
    openDialog({
      title: 'Supprimer l\'action',
      message: `Voulez-vous supprimer l'action "${action.title}" ?`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger',
      onConfirm: async () => {
        try {
          await actionsApi.delete(action.id)
          addToast(createSuccessToast('Action supprimée'))
          if (id) loadActions(id)
        } catch (err) {
          console.error('Erreur lors de la suppression de l\'action:', err)
          addToast(createErrorToast('Erreur', "Impossible de supprimer l'action"))
        }
      }
    })
  }

  const handleDelete = async () => {
    if (!id || !risk) return
    openDialog({
      title: 'Supprimer la fiche de risque',
      message: 'Êtes-vous sûr de vouloir supprimer cette fiche de risque ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger',
      onConfirm: async () => {
        try {
          await riskSheetsApi.delete(id)
          addToast(createSuccessToast('Fiche supprimée', 'La fiche de risque a été supprimée avec succès.'))
          navigate('/risks')
        } catch (error) {
          console.error('Erreur lors de la suppression:', error)
          addToast(createErrorToast('Erreur de suppression', handleApiError(error)))
        }
      }
    })
  }



  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Erreur de chargement</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => navigate('/risks')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  if (!risk) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Fiche de risque introuvable</h2>
          <p className="text-gray-600 mt-2">La fiche demandée n'existe pas.</p>
          <button
            onClick={() => navigate('/risks')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  // Calculate dynamic values
  const riskScore = calculateRiskScore(risk.probability, risk.vulnerability, risk.impact)
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

  const handleEdit = () => {
    navigate(`/risks/${id}/edit`)
  }

  const handleGenerateReport = async () => {
    if (!risk) return

    try {
      await PDFService.generateRiskSheetReport(risk)
      addToast(createSuccessToast('Rapport PDF généré avec succès'))
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error)
      addToast(createErrorToast('Erreur lors de la génération du rapport PDF'))
    }
  }



  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/risks')}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fiche de risque #{risk.id}</h1>
            <p className="text-gray-600">Détails de l'analyse GAMR</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleGenerateReport}
            className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Rapport PDF
          </Button>
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-primary-600" />
                <span>Informations générales</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cible potentielle
                </label>
                <p className="text-gray-900">{risk.target}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <Badge variant="outline">{risk.category}</Badge>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scénario de menace
                </label>
                <p className="text-gray-900">{risk.scenario}</p>
              </div>

              {/* Description détaillée: not always present on risk */}
            </CardContent>
          </Card>

          {/* Évaluation GAMR */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary-600" />
                <span>Évaluation GAMR</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">{risk.probability}</div>
                  <div className="text-sm text-gray-600">Probabilité</div>
                  <div className="text-xs text-gray-500">sur 3</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning-600">{risk.vulnerability}</div>
                  <div className="text-sm text-gray-600">Vulnérabilité</div>
                  <div className="text-xs text-gray-500">sur 4</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-danger-600">{risk.impact}</div>
                  <div className="text-sm text-gray-600">Repercussions</div>
                  <div className="text-xs text-gray-500">sur 5</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Calcul du score:</span>
                  <span className="text-sm text-gray-500">
                    {risk.probability} × {risk.vulnerability} × {risk.impact}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analyse IA */}
          {risk.aiSuggestions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-accent-600" />
                  <span>Analyse IA</span>
                  {risk.aiSuggestions.confidence && (
                    <Badge variant="outline" className="ml-2">
                      {Math.round(risk.aiSuggestions.confidence * 100)}% confiance
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Évaluation détaillée */}
                {risk.aiSuggestions.analysis && (
                  <div className="space-y-4">
                    {/* Probabilité */}
                    {risk.aiSuggestions.analysis.probability && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">
                          Probabilité ({risk.aiSuggestions.analysis.probability.score}/3)
                        </h4>
                        <p className="text-sm text-blue-800 mb-2">
                          {risk.aiSuggestions.analysis.probability.explanation}
                        </p>
                        {/* Points positifs */}
                        {Array.isArray(risk.aiSuggestions.analysis.probability.positivePoints) && risk.aiSuggestions.analysis.probability.positivePoints.length > 0 && (
                          <div className="mb-2">
                            <div className="text-xs font-medium text-green-700 mb-1 flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Points forts identifiés</span>
                            </div>
                            <ul className="text-xs text-green-700 space-y-1 bg-green-50 border border-green-200 rounded p-2">
                              {risk.aiSuggestions.analysis.probability.positivePoints.map((p: string, i: number) => (
                                <li key={i} className="flex items-start space-x-1">
                                  <span className="text-green-500 mt-0.5">•</span>
                                  <span className="flex-1">{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {/* Points négatifs */}
                        {Array.isArray(risk.aiSuggestions.analysis.probability.negativePoints) && risk.aiSuggestions.analysis.probability.negativePoints.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-red-700 mb-1 flex items-center space-x-1">
                              <XCircle className="w-3 h-3" />
                              <span>Points faibles identifiés</span>
                            </div>
                            <ul className="text-xs text-red-700 space-y-1 bg-red-50 border border-red-200 rounded p-2">
                              {risk.aiSuggestions.analysis.probability.negativePoints.map((p: string, i: number) => (
                                <li key={i} className="flex items-start space-x-1">
                                  <span className="text-red-500 mt-0.5">•</span>
                                  <span className="flex-1">{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Vulnérabilité */}
                    {risk.aiSuggestions.analysis.vulnerability && (
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <h4 className="font-medium text-orange-900 mb-2">
                          Vulnérabilité ({risk.aiSuggestions.analysis.vulnerability.score}/4)
                        </h4>
                        <p className="text-sm text-orange-800 mb-2">
                          {risk.aiSuggestions.analysis.vulnerability.explanation}
                        </p>
                        {/* Points positifs */}
                        {Array.isArray(risk.aiSuggestions.analysis.vulnerability.positivePoints) && risk.aiSuggestions.analysis.vulnerability.positivePoints.length > 0 && (
                          <div className="mb-2">
                            <div className="text-xs font-medium text-green-700 mb-1 flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Points forts identifiés</span>
                            </div>
                            <ul className="text-xs text-green-700 space-y-1 bg-green-50 border border-green-200 rounded p-2">
                              {risk.aiSuggestions.analysis.vulnerability.positivePoints.map((p: string, i: number) => (
                                <li key={i} className="flex items-start space-x-1">
                                  <span className="text-green-500 mt-0.5">•</span>
                                  <span className="flex-1">{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {/* Points négatifs */}
                        {Array.isArray(risk.aiSuggestions.analysis.vulnerability.negativePoints) && risk.aiSuggestions.analysis.vulnerability.negativePoints.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-red-700 mb-1 flex items-center space-x-1">
                              <XCircle className="w-3 h-3" />
                              <span>Points faibles identifiés</span>
                            </div>
                            <ul className="text-xs text-red-700 space-y-1 bg-red-50 border border-red-200 rounded p-2">
                              {risk.aiSuggestions.analysis.vulnerability.negativePoints.map((p: string, i: number) => (
                                <li key={i} className="flex items-start space-x-1">
                                  <span className="text-red-500 mt-0.5">•</span>
                                  <span className="flex-1">{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Impact */}
                    {risk.aiSuggestions.analysis.impact && (
                      <div className="p-3 bg-red-50 rounded-lg">
                        <h4 className="font-medium text-red-900 mb-2">
                          Repercussions ({risk.aiSuggestions.analysis.impact.score}/5)
                        </h4>
                        <p className="text-sm text-red-800 mb-2">
                          {risk.aiSuggestions.analysis.impact.explanation}
                        </p>
                        {/* Points positifs */}
                        {Array.isArray(risk.aiSuggestions.analysis.impact.positivePoints) && risk.aiSuggestions.analysis.impact.positivePoints.length > 0 && (
                          <div className="mb-2">
                            <div className="text-xs font-medium text-green-700 mb-1 flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Points forts identifiés</span>
                            </div>
                            <ul className="text-xs text-green-700 space-y-1 bg-green-50 border border-green-200 rounded p-2">
                              {risk.aiSuggestions.analysis.impact.positivePoints.map((p: string, i: number) => (
                                <li key={i} className="flex items-start space-x-1">
                                  <span className="text-green-500 mt-0.5">•</span>
                                  <span className="flex-1">{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {/* Points négatifs */}
                        {Array.isArray(risk.aiSuggestions.analysis.impact.negativePoints) && risk.aiSuggestions.analysis.impact.negativePoints.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-red-700 mb-1 flex items-center space-x-1">
                              <XCircle className="w-3 h-3" />
                              <span>Points faibles identifiés</span>
                            </div>
                            <ul className="text-xs text-red-700 space-y-1 bg-red-50 border border-red-200 rounded p-2">
                              {risk.aiSuggestions.analysis.impact.negativePoints.map((p: string, i: number) => (
                                <li key={i} className="flex items-start space-x-1">
                                  <span className="text-red-500 mt-0.5">•</span>
                                  <span className="flex-1">{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Évaluation globale */}
                    {risk.aiSuggestions.analysis.overallAssessment && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Évaluation globale</h4>
                        <p className="text-sm text-gray-800 whitespace-pre-line">
                          {risk.aiSuggestions.analysis.overallAssessment}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommandations */}
                {risk.aiSuggestions.recommendations && risk.aiSuggestions.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Recommandations</h4>
                    <ul className="space-y-2">
                      {risk.aiSuggestions.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Amélioration Questionnaire */}
                {Array.isArray(risk.aiSuggestions.questionnaireImprovements) && risk.aiSuggestions.questionnaireImprovements.length > 0 && (
                  <div>
                    <h4 className="font-medium text-emerald-900 mb-2">Amélioration Questionnaire</h4>
                    <ul className="space-y-1 bg-emerald-50 border border-emerald-200 rounded p-3">
                      {risk.aiSuggestions.questionnaireImprovements.slice(0,5).map((q: string, idx: number) => (
                        <li key={idx} className="text-xs text-emerald-800 flex items-start space-x-1">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          <span className="flex-1">{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Métadonnées de l'analyse */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    {risk.aiSuggestions.basedOnEvaluations && (
                      <span>Basé sur {risk.aiSuggestions.basedOnEvaluations.length} évaluation(s)</span>
                    )}
                    {risk.aiSuggestions.timestamp && (
                      <span>Analysé le {new Date(risk.aiSuggestions.timestamp).toLocaleDateString('fr-FR')}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Priorités d'actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span>Priorités d'actions</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddAction(true)}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openAISuggestions}
                  className="text-purple-600 border-purple-300 hover:bg-purple-50"
                >
                  <Brain className="w-4 h-4 mr-1" />
                  Ajouter avec IA
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Liste des actions existantes */}
                {isLoadingActions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Chargement des actions...</span>
                  </div>
                ) : actions.length > 0 ? (
                  <div className="space-y-3">
                    {actions.map((action) => (
                      <div
                        key={action.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              action.priority === 'CRITICAL' ? 'bg-red-500' :
                              action.priority === 'HIGH' ? 'bg-orange-500' :
                              action.priority === 'MEDIUM' ? 'bg-yellow-500' :
                              action.priority === 'LOW' ? 'bg-blue-500' :
                              'bg-gray-500'
                            }`}></div>
                            <h4 className="font-medium text-gray-900">{action.title}</h4>
                            <Badge variant="outline" className={
                              action.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                              action.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              action.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-gray-50 text-gray-700 border-gray-200'
                            }>
                              {action.status === 'TODO' ? 'À faire' :
                               action.status === 'IN_PROGRESS' ? 'En cours' :
                               action.status === 'COMPLETED' ? 'Terminé' :
                               action.status === 'CANCELLED' ? 'Annulé' : action.status}
                            </Badge>
                          </div>
                          {action.description && (
                            <p className="text-sm text-gray-600 mt-1 ml-6">{action.description}</p>
                          )}
                          {action.dueDate && (
                            <div className="flex items-center space-x-1 mt-2 ml-6 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>Échéance: {new Date(action.dueDate).toLocaleDateString('fr-FR')}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditAction(action)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAction(action)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 mb-4">Aucune action définie pour ce risque</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddAction(true)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Créer la première action
                    </Button>
                  </div>
                )}

                {/* Formulaire d'ajout d'action */}
                {showAddAction && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Nouvelle action</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Titre *
                        </label>
                        <input
                          type="text"
                          value={newAction.title}
                          onChange={(e) => setNewAction(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Titre de l'action..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={newAction.description}
                          onChange={(e) => setNewAction(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="Description détaillée..."
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Priorité
                          </label>
                          <select
                            value={newAction.priority}
                            onChange={(e) => setNewAction(prev => ({ ...prev, priority: e.target.value as any }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="CRITICAL">Critique</option>
                            <option value="HIGH">Haute</option>
                            <option value="MEDIUM">Moyenne</option>
                            <option value="LOW">Basse</option>
                            <option value="VERY_LOW">Très basse</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Échéance
                          </label>
                          <input
                            type="date"
                            value={newAction.dueDate}
                            onChange={(e) => setNewAction(prev => ({ ...prev, dueDate: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                          <select
                            value={'TODO'}
                            onChange={() => {}}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                            disabled
                          >
                            <option value="TODO">À faire</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ligne de défense</label>
                        <select
                          value={newActionDefense}
                          onChange={(e) => setNewActionDefense(e.target.value as any)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {DEFENSE_LINES.map(dl => (
                            <option key={dl.code} value={dl.code}>{dl.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowAddAction(false)
                            setNewAction({
                              title: '',
                              description: '',
                              priority: 'MEDIUM',
                              dueDate: '',
                              assignedTo: ''
                            })
                          }}
                        >
                          Annuler
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleCreateAction}
                          disabled={!newAction.title.trim()}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Créer
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          {/* Modale de suggestions IA pour actions */}
          {showAISuggestions && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Suggestions d'actions (IA)</h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowAISuggestions(false)}>Fermer</Button>
                </div>
                <div className="p-6">
                  {isGeneratingAISuggestions ? (
                    <div className="flex items-center justify-center py-10 text-gray-600">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Génération des suggestions...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {aiSuggestions.map((s, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-start justify-between">
                          <div className="pr-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-gray-900">{s.title}</h4>
                              <Badge variant="outline">{s.priority}</Badge>
                            </div>
                            <p className="text-sm text-gray-600">{s.description}</p>
                          </div>
                          <div className="flex items-center">
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => createFromAISuggestion(s)}>
                              Ajouter
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Modale d'édition d'action */}
          {editingAction && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Modifier l'action</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                    <input
                      type="text"
                      value={editAction.title}
                      onChange={(e) => setEditAction(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={editAction.description}
                      onChange={(e) => setEditAction(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                      <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                      <select
                        value={editAction.priority}
                        onChange={(e) => setEditAction(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="CRITICAL">Critique</option>
                        <option value="HIGH">Haute</option>
                        <option value="MEDIUM">Moyenne</option>
                        <option value="LOW">Basse</option>
                        <option value="VERY_LOW">Très basse</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Échéance</label>
                      <input
                        type="date"
                        value={editAction.dueDate}
                        onChange={(e) => setEditAction(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                          <select
                            value={editAction.status}
                            onChange={(e) => setEditAction(prev => ({ ...prev, status: e.target.value as any }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="TODO">À faire</option>
                            <option value="IN_PROGRESS">En cours</option>
                            <option value="COMPLETED">Terminée</option>
                            <option value="CANCELLED">Annulée</option>
                          </select>
                        </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ligne de défense</label>
                    <select
                      value={editActionDefense}
                      onChange={(e) => setEditActionDefense(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {DEFENSE_LINES.map(dl => (
                        <option key={dl.code} value={dl.code}>{dl.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="px-6 py-4 border-t flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingAction(null)}>Annuler</Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleUpdateAction} disabled={!editAction.title.trim()}>
                    Sauvegarder
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panneau latéral */}
        <div className="space-y-6">
          {/* Score et priorité */}
          <Card variant="gradient">
            <CardHeader>
              <CardTitle>Résultat GAMR</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div>
                <div className="text-4xl font-bold text-gray-900">{riskScore}/60</div>
                <div className="text-sm text-gray-600">Score de risque GAMR</div>
              </div>
              
              <Badge className={`${priorityConfig.color} border`}>
                <PriorityIcon className="w-4 h-4 mr-1" />
                {translatePriority(priority)}
              </Badge>
            </CardContent>
          </Card>

          {/* Métadonnées */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium">Auteur</div>
                  <div className="text-sm text-gray-600">{risk.author?.firstName} {risk.author?.lastName}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium">Créé le</div>
                  <div className="text-sm text-gray-600">{new Date(risk.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium">Révision prévue</div>
                  <div className="text-sm text-gray-600">{risk.reviewDate ? new Date(risk.reviewDate).toLocaleDateString() : 'Non planifiée'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Confirm dialog portal */}
      {confirmDialog}
    </div>
  )
}
