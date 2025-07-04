import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle,
  AlertCircle,
  FileText,
  Clock
} from 'lucide-react'
import { evaluationsApi, handleApiError, type Evaluation, type QuestionGroup, type Question, type EvaluationResponse } from '../lib/api'

export const EvaluationQuestionnaire: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [responses, setResponses] = useState<Map<string, EvaluationResponse>>(new Map())
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [localResponses, setLocalResponses] = useState<Map<string, any>>(new Map())

  useEffect(() => {
    if (id) {
      loadEvaluation(id)
    }
  }, [id])

  const loadEvaluation = async (evaluationId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const [evaluationData, responsesData] = await Promise.all([
        evaluationsApi.getById(evaluationId),
        evaluationsApi.getResponses(evaluationId)
      ])
      
      setEvaluation(evaluationData)
      
      // Convertir les réponses en Map pour un accès rapide
      const responsesMap = new Map<string, EvaluationResponse>()
      responsesData.forEach(response => {
        responsesMap.set(response.questionId, response)
      })
      setResponses(responsesMap)
      
    } catch (err) {
      console.error('Erreur lors du chargement:', err)
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const getCurrentGroup = (): QuestionGroup | null => {
    if (!evaluation?.template?.questionGroups) return null
    return evaluation.template.questionGroups[currentGroupIndex] || null
  }

  const getCurrentQuestion = (): Question | null => {
    const group = getCurrentGroup()
    if (!group?.objectives) return null
    
    let questionIndex = 0
    for (const objective of group.objectives) {
      if (!objective.questions) continue
      
      if (questionIndex + objective.questions.length > currentQuestionIndex) {
        return objective.questions[currentQuestionIndex - questionIndex]
      }
      questionIndex += objective.questions.length
    }
    return null
  }

  const getTotalQuestions = (): number => {
    if (!evaluation?.template?.questionGroups) return 0
    
    return evaluation.template.questionGroups.reduce((total, group) => {
      return total + (group.objectives?.reduce((objTotal, obj) => {
        return objTotal + (obj.questions?.length || 0)
      }, 0) || 0)
    }, 0)
  }

  const getAnsweredQuestions = (): number => {
    return responses.size
  }

  const saveResponse = async (questionId: string, value: any, type: string) => {
    if (!id) return

    try {
      setSaving(true)
      
      const responseData: any = {
        questionId
      }

      // Mapper la valeur selon le type de question
      switch (type) {
        case 'YES_NO':
          responseData.booleanValue = value
          break
        case 'TEXT':
          responseData.textValue = value
          break
        case 'NUMBER':
          responseData.numberValue = parseFloat(value) || 0
          break
        case 'SCALE':
          responseData.numberValue = parseInt(value) || 1
          break
        default:
          responseData.textValue = value
      }

      const response = await evaluationsApi.saveResponse(id, responseData)
      
      // Mettre à jour le state local
      setResponses(prev => new Map(prev.set(questionId, response)))
      
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      setError(handleApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const handleResponseChange = (questionId: string, value: any, type: string) => {
    // Mettre à jour immédiatement l'état local pour une réactivité instantanée
    setLocalResponses(prev => new Map(prev.set(questionId, { value, type })))

    // Annuler le timeout précédent
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }

    // Programmer la sauvegarde automatique après 2 secondes (plus long pour éviter trop d'appels)
    const timeout = setTimeout(() => {
      saveResponse(questionId, value, type)
    }, 2000)

    setAutoSaveTimeout(timeout)
  }

  const nextQuestion = () => {
    const group = getCurrentGroup()
    if (!group?.objectives) return

    const totalQuestionsInGroup = group.objectives.reduce((total, obj) => 
      total + (obj.questions?.length || 0), 0
    )

    if (currentQuestionIndex < totalQuestionsInGroup - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // Passer au groupe suivant
      if (currentGroupIndex < (evaluation?.template?.questionGroups?.length || 0) - 1) {
        setCurrentGroupIndex(prev => prev + 1)
        setCurrentQuestionIndex(0)
      }
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    } else {
      // Revenir au groupe précédent
      if (currentGroupIndex > 0) {
        setCurrentGroupIndex(prev => prev - 1)
        const prevGroup = evaluation?.template?.questionGroups?.[currentGroupIndex - 1]
        if (prevGroup?.objectives) {
          const totalQuestionsInPrevGroup = prevGroup.objectives.reduce((total, obj) => 
            total + (obj.questions?.length || 0), 0
          )
          setCurrentQuestionIndex(totalQuestionsInPrevGroup - 1)
        }
      }
    }
  }

  const saveAllPendingResponses = async () => {
    if (!id || localResponses.size === 0) return

    try {
      setSaving(true)

      // Sauvegarder toutes les réponses locales en attente
      const savePromises = Array.from(localResponses.entries()).map(([questionId, data]) =>
        saveResponse(questionId, data.value, data.type)
      )

      await Promise.all(savePromises)
      setLocalResponses(new Map()) // Vider les réponses locales après sauvegarde
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      setError(handleApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const finishEvaluation = async () => {
    if (!id) return

    try {
      setSaving(true)

      // Sauvegarder d'abord toutes les réponses en attente
      await saveAllPendingResponses()

      // Puis marquer l'évaluation comme terminée
      await evaluationsApi.update(id, { status: 'COMPLETED' })
      navigate(`/evaluations/${id}`)
    } catch (err) {
      console.error('Erreur lors de la finalisation:', err)
      setError(handleApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const renderQuestionInput = (question: Question) => {
    const currentResponse = responses.get(question.id)
    const localResponse = localResponses.get(question.id)
    
    switch (question.type) {
      case 'YES_NO':
        return (
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="true"
                checked={localResponse ? localResponse.value === true : currentResponse?.booleanValue === true}
                onChange={(e) => handleResponseChange(question.id, true, question.type)}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-lg">Oui</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="false"
                checked={localResponse ? localResponse.value === false : currentResponse?.booleanValue === false}
                onChange={(e) => handleResponseChange(question.id, false, question.type)}
                className="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-lg">Non</span>
            </label>
          </div>
        )

      case 'TEXT':
        return (
          <textarea
            value={localResponse ? localResponse.value : (currentResponse?.textValue || '')}
            onChange={(e) => handleResponseChange(question.id, e.target.value, question.type)}
            placeholder={question.placeholder || 'Votre réponse...'}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={4}
          />
        )

      case 'NUMBER':
        return (
          <input
            type="number"
            value={localResponse ? localResponse.value : (currentResponse?.numberValue || '')}
            onChange={(e) => handleResponseChange(question.id, e.target.value, question.type)}
            placeholder={question.placeholder || 'Entrez un nombre...'}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        )

      case 'SCALE':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">1 - Très faible</span>
              <span className="text-sm text-gray-600">5 - Très élevé</span>
            </div>
            <div className="flex space-x-4">
              {[1, 2, 3, 4, 5].map(value => (
                <label key={value} className="flex flex-col items-center space-y-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={value}
                    checked={localResponse ? localResponse.value === value : currentResponse?.numberValue === value}
                    onChange={(e) => handleResponseChange(question.id, value, question.type)}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-lg font-medium">{value}</span>
                </label>
              ))}
            </div>
          </div>
        )

      default:
        return (
          <input
            type="text"
            value={localResponse ? localResponse.value : (currentResponse?.textValue || '')}
            onChange={(e) => handleResponseChange(question.id, e.target.value, question.type)}
            placeholder={question.placeholder || 'Votre réponse...'}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Erreur de chargement</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <button 
            onClick={() => navigate('/evaluations')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  if (!evaluation) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Évaluation introuvable</h2>
          <p className="text-gray-600 mt-2">L'évaluation demandée n'existe pas.</p>
          <button 
            onClick={() => navigate('/evaluations')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  const currentGroup = getCurrentGroup()
  const currentQuestion = getCurrentQuestion()
  const totalQuestions = getTotalQuestions()
  const answeredQuestions = getAnsweredQuestions()
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0

  const isLastQuestion = currentGroupIndex === (evaluation.template?.questionGroups?.length || 0) - 1 &&
    currentQuestionIndex === (currentGroup?.objectives?.reduce((total, obj) => total + (obj.questions?.length || 0), 0) || 0) - 1

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/evaluations/${id}`)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{evaluation.title}</h1>
            <p className="text-gray-600 mt-2">
              {currentGroup?.title} - Question {currentQuestionIndex + 1}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {saving && (
            <div className="flex items-center space-x-2 text-blue-600">
              <Clock className="w-4 h-4 animate-spin" />
              <span className="text-sm">Sauvegarde...</span>
            </div>
          )}
          <div className="text-sm text-gray-600">
            {answeredQuestions} / {totalQuestions} réponses
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progression</span>
          <span className="text-sm font-medium text-gray-900">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-primary-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question actuelle */}
      {currentQuestion && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {currentQuestion.text}
              </h2>
              {currentQuestion.helpText && (
                <p className="text-gray-600 mb-6">
                  {currentQuestion.helpText}
                </p>
              )}
              {currentQuestion.isRequired && (
                <p className="text-sm text-red-600 mb-4">
                  * Cette question est obligatoire
                </p>
              )}
            </div>

            <div className="space-y-4">
              {renderQuestionInput(currentQuestion)}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={previousQuestion}
          disabled={currentGroupIndex === 0 && currentQuestionIndex === 0}
          className="inline-flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Précédent
        </button>

        <div className="flex space-x-3">
          <button
            onClick={async () => {
              await saveAllPendingResponses()
              navigate(`/evaluations/${id}`)
            }}
            disabled={saving}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder et quitter'}
          </button>

          {isLastQuestion ? (
            <button
              onClick={finishEvaluation}
              disabled={saving}
              className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {saving ? 'Finalisation...' : 'Terminer l\'évaluation'}
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Suivant
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
