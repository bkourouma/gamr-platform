import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { templatesApi, evaluationsApi, handleApiError, type EvaluationTemplate } from '../lib/api'

export const NewEvaluation: React.FC = () => {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [title, setTitle] = useState('')
  const [entityInfo, setEntityInfo] = useState({
    name: '',
    sector: '',
    address: '',
    employeeCount: ''
  })
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await templatesApi.getAll({ isActive: true })
      setTemplates(response.data)
      
      // Sélectionner automatiquement le premier template s'il n'y en a qu'un
      if (response.data.length === 1) {
        setSelectedTemplate(response.data[0].id)
      }
    } catch (err) {
      console.error('Erreur lors du chargement des templates:', err)
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTemplate || !title.trim()) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      setCreating(true)
      setError(null)
      
      const evaluation = await evaluationsApi.create({
        title: title.trim(),
        templateId: selectedTemplate,
        entityInfo: {
          name: entityInfo.name.trim(),
          sector: entityInfo.sector,
          address: entityInfo.address.trim(),
          employeeCount: entityInfo.employeeCount ? parseInt(entityInfo.employeeCount) : undefined
        }
      })

      // Rediriger vers la page de questionnaire
      navigate(`/evaluations/${evaluation.id}/questionnaire`)
    } catch (err) {
      console.error('Erreur lors de la création de l\'évaluation:', err)
      setError(handleApiError(err))
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/evaluations')}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle Évaluation</h1>
          <p className="text-gray-600 mt-2">
            Créez une nouvelle évaluation sécuritaire pour votre organisation
          </p>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Erreur</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sélection du template */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Choisir un template d'évaluation
          </h2>
          
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun template disponible</h3>
              <p className="text-gray-600">
                Contactez votre administrateur pour configurer des templates d'évaluation.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <label
                  key={template.id}
                  className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate === template.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={template.id}
                    checked={selectedTemplate === template.id}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {template.name}
                        </h3>
                        {template.description && (
                          <p className="text-gray-600 mt-1">
                            {template.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Version {template.version}</span>
                          <span>•</span>
                          <span>Créé le {new Date(template.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {selectedTemplate === template.id && (
                    <CheckCircle className="w-5 h-5 text-primary-500" />
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Informations de l'évaluation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Informations de l'évaluation
          </h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Titre de l'évaluation *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Évaluation sécuritaire - Site principal Q1 2024"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="entityName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entité
                </label>
                <input
                  type="text"
                  id="entityName"
                  value={entityInfo.name}
                  onChange={(e) => setEntityInfo({ ...entityInfo, name: e.target.value })}
                  placeholder="Nom de l'organisation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-2">
                  Secteur d'activité
                </label>
                <select
                  id="sector"
                  value={entityInfo.sector}
                  onChange={(e) => setEntityInfo({ ...entityInfo, sector: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Sélectionner un secteur</option>
                  <option value="Technologie et informatique">Technologie et informatique</option>
                  <option value="Santé et pharmaceutique">Santé et pharmaceutique</option>
                  <option value="Finance et banque">Finance et banque</option>
                  <option value="Industrie manufacturière">Industrie manufacturière</option>
                  <option value="Commerce et distribution">Commerce et distribution</option>
                  <option value="Éducation et formation">Éducation et formation</option>
                  <option value="Transport et logistique">Transport et logistique</option>
                  <option value="Énergie et utilities">Énergie et utilities</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse du site
              </label>
              <input
                type="text"
                id="address"
                value={entityInfo.address}
                onChange={(e) => setEntityInfo({ ...entityInfo, address: e.target.value })}
                placeholder="Adresse complète du site à évaluer"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="employeeCount" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre d'employés
              </label>
              <input
                type="number"
                id="employeeCount"
                value={entityInfo.employeeCount}
                onChange={(e) => setEntityInfo({ ...entityInfo, employeeCount: e.target.value })}
                placeholder="Nombre total d'employés sur le site"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/evaluations')}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={creating || !selectedTemplate || !title.trim()}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? 'Création...' : 'Créer l\'évaluation'}
          </button>
        </div>
      </form>
    </div>
  )
}
