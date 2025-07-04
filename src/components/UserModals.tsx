import React, { useState } from 'react'
import { Button } from './ui/Button'
import { useToast, createSuccessToast, createErrorToast } from './Toast'
import { usersApi, handleApiError } from '../lib/api'
import {
  X,
  Mail,
  Calendar,
  Shield,
  UserIcon,
  Crown,
  UserCheck,
  Edit,
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

// Composant modal pour voir les détails d'un utilisateur
interface UserDetailsModalProps {
  user: User
  isOpen: boolean
  onClose: () => void
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null

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

  const RoleIcon = getRoleIcon(user.role)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <RoleIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gradient">{user.firstName} {user.lastName}</h2>
                <p className="text-gray-600">{user.email}</p>
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
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1 flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-900">{user.email}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Rôle</label>
                <div className="mt-1 flex items-center space-x-2">
                  <RoleIcon className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-900">{getRoleLabel(user.role)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Organisation</label>
                <p className="mt-1 text-sm text-gray-900">{user.tenant.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Statut</label>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  user.isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {user.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date de création</label>
                <div className="mt-1 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dernière connexion</label>
                <div className="mt-1 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-900">
                    {user.lastLogin 
                      ? new Date(user.lastLogin).toLocaleDateString('fr-FR')
                      : 'Jamais connecté'
                    }
                  </p>
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

// Composant modal pour éditer un utilisateur
interface EditUserModalProps {
  user: User
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: User) => void
  tenants: Tenant[]
  currentUserRole: string
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
  tenants,
  currentUserRole
}) => {
  const { addToast } = useToast()
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const updatedUser = await usersApi.update(user.id, formData)
      onSuccess(updatedUser)
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error)
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
          <h2 className="text-2xl font-bold text-gradient">Modifier l'utilisateur</h2>
          <p className="text-gray-600 mt-2">Modifiez les informations de l'utilisateur</p>
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rôle
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'SUPER_ADMIN' | 'ADMIN' | 'AI_ANALYST' | 'EVALUATOR' | 'READER' }))}
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
