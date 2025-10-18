import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Toast } from './ui/Toast'
import { AIAssistantPanel } from './AIAssistantPanel'
import { MediaUpload } from './MediaUpload'
import { SECURITY_QUESTIONNAIRE, type QuestionSection, type SecurityObjective, type SecurityQuestion } from '../data/securityQuestionnaire'
// Temporarily comment out validation imports to test
// import { QuestionnaireValidator, type ValidationResult } from '../lib/questionnaireValidation'
// import { GAMRScoringEngine, type GAMRScore } from '../lib/gamrScoring'
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Upload,
  Camera,
  FileText,
  CheckCircle,
  AlertCircle,
  Brain,
  TrendingUp,
  Shield,
  Building,
  Zap,
  Users,
  MapPin,
  DoorOpen,
  Wifi,
  Flame
} from 'lucide-react'

interface QuestionnaireProps {
  templateId?: string
  evaluationId?: string
  onSave?: (data: any) => void
  onComplete?: (evaluation: any) => void
  mode?: 'create' | 'edit' | 'view'
}

// Using types from securityQuestionnaire.ts

interface Response {
  questionId: string
  booleanValue?: boolean
  textValue?: string
  numberValue?: number
  facilityScore?: number
  constraintScore?: number
  description?: string
  comment?: string
  files?: File[]
  location?: {
    latitude: number
    longitude: number
    accuracy?: number
  }
}

