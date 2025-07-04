import React, { useState } from 'react'
import { X, Calendar, User, Target, DollarSign, Clock, CheckCircle, AlertTriangle, MessageSquare, FileText } from 'lucide-react'
import { Button } from './ui/Button'
import { type Action, actionsApi } from '../lib/api'
import { useToast } from './Toast'
import { useAuth } from '../contexts/AuthContext'

interface ActionDetailProps {
  action: Action
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export const ActionDetail: React.FC<ActionDetailProps> = ({ action, isOpen, onClose, onUpdate }) => {
  const [comment, setComment] = useState('')
  const [updating, setUpdating] = useState(false)
  const { user } = useAuth()
  const { addToast } = useToast()

  // Gestion de la touche Échap pour fermer la modal
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Empêcher le scroll du body quand la modal est ouverte
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Mettre à jour le statut de l'action
  const updateStatus = async (newStatus: string) => {
    try {
      setUpdating(true)
      await actionsApi.update(action.id, { status: newStatus })
      addToast({
        type: 'success',
        title: 'Statut mis à jour avec succès',
        duration: 4000
      })
      onUpdate()
      onClose()
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error)
      addToast({
        type: 'error',
        title: 'Erreur lors de la mise à jour du statut',
        duration: 6000
      })
    } finally {
      setUpdating(false)
    }
  }

  // Obtenir la couleur selon le statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Obtenir la couleur selon la priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500'
      case 'HIGH': return 'bg-orange-500'
      case 'MEDIUM': return 'bg-yellow-500'
      case 'LOW': return 'bg-blue-500'
      case 'VERY_LOW': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  // Vérifier si l'action est en retard
  const isOverdue = () => {
    if (!action.dueDate || action.status === 'COMPLETED' || action.status === 'CANCELLED') {
      return false
    }
    return new Date(action.dueDate) < new Date()
  }

  // Formater la date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Calculer les jours restants
  const getDaysRemaining = () => {
    if (!action.dueDate) return null
    const today = new Date()
    const due = new Date(action.dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Vérifier les permissions
  const canUpdateStatus = () => {
    if (!user) return false

    // L'assigné peut toujours mettre à jour
    if (action.assigneeId === user.id) return true

    // Les admins et analystes peuvent mettre à jour
    if (['ADMIN', 'AI_ANALYST'].includes(user.role)) return true

    return false
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-y-auto p-6 z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {action.title}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                  {action.status === 'TODO' ? 'À faire' :
                   action.status === 'IN_PROGRESS' ? 'En cours' :
                   action.status === 'COMPLETED' ? 'Terminée' :
                   action.status === 'CANCELLED' ? 'Annulée' : action.status}
                </span>
                {isOverdue() && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    En retard
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Créée le {formatDate(action.createdAt)}</span>
                <span>•</span>
                <span>Mise à jour le {formatDate(action.updatedAt)}</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="hover:bg-gray-100 focus:ring-2 focus:ring-gray-300"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contenu principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Description</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{action.description}</p>
                </div>
              </div>

              {/* Fiche de risque associée */}
              {action.riskSheet && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Fiche de risque associée</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-blue-900">{action.riskSheet.target}</div>
                        <div className="text-sm text-blue-700">{action.riskSheet.scenario}</div>
                        <div className="text-xs text-blue-600 mt-1">
                          Score de risque: {Math.round(action.riskSheet.riskScore)}/100
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions de workflow */}
              {canUpdateStatus() && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Actions</h4>
                  <div className="flex flex-wrap gap-3">
                    {action.status === 'TODO' && (
                      <Button
                        onClick={() => updateStatus('IN_PROGRESS')}
                        disabled={updating}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Démarrer l'action
                      </Button>
                    )}
                    
                    {action.status === 'IN_PROGRESS' && (
                      <>
                        <Button
                          onClick={() => updateStatus('COMPLETED')}
                          disabled={updating}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Marquer comme terminée
                        </Button>
                        <Button
                          onClick={() => updateStatus('TODO')}
                          disabled={updating}
                          variant="outline"
                        >
                          Remettre en attente
                        </Button>
                      </>
                    )}
                    
                    {(action.status === 'TODO' || action.status === 'IN_PROGRESS') && (
                      <Button
                        onClick={() => updateStatus('CANCELLED')}
                        disabled={updating}
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Annuler l'action
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar avec informations */}
            <div className="space-y-6">
              {/* Informations générales */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Informations</h4>
                <div className="space-y-3">
                  {/* Priorité */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Priorité</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(action.priority)}`}></div>
                      <span className="text-sm font-medium">
                        {action.priority === 'CRITICAL' ? 'Critique' :
                         action.priority === 'HIGH' ? 'Haute' :
                         action.priority === 'MEDIUM' ? 'Moyenne' :
                         action.priority === 'LOW' ? 'Basse' :
                         action.priority === 'VERY_LOW' ? 'Très basse' : action.priority}
                      </span>
                    </div>
                  </div>

                  {/* Assigné à */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Assigné à</span>
                    <div className="flex items-center space-x-2">
                      {action.assignee ? (
                        <>
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {action.assignee.firstName} {action.assignee.lastName}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">Non assigné</span>
                      )}
                    </div>
                  </div>

                  {/* Date d'échéance */}
                  {action.dueDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Échéance</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatDate(action.dueDate)}</div>
                        <div className={`text-xs ${isOverdue() ? 'text-red-600' : 'text-gray-500'}`}>
                          {isOverdue() 
                            ? `${Math.abs(getDaysRemaining()!)} jour(s) de retard`
                            : getDaysRemaining() === 0 
                              ? 'Aujourd\'hui'
                              : getDaysRemaining()! > 0
                                ? `Dans ${getDaysRemaining()} jour(s)`
                                : 'Échue'
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Métriques */}
              {(action.successProbability || action.estimatedCost || action.estimatedDuration) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Métriques</h4>
                  <div className="space-y-3">
                    {action.successProbability && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Probabilité de succès</span>
                        </div>
                        <span className="text-sm font-medium">{action.successProbability}%</span>
                      </div>
                    )}

                    {action.estimatedCost && action.estimatedCost > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Coût estimé</span>
                        </div>
                        <span className="text-sm font-medium">{action.estimatedCost.toLocaleString('fr-FR')} €</span>
                      </div>
                    )}

                    {action.estimatedDuration && action.estimatedDuration > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Durée estimée</span>
                        </div>
                        <span className="text-sm font-medium">{action.estimatedDuration}h</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dates importantes */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Historique</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Créée</span>
                    <span className="text-sm font-medium">{formatDate(action.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dernière mise à jour</span>
                    <span className="text-sm font-medium">{formatDate(action.updatedAt)}</span>
                  </div>
                  {action.completedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Terminée</span>
                      <span className="text-sm font-medium">{formatDate(action.completedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
