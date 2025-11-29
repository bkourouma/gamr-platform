import React, { useState, useEffect } from 'react'
import { X, Save, Calendar, User, Target, DollarSign, Clock } from 'lucide-react'
import { Button } from './ui/Button'
import { actionsApi, riskSheetsApi, usersApi, type Action, type RiskSheet, type User as UserType } from '../lib/api'
import { useToast, createSuccessToast, createErrorToast } from './Toast'

interface ActionFormProps {
  action?: Action
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export const ActionForm: React.FC<ActionFormProps> = ({ action, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'MEDIUM',
    assigneeId: '',
    riskSheetId: '',
    successProbability: 80,
    estimatedCost: 0,
    estimatedDuration: 0
  })
  const [riskSheets, setRiskSheets] = useState<RiskSheet[]>([])
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()

  // Charger les données nécessaires
  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  // Initialiser le formulaire avec les données de l'action
  useEffect(() => {
    if (action) {
      setFormData({
        title: action.title,
        description: action.description,
        dueDate: action.dueDate ? new Date(action.dueDate).toISOString().split('T')[0] : '',
        priority: action.priority,
        assigneeId: action.assigneeId || '',
        riskSheetId: action.riskSheetId,
        successProbability: action.successProbability || 80,
        estimatedCost: action.estimatedCost || 0,
        estimatedDuration: action.estimatedDuration || 0
      })
    } else {
      // Réinitialiser pour une nouvelle action
      setFormData({
        title: '',
        description: '',
        dueDate: '',
        priority: 'MEDIUM',
        assigneeId: '',
        riskSheetId: '',
        successProbability: 80,
        estimatedCost: 0,
        estimatedDuration: 0
      })
    }
  }, [action])

  const loadData = async () => {
    try {
      setLoading(true)
      const [riskSheetsResponse, usersResponse] = await Promise.all([
        riskSheetsApi.getAll({ limit: 100 }),
        usersApi.getAll({ limit: 100 })
      ])
      setRiskSheets(riskSheetsResponse.data)
      setUsers(usersResponse.data)
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      addToast(createErrorToast('Erreur lors du chargement des données'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.description || !formData.riskSheetId) {
      addToast(createErrorToast('Veuillez remplir tous les champs obligatoires'))
      return
    }

    try {
      setSaving(true)
      
      const actionData = {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        priority: formData.priority,
        assigneeId: formData.assigneeId || undefined,
        riskSheetId: formData.riskSheetId,
        successProbability: formData.successProbability,
        estimatedCost: formData.estimatedCost,
        estimatedDuration: formData.estimatedDuration
      }

      if (action) {
        await actionsApi.update(action.id, actionData)
        addToast(createSuccessToast('Action mise à jour avec succès'))
      } else {
        await actionsApi.create(actionData)
        addToast(createSuccessToast('Action créée avec succès'))
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      addToast(createErrorToast('Erreur lors de la sauvegarde'))
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {action ? 'Modifier l\'action' : 'Nouvelle action corrective'}
            </h3>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de l'action *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ex: Mise à jour des pare-feu"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Décrivez l'action à réaliser..."
                  required
                />
              </div>

              {/* Fiche de risque */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fiche de risque associée *
                </label>
                <select
                  value={formData.riskSheetId}
                  onChange={(e) => handleChange('riskSheetId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Sélectionner une fiche de risque</option>
                  {riskSheets.map((risk) => (
                    <option key={risk.id} value={risk.id}>
                      {risk.target} (Score: {Math.round(risk.riskScore)}/60)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Priorité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priorité
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="VERY_LOW">Très basse</option>
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="HIGH">Haute</option>
                    <option value="CRITICAL">Critique</option>
                  </select>
                </div>

                {/* Assigné à */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigné à
                  </label>
                  <select
                    value={formData.assigneeId}
                    onChange={(e) => handleChange('assigneeId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Non assigné</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date d'échéance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date d'échéance
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleChange('dueDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Probabilité de succès */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="w-4 h-4 inline mr-1" />
                    Probabilité de succès (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.successProbability}
                    onChange={(e) => handleChange('successProbability', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coût estimé */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Coût estimé (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.estimatedCost}
                    onChange={(e) => handleChange('estimatedCost', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Durée estimée */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Durée estimée (heures)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.estimatedDuration}
                    onChange={(e) => handleChange('estimatedDuration', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {action ? 'Mettre à jour' : 'Créer l\'action'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
