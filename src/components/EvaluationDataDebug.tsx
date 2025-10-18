import React from 'react'
import { type Evaluation } from '../lib/api'

interface EvaluationDataDebugProps {
  evaluation: Evaluation
}

export const EvaluationDataDebug: React.FC<EvaluationDataDebugProps> = ({ evaluation }) => {
  return (
    <div className="bg-gray-100 p-4 rounded-lg mt-4">
      <h3 className="font-bold text-lg mb-2">Debug: Données d'évaluation</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>ID:</strong> {evaluation.id}
        </div>
        
        <div>
          <strong>Titre:</strong> {evaluation.title}
        </div>
        
        <div>
          <strong>Statut:</strong> {evaluation.status}
        </div>
        
        <div>
          <strong>Nombre de réponses:</strong> {evaluation.responses?.length || 0}
        </div>
        
        <div>
          <strong>Template disponible:</strong> {evaluation.template ? 'Oui' : 'Non'}
        </div>
        
        {evaluation.template && (
          <div>
            <strong>Lignes de défense:</strong> {evaluation.template.questionGroups?.length || 0}
          </div>
        )}
        
        {evaluation.responses && evaluation.responses.length > 0 && (
          <div>
            <strong>Première réponse:</strong>
            <pre className="bg-white p-2 rounded text-xs overflow-auto">
              {JSON.stringify(evaluation.responses[0], null, 2)}
            </pre>
          </div>
        )}
        
        {evaluation.template?.questionGroups && evaluation.template.questionGroups.length > 0 && (
          <div>
            <strong>Premier groupe:</strong>
            <pre className="bg-white p-2 rounded text-xs overflow-auto">
              {JSON.stringify(evaluation.template.questionGroups[0], null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
