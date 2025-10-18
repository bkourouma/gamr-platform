import React, { useState, useEffect } from 'react'
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  FileText,
  HelpCircle,
  Settings,
  Copy,
  Eye,
  EyeOff,
  Save,
  X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { useToast, createSuccessToast, createErrorToast } from './Toast'

interface Question {
  id: string
  text: string
  type: 'YES_NO' | 'TEXT' | 'NUMBER' | 'SCALE' | 'MULTIPLE_CHOICE' | 'FILE_UPLOAD' | 'DATE' | 'TIME'
  orderIndex: number
  isRequired: boolean
  helpText?: string
  placeholder?: string
  weight: number
  options?: string[]
  dependsOn?: any
  ouiMeansPositive?: boolean
}

interface Objective {
  id: string
  title: string
  description?: string
  orderIndex: number
  weight: number
  questions: Question[]
}

interface QuestionGroup {
  id: string
  title: string
  description?: string
  orderIndex: number
  icon?: string
  color?: string
  objectives: Objective[]
}

interface QuestionnaireBuilderProps {
  templateId: string
  questionGroups: QuestionGroup[]
  onSave: (groups: QuestionGroup[]) => Promise<void>
  readOnly?: boolean
}

const QUESTION_TYPES = [
  { value: 'YES_NO', label: 'Oui/Non', icon: '✓' },
  { value: 'TEXT', label: 'Texte libre', icon: '📝' },
  { value: 'NUMBER', label: 'Nombre', icon: '#' },
  { value: 'SCALE', label: 'Échelle (1-5)', icon: '📊' },
  { value: 'MULTIPLE_CHOICE', label: 'Choix multiple', icon: '☑️' },
  { value: 'FILE_UPLOAD', label: 'Fichier', icon: '📎' },
  { value: 'DATE', label: 'Date', icon: '📅' },
  { value: 'TIME', label: 'Heure', icon: '🕐' }
]

