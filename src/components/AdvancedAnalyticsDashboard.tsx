import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card'
import { Button } from './ui/Button'
import { apiClient } from "../lib/api";
import type {
  AnalyticsDashboardData,
  PredictiveInsight,
  AnomalyData,
  CorrelationInsight,
  EnhancedAnalyticsData
} from "../types/analytics"
import { TrendChart } from './analytics/TrendChart'
import { RiskDistributionChart } from './analytics/RiskDistributionChart'
import { SectorAnalyticsChart } from './analytics/SectorAnalyticsChart'
import { CorrelationInsights } from './analytics/CorrelationInsights'
import { AnalyticsHeatmap } from './analytics/AnalyticsHeatmap'
import { PredictiveInsightsChart } from './analytics/PredictiveInsightsChart'
import { AnomalyDetectionPanel } from './analytics/AnomalyDetectionPanel'
import { CorrelationMatrix } from './analytics/CorrelationMatrix'
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Filter,
  Download,
  RefreshCw,
  Target,
  Users,
  Shield,
  Brain,
  Network,
  Sparkles
} from 'lucide-react'

interface AdvancedAnalyticsDashboardProps {
  tenantId: string
}

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({ 
  tenantId 
}) => {
  const [data, setData] = useState<any>(null)
  const [enhancedData, setEnhancedData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'predictive' | 'correlations'>('overview')

  const timeRanges = {
    '7d': '7 derniers jours',
    '30d': '30 derniers jours',
    '3m': '3 derniers mois',
    '6m': '6 derniers mois',
    '1y': '1 an'
  }

  useEffect(() => {
    loadAnalytics()
  }, [tenantId, selectedTimeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)

      // Use API calls instead of direct service imports
      const [analyticsData, predictiveInsights, anomalies, correlationData] = await Promise.all([
        apiClient.get(`/analytics/dashboard/${tenantId}?timeRange=${selectedTimeRange}`),
        apiClient.get(`/analytics/predictive/${tenantId}?timeRange=${selectedTimeRange}`),
        apiClient.get(`/analytics/anomalies/${tenantId}?timeRange=${selectedTimeRange}`),
        apiClient.get(`/analytics/correlations/${tenantId}?timeRange=${selectedTimeRange}`)
      ])
      
      setData(analyticsData)
      setEnhancedData({
        predictiveInsights: predictiveInsights,
        anomalies: anomalies,
        objectivePerformance: [],
        correlationMatrix: correlationData.matrix || [],
        correlationLabels: correlationData.labels || [],
        aiInsights: {
          summary: 'Analyse des données avec insights IA avancés',
          keyFindings: [
            'Risques critiques identifiés',
            'Score moyen calculé',
            'Anomalies détectées'
          ],
          priorityActions: [
            'Réviser les procédures',
            'Analyser les tendances',
            'Mettre à jour les mesures'
          ],
          riskTrends: (predictiveInsights.data || predictiveInsights).map((i: any) => i.metric + ': ' + i.trend)
        }
      })
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAnalytics()
    setRefreshing(false)
  }

  const handleExport = () => {
    if (!data || !enhancedData) return
    
    const exportData = {
      timestamp: new Date().toISOString(),
      timeRange: selectedTimeRange,
      overview: data.overview,
      enhancedInsights: enhancedData.aiInsights,
      anomalies: enhancedData.anomalies,
      predictions: enhancedData.predictiveInsights
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'gamr-analytics-' + selectedTimeRange + '-' + new Date().toISOString().split('T')[0] + '.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée disponible</h3>
        <p className="text-gray-500">Les analytics seront disponibles une fois que vous aurez des évaluations.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gradient">Analytics Avancées</h1>
            <div className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-accent-100 to-accent-200 rounded-full">
              <Sparkles className="w-4 h-4 text-accent-600" />
              <span className="text-sm font-medium text-accent-700">IA Avancée</span>
            </div>
          </div>
          <p className="text-gray-600 text-lg">Analyse intelligente avec prédictions et détection d'anomalies</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {Object.entries(timeRanges).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exporter</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'overview'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Vue d'ensemble</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('predictive')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'predictive'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4" />
            <span>Prédictif</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('correlations')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'correlations'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Network className="w-4 h-4" />
            <span>Corrélations</span>
          </div>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && data && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="glass" className="group animate-slide-up">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Risques</p>
                    <p className="text-3xl font-bold text-gray-900">{data.overview?.totalRisks || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">Identifiés cette période</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="group animate-slide-up">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Risques Critiques</p>
                    <p className="text-3xl font-bold text-red-600">{data.overview?.criticalRisks || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">Nécessitent une action</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-red-50 to-red-100">
                    <Target className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="group animate-slide-up">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Évaluations</p>
                    <p className="text-3xl font-bold text-green-600">{data.overview?.evaluationsCompleted || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">Complétées</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-50 to-green-100">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="group animate-slide-up">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Score Moyen</p>
                    <p className="text-3xl font-bold text-purple-600">{data.overview?.averageScore || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">Sur 100</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card variant="glass" className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-primary-600" />
                  <span>Tendances Temporelles</span>
                </CardTitle>
                <CardDescription>Évolution des métriques dans le temps</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendChart 
                  data={data.overview?.trends || { risks: [], evaluations: [], scores: [] }}
                  timeRange={selectedTimeRange}
                />
              </CardContent>
            </Card>

            <Card variant="glass" className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-primary-600" />
                  <span>Distribution des Risques</span>
                </CardTitle>
                <CardDescription>Répartition par niveau de priorité</CardDescription>
              </CardHeader>
              <CardContent>
                <RiskDistributionChart data={data.riskDistribution || []} />
              </CardContent>
            </Card>

            <Card variant="glass" className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-primary-600" />
                  <span>Analytics par Secteur</span>
                </CardTitle>
                <CardDescription>Performance comparative des secteurs</CardDescription>
              </CardHeader>
              <CardContent>
                <SectorAnalyticsChart data={data.sectorAnalytics || []} />
              </CardContent>
            </Card>

            <Card variant="glass" className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-primary-600" />
                  <span>Insights de Corrélation</span>
                </CardTitle>
                <CardDescription>Relations entre facteurs de risque</CardDescription>
              </CardHeader>
              <CardContent>
                <CorrelationInsights data={data.correlations || []} />
              </CardContent>
            </Card>
          </div>

          <Card variant="glass" className="animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-primary-600" />
                <span>Carte de Chaleur - Objectifs vs Secteurs</span>
              </CardTitle>
              <CardDescription>Analyse croisée des performances par objectif et secteur</CardDescription>
            </CardHeader>
            <CardContent>
              <AnalyticsHeatmap data={data.heatmapData || { objectives: [], sectors: [], scores: [] }} />
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'predictive' && enhancedData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="lg:col-span-1">
            <PredictiveInsightsChart insights={enhancedData.predictiveInsights || []} />
          </div>
          <div className="lg:col-span-1">
            <AnomalyDetectionPanel anomalies={enhancedData.anomalies || []} />
          </div>
        </div>
      )}

      {activeTab === 'correlations' && enhancedData && (
        <div className="space-y-8">
          <CorrelationMatrix 
            matrix={enhancedData.correlationMatrix || []} 
            labels={enhancedData.correlationLabels || []} 
          />
        </div>
      )}
    </div>
  )
}