export const EvaluationQuestionnaire: React.FC<QuestionnaireProps> = ({
  templateId,
  evaluationId,
  onSave,
  onComplete,
  mode = 'create'
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [currentObjectiveIndex, setCurrentObjectiveIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, Response>>({})
  const [questionSections, setQuestionSections] = useState<QuestionSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [progress, setProgress] = useState(0)
  // const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({})
  // const [gamrScore, setGamrScore] = useState<GAMRScore | null>(null)

  // Load questionnaire data
  useEffect(() => {
    // Simulate loading time for better UX
    setTimeout(() => {
      setQuestionSections(SECURITY_QUESTIONNAIRE.sections)
      setIsLoading(false)
    }, 1000)
  }, [templateId])

  // Calcul du progrès
  useEffect(() => {
    const totalQuestions = questionSections.reduce((total, section) =>
      total + section.objectives.reduce((objTotal, obj) => objTotal + obj.questions.length, 0), 0
    )
    const answeredQuestions = Object.keys(responses).length
    setProgress(totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0)
  }, [responses, questionSections])

  const currentSection = questionSections[currentSectionIndex]
  const currentObjective = currentSection?.objectives[currentObjectiveIndex]

  const handleResponse = (questionId: string, response: Partial<Response>) => {
    const newResponses = {
      ...responses,
      [questionId]: {
        ...responses[questionId],
        questionId,
        ...response
      }
    }

    setResponses(newResponses)

    // Temporarily comment out validation
    // const question = currentObjective?.questions.find(q => q.id === questionId)
    // if (question) {
    //   const validationResult = QuestionnaireValidator.validateQuestion(
    //     question,
    //     newResponses[questionId],
    //     newResponses
    //   )
    //   setValidationResults(prev => ({
    //     ...prev,
    //     [questionId]: validationResult
    //   }))
    // }

    // Temporarily comment out scoring
    // const allObjectives = questionSections.flatMap(section => section.objectives)
    // if (Object.keys(newResponses).length > 5) {
    //   const score = GAMRScoringEngine.calculateGAMRScore(allObjectives, newResponses)
    //   setGamrScore(score)
    // }
  }

  const handleNext = () => {
    if (currentObjectiveIndex < currentSection.objectives.length - 1) {
      setCurrentObjectiveIndex(prev => prev + 1)
    } else if (currentSectionIndex < questionSections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1)
      setCurrentObjectiveIndex(0)
    }
  }

  const handlePrevious = () => {
    if (currentObjectiveIndex > 0) {
      setCurrentObjectiveIndex(prev => prev - 1)
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1)
      const prevSection = questionSections[currentSectionIndex - 1]
      setCurrentObjectiveIndex(prevSection.objectives.length - 1)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Simulation de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000))
      onSave?.(responses)
      setToastMessage('Évaluation sauvegardée avec succès')
      setShowToast(true)
    } catch (error) {
      setToastMessage('Erreur lors de la sauvegarde')
      setShowToast(true)
    } finally {
      setIsSaving(false)
    }
  }

  const getIconComponent = (iconName: string) => {
    const icons = {
      Building,
      Shield,
      Zap,
      Users,
      MapPin,
      DoorOpen,
      Wifi,
      Flame
    }
    return icons[iconName as keyof typeof icons] || Building
  }

  const getColorClasses = (color: string) => {
    const colors = {
      primary: 'from-primary-500 to-primary-600',
      danger: 'from-danger-500 to-danger-600',
      warning: 'from-warning-500 to-warning-600',
      success: 'from-success-500 to-success-600'
    }
    return colors[color as keyof typeof colors] || colors.primary
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card variant="glass" className="p-8">
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center animate-pulse-soft">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-600">Chargement du questionnaire...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentSection || !currentObjective) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Questionnaire non disponible</h3>
        <p className="text-gray-600">Aucun questionnaire n'a été trouvé.</p>
      </div>
    )
  }

  const IconComponent = getIconComponent(currentSection.icon)
  const colorClasses = getColorClasses(currentSection.color)

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header avec progression */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Questionnaire</h1>
            <p className="text-gray-600">Questionnaire d'évaluation intelligente</p>
          </div>
          <Badge variant="gradient" pulse>
            <Brain className="w-3 h-3 mr-1" />
            IA Active
          </Badge>
        </div>

        {/* Barre de progression */}
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progression globale</span>
              <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Section {currentSectionIndex + 1}/{questionSections.length}</span>
              <span>Objectif {currentObjectiveIndex + 1}/{currentSection.objectives.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation des sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {questionSections.map((section, index) => {
          const SectionIcon = getIconComponent(section.icon)
          const isActive = index === currentSectionIndex
          const isCompleted = section.objectives.every(obj =>
            obj.questions.every(q => responses[q.id])
          )

          return (
            <Card
              key={section.id}
              variant={isActive ? "gradient" : "glass"}
              className={`cursor-pointer transition-all duration-300 ${
                isActive ? 'ring-2 ring-primary-500' : 'hover:shadow-card-hover'
              }`}
              onClick={() => {
                setCurrentSectionIndex(index)
                setCurrentObjectiveIndex(0)
              }}
            >
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
                  isActive ? 'bg-white/20' : `bg-gradient-to-r ${getColorClasses(section.color)}`
                }`}>
                  <SectionIcon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white'}`} />
                </div>
                <h3 className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-900'}`}>
                  {section.title}
                </h3>
                {isCompleted && (
                  <CheckCircle className="w-4 h-4 text-success-500 mx-auto mt-2" />
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Questions */}
        <div className="lg:col-span-2">
          <Card variant="glass">
            <CardHeader>
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses}`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle>{currentObjective.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {currentObjective.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentObjective.questions
                .filter(question => {
                  // Apply conditional logic
                  if (!question.conditionalLogic) return true

                  const dependentResponse = responses[question.conditionalLogic.dependsOn]
                  if (!dependentResponse) return false

                  if (question.conditionalLogic.showWhen !== undefined) {
                    const dependentValue = dependentResponse.booleanValue !== undefined
                      ? dependentResponse.booleanValue
                      : dependentResponse.textValue
                    return dependentValue === question.conditionalLogic.showWhen
                  }

                  return true
                })
                .map((question, index) => {
                  // const validation = validationResults[question.id]
                  // const hasErrors = validation && !validation.isValid
                  // const hasWarnings = validation && validation.warnings.length > 0
                  const hasErrors = false
                  const hasWarnings = false

                  return (
                    <div key={question.id} className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                          hasErrors ? 'bg-red-100' : hasWarnings ? 'bg-yellow-100' : 'bg-primary-100'
                        }`}>
                          <span className={`text-sm font-medium ${
                            hasErrors ? 'text-red-700' : hasWarnings ? 'text-yellow-700' : 'text-primary-700'
                          }`}>{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            {question.text}
                            {question.isRequired && <span className="text-danger-500 ml-1">*</span>}
                          </label>
                      
                      {question.type === 'YES_NO' && (
                        <div className="flex space-x-4">
                          <button
                            type="button"
                            onClick={() => handleResponse(question.id, { booleanValue: true })}
                            className={`px-4 py-2 rounded-lg border-2 transition-all ${
                              responses[question.id]?.booleanValue === true
                                ? 'border-success-500 bg-success-50 text-success-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            Oui
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResponse(question.id, { booleanValue: false })}
                            className={`px-4 py-2 rounded-lg border-2 transition-all ${
                              responses[question.id]?.booleanValue === false
                                ? 'border-danger-500 bg-danger-50 text-danger-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            Non
                          </button>
                        </div>
                      )}

                      {question.type === 'TEXT' && (
                        <input
                          type="text"
                          value={responses[question.id]?.textValue || ''}
                          onChange={(e) => handleResponse(question.id, { textValue: e.target.value })}
                          placeholder={question.placeholder}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      )}

                      {question.type === 'NUMBER' && (
                        <input
                          type="number"
                          value={responses[question.id]?.numberValue || ''}
                          onChange={(e) => handleResponse(question.id, { numberValue: e.target.value ? parseInt(e.target.value) : undefined })}
                          placeholder={question.placeholder}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      )}

                      {question.type === 'MULTIPLE_CHOICE' && question.options && (
                        <select
                          value={responses[question.id]?.textValue || ''}
                          onChange={(e) => handleResponse(question.id, { textValue: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="">Sélectionnez une option</option>
                          {question.options.map((option, optIndex) => (
                            <option key={optIndex} value={option}>{option}</option>
                          ))}
                        </select>
                      )}

                      {question.helpText && (
                        <p className="text-xs text-gray-500 mt-1">{question.helpText}</p>
                      )}

                      {/* Champs d'évaluation Facilité/Contrainte pour questions YES_NO */}
                      {question.type === 'YES_NO' && responses[question.id]?.booleanValue !== undefined && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                          <h4 className="text-sm font-medium text-gray-700">Évaluation de l'impact</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Facilité (réduction vulnérabilité)
                              </label>
                              <select
                                value={responses[question.id]?.facilityScore || ''}
                                onChange={(e) => handleResponse(question.id, { 
                                  facilityScore: e.target.value ? parseInt(e.target.value) : undefined 
                                })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                              >
                                <option value="">Sélectionner</option>
                                <option value="1">1 - Faible</option>
                                <option value="2">2 - Moyen</option>
                                <option value="3">3 - Élevé</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Contrainte (augmentation vulnérabilité)
                              </label>
                              <select
                                value={responses[question.id]?.constraintScore || ''}
                                onChange={(e) => handleResponse(question.id, { 
                                  constraintScore: e.target.value ? parseInt(e.target.value) : undefined 
                                })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                              >
                                <option value="">Sélectionner</option>
                                <option value="1">1 - Faible</option>
                                <option value="2">2 - Moyen</option>
                                <option value="3">3 - Élevé</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Commentaire
                            </label>
                            <textarea
                              value={responses[question.id]?.comment || ''}
                              onChange={(e) => handleResponse(question.id, { comment: e.target.value })}
                              placeholder="Ajoutez des précisions..."
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none"
                            />
                          </div>
                        </div>
                      )}

                      {question.helpText && (
                        <p className="text-xs text-gray-500 mt-1">{question.helpText}</p>
                      )}

                      {/* Validation errors - temporarily commented out */}
                      {/* {validation && validation.errors.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {validation.errors.map((error, errorIndex) => (
                            <p key={errorIndex} className="text-xs text-red-600 flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {error.message}
                            </p>
                          ))}
                        </div>
                      )} */}

                      {/* Validation warnings - temporarily commented out */}
                      {/* {validation && validation.warnings.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {validation.warnings.map((warning, warningIndex) => (
                            <p key={warningIndex} className="text-xs text-yellow-600 flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {warning.message}
                            </p>
                          ))}
                        </div>
                      )} */}

                      {/* Champs d'évaluation Facilité/Contrainte pour questions YES_NO */}
                      {question.type === 'YES_NO' && responses[question.id]?.booleanValue !== undefined && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                          <h4 className="text-sm font-medium text-gray-700">Évaluation de l'impact</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Facilité (réduction vulnérabilité)
                              </label>
                              <select
                                value={responses[question.id]?.facilityScore || ''}
                                onChange={(e) => handleResponse(question.id, {
                                  facilityScore: e.target.value ? parseInt(e.target.value) : undefined
                                })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                              >
                                <option value="">Sélectionner</option>
                                <option value="1">1 - Faible</option>
                                <option value="2">2 - Moyen</option>
                                <option value="3">3 - Élevé</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Contrainte (augmentation vulnérabilité)
                              </label>
                              <select
                                value={responses[question.id]?.constraintScore || ''}
                                onChange={(e) => handleResponse(question.id, {
                                  constraintScore: e.target.value ? parseInt(e.target.value) : undefined
                                })}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                              >
                                <option value="">Sélectionner</option>
                                <option value="1">1 - Faible</option>
                                <option value="2">2 - Moyen</option>
                                <option value="3">3 - Élevé</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Commentaire
                            </label>
                            <textarea
                              value={responses[question.id]?.comment || ''}
                              onChange={(e) => handleResponse(question.id, { comment: e.target.value })}
                              placeholder="Ajoutez des précisions..."
                              rows={2}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            </CardContent>
          </Card>
        </div>

        {/* Panneau latéral */}
        <div className="space-y-6">
          {/* Assistant IA */}
          <AIAssistantPanel
            context={{
              sector: 'Technologie', // À récupérer depuis les données de l'entité
              companySize: 'ETI',
              location: 'France',
              previousResponses: responses,
              currentQuestion: {
                id: currentObjective.questions[0]?.id || '',
                text: currentObjective.questions[0]?.text || '',
                type: currentObjective.questions[0]?.type || 'YES_NO',
                objectiveId: parseInt(currentObjective.id)
              }
            }}
            responses={responses}
            onSuggestionApply={(suggestion) => {
              console.log('Suggestion appliquée:', suggestion)
              // Ici on pourrait auto-remplir des réponses ou afficher des conseils
            }}
          />

          {/* Actions */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle size="sm">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full glass"
                onClick={handleSave}
                loading={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full glass"
              >
                <Camera className="w-4 h-4 mr-2" />
                Ajouter photo
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full glass"
              >
                <FileText className="w-4 h-4 mr-2" />
                Joindre document
              </Button>
            </CardContent>
          </Card>

          {/* Upload de médias */}
          <MediaUpload
            onFilesChange={(files) => {
              console.log('Fichiers ajoutés:', files)
              // Ici on sauvegarderait les fichiers liés à la question courante
            }}
            maxFiles={5}
            showLocation={true}
            questionId={currentObjective.questions[0]?.id}
          />

          {/* Navigation */}
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="flex justify-between space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentSectionIndex === 0 && currentObjectiveIndex === 0}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Précédent
                </Button>

                <Button
                  variant="gradient"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentSectionIndex === questionSections.length - 1 &&
                           currentObjectiveIndex === currentSection.objectives.length - 1}
                  className="flex-1"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
