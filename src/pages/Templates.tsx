import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  FileText, 
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  MoreVertical,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { ConfirmDialog, useConfirmDialog } from '../components/ConfirmDialog'
import { useToast, createSuccessToast, createErrorToast } from '../components/Toast'
import { templatesApi, handleApiError, type EvaluationTemplate } from '../lib/api'

export const Templates: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { showConfirm } = useConfirmDialog()
  
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    loadTemplates()
  }, [currentPage, searchTerm, filterActive])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await templatesApi.getAll({
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        isActive: filterActive
      })
      
      setTemplates(response.data)
      setTotalPages(response.pagination.totalPages)
      setTotalCount(response.pagination.total)
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error)
      addToast(createErrorToast('Erreur lors du chargement des modèles'))
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (active: boolean | undefined) => {
    setFilterActive(active)
    setCurrentPage(1)
  }

  const handleToggleActive = async (template: EvaluationTemplate) => {
    try {
      await templatesApi.update(template.id, {
        isActive: !template.isActive
      })
      
      addToast(createSuccessToast(
        `Modèle ${template.isActive ? 'désactivé' : 'activé'} avec succès`
      ))
      loadTemplates()
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      addToast(createErrorToast('Erreur lors de la mise à jour du modèle'))
    }
  }

  const handleDuplicate = async (template: EvaluationTemplate) => {
    try {
      const duplicatedTemplate = await templatesApi.create({
        name: `${template.name} (Copie)`,
        description: template.description,
        version: '1.0'
      })
      
      addToast(createSuccessToast('Modèle dupliqué avec succès'))
      loadTemplates()
      navigate(`/templates/${duplicatedTemplate.id}/edit`)
    } catch (error) {
      console.error('Erreur lors de la duplication:', error)
      addToast(createErrorToast('Erreur lors de la duplication du modèle'))
    }
  }

  const handleDelete = async (template: EvaluationTemplate) => {
    const confirmed = await showConfirm({
      title: 'Supprimer le modèle',
      message: `Êtes-vous sûr de vouloir supprimer le modèle "${template.name}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'danger'
    })

    if (confirmed) {
      try {
        await templatesApi.delete(template.id)
        addToast(createSuccessToast('Modèle supprimé avec succès'))
        loadTemplates()
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        addToast(createErrorToast('Erreur lors de la suppression du modèle'))
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modèles d'évaluations</h1>
          <p className="text-gray-600 mt-1">
            Gérez vos modèles de questionnaires d'évaluation sécuritaire
          </p>
        </div>
        <Button
          onClick={() => navigate('/templates/new')}
          className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau modèle
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
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
                <p className="text-sm font-medium text-gray-600">Actifs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {templates.filter(t => t.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactifs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {templates.filter(t => !t.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher un modèle..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterActive === undefined ? 'primary' : 'outline'}
                onClick={() => handleFilterChange(undefined)}
                size="sm"
              >
                Tous
              </Button>
              <Button
                variant={filterActive === true ? 'primary' : 'outline'}
                onClick={() => handleFilterChange(true)}
                size="sm"
              >
                Actifs
              </Button>
              <Button
                variant={filterActive === false ? 'primary' : 'outline'}
                onClick={() => handleFilterChange(false)}
                size="sm"
              >
                Inactifs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des templates */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : templates.length === 0 ? (
        <Card variant="glass">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Aucun résultat' : 'Aucun modèle'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Aucun modèle ne correspond à votre recherche.'
                : 'Commencez par créer votre premier modèle d\'évaluation.'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={() => navigate('/templates/new')}
                className="bg-gradient-to-r from-primary-600 to-primary-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer un modèle
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {templates.map((template) => (
            <Card key={template.id} variant="glass" className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.name}
                      </h3>
                      <Badge variant={template.isActive ? 'success' : 'secondary'}>
                        {template.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    
                    {template.description && (
                      <p className="text-gray-600 mb-4">{template.description}</p>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Créé le {formatDate(template.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Settings className="w-4 h-4" />
                        <span>Version {template.version}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/templates/${template.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/templates/${template.id}/edit`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(template)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(template)}
                    >
                      {template.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Précédent
            </Button>
            <span className="flex items-center px-4 py-2 text-sm text-gray-700">
              Page {currentPage} sur {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog />
    </div>
  )
}
