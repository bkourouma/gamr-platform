import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/Toast'
import { useAuth } from '../contexts/AuthContext'
import { tenantsApi, handleApiError } from '../lib/api'
import {
  Building,
  Plus,
  Users,
  Shield,
  MapPin,
  Briefcase,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Settings,
  Activity,
  X
} from 'lucide-react'

interface Tenant {
  id: string
  name: string
  slug: string
  description?: string
  sector?: string
  size?: string
  location?: string
  isActive: boolean
  createdAt: string
  _count: {
    users: number
    riskSheets: number
    evaluations: number
  }
}

export const TenantsManagement: React.FC = () => {
  const { addToast } = useToast()
  const { user } = useAuth()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Données mock supprimées - utilisation uniquement des données réelles de l'API

  useEffect(() => {
    console.log('Utilisateur connecté:', user)
    console.log('Rôle utilisateur:', user?.role)

    if (user?.role !== 'SUPER_ADMIN') {
      console.warn('Utilisateur non autorisé pour la gestion des tenants')
      addToast('Accès refusé. Vous devez être superadmin.', 'error')
      return
    }

    loadTenants()
  }, [user])

  const loadTenants = async (forceReload = false) => {
    try {
      setIsLoading(true)
      console.log(`${forceReload ? 'Rechargement forcé' : 'Chargement'} des tenants depuis l'API...`)

      // Vérifier le token
      const token = localStorage.getItem('gamr_token')
      console.log('Token présent:', !!token)
      if (!token) {
        throw new Error('Aucun token d\'authentification trouvé')
      }

      // Ajouter un timestamp pour éviter le cache
      const response = await tenantsApi.getAll(forceReload ? { _t: Date.now() } : undefined)
      console.log('Tenants chargés:', response)
      console.log('Nombre de tenants reçus:', Array.isArray(response?.data) ? response.data.length : Array.isArray(response) ? response.length : 0)

      // Vérifier si la réponse a la structure attendue
      if (response && Array.isArray(response.data)) {
        setTenants(response.data)
        console.log('Tenants définis dans l\'état:', response.data)
        console.log('IDs des tenants:', response.data.map(t => ({ id: t.id, name: t.name })))
      } else if (Array.isArray(response)) {
        // Si la réponse est directement un tableau
        setTenants(response)
        console.log('Tenants définis dans l\'état (format direct):', response)
        console.log('IDs des tenants:', response.map(t => ({ id: t.id, name: t.name })))
      } else {
        console.warn('Format de réponse inattendu:', response)
        setTenants([])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tenants:', error)
      console.error('Détails de l\'erreur:', error.response?.data || error.message)

      // Afficher un message d'erreur spécifique selon le type d'erreur
      if (error.response?.status === 403) {
        addToast('Accès refusé. Vous devez être superadmin pour gérer les tenants.', 'error')
      } else if (error.response?.status === 401) {
        addToast('Session expirée. Veuillez vous reconnecter.', 'error')
      } else {
        addToast('Erreur lors du chargement des tenants. Vérifiez votre connexion.', 'error')
      }

      // Ne pas utiliser les données mock en production, laisser la liste vide
      setTenants([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSector = !sectorFilter || tenant.sector === sectorFilter
    
    return matchesSearch && matchesSector
  })

  const getSectorIcon = (sector?: string) => {
    switch (sector) {
      case 'Technologie': return '💻'
      case 'Santé': return '🏥'
      case 'Finance': return '🏦'
      case 'Industrie': return '🏭'
      case 'Commerce': return '🛍️'
      default: return '🏢'
    }
  }

  const getSizeColor = (size?: string) => {
    switch (size) {
      case 'TPE': return 'bg-gray-100 text-gray-700'
      case 'PME': return 'bg-primary-100 text-primary-700'
      case 'ETI': return 'bg-accent-100 text-accent-700'
      case 'GE': return 'bg-warning-100 text-warning-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const handleToggleStatus = async (tenantId: string) => {
    try {
      console.log('Tentative de basculement du statut pour le tenant:', tenantId)
      const updatedTenant = await tenantsApi.toggleStatus(tenantId)
      console.log('Réponse de l\'API:', updatedTenant)

      setTenants(prev => prev.map(tenant =>
        tenant.id === tenantId
          ? { ...tenant, isActive: !tenant.isActive }
          : tenant
      ))
      addToast('Statut du tenant mis à jour avec succès', 'success')
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      console.error('Détails de l\'erreur:', error.response?.data || error.message)
      addToast(handleApiError(error), 'error')
    }
  }

  const handleDeleteTenant = async (tenantId: string) => {
    // Trouver le tenant à supprimer pour afficher son nom
    const tenantToDelete = tenants.find(t => t.id === tenantId)
    const tenantName = tenantToDelete?.name || 'ce tenant'

    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${tenantName}" ? Cette action est irréversible.`)) {
      return
    }

    try {
      console.log('Tentative de suppression du tenant:', tenantId, tenantName)

      // Appel API pour supprimer le tenant
      await tenantsApi.delete(tenantId)
      console.log('✅ Tenant supprimé avec succès côté serveur')

      // Mettre à jour l'état local seulement si la suppression a réussi
      setTenants(prev => prev.filter(tenant => tenant.id !== tenantId))
      addToast(`Tenant "${tenantName}" supprimé avec succès`, 'success')

    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression du tenant:', error)
      console.error('Détails de l\'erreur:', error.response?.data || error.message)

      // Gestion spécifique des erreurs
      let errorMessage = 'Erreur lors de la suppression du tenant'

      if (error.response?.status === 400) {
        const serverError = error.response.data?.error
        if (serverError?.includes('contient des données')) {
          errorMessage = `Impossible de supprimer "${tenantName}" car il contient des utilisateurs ou des données. Supprimez d'abord tous les utilisateurs et données associés.`
        } else {
          errorMessage = serverError || errorMessage
        }
      } else if (error.response?.status === 403) {
        errorMessage = 'Accès refusé. Vous devez être superadmin pour supprimer des tenants.'
      } else if (error.response?.status === 404) {
        errorMessage = `Le tenant "${tenantName}" n'existe plus.`
        // Si le tenant n'existe plus côté serveur, on peut le supprimer de l'état local
        setTenants(prev => prev.filter(tenant => tenant.id !== tenantId))
      } else {
        errorMessage = handleApiError(error)
      }

      addToast(errorMessage, 'error')
    }
  }

  const handleViewTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setShowDetailsModal(true)
  }

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setShowEditForm(true)
  }

  const handleUpdateTenant = (updatedTenant: Tenant) => {
    setTenants(prev => prev.map(tenant =>
      tenant.id === updatedTenant.id ? updatedTenant : tenant
    ))
    setShowEditForm(false)
    setSelectedTenant(null)
    addToast('Tenant mis à jour avec succès', 'success')
  }

  // Fonction de test pour diagnostiquer l'API
  const testApiConnection = async () => {
    try {
      console.log('Test de connexion API...')

      // Test 1: Vérifier la connexion de base
      const response = await fetch('http://localhost:3002/api/test')
      const testData = await response.json()
      console.log('Test API de base:', testData)

      // Test 2: Vérifier l'authentification
      const token = localStorage.getItem('gamr_token')
      console.log('Token disponible:', !!token)

      if (token) {
        // Test 3: Appel API avec authentification
        const authResponse = await fetch('http://localhost:3002/api/tenants', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        console.log('Statut de la réponse tenants:', authResponse.status)

        if (authResponse.ok) {
          const tenantsData = await authResponse.json()
          console.log('Données tenants reçues:', tenantsData)
          addToast('Test API réussi !', 'success')
        } else {
          const errorData = await authResponse.json()
          console.error('Erreur API tenants:', errorData)
          addToast(`Erreur API: ${errorData.error || 'Erreur inconnue'}`, 'error')
        }
      } else {
        addToast('Aucun token d\'authentification trouvé', 'error')
      }

    } catch (error) {
      console.error('Erreur lors du test API:', error)
      addToast('Erreur de connexion au serveur', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Gestion des Tenants</h1>
            <p className="text-gray-600 mt-2">Administration des organisations</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} variant="glass" className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Gestion des Tenants</h1>
          <p className="text-gray-600 mt-2">Administration des organisations</p>
          {/* Debug info temporaire */}
          <div className="mt-2 text-xs text-gray-500">
            Utilisateur: {user?.email} | Rôle: {user?.role} | Tenants chargés: {tenants.length}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="lg"
            onClick={testApiConnection}
          >
            🔧 Test API
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              console.log('Rechargement forcé des tenants')
              loadTenants(true)
            }}
          >
            🔄 Recharger
          </Button>
          <Button
            variant="gradient"
            size="lg"
            onClick={() => setShowCreateForm(true)}
            className="btn-animated"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouveau Tenant
          </Button>
        </div>
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
                  placeholder="Rechercher un tenant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Tous les secteurs</option>
                <option value="Technologie">Technologie</option>
                <option value="Santé">Santé</option>
                <option value="Finance">Finance</option>
                <option value="Industrie">Industrie</option>
                <option value="Commerce">Commerce</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-primary-100 to-primary-200">
                <Building className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                <p className="text-2xl font-bold text-gray-900">{tenants.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-100 to-green-200">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Actifs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tenants.filter(t => t.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-warning-100 to-warning-200">
                <Users className="w-6 h-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Utilisateurs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tenants.reduce((sum, t) => sum + t._count.users, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-accent-100 to-accent-200">
                <Shield className="w-6 h-6 text-accent-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Risques</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tenants.reduce((sum, t) => sum + t._count.riskSheets, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des tenants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTenants.map((tenant, index) => (
          <Card
            key={tenant.id}
            variant="glass"
            className="group hover:shadow-card-hover transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center text-2xl">
                    {getSectorIcon(tenant.sector)}
                  </div>
                  <div>
                    <CardTitle size="lg">{tenant.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{tenant.description}</p>
                  </div>
                </div>
                <div className="relative">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Informations du tenant */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Secteur:</span>
                  </div>
                  <span className="font-medium">{tenant.sector || 'Non défini'}</span>

                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Localisation:</span>
                  </div>
                  <span className="font-medium">{tenant.location || 'Non définie'}</span>
                </div>

                {/* Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {tenant.size && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSizeColor(tenant.size)}`}>
                        {tenant.size}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tenant.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {tenant.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Users className="w-4 h-4 text-primary-600" />
                      <span className="text-lg font-bold text-gray-900">{tenant._count.users}</span>
                    </div>
                    <p className="text-xs text-gray-600">Utilisateurs</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Shield className="w-4 h-4 text-accent-600" />
                      <span className="text-lg font-bold text-gray-900">{tenant._count.riskSheets}</span>
                    </div>
                    <p className="text-xs text-gray-600">Risques</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Activity className="w-4 h-4 text-warning-600" />
                      <span className="text-lg font-bold text-gray-900">{tenant._count.evaluations}</span>
                    </div>
                    <p className="text-xs text-gray-600">Évaluations</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewTenant(tenant)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Voir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditTenant(tenant)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Éditer
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant={tenant.isActive ? "outline" : "primary"}
                      onClick={() => {
                        console.log('Clic sur bouton toggle pour tenant:', tenant)
                        handleToggleStatus(tenant.id)
                      }}
                    >
                      {tenant.isActive ? 'Désactiver' : 'Activer'}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        console.log('Clic sur bouton supprimer pour tenant:', tenant)
                        handleDeleteTenant(tenant.id)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTenants.length === 0 && (
        <Card variant="glass">
          <CardContent className="p-12 text-center">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun tenant trouvé</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || sectorFilter
                ? 'Aucun tenant ne correspond à vos critères de recherche.'
                : 'Commencez par créer votre premier tenant.'
              }
            </p>
            {!searchTerm && !sectorFilter && (
              <Button
                variant="gradient"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer un tenant
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Formulaire de création (modal) */}
      {showCreateForm && (
        <CreateTenantModal
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSuccess={(newTenant) => {
            setTenants(prev => [...prev, newTenant])
            setShowCreateForm(false)
            addToast('Tenant créé avec succès', 'success')
          }}
        />
      )}

      {/* Modal de détails */}
      {showDetailsModal && selectedTenant && (
        <TenantDetailsModal
          tenant={selectedTenant}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedTenant(null)
          }}
        />
      )}

      {/* Formulaire d'édition (modal) */}
      {showEditForm && selectedTenant && (
        <EditTenantModal
          tenant={selectedTenant}
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false)
            setSelectedTenant(null)
          }}
          onSuccess={handleUpdateTenant}
        />
      )}
    </div>
  )
}

