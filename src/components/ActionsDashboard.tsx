import React, { useState, useEffect } from 'react'
import { Calendar, Clock, AlertTriangle, CheckCircle, ArrowRight, User } from 'lucide-react'
import { Button } from './ui/Button'
import { actionsApi, type Action } from '../lib/api'
import { useNavigate } from 'react-router-dom'

export const ActionsDashboard: React.FC = () => {
  const [actions, setActions] = useState<Action[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [actionsResponse, statsResponse] = await Promise.all([
        actionsApi.getAll({ limit: 5, overdue: true }), // Actions en retard
        actionsApi.getStats()
      ])
      setActions(actionsResponse.data)
      setStats(statsResponse)
    } catch (error) {
      console.error('Erreur lors du chargement des actions:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  const getDaysOverdue = (dueDate: Date | string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = today.getTime() - due.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Actions Correctives</h3>
          <p className="text-sm text-gray-600">Suivi des actions en cours et en retard</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/actions')}
          className="text-primary-600 hover:text-primary-700"
        >
          Voir tout
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Statistiques rapides */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-xl font-bold text-blue-900">{stats.totalActions}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-xl font-bold text-yellow-900">{stats.inProgressActions}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">En retard</p>
                <p className="text-xl font-bold text-red-900">{stats.overdueActions}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Terminées</p>
                <p className="text-xl font-bold text-green-900">{stats.completedActions}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions en retard */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Actions en retard ({actions.length})
        </h4>
        
        {actions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune action en retard</p>
            <p className="text-sm text-gray-400">Excellent travail !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((action) => (
              <div
                key={action.id}
                className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                onClick={() => navigate('/actions')}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`w-3 h-3 rounded-full ${getPriorityColor(action.priority)}`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {action.title}
                    </div>
                    <div className="text-xs text-gray-600 flex items-center space-x-2">
                      {action.assignee && (
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{action.assignee.firstName} {action.assignee.lastName}</span>
                        </div>
                      )}
                      {action.riskSheet && (
                        <span>• {action.riskSheet.target}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-red-600">
                    {action.dueDate && formatDate(action.dueDate)}
                  </div>
                  <div className="text-xs text-red-500">
                    {action.dueDate && `${getDaysOverdue(action.dueDate)} jour(s) de retard`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap gap-3">
          <Button
            size="sm"
            onClick={() => navigate('/actions')}
            className="bg-primary-600 hover:bg-primary-700"
          >
            Gérer les actions
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/actions')}
          >
            Nouvelle action
          </Button>
        </div>
      </div>
    </div>
  )
}
