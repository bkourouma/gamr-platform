import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RiskSheetForm } from '../components/RiskSheetForm'
import { riskSheetsApi, handleApiError } from '../lib/api'

export const CreateRiskSheet: React.FC = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async (data: any) => {
    console.log('Nouvelle fiche créée:', data)
    setIsLoading(true)

    try {
      // Créer la fiche via l'API
      const newRisk = await riskSheetsApi.create({
        target: data.target,
        scenario: data.scenario,
        probability: data.probability,
        vulnerability: data.vulnerability,
        impact: data.impact,
        category: data.category
      })

      console.log('Fiche sauvegardée avec succès:', newRisk)

      // Rediriger après sauvegarde
      setTimeout(() => {
        navigate('/risks')
      }, 1000)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      const errorMessage = handleApiError(error)
      alert(`Erreur lors de la sauvegarde: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/risks')
  }

  return (
    <div className="animate-fade-in">
      <RiskSheetForm
        mode="create"
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  )
}
