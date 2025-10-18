import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ActionsDashboard } from '../components/ActionsDashboard'
import { ReportsDashboard } from '../components/ReportsDashboard'
import {
  TrendingUp,
  AlertTriangle,
  Shield,
  Plus,
  BarChart3,
  Sparkles,
  Activity,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { riskSheetsApi } from '../lib/api'

export const Dashboard: React.FC = () => {
  const [averageRiskScore, setAverageRiskScore] = useState<number>(0)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const s = await riskSheetsApi.getStats()
        setAverageRiskScore(s.averageRiskScore || 0)
      } catch (e) {
        // ignore dashboard average errors for now
      }
    }
    loadStats()
  }, [])

  const stats = [
    {
      name: 'Indice Global de Sécurité',
      value: `${averageRiskScore}`,
      change: '0',
      changeType: 'neutral',
      icon: Shield,
      gradient: 'from-success-500 to-success-600',
      bgGradient: 'from-success-50 to-success-100',
      description: 'Moyenne des notes de risque (1–60)'
    },
    {
      name: 'Risques actifs',
      value: '24',
      change: '+2',
      changeType: 'increase',
      icon: Shield,
      gradient: 'from-primary-500 to-primary-600',
      bgGradient: 'from-primary-50 to-primary-100',
      description: 'Fiches en cours d\'analyse'
    },
    {
      name: 'Risques critiques',
      value: '3',
      change: '-1',
      changeType: 'decrease',
      icon: AlertTriangle,
      gradient: 'from-danger-500 to-danger-600',
      bgGradient: 'from-danger-50 to-danger-100',
      description: 'Nécessitent une action immédiate'
    },
    {
      name: 'Actions en cours',
      value: '12',
      change: '+4',
      changeType: 'increase',
      icon: Activity,
      gradient: 'from-warning-500 to-warning-600',
      bgGradient: 'from-warning-50 to-warning-100',
      description: 'Mesures correctives actives'
    }
  ]

  const recentRisks = [
    {
      id: 1,
      target: 'Serveurs de production',
      scenario: 'Cyberattaque par ransomware sur l\'infrastructure critique',
      priority: 'CRITICAL',
      score: 85,
      createdAt: '2024-01-15',
      author: 'Marie Dubois',
      category: 'Cybersécurité'
    },
    {
      id: 2,
      target: 'Données clients',
      scenario: 'Fuite de données personnelles via une vulnérabilité applicative',
      priority: 'HIGH',
      score: 72,
      createdAt: '2024-01-14',
      author: 'Jean Martin',
      category: 'Protection des données'
    },
    {
      id: 3,
      target: 'Chaîne d\'approvisionnement',
      scenario: 'Rupture d\'approvisionnement du fournisseur principal',
      priority: 'MEDIUM',
      score: 45,
      createdAt: '2024-01-13',
      author: 'Sophie Laurent',
      category: 'Opérationnel'
    }
  ]

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return {
          color: 'text-danger-700 bg-gradient-to-r from-danger-100 to-danger-200 border-danger-300',
          icon: AlertTriangle,
          gradient: 'from-danger-500 to-danger-600'
        }
      case 'HIGH':
        return {
          color: 'text-warning-700 bg-gradient-to-r from-warning-100 to-warning-200 border-warning-300',
          icon: TrendingUp,
          gradient: 'from-warning-500 to-warning-600'
        }
      case 'MEDIUM':
        return {
          color: 'text-primary-700 bg-gradient-to-r from-primary-100 to-primary-200 border-primary-300',
          icon: Shield,
          gradient: 'from-primary-500 to-primary-600'
        }
      default:
        return {
          color: 'text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300',
          icon: Minus,
          gradient: 'from-gray-500 to-gray-600'
        }
    }
  }

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase': return ArrowUpRight
      case 'decrease': return ArrowDownRight
      default: return Minus
    }
  }

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase': return 'text-success-600 bg-success-100'
      case 'decrease': return 'text-danger-600 bg-danger-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gradient">Tableau de bord</h1>
            <div className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-accent-100 to-accent-200 rounded-full">
              <Sparkles className="w-4 h-4 text-accent-600" />
              <span className="text-sm font-medium text-accent-700">IA Active</span>
            </div>
          </div>
          <p className="text-gray-600 text-lg">Vue d'ensemble intelligente de votre gestion des risques</p>
        </div>
        <Link to="/risks/new">
          <Button variant="gradient" size="lg" className="btn-animated">
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle fiche de risque
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const ChangeIcon = getChangeIcon(stat.changeType)
          const isSecurityIndex = index === 0 // First stat is the security index
          
          return (
            <Card
              key={stat.name}
              variant="glass"
              className={`group animate-slide-up ${isSecurityIndex ? 'security-panel-flashy security-panel-border relative z-10' : ''}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className={`p-6 ${isSecurityIndex ? 'security-shimmer' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.bgGradient} ${isSecurityIndex ? 'security-panel-blink' : 'group-hover:shadow-glow'} transition-all duration-300`}>
                        <stat.icon className={`h-6 w-6 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent ${isSecurityIndex ? 'security-icon-spin' : ''}`} />
                      </div>
                      {stat.change !== '0' && (
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${getChangeColor(stat.changeType)}`}>
                          <ChangeIcon className="w-3 h-3" />
                          <span>{stat.change}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h3 className={`text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors ${isSecurityIndex ? 'security-panel-blink text-gradient font-bold' : ''}`}>
                        {stat.name}
                      </h3>
                      <div className={`text-3xl font-bold text-gray-900 group-hover:text-gradient transition-all duration-300 ${isSecurityIndex ? 'security-value-bounce text-gradient text-5xl security-number-flashy security-number-bounce security-number-rainbow relative' : ''}`}>
                        {isSecurityIndex ? (
                          <span className="security-number-scale inline-block">
                            {stat.value}
                          </span>
                        ) : (
                          stat.value
                        )}
                        
                        {/* Extra effects for the number */}
                        {isSecurityIndex && (
                          <>
                            <div className="absolute -inset-2 bg-gradient-to-r from-success-400/20 via-accent-400/20 to-primary-400/20 rounded-lg animate-pulse-soft blur-sm"></div>
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-success-400 to-accent-400 rounded-full animate-ping"></div>
                          </>
                        )}
                      </div>
                      <p className={`text-xs leading-relaxed ${isSecurityIndex ? 'text-success-700 font-semibold security-panel-blink' : 'text-gray-500'}`}>
                        {stat.description}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Extra flashy elements for security index */}
                {isSecurityIndex && (
                  <>
                    <div className="absolute top-2 right-2 w-3 h-3 bg-gradient-to-r from-success-400 to-success-600 rounded-full animate-ping"></div>
                    <div className="absolute bottom-2 left-2 w-2 h-2 bg-gradient-to-r from-accent-400 to-accent-600 rounded-full animate-bounce-gentle"></div>
                    <div className="absolute top-1/2 right-1 w-1 h-8 bg-gradient-to-b from-transparent via-success-400 to-transparent animate-pulse-soft"></div>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Actions Dashboard */}
      <ActionsDashboard />

      {/* Reports Dashboard */}
      <ReportsDashboard />

      {/* Recent Risks and Charts */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Risks */}
        <Card variant="glass" className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader gradient>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle size="lg" gradient>Risques récents</CardTitle>
                <CardDescription>Dernières analyses GAMR créées</CardDescription>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 bg-white/60 rounded-full">
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse-soft"></div>
                <span className="text-sm font-medium text-gray-700">Temps réel</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRisks.map((risk, index) => {
                const priorityConfig = getPriorityConfig(risk.priority)
                const PriorityIcon = priorityConfig.icon

                return (
                  <div
                    key={risk.id}
                    className="group p-5 border border-gray-100 rounded-xl hover:border-primary-200 hover:shadow-card transition-all duration-300 bg-gradient-to-r from-white to-gray-50/50 animate-slide-up"
                    style={{ animationDelay: `${500 + index * 100}ms` }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${priorityConfig.gradient} shadow-soft`}>
                        <PriorityIcon className="w-4 h-4 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                              {risk.target}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                              {risk.scenario}
                            </p>

                            <div className="flex items-center mt-3 space-x-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${priorityConfig.color}`}>
                                {risk.priority}
                              </span>
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <span>Score:</span>
                                <span className="font-semibold text-gray-700">{risk.score}/100</span>
                              </div>
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <span>•</span>
                                <span>{risk.category}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right ml-4">
                            <div className="text-xs text-gray-500">{risk.createdAt}</div>
                            <div className="text-xs text-gray-400 mt-1">par {risk.author}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Analytics Card */}
        <Card variant="gradient" className="animate-slide-up" style={{ animationDelay: '600ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              <span>Analytics IA</span>
            </CardTitle>
            <CardDescription>Insights intelligents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-success-400 to-success-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Tendance</span>
                  </div>
                  <span className="text-sm font-bold text-success-600">↗ +12%</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-warning-400 to-warning-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Prédiction</span>
                  </div>
                  <span className="text-sm font-bold text-warning-600">2 nouveaux</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Efficacité</span>
                  </div>
                  <span className="text-sm font-bold text-primary-600">94%</span>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="h-32 bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl flex items-center justify-center border border-primary-100">
                <div className="text-center">
                  <BarChart3 className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                  <p className="text-sm text-primary-600 font-medium">Graphique interactif</p>
                  <p className="text-xs text-primary-500">Bientôt disponible</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
