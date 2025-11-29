import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { translatePriority, calculateRiskScore, getPriorityFromScore } from '../lib/utils'
import { riskSheetsApi, handleApiError, type RiskSheet } from '../lib/api'
import { useConfirmDialog } from '../components/ConfirmDialog'
import { useToast, createSuccessToast, createErrorToast } from '../components/Toast'
import { ReportGenerator } from '../components/ReportGenerator'
import { PDFService } from '../lib/pdfService'
import {
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Shield,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Download,
  FileText
} from 'lucide-react'

export const RiskSheets: React.FC = () => {
  const navigate = useNavigate()
  const { openDialog, confirmDialog } = useConfirmDialog()
  const { addToast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [riskSheets, setRiskSheets] = useState<RiskSheet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReportGenerator, setShowReportGenerator] = useState(false)

  // Charger les fiches depuis l'API
  useEffect(() => {
    loadRiskSheets()
  }, [])

  const loadRiskSheets = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await riskSheetsApi.getAll()
      setRiskSheets(response.data)
    } catch (err) {
      console.error('Erreur lors du chargement des fiches:', err)
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }
  
  // Filtrer les fiches selon la recherche
  const filteredRisks = riskSheets.filter(risk =>
    risk.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
    risk.scenario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (risk.category && risk.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-danger-600 bg-danger-100 border-danger-200'
      case 'HIGH': return 'text-warning-600 bg-warning-100 border-warning-200'
      case 'MEDIUM': return 'text-primary-600 bg-primary-100 border-primary-200'
      case 'LOW': return 'text-success-600 bg-success-100 border-success-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return AlertTriangle
      case 'HIGH': return TrendingUp
      default: return Shield
    }
  }

  // Fonctions pour les actions
  const handleViewRisk = (riskId: string) => {
    navigate(`/risks/${riskId}`)
  }

  const handleEditRisk = (riskId: string) => {
    navigate(`/risks/${riskId}/edit`)
  }

  const handleDeleteRisk = async (riskId: string) => {
    openDialog({
      title: 'Supprimer la fiche de risque',
      message: 'Êtes-vous sûr de vouloir supprimer cette fiche de risque ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger',
      onConfirm: async () => {
        try {
          await riskSheetsApi.delete(riskId)
          await loadRiskSheets()
          addToast(createSuccessToast('Fiche supprimée', 'La fiche de risque a été supprimée avec succès.'))
        } catch (error) {
          console.error('Erreur lors de la suppression:', error)
          addToast(createErrorToast('Erreur de suppression', handleApiError(error)))
        }
      }
    })
  }

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  // Générer un rapport PDF pour une fiche spécifique
  const generateSingleReport = async (riskSheet: RiskSheet) => {
    try {
      await PDFService.generateRiskSheetReport(riskSheet)
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error)
      alert('Erreur lors de la génération du rapport PDF')
    }
  }

  // État de chargement
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GAMR</h1>
            <p className="text-gray-600">Gestion et suivi de vos analyses GAMR</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-primary-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Chargement des GAMR...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // État d'erreur
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GAMR</h1>
            <p className="text-gray-600">Gestion et suivi de vos analyses GAMR</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadRiskSheets}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GAMR</h1>
          <p className="text-gray-600">Gestion et suivi de vos analyses GAMR</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowReportGenerator(true)}
            variant="outline"
            className="btn-animated"
          >
            <FileText className="h-4 w-4 mr-2" />
            Rapports
          </Button>
          <Link to="/risks/new">
            <Button variant="gradient" size="lg" className="btn-animated">
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle fiche de risque
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par cible, scénario ou catégorie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full h-10 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <Button variant="outline" onClick={toggleFilters}>
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Panneau de filtres avancés */}
      {showFilters && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filtres avancés</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorité
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option value="">Toutes les priorités</option>
                  <option value="CRITIQUE">Critique</option>
                  <option value="ÉLEVÉ">Élevé</option>
                  <option value="MOYEN">Moyen</option>
                  <option value="FAIBLE">Faible</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option value="">Toutes les catégories</option>
                  <option value="Cybersécurité">Cybersécurité</option>
                  <option value="Protection des données">Protection des données</option>
                  <option value="Opérationnel">Opérationnel</option>
                  <option value="Ressources humaines">Ressources humaines</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auteur
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option value="">Tous les auteurs</option>
                  <option value="Marie Dubois">Marie Dubois</option>
                  <option value="Jean Martin">Jean Martin</option>
                  <option value="Sophie Laurent">Sophie Laurent</option>
                  <option value="Pierre Durand">Pierre Durand</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(false)}>
                Annuler
              </Button>
              <Button variant="primary" size="sm">
                Appliquer les filtres
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm dialog mount point */}
      {confirmDialog}

      {/* Risk Sheets List */}
      <div className="space-y-4">
        {filteredRisks.map((risk) => {
          const PriorityIcon = getPriorityIcon(risk.priority)
          return (
            <Card key={risk.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <PriorityIcon className="w-5 h-5 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900">{risk.target}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(risk.priority)}`}>
                        {translatePriority(risk.priority)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{risk.scenario}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-xs font-medium text-gray-500">Probabilité</span>
                        <div className="text-sm font-semibold text-gray-900">{risk.probability}/3</div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Vulnérabilité</span>
                        <div className="text-sm font-semibold text-gray-900">{risk.vulnerability}/4</div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Impact</span>
                        <div className="text-sm font-semibold text-gray-900">{risk.impact}/5</div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Score de risque</span>
                        <div className="text-sm font-semibold text-gray-900">{risk.riskScore}/60</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span>Catégorie: {risk.category || 'Non spécifiée'}</span>
                        <span>Auteur: {risk.author?.firstName} {risk.author?.lastName}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span>Créé: {new Date(risk.createdAt).toLocaleDateString()}</span>
                        <span>Révision: {risk.reviewDate ? new Date(risk.reviewDate).toLocaleDateString() : 'Non planifiée'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewRisk(risk.id)}
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateSingleReport(risk)}
                      title="Générer un rapport PDF"
                      className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRisk(risk.id)}
                      title="Modifier la fiche"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRisk(risk.id)}
                      title="Supprimer la fiche"
                      className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredRisks.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune fiche trouvée</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Aucune fiche ne correspond à votre recherche.' : 'Commencez par créer votre première fiche de risque.'}
            </p>
            <Link to="/risks/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Créer une fiche
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Générateur de rapports */}
      <ReportGenerator
        isOpen={showReportGenerator}
        onClose={() => setShowReportGenerator(false)}
      />
    </div>
  )
}
