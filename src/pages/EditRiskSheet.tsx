import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { RiskSheetForm } from '../components/RiskSheetForm'
import { riskSheetsApi, handleApiError, type RiskSheet } from '../lib/api'

export const EditRiskSheet: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [riskData, setRiskData] = useState<RiskSheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Charger la fiche depuis l'API
  useEffect(() => {
    if (id) {
      loadRisk(id)
    }
  }, [id])

  const loadRisk = async (riskId: string) => {
    try {
      setLoading(true)
      setError(null)
      const risk = await riskSheetsApi.getById(riskId)
      setRiskData(risk)
    } catch (err) {
      console.error('Erreur lors du chargement de la fiche:', err)
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }



  const handleSave = async (data: any) => {
    if (!id) return

    console.log('Fiche mise à jour:', data)
    setSaving(true)

    try {
      await riskSheetsApi.update(id, {
        target: data.target,
        scenario: data.scenario,
        probability: data.probability,
        vulnerability: data.vulnerability,
        impact: data.impact,
        category: data.category
      })

      console.log('Fiche sauvegardée avec succès')

      // Rediriger après sauvegarde
      setTimeout(() => {
        navigate(`/risks/${id}`)
      }, 1000)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert(`Erreur lors de la sauvegarde: ${handleApiError(error)}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate(`/risks/${id}`)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Erreur de chargement</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => navigate('/risks')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  if (!riskData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Fiche de risque introuvable</h2>
          <p className="text-gray-600 mt-2">La fiche demandée n'existe pas ou a été supprimée.</p>
          <button
            onClick={() => navigate('/risks')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <RiskSheetForm
        mode="edit"
        initialData={riskData}
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={saving}
      />
    </div>
  )
}
