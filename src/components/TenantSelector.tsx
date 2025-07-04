import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { 
  Building, 
  Users, 
  Shield, 
  ChevronDown, 
  Check,
  MapPin,
  Briefcase,
  Crown
} from 'lucide-react'

// Mock data pour les tenants (en attendant l'API)
const MOCK_TENANTS = [
  {
    id: 'tenant1',
    name: 'TechCorp Solutions',
    slug: 'techcorp',
    description: 'Entreprise de solutions technologiques',
    sector: 'Technologie',
    size: 'ETI',
    location: 'Paris, France',
    userCount: 4,
    riskCount: 12,
    logo: null
  },
  {
    id: 'tenant2',
    name: 'HealthCare Plus',
    slug: 'healthcare-plus',
    description: 'Centre médical spécialisé',
    sector: 'Santé',
    size: 'PME',
    location: 'Lyon, France',
    userCount: 2,
    riskCount: 8,
    logo: null
  }
]

interface TenantSelectorProps {
  onTenantSelect?: (tenantId: string) => void
  showStats?: boolean
  compact?: boolean
}

export const TenantSelector: React.FC<TenantSelectorProps> = ({
  onTenantSelect,
  showStats = true,
  compact = false
}) => {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState(user?.tenant)

  const handleTenantSelect = (tenant: any) => {
    setSelectedTenant(tenant)
    setIsOpen(false)
    onTenantSelect?.(tenant.id)
  }

  const getSizeColor = (size: string) => {
    switch (size) {
      case 'TPE': return 'bg-gray-100 text-gray-700'
      case 'PME': return 'bg-primary-100 text-primary-700'
      case 'ETI': return 'bg-accent-100 text-accent-700'
      case 'GE': return 'bg-warning-100 text-warning-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getSectorIcon = (sector: string) => {
    switch (sector) {
      case 'Technologie': return '💻'
      case 'Santé': return '🏥'
      case 'Finance': return '🏦'
      case 'Industrie': return '🏭'
      case 'Commerce': return '🛍️'
      default: return '🏢'
    }
  }

  if (compact) {
    return (
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="glass flex items-center space-x-2"
        >
          <Building className="w-4 h-4" />
          <span className="hidden sm:inline">{selectedTenant?.name}</span>
          <ChevronDown className="w-4 h-4" />
        </Button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-80 z-50">
            <Card variant="glass" className="shadow-card-hover">
              <CardContent className="p-4">
                <div className="space-y-2">
                  {MOCK_TENANTS.map((tenant) => (
                    <button
                      key={tenant.id}
                      onClick={() => handleTenantSelect(tenant)}
                      className={`
                        w-full p-3 rounded-xl text-left transition-all duration-200
                        ${selectedTenant?.id === tenant.id 
                          ? 'bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200' 
                          : 'hover:bg-gray-50 border border-transparent'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{getSectorIcon(tenant.sector)}</div>
                          <div>
                            <div className="font-medium text-gray-900">{tenant.name}</div>
                            <div className="text-sm text-gray-500">{tenant.description}</div>
                          </div>
                        </div>
                        {selectedTenant?.id === tenant.id && (
                          <Check className="w-5 h-5 text-primary-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gradient mb-2">
          Sélectionnez votre organisation
        </h2>
        <p className="text-gray-600">
          Choisissez l'organisation pour laquelle vous souhaitez gérer les risques
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOCK_TENANTS.map((tenant, index) => (
          <Card
            key={tenant.id}
            variant="glass"
            className={`
              cursor-pointer transition-all duration-300 animate-slide-up
              ${selectedTenant?.id === tenant.id 
                ? 'ring-2 ring-primary-500 shadow-glow' 
                : 'hover:shadow-card-hover hover:-translate-y-1'
              }
            `}
            style={{ animationDelay: `${index * 200}ms` }}
            onClick={() => handleTenantSelect(tenant)}
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
                {selectedTenant?.id === tenant.id && (
                  <div className="w-6 h-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Informations de base */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Briefcase className="w-4 h-4" />
                    <span>{tenant.sector}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge size="sm" className={getSizeColor(tenant.size)}>
                      {tenant.size}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 col-span-2">
                    <MapPin className="w-4 h-4" />
                    <span>{tenant.location}</span>
                  </div>
                </div>

                {/* Statistiques */}
                {showStats && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{tenant.userCount} utilisateurs</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                        <Shield className="w-4 h-4" />
                        <span>{tenant.riskCount} risques</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Indicateur de sélection */}
                {selectedTenant?.id === tenant.id && (
                  <div className="flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl border border-primary-200">
                    <Crown className="w-4 h-4 text-primary-600" />
                    <span className="text-sm font-medium text-primary-700">
                      Organisation sélectionnée
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTenant && (
        <div className="text-center">
          <Button
            variant="gradient"
            size="lg"
            onClick={() => onTenantSelect?.(selectedTenant.id)}
            className="animate-bounce-gentle"
          >
            Accéder à {selectedTenant.name}
          </Button>
        </div>
      )}
    </div>
  )
}
