import React from 'react'
import { useNavigate } from 'react-router-dom'
import { EvaluationQuestionnaire } from '../components/EvaluationQuestionnaire'

export const CreateEvaluation: React.FC = () => {
  const navigate = useNavigate()

  const handleSave = (data: any) => {
    console.log('Évaluation sauvegardée:', data)
    // Ici, on sauvegarderait en base de données
  }

  const handleComplete = (evaluation: any) => {
    console.log('Évaluation terminée:', evaluation)
    // Redirection vers la liste des évaluations
    setTimeout(() => {
      navigate('/evaluations')
    }, 2000)
  }

  return (
    <div className="animate-fade-in">
      <EvaluationQuestionnaire
        mode="create"
        onSave={handleSave}
        onComplete={handleComplete}
      />
    </div>
  )
}
