import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  Shield,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Sparkles,
  TrendingUp,
  FileText,
  LogOut,
  User,
  Users,
  Building,
  Crown,
  ChevronDown,
  Layers,
  ClipboardList,
  BarChart3,
  FileSearch,
  AlertTriangle,
  CheckCircle,
  Target,
  MessageSquare,
  Bot,
  Zap
} from 'lucide-react'
import { Button } from './ui/Button'
import { NotificationPanel } from './NotificationPanel'
import { useNotifications } from '../hooks/useNotifications'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const { unreadCount } = useNotifications()

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Calculate dropdown position when opening
  const handleUserMenuToggle = () => {
    if (!userMenuOpen && userMenuRef.current) {
      const rect = userMenuRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      })
    }
    setUserMenuOpen(!userMenuOpen)
  }

  const handleLogout = () => {
    setUserMenuOpen(false)
    logout()
    navigate('/login')
  }

  const getRoleColor = (role: string) => {
    const colors = {
      SUPER_ADMIN: 'from-purple-500 to-purple-600',
      ADMIN: 'from-blue-500 to-blue-600',
      AI_ANALYST: 'from-green-500 to-green-600',
      EVALUATOR: 'from-orange-500 to-orange-600',
      READER: 'from-gray-500 to-gray-600'
    }
    return colors[role as keyof typeof colors] || 'from-gray-500 to-gray-600'
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return Crown
      case 'ADMIN': return Shield
      case 'AI_ANALYST': return Sparkles
      case 'EVALUATOR': return FileText
      case 'READER': return User
      default: return User
    }
  }

  // Navigation principale - Workflow GAMR dans l'ordre logique
  const mainWorkflowNavigation = [
    {
      name: 'Tableau de bord',
      href: '/',
      icon: LayoutDashboard,
      gradient: 'from-primary-500 to-primary-600',
      description: 'Vue d\'ensemble des évaluations et risques'
    },
    {
      name: 'Assistant IA',
      href: '/chat',
      icon: MessageSquare,
      gradient: 'from-emerald-500 to-emerald-600',
      description: 'Chat intelligent avec vos données GAMR',
      isAI: true
    },
    {
      name: 'Modèles d\'Évaluations',
      href: '/templates',
      icon: Layers,
      gradient: 'from-purple-500 to-purple-600',
      description: 'Modèles GAMR standardisés'
    },
    {
      name: 'Évaluations de Sécurité',
      href: '/evaluations',
      icon: FileSearch,
      gradient: 'from-blue-500 to-blue-600',
      description: 'Étape 1: Identifier les cibles et menaces',
      badge: '1'
    },
    {
      name: 'Fiches de Risques',
      href: '/risks',
      icon: AlertTriangle,
      gradient: 'from-orange-500 to-orange-600',
      description: 'Étape 2: Analyser et classifier les risques',
      badge: '2'
    },
    {
      name: 'Actions Correctives',
      href: '/actions',
      icon: Target,
      gradient: 'from-green-500 to-green-600',
      description: 'Étape 3: Traiter et mitiger les risques',
      badge: '3'
    },
    {
      name: 'Rapports & Analyses',
      href: '/reports',
      icon: BarChart3,
      gradient: 'from-indigo-500 to-indigo-600',
      description: 'Synthèse et indicateurs de performance'
    }
  ]

  // Navigation spécifique aux super admins
  const superAdminNavigation = [
    {
      name: 'Gestion des Tenants',
      href: '/tenants',
      icon: Building,
      gradient: 'from-red-500 to-red-600',
      description: 'Administration des organisations'
    }
  ]

  // Navigation pour les admins et super admins
  const adminNavigation = [
    {
      name: 'Gestion des Utilisateurs',
      href: '/users',
      icon: Users,
      gradient: 'from-cyan-500 to-cyan-600',
      description: 'Administration des comptes utilisateurs'
    }
  ]

  // Navigation commune
  const systemNavigation = [
    {
      name: 'Paramètres',
      href: '/settings',
      icon: Settings,
      gradient: 'from-gray-500 to-gray-600',
      description: 'Configuration système'
    }
  ]

  // Construire la navigation finale selon le rôle
  const allNavigation = [
    ...mainWorkflowNavigation,
    ...(user?.role === 'SUPER_ADMIN' ? superAdminNavigation : []),
    ...((user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') ? adminNavigation : []),
    ...systemNavigation
  ]

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75 animate-fade-in"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full glass border-r border-white/20 shadow-xl">
          {/* Logo section */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Shield className="w-8 h-8 text-primary-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-accent-400 to-accent-500 rounded-full animate-pulse-soft"></div>
              </div>
              <div>
                <span className="text-xl font-bold text-gradient">GAMR</span>
                <div className="flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-accent-500" />
                  <span className="text-xs text-gray-500 font-medium">Intelligence</span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Workflow indicator */}
          <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-primary-50/50 to-accent-50/50">
            <div className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-1">
              Processus GAMR
            </div>
            <div className="text-xs text-gray-600">
              Méthodologie d'Analyse des Menaces et Risques
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {allNavigation.map((item, index) => {
              const isActive = location.pathname === item.href
              const isWorkflowStep = item.badge !== undefined
              const isAI = item.isAI === true
              
              return (
                <div key={item.name} className="relative">
                  <Link
                    to={item.href}
                    className={`
                      group flex items-start px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ease-out
                      ${isActive
                        ? 'bg-gradient-to-r from-primary-50 to-accent-50 text-primary-900 shadow-soft border border-primary-100'
                        : 'text-gray-600 hover:bg-white/60 hover:text-gray-900 hover:shadow-card'
                      }
                      ${isAI ? 'relative overflow-hidden' : ''}
                      animate-slide-up
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {/* AI Glow Effect */}
                    {isAI && (
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 animate-pulse-soft"></div>
                    )}
                    
                    <div className="flex items-start space-x-3 w-full relative z-10">
                      <div className={`
                        relative p-2 rounded-lg flex-shrink-0 transition-all duration-200
                        ${isActive
                          ? `bg-gradient-to-r ${item.gradient} shadow-glow`
                          : 'bg-gray-100 group-hover:bg-white group-hover:shadow-card'
                        }
                        ${isAI && !isActive ? 'bg-gradient-to-r from-emerald-100 to-blue-100' : ''}
                      `}>
                        <item.icon
                          className={`h-4 w-4 ${
                            isActive ? 'text-white' : 
                            isAI ? 'text-emerald-600' : 'text-gray-500 group-hover:text-gray-700'
                          }`}
                        />
                        {isActive && (
                          <div className="absolute inset-0 bg-white/20 rounded-lg animate-pulse-soft"></div>
                        )}
                        {isAI && !isActive && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                        )}
                        {isWorkflowStep && (
                          <div className={`
                            absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                            ${isActive ? 'bg-white text-primary-600' : 'bg-primary-600 text-white'}
                          `}>
                            {item.badge}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium flex items-center gap-2">
                            {item.name}
                            {isAI && (
                              <div className="flex items-center gap-1">
                                <Bot className="w-3 h-3 text-emerald-500" />
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                  IA
                                </span>
                              </div>
                            )}
                          </span>
                          {isActive && (
                            <div className="w-2 h-2 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full animate-bounce-gentle"></div>
                          )}
                        </div>
                        {item.description && (
                          <p className={`text-xs mt-1 leading-relaxed ${
                            isActive ? 'text-primary-600' : 
                            isAI ? 'text-emerald-600' : 'text-gray-500'
                          }`}>
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                  
                  {/* Workflow connector line */}
                  {isWorkflowStep && index < mainWorkflowNavigation.length - 1 && (
                    <div className="absolute left-8 top-full w-0.5 h-4 bg-gradient-to-b from-primary-300 to-transparent"></div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Bottom section */}
          <div className="p-4 border-t border-white/10">
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4 border border-emerald-100">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Zap className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Assistant IA</p>
                  <p className="text-xs text-emerald-600">Prêt à vous aider</p>
                </div>
                <div className="status-indicator bg-emerald-500">
                  <div className="status-indicator bg-emerald-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden relative" style={{ zIndex: 1 }}>
        {/* Top navigation */}
        <header className="glass border-b border-white/20 shadow-soft backdrop-blur-xl relative" style={{ zIndex: 1000 }}>
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                className="md:hidden btn-animated glass"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher des évaluations, risques, actions..."
                  className="
                    block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl leading-5
                    bg-white/60 backdrop-blur-sm placeholder-gray-500
                    focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                    focus:bg-white focus:shadow-glow
                    transition-all duration-200 sm:text-sm
                    hover:bg-white/80 hover:shadow-card
                  "
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-500/10 to-accent-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* AI Quick Access */}
              {location.pathname !== '/chat' && (
                <Link to="/chat">
                  <Button
                    variant="outline"
                    size="sm"
                    className="btn-animated glass bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200 hover:from-emerald-100 hover:to-blue-100 group"
                  >
                    <MessageSquare className="h-4 w-4 text-emerald-600 group-hover:text-emerald-700" />
                    <span className="hidden sm:inline ml-2 text-emerald-700 font-medium">Assistant IA</span>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                  </Button>
                </Link>
              )}

              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-animated glass relative"
                  onClick={() => setNotificationPanelOpen(true)}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-danger-400 to-danger-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                      <div className="absolute inset-0 bg-danger-400 rounded-full animate-ping"></div>
                    </div>
                  )}
                </Button>
              </div>

              {/* User profile */}
              <div className="relative" ref={userMenuRef} style={{ zIndex: 10000 }}>
                <button
                  onClick={handleUserMenuToggle}
                  className="flex items-center space-x-3 p-2 rounded-xl glass hover:bg-white/60 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex-shrink-0 relative">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-r ${getRoleColor(user?.role || '')} flex items-center justify-center shadow-glow group-hover:shadow-glow-accent transition-all duration-200`}>
                      <span className="text-sm font-bold text-white">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success-500 rounded-full border-2 border-white">
                      <div className="w-full h-full bg-success-500 rounded-full animate-pulse-soft"></div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center space-x-1">
                      <span className="text-success-600 font-medium">En ligne</span>
                      <span>•</span>
                      <span>{user?.role}</span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User dropdown menu */}
                {userMenuOpen && createPortal(
                  <div
                    className="fixed w-80 bg-white rounded-xl shadow-2xl border border-gray-200 animate-fade-in"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      right: `${dropdownPosition.right}px`,
                      zIndex: 999999
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-r ${getRoleColor(user?.role || '')} flex items-center justify-center shadow-glow`}>
                          <span className="text-lg font-bold text-white">
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-gray-900">
                            {user?.firstName} {user?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{user?.email}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            {React.createElement(getRoleIcon(user?.role || ''), { className: "w-3 h-3 text-gray-400" })}
                            <span className="text-xs text-gray-600">{user?.role}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                        <Building className="w-4 h-4 text-gray-500" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{user?.tenant?.name}</div>
                          <div className="text-xs text-gray-500">{user?.tenant?.industry} • {user?.tenant?.country}</div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-red-50 transition-colors group"
                        type="button"
                      >
                        <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
                        <span className="text-sm text-gray-700 group-hover:text-red-600">Se déconnecter</span>
                      </button>
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="animate-fade-in">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={notificationPanelOpen}
        onClose={() => setNotificationPanelOpen(false)}
      />
    </div>
  )
}