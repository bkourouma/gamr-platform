import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { riskSheetsApi, handleApiError, type RiskSheet } from '../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { translatePriority, calculateRiskScore, getPriorityFromScore } from '../lib/utils'
import { PDFService } from '../lib/pdfService'
import { useToast } from '../components/Toast'
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
  Download
} from 'lucide-react'

export const RiskSheetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [risk, setRisk] = useState<RiskSheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast()

  // Charger la fiche depuis l'API
  useEffect(() => {
    if (id) {
      loadRisk(id)
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

  const handleDelete = async () => {
    if (!id || !risk) return

    if (confirm('Êtes-vous sûr de vouloir supprimer cette fiche de risque ?')) {
      try {
        await riskSheetsApi.delete(id)
        alert('Fiche supprimée avec succès')
        navigate('/risks')
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        alert(`Erreur lors de la suppression: ${handleApiError(error)}`)
      }
    }
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
      showToast('Rapport PDF généré avec succès', 'success')
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error)
      showToast('Erreur lors de la génération du rapport PDF', 'error')
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description détaillée
                </label>
                <p className="text-gray-900">{risk.description || 'Aucune description disponible'}</p>
              </div>
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
                  <div className="text-sm text-gray-600">Impact</div>
                  <div className="text-xs text-gray-500">sur 5</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Calcul du score:</span>
                  <span className="text-sm text-gray-500">
                    ({risk.probability} × {risk.vulnerability} × {risk.impact}) ÷ 60 × 100
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mesures de mitigation */}
          <Card>
            <CardHeader>
              <CardTitle>Mesures de mitigation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900">{risk.mitigation || 'Aucune mesure de mitigation définie'}</p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Risque résiduel
                </label>
                <Badge variant="outline">{risk.residualRisk || 'Non évalué'}</Badge>
              </div>
            </CardContent>
          </Card>
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
                <div className="text-4xl font-bold text-gray-900">{riskScore}</div>
                <div className="text-sm text-gray-600">Score de risque</div>
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
    </div>
  )
}
