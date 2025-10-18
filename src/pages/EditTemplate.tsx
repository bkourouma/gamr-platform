import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Save, 
  Settings, 
  FileText, 
  Eye,
  AlertCircle,
  CheckCircle,
  Building,
  Users
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { QuestionnaireBuilder } from '../components/QuestionnaireBuilder'
import { useToast, createSuccessToast, createErrorToast } from '../components/Toast'
import { templatesApi, handleApiError, type EvaluationTemplate } from '../lib/api'

interface TemplateFormData {
  name: string
  description: string
  version: string
  isActive: boolean
  ouiMeansPositive: boolean
}

export const EditTemplate: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()
  
  const [template, setTemplate] = useState<EvaluationTemplate | null>(null)
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    version: '',
    isActive: true,
    ouiMeansPositive: true
  })
  
  const [activeTab, setActiveTab] = useState<'info' | 'questionnaire'>('info')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (id) {
      loadTemplate()
    }
  }, [id])

  const loadTemplate = async () => {
    try {
      setLoading(true)
      const templateData = await templatesApi.getById(id!)
      setTemplate(templateData)
      setFormData({
        name: templateData.name,
        description: templateData.description || '',
        version: templateData.version,
        isActive: templateData.isActive,
        ouiMeansPositive: templateData.ouiMeansPositive !== false
      })
    } catch (error) {
      console.error('Erreur lors du chargement du template:', error)
      addToast(createErrorToast('Erreur lors du chargement du modèle'))
      navigate('/templates')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du modèle est obligatoire'
    }

    if (!formData.version.trim()) {
      newErrors.version = 'La version est obligatoire'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof TemplateFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Effacer l'erreur si le champ est maintenant valide
    if (errors[field] && typeof value === 'string' && value.trim()) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleSaveInfo = async () => {
    if (!validateForm() || !template) {
      return
    }

    try {
      setSaving(true)
      
      await templatesApi.update(template.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        version: formData.version.trim(),
        isActive: formData.isActive,
        ouiMeansPositive: formData.ouiMeansPositive
      })

      addToast(createSuccessToast('Informations sauvegardées avec succès'))
      loadTemplate() // Recharger pour avoir les données à jour
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      addToast(createErrorToast(handleApiError(error)))
    } finally {
      setSaving(false)
    }
  }

  const handleSaveQuestionnaire = async (questionGroups: any[]) => {
    if (!template) return

    try {
      console.log('Sauvegarde des lignes de défense:', questionGroups)

      await templatesApi.updateQuestionGroups(template.id, questionGroups)

      addToast(createSuccessToast('Questionnaire sauvegardé avec succès'))

      // Recharger le template pour avoir les données à jour
      loadTemplate()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du questionnaire:', error)
      addToast(createErrorToast('Erreur lors de la sauvegarde du questionnaire'))
      throw error
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Modèle non trouvé</h2>
        <p className="text-gray-600 mb-6">Le modèle demandé n'existe pas ou a été supprimé.</p>
        <Button onClick={() => navigate('/templates')}>
          Retour aux modèles
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/templates')}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
            <Badge variant={template.isActive ? 'success' : 'secondary'}>
              {template.isActive ? 'Actif' : 'Inactif'}
            </Badge>
            <Badge variant="outline">Version {template.version}</Badge>
          </div>
          <p className="text-gray-600 mt-1">
            Modifié le {formatDate(template.updatedAt)}
          </p>
        </div>
        <Button
          onClick={() => navigate(`/templates/${template.id}`)}
          variant="outline"
        >
          <Eye className="w-4 h-4 mr-2" />
          Aperçu
        </Button>
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'info'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Informations générales
          </button>
          <button
            onClick={() => setActiveTab('questionnaire')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'questionnaire'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Questionnaire
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'info' ? (
        <div className="space-y-6">
          {/* Informations générales */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Informations du modèle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du modèle *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Version *
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => handleInputChange('version', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.version ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.version && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.version}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Modèle actif
                  </span>
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  Les modèles inactifs ne peuvent pas être utilisés pour créer de nouvelles évaluations
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.ouiMeansPositive}
                    onChange={(e) => handleInputChange('ouiMeansPositive', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Oui = positif (protection/atténuation)
                  </span>
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  Décochez si, pour ce modèle, une réponse "Oui" doit être considérée comme négative (exposition/aggravation).
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveInfo}
                  disabled={saving}
                  className="bg-gradient-to-r from-primary-600 to-primary-700"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="glass">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Lignes de défense</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {template.questionGroups?.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Objectifs</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {template.questionGroups?.reduce((total, group) => 
                        total + (group.objectives?.length || 0), 0) || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Questions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {template.questionGroups?.reduce((total, group) => 
                        total + (group.objectives?.reduce((objTotal, obj) => 
                          objTotal + (obj.questions?.length || 0), 0) || 0), 0) || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <QuestionnaireBuilder
          templateId={template.id}
          questionGroups={template.questionGroups || []}
          onSave={handleSaveQuestionnaire}
        />
      )}
    </div>
  )
}
