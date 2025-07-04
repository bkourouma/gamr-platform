import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useToast, createSuccessToast, createErrorToast } from '../components/Toast'
import { useAuth } from '../contexts/AuthContext'
import { usersApi, tenantsApi, handleApiError } from '../lib/api'
import { UserDetailsModal, EditUserModal } from '../components/UserModals'
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  UserX,
  Shield,
  Crown,
  User as UserIcon,
  Mail,
  Calendar,
  X,
  Key
} from 'lucide-react'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'AI_ANALYST' | 'EVALUATOR' | 'READER'
  isActive: boolean
  lastLogin?: string
  createdAt: string
  tenant: {
    id: string
    name: string
    slug: string
  }
}

interface Tenant {
  id: string
  name: string
  slug: string
}

export const UsersManagement: React.FC = () => {
  const { addToast } = useToast()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [tenantFilter, setTenantFilter] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    if (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'ADMIN') {
      addToast(createErrorToast('Accès refusé. Vous devez être admin ou superadmin.'))
      return
    }
    
    loadUsers()
    if (currentUser?.role === 'SUPER_ADMIN') {
      loadTenants()
    }
  }, [currentUser])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const response = await usersApi.getAll()
      setUsers(response.data || response)
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
      addToast(createErrorToast(handleApiError(error)))
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadTenants = async () => {
    try {
      const response = await tenantsApi.getAll()
      setTenants(response.data || response)
    } catch (error) {
      console.error('Erreur lors du chargement des tenants:', error)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = !roleFilter || user.role === roleFilter
    const matchesTenant = !tenantFilter || user.tenant.id === tenantFilter
    
    return matchesSearch && matchesRole && matchesTenant
  })

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return Crown
      case 'ADMIN': return Shield
      case 'AI_ANALYST': return UserCheck
      case 'EVALUATOR': return Edit
      case 'READER': return UserIcon
      default: return UserIcon
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-100 text-red-700'
      case 'ADMIN': return 'bg-purple-100 text-purple-700'
      case 'AI_ANALYST': return 'bg-blue-100 text-blue-700'
      case 'EVALUATOR': return 'bg-green-100 text-green-700'
      case 'READER': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin'
      case 'ADMIN': return 'Administrateur'
      case 'AI_ANALYST': return 'Analyste IA'
      case 'EVALUATOR': return 'Évaluateur'
      case 'READER': return 'Lecteur'
      default: return role
    }
  }

  const handleToggleStatus = async (userId: string) => {
    try {
      await usersApi.toggleStatus(userId)
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, isActive: !user.isActive }
          : user
      ))
      addToast(createSuccessToast('Statut de l\'utilisateur mis à jour avec succès'))
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      addToast(createErrorToast(handleApiError(error)))
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      return
    }

    try {
      await usersApi.delete(userId)
      setUsers(prev => prev.filter(user => user.id !== userId))
      addToast(createSuccessToast('Utilisateur supprimé avec succès'))
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error)
      addToast(createErrorToast(handleApiError(error)))
    }
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setShowDetailsModal(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setShowEditForm(true)
  }

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ))
    setShowEditForm(false)
    setSelectedUser(null)
    addToast(createSuccessToast('Utilisateur mis à jour avec succès'))
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Gestion des Utilisateurs</h1>
            <p className="text-gray-600 mt-2">Administration des comptes utilisateurs</p>
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
          <h1 className="text-3xl font-bold text-gradient">Gestion des Utilisateurs</h1>
          <p className="text-gray-600 mt-2">Administration des comptes utilisateurs</p>
          <div className="mt-2 text-xs text-gray-500">
            Utilisateur: {currentUser?.email} | Rôle: {currentUser?.role} | Utilisateurs chargés: {users.length}
          </div>
        </div>
        <Button
          variant="gradient"
          size="lg"
          onClick={() => setShowCreateForm(true)}
          className="btn-animated"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouvel Utilisateur
        </Button>
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
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Tous les rôles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Administrateur</option>
                <option value="AI_ANALYST">Analyste IA</option>
                <option value="EVALUATOR">Évaluateur</option>
                <option value="READER">Lecteur</option>
              </select>
            </div>
            {currentUser?.role === 'SUPER_ADMIN' && (
              <div className="sm:w-48">
                <select
                  value={tenantFilter}
                  onChange={(e) => setTenantFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Tous les tenants</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-primary-100 to-primary-200">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Utilisateurs</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-100 to-green-200">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Actifs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-100 to-purple-200">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Administrateurs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-100 to-blue-200">
                <Edit className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Évaluateurs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'EVALUATOR' || u.role === 'AI_ANALYST').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des utilisateurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user, index) => {
          const RoleIcon = getRoleIcon(user.role)
          return (
            <Card
              key={user.id}
              variant="glass"
              className="group hover:shadow-card-hover transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                      <RoleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle size="lg">{user.firstName} {user.lastName}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{user.email}</p>
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
                  {/* Informations de l'utilisateur */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Rôle:</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>

                    <div className="flex items-center space-x-2">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Tenant:</span>
                    </div>
                    <span className="font-medium text-sm">{user.tenant.name}</span>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.lastLogin ? (
                        `Dernière connexion: ${new Date(user.lastLogin).toLocaleDateString('fr-FR')}`
                      ) : (
                        'Jamais connecté'
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewUser(user)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Éditer
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant={user.isActive ? "outline" : "primary"}
                        onClick={() => handleToggleStatus(user.id)}
                        disabled={user.id === currentUser?.id}
                      >
                        {user.isActive ? 'Désactiver' : 'Activer'}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.id === currentUser?.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredUsers.length === 0 && (
        <Card variant="glass">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur trouvé</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || roleFilter || tenantFilter
                ? 'Aucun utilisateur ne correspond à vos critères de recherche.'
                : 'Commencez par créer votre premier utilisateur.'
              }
            </p>
            {!searchTerm && !roleFilter && !tenantFilter && (
              <Button
                variant="gradient"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer un utilisateur
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Formulaire de création (modal) */}
      {showCreateForm && (
        <CreateUserModal
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSuccess={(newUser) => {
            setUsers(prev => [...prev, newUser])
            setShowCreateForm(false)
            addToast(createSuccessToast('Utilisateur créé avec succès'))
          }}
          tenants={tenants}
          currentUserRole={currentUser?.role || 'READER'}
        />
      )}

      {/* Modal de détails */}
      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedUser(null)
          }}
        />
      )}

      {/* Formulaire d'édition (modal) */}
      {showEditForm && selectedUser && (
        <EditUserModal
          user={selectedUser}
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false)
            setSelectedUser(null)
          }}
          onSuccess={handleUpdateUser}
          tenants={tenants}
          currentUserRole={currentUser?.role || 'READER'}
        />
      )}
    </div>
  )
}

