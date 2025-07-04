import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Toast } from './ui/Toast'
import { useAuth } from '../contexts/AuthContext'
import { 
  Save, 
  X, 
  AlertTriangle, 
  Shield, 
  TrendingUp,
  Sparkles,
  Calculator,
  Brain,
  Target,
  Zap
} from 'lucide-react'
import { calculateRiskScore, getPriorityFromScore, translatePriority } from '../lib/utils'

interface RiskSheetFormProps {
  initialData?: any
  onSave?: (data: any) => void
  onCancel?: () => void
  mode?: 'create' | 'edit'
  isLoading?: boolean
}

export const RiskSheetForm: React.FC<RiskSheetFormProps> = ({
  initialData,
  onSave,
  onCancel,
  mode = 'create',
  isLoading: externalLoading = false
}) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    target: initialData?.target || '',
    scenario: initialData?.scenario || '',
    probability: initialData?.probability || 1,
    vulnerability: initialData?.vulnerability || 1,
    impact: initialData?.impact || 1,
    category: initialData?.category || '',
    ...initialData
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Calcul automatique du score et de la priorité
  const riskScore = calculateRiskScore(formData.probability, formData.vulnerability, formData.impact)
  const priority = getPriorityFromScore(riskScore)

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulation d'une sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const dataToSave = {
        ...formData,
        riskScore,
        priority,
        tenantId: user?.tenant?.id,
        authorId: user?.id
      }

      onSave?.(dataToSave)
      setToastMessage(`Fiche ${mode === 'create' ? 'créée' : 'mise à jour'} avec succès`)
      setShowToast(true)
    } catch (error) {
      setToastMessage('Erreur lors de la sauvegarde')
      setShowToast(true)
    } finally {
      setIsLoading(false)
    }
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return { color: 'text-danger-700 bg-gradient-to-r from-danger-100 to-danger-200', icon: AlertTriangle }
      case 'HIGH':
        return { color: 'text-warning-700 bg-gradient-to-r from-warning-100 to-warning-200', icon: TrendingUp }
      case 'MEDIUM':
        return { color: 'text-primary-700 bg-gradient-to-r from-primary-100 to-primary-200', icon: Shield }
      default:
        return { color: 'text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200', icon: Shield }
    }
  }

  const priorityConfig = getPriorityConfig(priority)
  const PriorityIcon = priorityConfig.icon

  const categories = [
    'Cybersécurité',
    'Protection des données',
    'Opérationnel',
    'Financier',
    'Réglementaire',
    'Ressources humaines',
    'Réputation',
    'Environnemental',
    'Technique',
    'Stratégique'
  ]

  const aiSuggestions = [
    'Cyberattaque par ransomware sur l\'infrastructure critique',
    'Fuite de données personnelles via une vulnérabilité applicative',
    'Rupture d\'approvisionnement du fournisseur principal',
    'Départ simultané de plusieurs experts techniques',
    'Panne majeure du système informatique principal',
    'Non-conformité aux nouvelles réglementations RGPD',
    'Crise de réputation suite à un incident public'
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gradient">
            {mode === 'create' ? 'Nouvelle fiche GAMR' : 'Modifier la fiche GAMR'}
          </h2>
          <p className="text-gray-600">
            Analyse des risques pour {user?.tenant.name}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="gradient" pulse>
            <Brain className="w-3 h-3 mr-1" />
            IA Active
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations de base */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-primary-600" />
                  <span>Identification du risque</span>
                </CardTitle>
                <CardDescription>
                  Définissez la cible et le scénario de menace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cible potentielle *
                  </label>
                  <input
                    type="text"
                    value={formData.target}
                    onChange={(e) => handleChange('target', e.target.value)}
                    placeholder="Ex: Serveurs de production, Données clients..."
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/60 backdrop-blur-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/60 backdrop-blur-sm"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Scénario de menace *
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="glass"
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      Suggestions IA
                    </Button>
                  </div>
                  <textarea
                    value={formData.scenario}
                    onChange={(e) => handleChange('scenario', e.target.value)}
                    placeholder="Décrivez le scénario de menace en détail..."
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/60 backdrop-blur-sm resize-none"
                  />
                  
                  {/* Suggestions IA */}
                  <div className="mt-3 p-4 bg-gradient-to-r from-accent-50 to-primary-50 rounded-xl border border-accent-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Brain className="w-4 h-4 text-accent-600" />
                      <span className="text-sm font-medium text-accent-800">Suggestions IA</span>
                    </div>
                    <div className="space-y-2">
                      {aiSuggestions.slice(0, 3).map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleChange('scenario', suggestion)}
                          className="block w-full text-left p-2 text-sm text-gray-700 hover:bg-white/60 rounded-lg transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Évaluation GAMR */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-primary-600" />
                  <span>Évaluation GAMR</span>
                </CardTitle>
                <CardDescription>
                  Évaluez la probabilité, vulnérabilité et impact
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Probabilité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Probabilité (1-3)
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(value => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleChange('probability', value)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.probability === value
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-lg font-bold">{value}</div>
                          <div className="text-xs">
                            {value === 1 ? 'Faible' : value === 2 ? 'Moyen' : 'Élevé'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vulnérabilité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Vulnérabilité (1-4)
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(value => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleChange('vulnerability', value)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.vulnerability === value
                            ? 'border-warning-500 bg-warning-50 text-warning-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-lg font-bold">{value}</div>
                          <div className="text-xs">
                            {value === 1 ? 'Très faible' : value === 2 ? 'Faible' : value === 3 ? 'Moyen' : 'Élevé'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Impact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Impact (1-5)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map(value => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleChange('impact', value)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          formData.impact === value
                            ? 'border-danger-500 bg-danger-50 text-danger-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-lg font-bold">{value}</div>
                          <div className="text-xs">
                            {value === 1 ? 'Négligeable' : value === 2 ? 'Mineur' : value === 3 ? 'Modéré' : value === 4 ? 'Majeur' : 'Critique'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panneau de résultats */}
          <div className="space-y-6">
            {/* Score calculé */}
            <Card variant="gradient" className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Résultat GAMR</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {riskScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 mb-4">Score de risque</div>
                  
                  <Badge className={`${priorityConfig.color} border`}>
                    <PriorityIcon className="w-4 h-4 mr-1" />
                    {translatePriority(priority)}
                  </Badge>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/20">
                  <div className="flex justify-between text-sm">
                    <span>Probabilité:</span>
                    <span className="font-medium">{formData.probability}/3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Vulnérabilité:</span>
                    <span className="font-medium">{formData.vulnerability}/4</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Impact:</span>
                    <span className="font-medium">{formData.impact}/5</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/20">
                  <div className="text-xs text-gray-600 text-center">
                    Calcul: ({formData.probability} × {formData.vulnerability} × {formData.impact}) ÷ 60 × 100
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full"
                loading={isLoading || externalLoading}
                disabled={!formData.target || !formData.scenario || externalLoading}
              >
                <Save className="w-4 h-4 mr-2" />
                {mode === 'create' ? 'Créer la fiche' : 'Sauvegarder'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full glass"
                onClick={onCancel}
                disabled={isLoading || externalLoading}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Toast */}
      {showToast && (
        <Toast
          type="success"
          title="Succès"
          description={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  )
}
