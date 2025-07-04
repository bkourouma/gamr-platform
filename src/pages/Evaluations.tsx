import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { evaluationsApi, handleApiError, type Evaluation } from '../lib/api'
import { useConfirmDialog } from '../components/ConfirmDialog'
import { useToast, createSuccessToast, createErrorToast } from '../components/Toast'
import { useAuth } from '../contexts/AuthContext'
import {
  Plus,
  Search,
  Filter,
  FileText,
  Calendar,
  User,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Edit,
  Download,
  MoreVertical
} from 'lucide-react'



export const Evaluations: React.FC = () => {
  const { user } = useAuth()
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { openDialog, confirmDialog } = useConfirmDialog()
  const { addToast } = useToast()

  useEffect(() => {
    loadEvaluations()
  }, [page, searchTerm, selectedStatus])

  const loadEvaluations = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await evaluationsApi.getAll({
        page,
        limit: 10,
        search: searchTerm || undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined
      })
      setEvaluations(response.data)
      setTotalPages(response.pagination.pages)
    } catch (err) {
      console.error('Erreur lors du chargement des évaluations:', err)
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return {
          label: 'Terminée',
          color: 'bg-success-100 text-success-800 border-success-200',
          icon: CheckCircle
        }
      case 'IN_PROGRESS':
        return {
          label: 'En cours',
          color: 'bg-primary-100 text-primary-800 border-primary-200',
          icon: Clock
        }
      case 'DRAFT':
        return {
          label: 'Brouillon',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: FileText
        }
      case 'VALIDATED':
        return {
          label: 'Validée',
          color: 'bg-accent-100 text-accent-800 border-accent-200',
          icon: CheckCircle
        }
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800',
          icon: FileText
        }
    }
  }

  const getRiskLevelConfig = (riskLevel: string | null) => {
    if (!riskLevel) return null
    
    switch (riskLevel) {
      case 'CRITICAL':
        return { color: 'text-danger-700', label: 'Critique' }
      case 'HIGH':
        return { color: 'text-warning-700', label: 'Élevé' }
      case 'MEDIUM':
        return { color: 'text-primary-700', label: 'Moyen' }
      case 'LOW':
        return { color: 'text-success-700', label: 'Faible' }
      default:
        return { color: 'text-gray-700', label: riskLevel }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDelete = async (evaluation: Evaluation) => {
    openDialog({
      title: 'Supprimer l\'évaluation',
      message: `Êtes-vous sûr de vouloir supprimer l'évaluation "${evaluation.title}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger',
      onConfirm: async () => {
        try {
          setDeletingId(evaluation.id)
          await evaluationsApi.delete(evaluation.id)
          addToast(createSuccessToast(
            'Évaluation supprimée',
            'L\'évaluation a été supprimée avec succès.'
          ))
          // Recharger la liste
          await loadEvaluations()
        } catch (err) {
          console.error('Erreur lors de la suppression:', err)
          addToast(createErrorToast(
            'Erreur de suppression',
            handleApiError(err)
          ))
        } finally {
          setDeletingId(null)
        }
      }
    })
  }

  const handleExport = async (evaluation: Evaluation) => {
    try {
      const { pdfExportService } = await import('../lib/pdfExport')
      await pdfExportService.exportEvaluation(evaluation)
      addToast(createSuccessToast(
        'Export réussi',
        'Le rapport PDF a été téléchargé avec succès.'
      ))
    } catch (err) {
      console.error('Erreur lors de l\'export:', err)
      addToast(createErrorToast(
        'Erreur d\'export',
        'Une erreur est survenue lors de la génération du PDF.'
      ))
    }
  }

  const stats = {
    total: evaluations.length,
    completed: evaluations.filter(e => e.status === 'COMPLETED').length,
    inProgress: evaluations.filter(e => e.status === 'IN_PROGRESS').length,
    avgScore: evaluations
      .filter(e => e.totalScore)
      .reduce((sum, e) => sum + (e.totalScore || 0), 0) /
      evaluations.filter(e => e.totalScore).length || 0
  }

  if (loading && evaluations.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Évaluations Sécuritaires</h1>
          <p className="text-gray-600 text-lg">
            Questionnaires d'évaluation pour {user?.tenant.name}
          </p>
        </div>
        <Link to="/evaluations/new">
          <Button variant="gradient" size="lg" className="btn-animated">
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle évaluation
          </Button>
        </Link>
      </div>

      {/* Message d'erreur */}
      {error && (
        <Card variant="glass" className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Erreur de chargement</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Total évaluations', 
            value: stats.total, 
            icon: FileText, 
            color: 'from-primary-500 to-primary-600' 
          },
          { 
            label: 'Terminées', 
            value: stats.completed, 
            icon: CheckCircle, 
            color: 'from-success-500 to-success-600' 
          },
          { 
            label: 'En cours', 
            value: stats.inProgress, 
            icon: Clock, 
            color: 'from-warning-500 to-warning-600' 
          },
          { 
            label: 'Score moyen', 
            value: `${stats.avgScore.toFixed(1)}%`, 
            icon: TrendingUp, 
            color: 'from-accent-500 to-accent-600' 
          }
        ].map((stat, index) => (
          <Card key={stat.label} variant="glass" className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-soft`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par titre ou entité..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full h-10 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/60 backdrop-blur-sm"
                />
              </div>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/60 backdrop-blur-sm"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="COMPLETED">Terminée</option>
              <option value="VALIDATED">Validée</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Evaluations List */}
      <div className="space-y-4">
        {evaluations.map((evaluation, index) => {
          const statusConfig = getStatusConfig(evaluation.status)
          const riskConfig = getRiskLevelConfig(evaluation.riskLevel)
          const StatusIcon = statusConfig.icon
          
          return (
            <Card 
              key={evaluation.id} 
              variant="glass" 
              className="hover:shadow-card-hover transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${400 + index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-soft">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {evaluation.title}
                        </h3>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        {riskConfig && (
                          <Badge variant="outline" className={riskConfig.color}>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {riskConfig.label}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{evaluation.evaluator?.firstName} {evaluation.evaluator?.lastName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Débuté le {evaluation.startedAt ? formatDate(evaluation.startedAt) : 'Non défini'}</span>
                        </div>
                        {evaluation.completedAt && (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>Terminé le {formatDate(evaluation.completedAt)}</span>
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Progression</span>
                          <span className="text-sm text-gray-600">{evaluation.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${evaluation.progress}%` }}
                          />
                        </div>
                      </div>

                      {evaluation.totalScore && (
                        <div className="mt-3">
                          <span className="text-sm text-gray-600">Score final: </span>
                          <span className="font-semibold text-gray-900">{evaluation.totalScore}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Link to={`/evaluations/${evaluation.id}`}>
                      <Button variant="outline" size="sm" className="glass">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    {evaluation.status !== 'COMPLETED' && (
                      <Link to={`/evaluations/${evaluation.id}/questionnaire`}>
                        <Button variant="outline" size="sm" className="glass">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                    {evaluation.status === 'COMPLETED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="glass"
                        onClick={() => handleExport(evaluation)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="glass text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(evaluation)}
                      disabled={deletingId === evaluation.id}
                    >
                      {deletingId === evaluation.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <MoreVertical className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {evaluations.length === 0 && !loading && (
        <Card variant="glass">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune évaluation trouvée</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Aucune évaluation ne correspond à votre recherche.' : 'Commencez par créer votre première évaluation sécuritaire.'}
            </p>
            <Link to="/evaluations/new">
              <Button variant="gradient">
                <Plus className="w-4 h-4 mr-2" />
                Créer une évaluation
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            Précédent
          </Button>

          <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg">
            Page {page} sur {totalPages}
          </span>

          <Button
            variant="outline"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            Suivant
          </Button>
        </div>
      )}

      {/* Dialog de confirmation */}
      {confirmDialog}
    </div>
  )
}