// Composant modal pour créer un utilisateur
interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: User) => void
  tenants: Tenant[]
  currentUserRole: string
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tenants,
  currentUserRole
}) => {
  const { addToast } = useToast()
  const { user: currentUser } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'READER',
    tenantId: currentUser?.tenant?.id || ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est obligatoire'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide'
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est obligatoire'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est obligatoire'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Le mot de passe est obligatoire'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }

    if (currentUserRole === 'SUPER_ADMIN' && !formData.tenantId) {
      newErrors.tenantId = 'Le tenant est obligatoire'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const newUser = await usersApi.create(formData)
      onSuccess(newUser)
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error)
      addToast(createErrorToast(handleApiError(error)))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gradient">Créer un nouvel utilisateur</h2>
          <p className="text-gray-600 mt-2">Ajoutez un nouveau compte utilisateur</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prénom *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                placeholder="Ex: Jean"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.firstName ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                placeholder="Ex: Dupont"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.lastName ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Ex: jean.dupont@example.com"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Minimum 6 caractères"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.password ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rôle
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="READER">Lecteur</option>
                <option value="EVALUATOR">Évaluateur</option>
                <option value="AI_ANALYST">Analyste IA</option>
                {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'ADMIN') && (
                  <option value="ADMIN">Administrateur</option>
                )}
                {currentUserRole === 'SUPER_ADMIN' && (
                  <option value="SUPER_ADMIN">Super Admin</option>
                )}
              </select>
            </div>

            {currentUserRole === 'SUPER_ADMIN' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenant *
                </label>
                <select
                  value={formData.tenantId}
                  onChange={(e) => setFormData(prev => ({ ...prev, tenantId: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.tenantId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionner un tenant</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                  ))}
                </select>
                {errors.tenantId && <p className="text-red-600 text-sm mt-1">{errors.tenantId}</p>}
              </div>
            )}
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
              {isSubmitting ? 'Création...' : 'Créer l\'utilisateur'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