// Composant modal pour la création de tenant
interface CreateTenantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (tenant: Tenant) => void
}

const CreateTenantModal: React.FC<CreateTenantModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { addToast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    sector: '',
    size: '',
    location: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire'
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Le slug est obligatoire'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const newTenant = await tenantsApi.create(formData)
      onSuccess(newTenant)
    } catch (error) {
      console.error('Erreur lors de la création du tenant:', error)
      addToast(handleApiError(error), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gradient">Créer un nouveau tenant</h2>
          <p className="text-gray-600 mt-2">Ajoutez une nouvelle organisation à la plateforme</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'organisation *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: TechCorp Solutions"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug (identifiant unique) *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="Ex: techcorp-solutions"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.slug ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.slug && <p className="text-red-600 text-sm mt-1">{errors.slug}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description de l'organisation..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secteur d'activité
              </label>
              <select
                value={formData.sector}
                onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Sélectionner un secteur</option>
                <option value="Technologie">Technologie</option>
                <option value="Santé">Santé</option>
                <option value="Finance">Finance</option>
                <option value="Industrie">Industrie</option>
                <option value="Commerce">Commerce</option>
                <option value="Éducation">Éducation</option>
                <option value="Transport">Transport</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taille de l'entreprise
              </label>
              <select
                value={formData.size}
                onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Sélectionner une taille</option>
                <option value="TPE">TPE (1-9 employés)</option>
                <option value="PME">PME (10-249 employés)</option>
                <option value="ETI">ETI (250-4999 employés)</option>
                <option value="GE">GE (5000+ employés)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localisation
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ex: Paris, France"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Création...' : 'Créer le tenant'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Composant modal pour voir les détails d'un tenant
interface TenantDetailsModalProps {
  tenant: Tenant
  isOpen: boolean
  onClose: () => void
}

const TenantDetailsModal: React.FC<TenantDetailsModalProps> = ({
  tenant,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null

  const getSectorIcon = (sector?: string) => {
    switch (sector) {
      case 'Technologie': return '💻'
      case 'Santé': return '🏥'
      case 'Finance': return '🏦'
      case 'Industrie': return '🏭'
      case 'Commerce': return '🛍️'
      default: return '🏢'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center text-2xl">
                {getSectorIcon(tenant.sector)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gradient">{tenant.name}</h2>
                <p className="text-gray-600">{tenant.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Informations générales */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <p className="mt-1 text-sm text-gray-900">{tenant.slug}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Secteur</label>
                <p className="mt-1 text-sm text-gray-900">{tenant.sector || 'Non défini'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Taille</label>
                <p className="mt-1 text-sm text-gray-900">{tenant.size || 'Non définie'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Localisation</label>
                <p className="mt-1 text-sm text-gray-900">{tenant.location || 'Non définie'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Statut</label>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  tenant.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {tenant.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date de création</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(tenant.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-primary-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-primary-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                    <p className="text-2xl font-bold text-gray-900">{tenant._count.users}</p>
                  </div>
                </div>
              </div>
              <div className="bg-accent-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Shield className="w-8 h-8 text-accent-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Fiches de risques</p>
                    <p className="text-2xl font-bold text-gray-900">{tenant._count.riskSheets}</p>
                  </div>
                </div>
              </div>
              <div className="bg-warning-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Activity className="w-8 h-8 text-warning-600" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Évaluations</p>
                    <p className="text-2xl font-bold text-gray-900">{tenant._count.evaluations}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant modal pour éditer un tenant
interface EditTenantModalProps {
  tenant: Tenant
  isOpen: boolean
  onClose: () => void
  onSuccess: (tenant: Tenant) => void
}

const EditTenantModal: React.FC<EditTenantModalProps> = ({
  tenant,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { addToast } = useToast()
  const [formData, setFormData] = useState({
    name: tenant.name,
    description: tenant.description || '',
    sector: tenant.sector || '',
    size: tenant.size || '',
    location: tenant.location || ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const updatedTenant = await tenantsApi.update(tenant.id, formData)
      onSuccess(updatedTenant)
    } catch (error) {
      console.error('Erreur lors de la mise à jour du tenant:', error)
      addToast(handleApiError(error), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gradient">Modifier le tenant</h2>
          <p className="text-gray-600 mt-2">Modifiez les informations de l'organisation</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l'organisation *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: TechCorp Solutions"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description de l'organisation..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secteur d'activité
              </label>
              <select
                value={formData.sector}
                onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Sélectionner un secteur</option>
                <option value="Technologie">Technologie</option>
                <option value="Santé">Santé</option>
                <option value="Finance">Finance</option>
                <option value="Industrie">Industrie</option>
                <option value="Commerce">Commerce</option>
                <option value="Éducation">Éducation</option>
                <option value="Transport">Transport</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taille de l'entreprise
              </label>
              <select
                value={formData.size}
                onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Sélectionner une taille</option>
                <option value="TPE">TPE (1-9 employés)</option>
                <option value="PME">PME (10-249 employés)</option>
                <option value="ETI">ETI (250-4999 employés)</option>
                <option value="GE">GE (5000+ employés)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localisation
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ex: Paris, France"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
