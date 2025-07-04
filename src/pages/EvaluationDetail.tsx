import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Play, 
  FileText, 
  Calendar, 
  User, 
  Building,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  BarChart3
} from 'lucide-react'
import { evaluationsApi, handleApiError, type Evaluation } from '../lib/api'
import { ConfirmDialog, useConfirmDialog } from '../components/ConfirmDialog'
import { useToast, createSuccessToast, createErrorToast } from '../components/Toast'
import { pdfExportService } from '../lib/pdfExport'

export const EvaluationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { openDialog, confirmDialog } = useConfirmDialog()
  const { addToast } = useToast()

  useEffect(() => {
    if (id) {
      loadEvaluation(id)
    }
  }, [id])

  const loadEvaluation = async (evaluationId: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await evaluationsApi.getById(evaluationId)
      setEvaluation(data)
    } catch (err) {
      console.error('Erreur lors du chargement de l\'évaluation:', err)
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!evaluation) return

    openDialog({
      title: 'Supprimer l\'évaluation',
      message: `Êtes-vous sûr de vouloir supprimer l'évaluation "${evaluation.title}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      type: 'danger',
      onConfirm: async () => {
        try {
          setDeleting(true)
          await evaluationsApi.delete(evaluation.id)
          addToast(createSuccessToast(
            'Évaluation supprimée',
            'L\'évaluation a été supprimée avec succès.'
          ))
          navigate('/evaluations')
        } catch (err) {
          console.error('Erreur lors de la suppression:', err)
          addToast(createErrorToast(
            'Erreur de suppression',
            handleApiError(err)
          ))
        } finally {
          setDeleting(false)
        }
      }
    })
  }

  const handleExportPDF = async () => {
    if (!evaluation) return

    try {
      setExporting(true)
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
    } finally {
      setExporting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <FileText className="w-5 h-5 text-gray-500" />
      case 'IN_PROGRESS':
        return <Clock className="w-5 h-5 text-blue-500" />
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'VALIDATED':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />
      case 'ARCHIVED':
        return <AlertTriangle className="w-5 h-5 text-gray-400" />
      default:
        return <FileText className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Brouillon'
      case 'IN_PROGRESS':
        return 'En cours'
      case 'COMPLETED':
        return 'Terminée'
      case 'VALIDATED':
        return 'Validée'
      case 'ARCHIVED':
        return 'Archivée'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'VALIDATED':
        return 'bg-emerald-100 text-emerald-800'
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskLevelColor = (level?: string) => {
    switch (level) {
      case 'VERY_LOW':
        return 'bg-green-100 text-green-800'
      case 'LOW':
        return 'bg-blue-100 text-blue-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'CRITICAL':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskLevelLabel = (level?: string) => {
    switch (level) {
      case 'VERY_LOW':
        return 'Très faible'
      case 'LOW':
        return 'Faible'
      case 'MEDIUM':
        return 'Moyen'
      case 'HIGH':
        return 'Élevé'
      case 'CRITICAL':
        return 'Critique'
      default:
        return 'Non évalué'
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Erreur de chargement</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <button 
            onClick={() => navigate('/evaluations')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  if (!evaluation) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Évaluation introuvable</h2>
          <p className="text-gray-600 mt-2">L'évaluation demandée n'existe pas.</p>
          <button 
            onClick={() => navigate('/evaluations')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/evaluations')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              {getStatusIcon(evaluation.status)}
              <h1 className="text-3xl font-bold text-gray-900">{evaluation.title}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(evaluation.status)}`}>
                {getStatusLabel(evaluation.status)}
              </span>
            </div>
            <p className="text-gray-600 mt-2">
              Template: {evaluation.template?.name || 'Non défini'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {evaluation.status === 'DRAFT' || evaluation.status === 'IN_PROGRESS' ? (
            <Link
              to={`/evaluations/${evaluation.id}/questionnaire`}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Play className="w-4 h-4 mr-2" />
              {evaluation.status === 'DRAFT' ? 'Commencer' : 'Continuer'}
            </Link>
          ) : null}
          
          {evaluation.status === 'COMPLETED' && (
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Export en cours...' : 'Exporter PDF'}
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations générales</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Évaluateur</div>
                  <div className="text-sm text-gray-600">
                    {evaluation.evaluator?.firstName} {evaluation.evaluator?.lastName}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Créé le</div>
                  <div className="text-sm text-gray-600">
                    {new Date(evaluation.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {evaluation.startedAt && (
                <div className="flex items-center space-x-3">
                  <Play className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Débuté le</div>
                    <div className="text-sm text-gray-600">
                      {new Date(evaluation.startedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}

              {evaluation.completedAt && (
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Terminé le</div>
                    <div className="text-sm text-gray-600">
                      {new Date(evaluation.completedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Informations de l'entité */}
            {evaluation.entityInfo && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Entité évaluée
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {evaluation.entityInfo.name && (
                    <div>
                      <div className="text-sm font-medium text-gray-900">Nom</div>
                      <div className="text-sm text-gray-600">{evaluation.entityInfo.name}</div>
                    </div>
                  )}
                  {evaluation.entityInfo.sector && (
                    <div>
                      <div className="text-sm font-medium text-gray-900">Secteur</div>
                      <div className="text-sm text-gray-600">{evaluation.entityInfo.sector}</div>
                    </div>
                  )}
                  {evaluation.entityInfo.address && (
                    <div className="md:col-span-2">
                      <div className="text-sm font-medium text-gray-900">Adresse</div>
                      <div className="text-sm text-gray-600">{evaluation.entityInfo.address}</div>
                    </div>
                  )}
                  {evaluation.entityInfo.employeeCount && (
                    <div>
                      <div className="text-sm font-medium text-gray-900">Employés</div>
                      <div className="text-sm text-gray-600">{evaluation.entityInfo.employeeCount}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Progrès */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Progrès de l'évaluation</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Progression</span>
                <span className="text-sm font-medium text-gray-900">{Math.round(evaluation.progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${evaluation.progress}%` }}
                ></div>
              </div>
              
              {evaluation.responses && (
                <div className="text-sm text-gray-600">
                  {evaluation.responses.length} réponses enregistrées
                </div>
              )}
            </div>
          </div>

          {/* Réponses aux questions regroupées */}
          {evaluation.responses && evaluation.responses.length > 0 && evaluation.template?.questionGroups && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Réponses aux questions ({evaluation.responses.length})
              </h2>

              <div className="space-y-8">
                {evaluation.template.questionGroups.map((group, groupIndex) => {
                  // Trouver toutes les réponses pour ce groupe
                  const groupResponses = evaluation.responses?.filter(response =>
                    group.objectives.some(obj =>
                      obj.questions.some(q => q.id === response.questionId)
                    )
                  ) || []

                  if (groupResponses.length === 0) return null

                  return (
                    <div key={group.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* En-tête du groupe */}
                      <div className="bg-primary-50 border-b border-primary-200 px-6 py-4">
                        <h3 className="text-lg font-semibold text-primary-900 flex items-center">
                          <span className="bg-primary-100 text-primary-800 text-sm font-medium px-2 py-1 rounded-full mr-3">
                            Groupe {groupIndex + 1}
                          </span>
                          {group.title}
                        </h3>
                        {group.description && (
                          <p className="text-sm text-primary-700 mt-2">{group.description}</p>
                        )}
                        <div className="text-sm text-primary-600 mt-2">
                          {groupResponses.length} réponse{groupResponses.length > 1 ? 's' : ''}
                        </div>
                      </div>

                      {/* Objectifs du groupe */}
                      <div className="p-6 space-y-6">
                        {group.objectives.map((objective, objIndex) => {
                          // Trouver les réponses pour cet objectif
                          const objectiveResponses = evaluation.responses?.filter(response =>
                            objective.questions.some(q => q.id === response.questionId)
                          ) || []

                          if (objectiveResponses.length === 0) return null

                          return (
                            <div key={objective.id} className="bg-gray-50 rounded-lg p-5">
                              {/* En-tête de l'objectif */}
                              <div className="mb-4">
                                <h4 className="text-base font-medium text-gray-900 flex items-center">
                                  <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded mr-3">
                                    Obj. {objIndex + 1}
                                  </span>
                                  {objective.title}
                                </h4>
                                {objective.description && (
                                  <p className="text-sm text-gray-600 mt-2 ml-12">{objective.description}</p>
                                )}
                              </div>

                              {/* Questions et réponses de l'objectif */}
                              <div className="space-y-4 ml-12">
                                {objective.questions.map((question, questionIndex) => {
                                  const response = evaluation.responses?.find(r => r.questionId === question.id)
                                  if (!response) return null

                                  return (
                                    <div key={question.id} className="bg-white rounded-lg border border-gray-200 p-4">
                                      <div className="text-sm font-medium text-gray-800 mb-3">
                                        <span className="text-gray-500 mr-2">Q{questionIndex + 1}.</span>
                                        {question.text}
                                      </div>

                                      {/* Réponse */}
                                      <div className="mb-3">
                                        {question.type === 'YES_NO' ? (
                                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                            response.booleanValue
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-red-100 text-red-800'
                                          }`}>
                                            {response.booleanValue ? '✓ Oui' : '✗ Non'}
                                          </span>
                                        ) : question.type === 'NUMBER' ? (
                                          <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                            {response.numberValue}
                                          </span>
                                        ) : (
                                          <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-900">
                                            {response.textValue || 'Non renseigné'}
                                          </div>
                                        )}
                                      </div>

                                      {/* Notes et commentaires */}
                                      {(response.description || response.comment) && (
                                        <div className="space-y-2">
                                          {response.description && (
                                            <div className="text-xs text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-2">
                                              <strong className="text-yellow-800">Note:</strong> {response.description}
                                            </div>
                                          )}
                                          {response.comment && (
                                            <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-2">
                                              <strong className="text-blue-800">Commentaire:</strong> {response.comment}
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Scores */}
                                      {(response.facilityScore !== null || response.constraintScore !== null) && (
                                        <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-gray-100">
                                          <div className="flex items-center space-x-2 text-xs">
                                            <span className="text-gray-500">Score facilité:</span>
                                            <span className="font-medium text-green-600">{response.facilityScore || 0}</span>
                                          </div>
                                          <div className="flex items-center space-x-2 text-xs">
                                            <span className="text-gray-500">Score contrainte:</span>
                                            <span className="font-medium text-orange-600">{response.constraintScore || 0}</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Résultats */}
          {evaluation.status === 'COMPLETED' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Résultats
              </h2>
              
              <div className="space-y-4">
                {evaluation.totalScore !== undefined && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Score total</div>
                    <div className="text-2xl font-bold text-gray-900">{evaluation.totalScore}/100</div>
                  </div>
                )}
                
                {evaluation.riskLevel && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Niveau de risque</div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(evaluation.riskLevel)}`}>
                      {getRiskLevelLabel(evaluation.riskLevel)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fiches de risque générées */}
          {evaluation.generatedRisks && evaluation.generatedRisks.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Fiches de risque générées</h2>
              
              <div className="space-y-3">
                {evaluation.generatedRisks.map((risk) => (
                  <Link
                    key={risk.id}
                    to={`/risks/${risk.id}`}
                    className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{risk.target}</div>
                    <div className="text-sm text-gray-600 mt-1">{risk.scenario}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        Score: {risk.riskScore}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        risk.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        risk.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        risk.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {risk.priority}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Pièces jointes */}
          {evaluation.attachments && evaluation.attachments.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pièces jointes</h2>
              
              <div className="space-y-2">
                {evaluation.attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center space-x-3 p-2 border border-gray-200 rounded">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {attachment.originalName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(attachment.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <button className="text-primary-600 hover:text-primary-700">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialog de confirmation */}
      {confirmDialog}
    </div>
  )
}