export const QuestionnaireBuilder: React.FC<QuestionnaireBuilderProps> = ({
  templateId,
  questionGroups: initialGroups,
  onSave,
  readOnly = false
}) => {
  const { addToast } = useToast()
  const [groups, setGroups] = useState<QuestionGroup[]>(initialGroups)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set())
  const [editingItem, setEditingItem] = useState<{ type: 'group' | 'objective' | 'question', id: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState<{
    type: 'group' | 'objective' | 'question'
    id: string
    title: string
    description: string
    questionType?: string
    isRequired?: boolean
    helpText?: string
    placeholder?: string
    options?: string[]
    ouiMeansPositive?: boolean
  } | null>(null)

  useEffect(() => {
    setGroups(initialGroups)
  }, [initialGroups])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      console.log('Sauvegarde des lignes de défense:', groups)
      await onSave(groups)
      addToast(createSuccessToast('Questionnaire sauvegardé avec succès'))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      addToast(createErrorToast('Erreur lors de la sauvegarde'))
    } finally {
      setIsSaving(false)
    }
  }

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }

  const toggleObjectiveExpansion = (objectiveId: string) => {
    setExpandedObjectives(prev => {
      const newSet = new Set(prev)
      if (newSet.has(objectiveId)) {
        newSet.delete(objectiveId)
      } else {
        newSet.add(objectiveId)
      }
      return newSet
    })
  }

  const startEdit = (
    type: 'group' | 'objective' | 'question',
    id: string,
    title: string,
    description: string,
    questionType?: string,
    isRequired?: boolean,
    helpText?: string,
    placeholder?: string,
    options?: string[],
    ouiMeansPositive?: boolean
  ) => {
    setEditForm({
      type,
      id,
      title,
      description,
      questionType,
      isRequired,
      helpText,
      placeholder,
      options: options || [],
      ouiMeansPositive
    })
  }

  const cancelEdit = () => {
    setEditForm(null)
  }

  const saveEdit = () => {
    if (!editForm) return

    setGroups(prev => prev.map(group => {
      if (editForm.type === 'group' && group.id === editForm.id) {
        return {
          ...group,
          title: editForm.title,
          description: editForm.description
        }
      }

      if (editForm.type === 'objective' || editForm.type === 'question') {
        return {
          ...group,
          objectives: group.objectives.map(objective => {
            if (editForm.type === 'objective' && objective.id === editForm.id) {
              return {
                ...objective,
                title: editForm.title,
                description: editForm.description
              }
            }

            if (editForm.type === 'question') {
              return {
                ...objective,
                questions: objective.questions.map(question => {
                  if (question.id === editForm.id) {
                    return {
                      ...question,
                      text: editForm.title,
                      type: (editForm.questionType as any) || question.type,
                      isRequired: editForm.isRequired ?? question.isRequired,
                      helpText: editForm.helpText,
                      placeholder: editForm.placeholder,
                      options: editForm.options?.length ? editForm.options : question.options,
                      ouiMeansPositive: editForm.ouiMeansPositive !== false
                    }
                  }
                  return question
                })
              }
            }

            return objective
          })
        }
      }

      return group
    }))

    setEditForm(null)
  }

  const addGroup = () => {
    const newGroup: QuestionGroup = {
      id: `group_${Date.now()}`,
      title: 'Nouvelle ligne de défense',
      description: '',
      orderIndex: groups.length,
      objectives: []
    }
    setGroups([...groups, newGroup])
    startEdit('group', newGroup.id, newGroup.title, newGroup.description || '')
  }

  const addObjective = (groupId: string) => {
    const newObjective: Objective = {
      id: `objective_${Date.now()}`,
      title: 'Nouvel objectif',
      description: '',
      orderIndex: 0,
      weight: 1.0,
      questions: []
    }

    setGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          objectives: [...group.objectives, { ...newObjective, orderIndex: group.objectives.length }]
        }
      }
      return group
    }))

    startEdit('objective', newObjective.id, newObjective.title, newObjective.description || '')
  }

  const addQuestion = (groupId: string, objectiveId: string) => {
    const newQuestion: Question = {
      id: `question_${Date.now()}`,
      text: 'Nouvelle question',
      type: 'YES_NO',
      orderIndex: 0,
      isRequired: false,
      weight: 1.0
    }

    setGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          objectives: group.objectives.map(objective => {
            if (objective.id === objectiveId) {
              return {
                ...objective,
                questions: [...objective.questions, { ...newQuestion, orderIndex: objective.questions.length }]
              }
            }
            return objective
          })
        }
      }
      return group
    }))

    startEdit('question', newQuestion.id, newQuestion.text, '', newQuestion.type, newQuestion.isRequired, undefined, undefined, undefined, true)
  }

  const deleteItem = (type: 'group' | 'objective' | 'question', id: string, parentId?: string) => {
    if (type === 'group') {
      setGroups(prev => prev.filter(group => group.id !== id))
    } else if (type === 'objective') {
      setGroups(prev => prev.map(group => ({
        ...group,
        objectives: group.objectives.filter(obj => obj.id !== id)
      })))
    } else if (type === 'question' && parentId) {
      setGroups(prev => prev.map(group => ({
        ...group,
        objectives: group.objectives.map(objective => ({
          ...objective,
          questions: objective.questions.filter(q => q.id !== id)
        }))
      })))
    }
  }

  const duplicateItem = (type: 'group' | 'objective' | 'question', id: string) => {
    // Logique de duplication
    addToast(createSuccessToast('Élément dupliqué'))
  }

  const getQuestionTypeIcon = (type: string) => {
    return QUESTION_TYPES.find(t => t.value === type)?.icon || '❓'
  }

  const getQuestionTypeLabel = (type: string) => {
    return QUESTION_TYPES.find(t => t.value === type)?.label || type
  }

  const getTotalQuestions = () => {
    return groups.reduce((total, group) => 
      total + group.objectives.reduce((objTotal, obj) => objTotal + obj.questions.length, 0), 0
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Constructeur de questionnaire</h2>
          <p className="text-gray-600 text-sm mt-1">
            {groups.length} ligne(s) de défense • {groups.reduce((total, g) => total + g.objectives.length, 0)} objectif(s) • {getTotalQuestions()} question(s)
          </p>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={addGroup}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une ligne de défense
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-primary-600 to-primary-700"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sauvegarde...
                </>
              ) : (
                'Sauvegarder'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Liste des groupes */}
      <div className="space-y-4">
        {groups.length === 0 ? (
          <Card variant="glass">
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune ligne de défense</h3>
              <p className="text-gray-600 mb-6">
                Commencez par créer votre première ligne de défense.
              </p>
              {!readOnly && (
                <Button
                  onClick={addGroup}
                  className="bg-gradient-to-r from-primary-600 to-primary-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une ligne de défense
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          groups.map((group, groupIndex) => (
            <Card key={group.id} variant="glass" className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGroupExpansion(group.id)}
                      className="p-1"
                    >
                      {expandedGroups.has(group.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                    <div>
                      <CardTitle className="text-lg">{group.title}</CardTitle>
                      {group.description && (
                        <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      {group.objectives.length} objectif(s)
                    </Badge>
                  </div>
                  
                  {!readOnly && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        <GripVertical className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit('group', group.id, group.title, group.description || '')}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => addObjective(group.id)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteItem('group', group.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              {expandedGroups.has(group.id) && (
                <CardContent className="pt-0">
                  {group.objectives.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                      <HelpCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-4">Aucun objectif dans cette ligne de défense</p>
                      {!readOnly && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addObjective(group.id)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter un objectif
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {group.objectives.map((objective) => (
                        <Card key={objective.id} variant="outline" className="ml-4">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleObjectiveExpansion(objective.id)}
                                  className="p-1"
                                >
                                  {expandedObjectives.has(objective.id) ? (
                                    <ChevronDown className="w-3 h-3" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3" />
                                  )}
                                </Button>
                                <div>
                                  <h4 className="font-medium text-gray-900">{objective.title}</h4>
                                  {objective.description && (
                                    <p className="text-xs text-gray-600">{objective.description}</p>
                                  )}
                                </div>
                                <Badge variant="outline" size="sm">
                                  {objective.questions.length} question(s)
                                </Badge>
                              </div>
                              
                              {!readOnly && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEdit('objective', objective.id, objective.title, objective.description || '')}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => addQuestion(group.id, objective.id)}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => deleteItem('objective', objective.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardHeader>

                          {expandedObjectives.has(objective.id) && (
                            <CardContent className="pt-0">
                              {objective.questions.length === 0 ? (
                                <div className="text-center py-4 border border-dashed border-gray-200 rounded">
                                  <p className="text-gray-600 text-sm mb-2">Aucune question</p>
                                  {!readOnly && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addQuestion(group.id, objective.id)}
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Ajouter
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {objective.questions.map((question, qIndex) => (
                                    <div
                                      key={question.id}
                                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                      <div className="flex items-center gap-3 flex-1">
                                        <span className="text-lg">{getQuestionTypeIcon(question.type)}</span>
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-gray-900">
                                            {question.text}
                                          </p>
                                          <p className="text-xs text-gray-600">
                                            {getQuestionTypeLabel(question.type)}
                                            {question.isRequired && ' • Obligatoire'}
                                            {question.type === 'YES_NO' && (
                                              <> • {question.ouiMeansPositive === false ? 'Oui = négatif' : 'Oui = positif'}</>
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      {!readOnly && (
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                              onClick={() => startEdit('question', question.id, question.text, '', question.type, question.isRequired, question.helpText, question.placeholder, question.options, question.ouiMeansPositive)}
                                          >
                                            <Edit className="w-3 h-3" />
                                          </Button>
                                          <Button variant="ghost" size="sm">
                                            <Copy className="w-3 h-3" />
                                          </Button>
                                          <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => deleteItem('question', question.id, objective.id)}
                                            className="text-red-600 hover:text-red-700"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Modale d'édition */}
      {editForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Modifier {editForm.type === 'group' ? 'la ligne de défense' : editForm.type === 'objective' ? 'l\'objectif' : 'la question'}
              </h3>
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editForm.type === 'question' ? 'Question' : 'Titre'}
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={editForm.type === 'question' ? 'Saisissez votre question...' : 'Saisissez le titre...'}
                />
              </div>

              {editForm.type !== 'question' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Description optionnelle..."
                  />
                </div>
              )}

              {editForm.type === 'question' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de question
                    </label>
                    <select
                      value={editForm.questionType}
                      onChange={(e) => setEditForm({ ...editForm, questionType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {QUESTION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editForm.isRequired}
                        onChange={(e) => setEditForm({ ...editForm, isRequired: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Question obligatoire</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Texte d'aide (optionnel)
                    </label>
                    <input
                      type="text"
                      value={editForm.helpText || ''}
                      onChange={(e) => setEditForm({ ...editForm, helpText: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Texte d'aide pour l'utilisateur..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Placeholder (optionnel)
                    </label>
                    <input
                      type="text"
                      value={editForm.placeholder || ''}
                      onChange={(e) => setEditForm({ ...editForm, placeholder: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Texte d'exemple dans le champ..."
                    />
                  </div>

                  {editForm.questionType === 'MULTIPLE_CHOICE' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Options (une par ligne)
                      </label>
                      <textarea
                        value={editForm.options?.join('\n') || ''}
                        onChange={(e) => setEditForm({ ...editForm, options: e.target.value.split('\n').filter(o => o.trim()) })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                      />
                    </div>
                  )}

                  {editForm.questionType === 'YES_NO' && (
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editForm.ouiMeansPositive !== false}
                          onChange={(e) => setEditForm({ ...editForm, ouiMeansPositive: e.target.checked })}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">Oui = positif (protection/atténuation)</span>
                      </label>
                      <p className="text-xs text-gray-600 mt-1">
                        Décochez si, pour cette question, une réponse "Oui" doit être considérée comme négative (exposition/aggravation).
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={cancelEdit}>
                Annuler
              </Button>
              <Button onClick={saveEdit} className="bg-gradient-to-r from-primary-600 to-primary-700">
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
