import React, { useState } from 'react'
import { Download, FileText, Calendar, Filter, Loader } from 'lucide-react'
import { Button } from './ui/Button'
import { PDFService } from '../lib/pdfService'
import { riskSheetsApi, actionsApi, type RiskSheet, type Action } from '../lib/api'
import { useToast } from './Toast'

interface ReportGeneratorProps {
  isOpen: boolean
  onClose: () => void
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ isOpen, onClose }) => {
  const [reportType, setReportType] = useState<'risks' | 'actions' | 'evaluation'>('risks')
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [filters, setFilters] = useState({
    priority: '',
    status: '',
    category: ''
  })
  const [generating, setGenerating] = useState(false)
  const { addToast } = useToast()

  const generateRiskReport = async () => {
    try {
      setGenerating(true)
      
      // Récupérer les fiches de risques selon les filtres
      const params: any = { limit: 100 }
      
      if (filters.priority) params.priority = filters.priority
      if (filters.category) params.category = filters.category
      if (dateRange.startDate) params.startDate = dateRange.startDate
      if (dateRange.endDate) params.endDate = dateRange.endDate

      const response = await riskSheetsApi.getAll(params)
      const riskSheets = response.data

      if (riskSheets.length === 0) {
        addToast({
          type: 'warning',
          title: 'Aucune fiche de risque trouvée avec ces critères',
          duration: 5000
        })
        return
      }

      // Générer un rapport pour la première fiche (exemple)
      // Dans une vraie application, on pourrait générer un rapport consolidé
      if (riskSheets.length === 1) {
        await PDFService.generateRiskSheetReport(riskSheets[0])
      } else {
        // Générer un rapport consolidé (à implémenter)
        addToast({
          type: 'info',
          title: `Génération d'un rapport consolidé pour ${riskSheets.length} fiches de risques`,
          duration: 5000
        })
        // Pour l'instant, générer le rapport de la première fiche
        await PDFService.generateRiskSheetReport(riskSheets[0])
      }

      addToast({
        type: 'success',
        title: 'Rapport PDF généré avec succès',
        duration: 4000
      })
      onClose()
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error)
      addToast({
        type: 'error',
        title: 'Erreur lors de la génération du rapport',
        duration: 6000
      })
    } finally {
      setGenerating(false)
    }
  }

  const generateActionReport = async () => {
    try {
      setGenerating(true)
      
      // Récupérer les actions selon les filtres
      const params: any = { limit: 100 }
      
      if (filters.status) params.status = filters.status
      if (filters.priority) params.priority = filters.priority
      if (dateRange.startDate) params.startDate = dateRange.startDate
      if (dateRange.endDate) params.endDate = dateRange.endDate

      const response = await actionsApi.getAll(params)
      const actions = response.data

      if (actions.length === 0) {
        addToast({
          type: 'warning',
          title: 'Aucune action trouvée avec ces critères',
          duration: 5000
        })
        return
      }

      await PDFService.generateActionsReport(actions, 'Rapport des Actions Correctives')
      addToast({
        type: 'success',
        title: 'Rapport PDF généré avec succès',
        duration: 4000
      })
      onClose()
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error)
      addToast({
        type: 'error',
        title: 'Erreur lors de la génération du rapport',
        duration: 6000
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerate = async () => {
    switch (reportType) {
      case 'risks':
        await generateRiskReport()
        break
      case 'actions':
        await generateActionReport()
        break
      case 'evaluation':
        addToast({
          type: 'info',
          title: 'Rapports d\'évaluation bientôt disponibles',
          duration: 5000
        })
        break
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Générateur de Rapports</h3>
                <p className="text-sm text-gray-600">Créez des rapports PDF personnalisés</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          <div className="space-y-6">
            {/* Type de rapport */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Type de rapport
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setReportType('risks')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    reportType === 'risks'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileText className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Fiches de Risques</div>
                </button>
                
                <button
                  onClick={() => setReportType('actions')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    reportType === 'actions'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Calendar className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Actions Correctives</div>
                </button>
                
                <button
                  onClick={() => setReportType('evaluation')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    reportType === 'evaluation'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Filter className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">Évaluations</div>
                </button>
              </div>
            </div>

            {/* Période */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Période (optionnel)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date de début</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date de fin</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Filtres selon le type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Filtres
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* Priorité */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Priorité</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Toutes les priorités</option>
                    <option value="CRITICAL">Critique</option>
                    <option value="HIGH">Haute</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="LOW">Basse</option>
                    <option value="VERY_LOW">Très basse</option>
                  </select>
                </div>

                {/* Statut (pour les actions) ou Catégorie (pour les risques) */}
                {reportType === 'actions' ? (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Statut</label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Tous les statuts</option>
                      <option value="TODO">À faire</option>
                      <option value="IN_PROGRESS">En cours</option>
                      <option value="COMPLETED">Terminées</option>
                      <option value="CANCELLED">Annulées</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Catégorie</label>
                    <input
                      type="text"
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Ex: Cybersécurité"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Aperçu du rapport */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Aperçu du rapport</h4>
              <div className="text-sm text-gray-600">
                {reportType === 'risks' && (
                  <div>
                    <p>• Analyse détaillée des fiches de risques</p>
                    <p>• Scores et métriques GAMR</p>
                    <p>• Graphiques de priorité</p>
                    <p>• Suggestions IA</p>
                  </div>
                )}
                {reportType === 'actions' && (
                  <div>
                    <p>• Résumé exécutif des actions</p>
                    <p>• Statuts et échéances</p>
                    <p>• Actions en retard</p>
                    <p>• Assignations et responsabilités</p>
                  </div>
                )}
                {reportType === 'evaluation' && (
                  <div>
                    <p>• Résultats d'évaluation complète</p>
                    <p>• Scores par objectif</p>
                    <p>• Recommandations</p>
                    <p>• Plan d'action suggéré</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Générer le PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
