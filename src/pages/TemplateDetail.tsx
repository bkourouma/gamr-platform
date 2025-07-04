import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  Copy, 
  Settings, 
  FileText, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building,
  Users,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { QuestionnaireBuilder } from '../components/QuestionnaireBuilder'
import { useToast, createSuccessToast, createErrorToast } from '../components/Toast'
import { templatesApi, handleApiError, type EvaluationTemplate } from '../lib/api'

export const TemplateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()
  
  const [template, setTemplate] = useState<EvaluationTemplate | null>(null)
  const [loading, setLoading] = useState(true)

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
    } catch (error) {
      console.error('Erreur lors du chargement du template:', error)
      addToast(createErrorToast('Erreur lors du chargement du modèle'))
      navigate('/templates')
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = async () => {
    if (!template) return

    try {
      const duplicatedTemplate = await templatesApi.create({
        name: `${template.name} (Copie)`,
        description: template.description,
        version: '1.0'
      })
      
      addToast(createSuccessToast('Modèle dupliqué avec succès'))
      navigate(`/templates/${duplicatedTemplate.id}/edit`)
    } catch (error) {
      console.error('Erreur lors de la duplication:', error)
      addToast(createErrorToast('Erreur lors de la duplication du modèle'))
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
          {template.description && (
            <p className="text-gray-600 mt-1">{template.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleDuplicate}
            variant="outline"
          >
            <Copy className="w-4 h-4 mr-2" />
            Dupliquer
          </Button>
          <Button
            onClick={() => navigate(`/templates/${template.id}/edit`)}
            className="bg-gradient-to-r from-primary-600 to-primary-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      {/* Informations générales */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Statut</p>
              <div className="flex items-center gap-2">
                {template.isActive ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
                <span className={template.isActive ? 'text-green-700' : 'text-gray-500'}>
                  {template.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Version</p>
              <p className="text-gray-900">{template.version}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Créé le</p>
              <div className="flex items-center gap-1 text-gray-900">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(template.createdAt)}</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Modifié le</p>
              <div className="flex items-center gap-1 text-gray-900">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(template.updatedAt)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Groupes</p>
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

        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Évaluations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(template as any)._count?.evaluations || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Structure du questionnaire */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Structure du questionnaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          {template.questionGroups && template.questionGroups.length > 0 ? (
            <QuestionnaireBuilder
              templateId={template.id}
              questionGroups={template.questionGroups}
              onSave={async () => {}} // Pas de sauvegarde en mode lecture
              readOnly={true}
            />
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun questionnaire configuré
              </h3>
              <p className="text-gray-600 mb-6">
                Ce modèle n'a pas encore de questionnaire configuré.
              </p>
              <Button
                onClick={() => navigate(`/templates/${template.id}/edit`)}
                className="bg-gradient-to-r from-primary-600 to-primary-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Configurer le questionnaire
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
