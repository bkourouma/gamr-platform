import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Calendar, User, AlertTriangle, CheckCircle, Clock, X, Edit, FileText } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { ActionForm } from '../components/ActionForm'
import { ActionDetail } from '../components/ActionDetail'
import { ReportGenerator } from '../components/ReportGenerator'
import { PDFService } from '../lib/pdfService'
import { actionsApi, type Action } from '../lib/api'
import { useToast, createSuccessToast, createErrorToast } from '../components/Toast'

export const ActionsPage: React.FC = () => {
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [defenseFilter, setDefenseFilter] = useState<string>('all')
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [showActionForm, setShowActionForm] = useState(false)
  const [editingAction, setEditingAction] = useState<Action | undefined>(undefined)
  const [showActionDetail, setShowActionDetail] = useState(false)
  const [selectedAction, setSelectedAction] = useState<Action | undefined>(undefined)
  const [showReportGenerator, setShowReportGenerator] = useState(false)
  const { addToast } = useToast()

  // Charger les actions et statistiques
  const getDefenseCodeFromTitle = (title: string): 'LD1' | 'LD2' | 'LD3' | 'LD4' | undefined => {
    const match = title.match(/^\[(LD[1-4])\]/)
    return (match?.[1] as any) || undefined
  }

  const loadActions = async () => {
    try {
      setLoading(true)
      const [actionsResponse, statsResponse] = await Promise.all([
        actionsApi.getAll({
          search: searchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          overdue: showOverdueOnly || undefined,
          limit: 50
        }),
        actionsApi.getStats()
      ])
      
      const baseActions = actionsResponse.data
      const filteredByDefense = defenseFilter === 'all'
        ? baseActions
        : baseActions.filter(a => getDefenseCodeFromTitle(a.title) === defenseFilter)

      setActions(filteredByDefense)
      setStats(statsResponse)
    } catch (error) {
      console.error('Erreur lors du chargement des actions:', error)
      addToast(createErrorToast('Erreur lors du chargement des actions'))
    } finally {
      setLoading(false)
    }
  }

  // Charger les données au montage et lors des changements de filtres
  useEffect(() => {
    loadActions()
  }, [searchTerm, statusFilter, priorityFilter, defenseFilter, showOverdueOnly])

  // Mettre à jour le statut d'une action
  const updateActionStatus = async (actionId: string, newStatus: string) => {
    try {
      await actionsApi.update(actionId, { status: newStatus })
      await loadActions() // Recharger les données
      addToast(createSuccessToast('Statut mis à jour avec succès'))
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      addToast(createErrorToast('Erreur lors de la mise à jour du statut'))
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

  // Obtenir l'icône selon le statut
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO': return <Clock className="w-4 h-4" />
      case 'IN_PROGRESS': return <AlertTriangle className="w-4 h-4" />
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />
      case 'CANCELLED': return <X className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  // Vérifier si une action est en retard
  const isOverdue = (action: Action) => {
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
  const getDaysRemaining = (dueDate: Date | string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Ouvrir le formulaire de création
  const handleCreateAction = () => {
    setEditingAction(undefined)
    setShowActionForm(true)
  }

  // Ouvrir le formulaire d'édition
  const handleEditAction = (action: Action) => {
    setEditingAction(action)
    setShowActionForm(true)
  }

  // Fermer le formulaire
  const handleCloseForm = () => {
    setShowActionForm(false)
    setEditingAction(undefined)
  }

  // Callback après sauvegarde
  const handleSaveAction = () => {
    loadActions()
  }

  // Ouvrir les détails d'une action
  const handleViewAction = (action: Action) => {
    setSelectedAction(action)
    setShowActionDetail(true)
  }

  // Fermer les détails
  const handleCloseDetail = () => {
    setShowActionDetail(false)
    setSelectedAction(undefined)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Priorités d'action</h1>
          <p className="text-gray-600 mt-1">
            Gérez et suivez les priorités d'action pour réduire les risques
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="btn-animated"
            onClick={() => setShowReportGenerator(true)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Rapports
          </Button>
          <Button className="btn-animated" onClick={handleCreateAction}>
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle Action
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalActions}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">À faire</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todoActions}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-blue-900">{stats.inProgressActions}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Terminées</p>
                <p className="text-2xl font-bold text-green-900">{stats.completedActions}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En retard</p>
                <p className="text-2xl font-bold text-red-900">{stats.overdueActions}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4">
          {/* Recherche */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtre statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="TODO">À faire</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="COMPLETED">Terminées</option>
            <option value="CANCELLED">Annulées</option>
          </select>

          {/* Filtre priorité */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">Toutes les priorités</option>
            <option value="CRITICAL">Critique</option>
            <option value="HIGH">Haute</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="LOW">Basse</option>
            <option value="VERY_LOW">Très basse</option>
          </select>

          {/* Filtre ligne de défense */}
          <select
            value={defenseFilter}
            onChange={(e) => setDefenseFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">Toutes les lignes de défense</option>
            <option value="LD1">LD1 — Périphérie</option>
            <option value="LD2">LD2 — Périmètre</option>
            <option value="LD3">LD3 — Entrées et accès</option>
            <option value="LD4">LD4 — Espace névralgique</option>
          </select>

          {/* Filtre en retard */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showOverdueOnly}
              onChange={(e) => setShowOverdueOnly(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">En retard seulement</span>
          </label>
        </div>
      </div>

      {/* Liste des actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des actions...</p>
          </div>
        ) : actions.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Aucune action trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigné à
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Échéance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {actions.map((action) => (
                  <tr key={action.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div
                        className="cursor-pointer hover:bg-blue-50 p-2 rounded-lg transition-colors"
                        onClick={() => handleViewAction(action)}
                      >
                        <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                          {action.title}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {action.description}
                        </div>
                        {action.riskSheet && (
                          <div className="text-xs text-blue-600 mt-1">
                            Risque: {action.riskSheet.target}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                          {getStatusIcon(action.status)}
                          <span className="ml-1">
                            {action.status === 'TODO' ? 'À faire' :
                             action.status === 'IN_PROGRESS' ? 'En cours' :
                             action.status === 'COMPLETED' ? 'Terminée' :
                             action.status === 'CANCELLED' ? 'Annulée' : action.status}
                          </span>
                        </span>
                        {isOverdue(action) && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            En retard
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(action.priority)}`}></div>
                        <span className="text-sm text-gray-900">
                          {action.priority === 'CRITICAL' ? 'Critique' :
                           action.priority === 'HIGH' ? 'Haute' :
                           action.priority === 'MEDIUM' ? 'Moyenne' :
                           action.priority === 'LOW' ? 'Basse' :
                           action.priority === 'VERY_LOW' ? 'Très basse' : action.priority}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {action.assignee ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-primary-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {action.assignee.firstName} {action.assignee.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {action.assignee.email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Non assigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {action.dueDate ? (
                        <div>
                          <div className="text-sm text-gray-900">
                            {formatDate(action.dueDate)}
                          </div>
                          <div className={`text-xs ${isOverdue(action) ? 'text-red-600' : 'text-gray-500'}`}>
                            {isOverdue(action) 
                              ? `${Math.abs(getDaysRemaining(action.dueDate))} jour(s) de retard`
                              : getDaysRemaining(action.dueDate) === 0 
                                ? 'Aujourd\'hui'
                                : getDaysRemaining(action.dueDate) > 0
                                  ? `Dans ${getDaysRemaining(action.dueDate)} jour(s)`
                                  : 'Échue'
                            }
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Pas d'échéance</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {action.status !== 'COMPLETED' && action.status !== 'CANCELLED' && (
                          <>
                            {action.status === 'TODO' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateActionStatus(action.id, 'IN_PROGRESS')}
                              >
                                Démarrer
                              </Button>
                            )}
                            {action.status === 'IN_PROGRESS' && (
                              <Button
                                size="sm"
                                onClick={() => updateActionStatus(action.id, 'COMPLETED')}
                              >
                                Terminer
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditAction(action)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Modifier
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Formulaire d'action */}
      <ActionForm
        action={editingAction}
        isOpen={showActionForm}
        onClose={handleCloseForm}
        onSave={handleSaveAction}
      />

      {/* Détails d'action */}
      {selectedAction && (
        <ActionDetail
          action={selectedAction}
          isOpen={showActionDetail}
          onClose={handleCloseDetail}
          onUpdate={handleSaveAction}
        />
      )}

      {/* Générateur de rapports */}
      <ReportGenerator
        isOpen={showReportGenerator}
        onClose={() => setShowReportGenerator(false)}
      />
    </div>
  )
}
