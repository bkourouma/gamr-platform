import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { 
  Settings as SettingsIcon, 
  Brain, 
  User, 
  Shield, 
  Bell,
  Database,
  Palette,
  Globe
} from 'lucide-react'
import { AIConfigPanel } from '../components/AIConfigPanel'
import { useAuth } from '../contexts/AuthContext'

type SettingsTab = 'ai' | 'profile' | 'security' | 'notifications' | 'system' | 'appearance'

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai')
  const { user } = useAuth()

  const tabs = [
    {
      id: 'ai' as SettingsTab,
      name: 'Configuration IA',
      icon: Brain,
      description: 'OpenAI et analyse des risques',
      badge: 'Nouveau'
    },
    {
      id: 'profile' as SettingsTab,
      name: 'Profil',
      icon: User,
      description: 'Informations personnelles'
    },
    {
      id: 'security' as SettingsTab,
      name: 'Sécurité',
      icon: Shield,
      description: 'Mot de passe et authentification'
    },
    {
      id: 'notifications' as SettingsTab,
      name: 'Notifications',
      icon: Bell,
      description: 'Alertes et rappels'
    },
    {
      id: 'system' as SettingsTab,
      name: 'Système',
      icon: Database,
      description: 'Configuration avancée',
      adminOnly: true
    },
    {
      id: 'appearance' as SettingsTab,
      name: 'Apparence',
      icon: Palette,
      description: 'Thème et interface'
    }
  ]

  const filteredTabs = tabs.filter(tab => 
    !tab.adminOnly || (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN')
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ai':
        return <AIConfigPanel />
      
      case 'profile':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Informations du Profil</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={user?.firstName || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={user?.lastName || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rôle
                  </label>
                  <Badge variant="outline">{user?.role}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      
      case 'security':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Sécurité</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Configuration de sécurité à venir</p>
              </div>
            </CardContent>
          </Card>
        )
      
      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Configuration des notifications à venir</p>
              </div>
            </CardContent>
          </Card>
        )
      
      case 'system':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Configuration Système</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Configuration système à venir</p>
              </div>
            </CardContent>
          </Card>
        )
      
      case 'appearance':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Apparence</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Palette className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Configuration de l'apparence à venir</p>
              </div>
            </CardContent>
          </Card>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
            <SettingsIcon className="w-8 h-8 text-primary-600" />
            <span>Paramètres</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Configurez votre expérience GAMR
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {filteredTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full text-left px-4 py-3 flex items-center space-x-3 transition-colors
                      ${activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <tab.icon className="w-5 h-5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{tab.name}</span>
                        {tab.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {tab.badge}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {tab.description}
                      </div>
                    </div>
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
