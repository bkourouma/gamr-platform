import React, { useState } from 'react'
import { FileText, Download, Calendar, BarChart3, TrendingUp, Users } from 'lucide-react'
import { Button } from './ui/Button'
import { ReportGenerator } from './ReportGenerator'

export const ReportsDashboard: React.FC = () => {
  const [showReportGenerator, setShowReportGenerator] = useState(false)

  const reportTypes = [
    {
      id: 'risks',
      title: 'GAMRDIGITALE',
      description: 'Analyse complète des risques identifiés',
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      stats: '24 fiches actives'
    },
    {
      id: 'actions',
      title: 'Priorités d\'action',
      description: 'Suivi des priorités d\'action',
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
      stats: '12 actions en cours'
    },
    {
      id: 'evaluations',
      title: 'Questionnaire',
      description: 'Résultats des questionnaires GAMRDIGITALE',
      icon: BarChart3,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
      stats: '8 questionnaires complètes'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Tendances et insights IA',
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-50 to-orange-100',
      stats: 'Données temps réel'
    }
  ]

  const recentReports = [
    {
      name: 'Rapport Mensuel - Janvier 2024',
      type: 'GAMRDIGITALE',
      date: '2024-01-15',
      size: '2.4 MB'
    },
    {
      name: 'Priorités d\'action Q1',
      type: 'Actions',
      date: '2024-01-10',
      size: '1.8 MB'
    },
    {
      name: 'Questionnaire Sécurité TechCorp',
      type: 'Questionnaire',
      date: '2024-01-08',
      size: '3.2 MB'
    }
  ]

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Rapports & Analytics</h3>
          <p className="text-sm text-gray-600">Générez des rapports PDF personnalisés</p>
        </div>
        <Button
          onClick={() => setShowReportGenerator(true)}
          className="bg-primary-600 hover:bg-primary-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Nouveau Rapport
        </Button>
      </div>

      {/* Types de rapports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {reportTypes.map((report) => (
          <div
            key={report.id}
            className={`relative p-4 rounded-lg bg-gradient-to-br ${report.bgColor} border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group`}
            onClick={() => setShowReportGenerator(true)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${report.color} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                <report.icon className="w-5 h-5 text-white" />
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Download className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            
            <h4 className="font-medium text-gray-900 mb-1">{report.title}</h4>
            <p className="text-xs text-gray-600 mb-2">{report.description}</p>
            <div className="text-xs font-medium text-gray-500">{report.stats}</div>
          </div>
        ))}
      </div>

      {/* Rapports récents */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Rapports Récents</h4>
        <div className="space-y-2">
          {recentReports.map((report, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{report.name}</div>
                  <div className="text-xs text-gray-500">{report.type} • {report.size}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(report.date).toLocaleDateString('fr-FR')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowReportGenerator(true)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Rapport Risques
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowReportGenerator(true)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Rapport Actions
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowReportGenerator(true)}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
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
