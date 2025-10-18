import React, { useState, useEffect } from 'react'
import { FileText, Download, Calendar, BarChart3, TrendingUp, Filter, Search, Plus } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { ReportGenerator } from '../components/ReportGenerator'
import { PDFService } from '../lib/pdfService'
import { riskSheetsApi, actionsApi, evaluationsApi } from '../lib/api'
import { WordService } from '../lib/wordService'
import { useToast } from '../components/Toast'

export const ReportsPage: React.FC = () => {
  const [showReportGenerator, setShowReportGenerator] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const [risksResponse, actionsResponse] = await Promise.all([
        riskSheetsApi.getAll({ limit: 1 }),
        actionsApi.getStats()
      ])
      
      setStats({
        totalRisks: risksResponse.total,
        totalActions: actionsResponse.totalActions,
        criticalRisks: risksResponse.data.filter((r: any) => r.priority === 'CRITICAL').length,
        overdueActions: actionsResponse.overdueActions
      })
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    } finally {
      setLoading(false)
    }
  }

  const reportTemplates = [
    {
      id: 'risk-summary',
      title: 'Résumé des Risques',
      description: 'Vue d\'ensemble de tous les risques identifiés avec scores et priorités',
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      action: async () => {
        try {
          const response = await riskSheetsApi.getAll({ limit: 100 })
          if (response.data.length > 0) {
            await PDFService.generateConsolidatedReport({
              riskSheets: response.data,
              title: 'Résumé des Risques - ' + new Date().toLocaleDateString('fr-FR')
            })
            addToast({ type: 'success', title: 'Rapport généré avec succès' })
          } else {
            addToast({ type: 'warning', title: 'Aucune fiche de risque trouvée' })
          }
        } catch (error) {
          addToast({ type: 'error', title: 'Erreur lors de la génération du rapport' })
        }
      }
    },
    {
      id: 'word-risk-actions',
      title: 'DOCX — Risques & Actions',
      description: 'Rapport Word avec statistiques et Recommandations IA',
      icon: FileText,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      action: async () => {
        try {
          await WordService.generateRiskActionReport({
            title: `Rapport Risques & Actions — ${new Date().toLocaleDateString('fr-FR')}`,
          })
          addToast({ type: 'success', title: 'Rapport Word généré avec succès' })
        } catch (error) {
          addToast({ type: 'error', title: 'Erreur lors de la génération du rapport Word' })
        }
      }
    },
    {
      id: 'actions-tracking',
      title: 'Suivi des Actions',
      description: 'Rapport détaillé des priorités d\'action et de leur avancement',
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      action: async () => {
        try {
          const response = await actionsApi.getAll({ limit: 100 })
          if (response.data.length > 0) {
            await PDFService.generateActionsReport(response.data, 'Suivi des Priorités d\'action')
            addToast({ type: 'success', title: 'Rapport généré avec succès' })
          } else {
            addToast({ type: 'warning', title: 'Aucune action trouvée' })
          }
        } catch (error) {
          addToast({ type: 'error', title: 'Erreur lors de la génération du rapport' })
        }
      }
    },
    {
      id: 'critical-risks',
      title: 'Risques Critiques',
      description: 'Focus sur les risques nécessitant une attention immédiate',
      icon: TrendingUp,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      action: async () => {
        try {
          const response = await riskSheetsApi.getAll({ priority: 'CRITICAL', limit: 100 })
          if (response.data.length > 0) {
            await PDFService.generateConsolidatedReport({
              riskSheets: response.data,
              title: 'Rapport des Risques Critiques'
            })
            addToast({ type: 'success', title: 'Rapport généré avec succès' })
          } else {
            addToast({ type: 'info', title: 'Aucun risque critique trouvé' })
          }
        } catch (error) {
          addToast({ type: 'error', title: 'Erreur lors de la génération du rapport' })
        }
      }
    },
    {
      id: 'monthly-report',
      title: 'Rapport Mensuel',
      description: 'Rapport consolidé avec toutes les données du mois',
      icon: BarChart3,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      action: async () => {
        try {
          const [risksResponse, actionsResponse] = await Promise.all([
            riskSheetsApi.getAll({ limit: 100 }),
            actionsApi.getAll({ limit: 100 })
          ])
          
          await PDFService.generateConsolidatedReport({
            riskSheets: risksResponse.data,
            actions: actionsResponse.data,
            title: `Rapport Mensuel - ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
          })
          addToast({ type: 'success', title: 'Rapport mensuel généré avec succès' })
        } catch (error) {
          addToast({ type: 'error', title: 'Erreur lors de la génération du rapport mensuel' })
        }
      }
    }
  ]

  const recentReports = [
    {
      name: 'Rapport Mensuel - Janvier 2024',
      type: 'Consolidé',
      date: '2024-01-15T10:30:00',
      size: '2.4 MB',
      status: 'Généré'
    },
    {
      name: 'Priorités d\'action Q1',
      type: 'Actions',
      date: '2024-01-10T14:15:00',
      size: '1.8 MB',
      status: 'Généré'
    },
    {
      name: 'Risques Critiques - Semaine 2',
      type: 'Risques',
      date: '2024-01-08T09:45:00',
      size: '1.2 MB',
      status: 'Généré'
    },
    {
      name: 'Évaluation Sécurité TechCorp',
      type: 'Évaluation',
      date: '2024-01-05T16:20:00',
      size: '3.2 MB',
      status: 'Généré'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rapports & Analytics</h1>
          <p className="text-gray-600 mt-1">
            Générez et gérez vos rapports PDF personnalisés
          </p>
        </div>
        <Button
          onClick={() => setShowReportGenerator(true)}
          className="btn-animated"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouveau Rapport
        </Button>
      </div>

      {/* Statistiques rapides */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">GAMR</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRisks}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Priorités d'action</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalActions}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Risques Critiques</p>
                <p className="text-2xl font-bold text-red-900">{stats.criticalRisks}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Actions en Retard</p>
                <p className="text-2xl font-bold text-orange-900">{stats.overdueActions}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates de rapports */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Templates de Rapports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportTemplates.map((template) => (
            <div
              key={template.id}
              className={`relative p-4 rounded-lg ${template.bgColor} border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group`}
              onClick={template.action}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${template.color} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                  <template.icon className="w-5 h-5 text-white" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Download className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              
              <h4 className="font-medium text-gray-900 mb-1">{template.title}</h4>
              <p className="text-xs text-gray-600">{template.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rapports récents */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Rapports Récents</h3>
          <div className="flex space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtrer
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom du Rapport
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de Génération
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taille
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentReports.map((report, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">{report.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {report.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(report.date).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {report.size}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-1" />
                      Télécharger
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Générateur de rapports */}
      <ReportGenerator
        isOpen={showReportGenerator}
        onClose={() => setShowReportGenerator(false)}
      />
    </div>
  )
}
