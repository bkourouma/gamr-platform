import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  FileText, 
  Settings, 
  Building,
  Users,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useToast, createSuccessToast, createErrorToast } from '../components/Toast'
import { templatesApi, handleApiError } from '../lib/api'

interface TemplateFormData {
  name: string
  description: string
  version: string
  targetSectors: string[]
  companySize: string[]
  ouiMeansPositive: boolean
}

const AVAILABLE_SECTORS = [
  'Technologie',
  'Santé',
  'Finance',
  'Industrie',
  'Commerce',
  'Éducation',
  'Transport',
  'Énergie',
  'Agriculture',
  'Services'
]

const COMPANY_SIZES = [
  { value: 'TPE', label: 'TPE (1-9 salariés)' },
  { value: 'PME', label: 'PME (10-249 salariés)' },
  { value: 'ETI', label: 'ETI (250-4999 salariés)' },
  { value: 'GE', label: 'GE (5000+ salariés)' }
]

export const CreateTemplate: React.FC = () => {
  const navigate = useNavigate()
  const { addToast } = useToast()
  
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    version: '1.0',
    targetSectors: [],
    companySize: [],
    ouiMeansPositive: true
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du modèle est obligatoire'
    }

    if (!formData.version.trim()) {
      newErrors.version = 'La version est obligatoire'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof TemplateFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Effacer l'erreur si le champ est maintenant valide
    if (errors[field] && value.trim()) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleSectorToggle = (sector: string) => {
    setFormData(prev => ({
      ...prev,
      targetSectors: prev.targetSectors.includes(sector)
        ? prev.targetSectors.filter(s => s !== sector)
        : [...prev.targetSectors, sector]
    }))
  }

  const handleCompanySizeToggle = (size: string) => {
    setFormData(prev => ({
      ...prev,
      companySize: prev.companySize.includes(size)
        ? prev.companySize.filter(s => s !== size)
        : [...prev.companySize, size]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      
      const template = await templatesApi.create({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        version: formData.version.trim(),
        ouiMeansPositive: formData.ouiMeansPositive,
        questionGroups: [] // Sera configuré dans l'éditeur
      })

      addToast(createSuccessToast('Modèle créé avec succès'))

      // Rediriger vers l'éditeur de template
      navigate(`/templates/${template.id}/edit`)
    } catch (error) {
      console.error('Erreur lors de la création du modèle:', error)
      addToast(createErrorToast(handleApiError(error)))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/templates')}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau modèle d'évaluation</h1>
          <p className="text-gray-600 mt-1">
            Créez un nouveau modèle de questionnaire d'évaluation sécuritaire
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du modèle *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Évaluation Sécurité Standard"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Version *
                </label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => handleInputChange('version', e.target.value)}
                  placeholder="Ex: 1.0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.version ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.version && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.version}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Description du modèle d'évaluation..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuration par secteur */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Secteurs d'activité ciblés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Sélectionnez les secteurs d'activité pour lesquels ce modèle est adapté (optionnel)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {AVAILABLE_SECTORS.map((sector) => (
                <button
                  key={sector}
                  type="button"
                  onClick={() => handleSectorToggle(sector)}
                  className={`p-3 text-sm rounded-lg border transition-colors ${
                    formData.targetSectors.includes(sector)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {sector}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configuration par taille d'entreprise */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Taille d'entreprise ciblée
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Sélectionnez les tailles d'entreprise pour lesquelles ce modèle est adapté (optionnel)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {COMPANY_SIZES.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => handleCompanySizeToggle(size.value)}
                  className={`p-4 text-left rounded-lg border transition-colors ${
                    formData.companySize.includes(size.value)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="font-medium">{size.value}</div>
                  <div className="text-sm opacity-75">{size.label}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Aperçu */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Aperçu du modèle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">{formData.name || 'Nom du modèle'}</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {formData.description || 'Aucune description'}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Version {formData.version}</Badge>
                <Badge variant="success">Nouveau</Badge>
              </div>

              {formData.targetSectors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Secteurs ciblés:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.targetSectors.map((sector) => (
                      <Badge key={sector} variant="outline">{sector}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {formData.companySize.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Tailles d'entreprise:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.companySize.map((size) => (
                      <Badge key={size} variant="outline">{size}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/templates')}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Création...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Créer et configurer
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
