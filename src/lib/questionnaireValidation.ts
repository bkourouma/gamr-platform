import { SecurityQuestion, ValidationRule } from '../data/securityQuestionnaire'

// Local interface definition to avoid import issues
interface ConditionalLogic {
  dependsOn: string
  showWhen: any
  hideWhen?: any
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  questionId: string
  message: string
  type: 'REQUIRED' | 'FORMAT' | 'RANGE' | 'CUSTOM'
}

export interface ValidationWarning {
  questionId: string
  message: string
  type: 'INCOMPLETE' | 'INCONSISTENT' | 'RECOMMENDATION'
}

export interface QuestionResponse {
  questionId: string
  booleanValue?: boolean
  textValue?: string
  numberValue?: number
  facilityScore?: number
  constraintScore?: number
  comment?: string
}

export class QuestionnaireValidator {
  
  /**
   * Validate a single question response
   */
  static validateQuestion(
    question: SecurityQuestion, 
    response: QuestionResponse | undefined,
    allResponses: Record<string, QuestionResponse>
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Check if question should be visible based on conditional logic
    if (!this.isQuestionVisible(question, allResponses)) {
      return { isValid: true, errors: [], warnings: [] }
    }

    // Required field validation
    if (question.isRequired && !this.hasValidResponse(question, response)) {
      errors.push({
        questionId: question.id,
        message: 'Cette question est obligatoire',
        type: 'REQUIRED'
      })
    }

    if (response) {
      // Format validation
      const formatValidation = this.validateFormat(question, response)
      errors.push(...formatValidation.errors)
      warnings.push(...formatValidation.warnings)

      // Range validation
      const rangeValidation = this.validateRange(question, response)
      errors.push(...rangeValidation.errors)

      // Custom validation rules
      if (question.validation) {
        const customValidation = this.validateCustomRules(question, response)
        errors.push(...customValidation.errors)
        warnings.push(...customValidation.warnings)
      }

      // Scoring validation for YES/NO questions
      if (question.type === 'YES_NO' && response.booleanValue !== undefined) {
        const scoringValidation = this.validateScoring(question, response)
        warnings.push(...scoringValidation.warnings)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate multiple questions at once
   */
  static validateQuestionnaire(
    questions: SecurityQuestion[],
    responses: Record<string, QuestionResponse>
  ): ValidationResult {
    const allErrors: ValidationError[] = []
    const allWarnings: ValidationWarning[] = []

    questions.forEach(question => {
      const result = this.validateQuestion(question, responses[question.id], responses)
      allErrors.push(...result.errors)
      allWarnings.push(...result.warnings)
    })

    // Cross-question validation
    const crossValidation = this.validateCrossQuestions(questions, responses)
    allErrors.push(...crossValidation.errors)
    allWarnings.push(...crossValidation.warnings)

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    }
  }

  /**
   * Check if a question should be visible based on conditional logic
   */
  private static isQuestionVisible(
    question: SecurityQuestion,
    allResponses: Record<string, QuestionResponse>
  ): boolean {
    if (!question.conditionalLogic) {
      return true
    }

    const dependentResponse = allResponses[question.conditionalLogic.dependsOn]
    if (!dependentResponse) {
      return false
    }

    // Check showWhen condition
    if (question.conditionalLogic.showWhen !== undefined) {
      const dependentValue = this.getResponseValue(dependentResponse)
      return dependentValue === question.conditionalLogic.showWhen
    }

    // Check hideWhen condition
    if (question.conditionalLogic.hideWhen !== undefined) {
      const dependentValue = this.getResponseValue(dependentResponse)
      return dependentValue !== question.conditionalLogic.hideWhen
    }

    return true
  }

  /**
   * Check if a response has a valid value
   */
  private static hasValidResponse(question: SecurityQuestion, response: QuestionResponse | undefined): boolean {
    if (!response) return false

    switch (question.type) {
      case 'YES_NO':
        return response.booleanValue !== undefined
      case 'TEXT':
        return !!response.textValue && response.textValue.trim().length > 0
      case 'NUMBER':
        return response.numberValue !== undefined && response.numberValue !== null
      case 'MULTIPLE_CHOICE':
        return !!response.textValue && response.textValue.trim().length > 0
      default:
        return false
    }
  }

  /**
   * Validate format of response
   */
  private static validateFormat(question: SecurityQuestion, response: QuestionResponse): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    switch (question.type) {
      case 'TEXT':
        if (response.textValue) {
          // Check for suspicious patterns
          if (response.textValue.length < 2) {
            warnings.push({
              questionId: question.id,
              message: 'Réponse très courte, vérifiez si elle est complète',
              type: 'INCOMPLETE'
            })
          }
        }
        break

      case 'NUMBER':
        if (response.numberValue !== undefined) {
          if (response.numberValue < 0) {
            errors.push({
              questionId: question.id,
              message: 'La valeur ne peut pas être négative',
              type: 'FORMAT'
            })
          }
        }
        break
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate range constraints
   */
  private static validateRange(question: SecurityQuestion, response: QuestionResponse): ValidationResult {
    const errors: ValidationError[] = []

    if (question.type === 'NUMBER' && response.numberValue !== undefined) {
      // Common sense ranges for different question types
      if (question.text.toLowerCase().includes('employé') && response.numberValue > 10000) {
        errors.push({
          questionId: question.id,
          message: 'Nombre d\'employés semble très élevé, vérifiez la valeur',
          type: 'RANGE'
        })
      }
    }

    return { isValid: errors.length === 0, errors, warnings: [] }
  }

  /**
   * Validate custom rules defined in question
   */
  private static validateCustomRules(question: SecurityQuestion, response: QuestionResponse): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!question.validation) {
      return { isValid: true, errors, warnings }
    }

    const validation = question.validation

    // Length validation for text
    if (question.type === 'TEXT' && response.textValue) {
      if (validation.minLength && response.textValue.length < validation.minLength) {
        errors.push({
          questionId: question.id,
          message: validation.customMessage || `Minimum ${validation.minLength} caractères requis`,
          type: 'CUSTOM'
        })
      }

      if (validation.maxLength && response.textValue.length > validation.maxLength) {
        errors.push({
          questionId: question.id,
          message: validation.customMessage || `Maximum ${validation.maxLength} caractères autorisés`,
          type: 'CUSTOM'
        })
      }

      // Pattern validation
      if (validation.pattern) {
        const regex = new RegExp(validation.pattern)
        if (!regex.test(response.textValue)) {
          errors.push({
            questionId: question.id,
            message: validation.customMessage || 'Format invalide',
            type: 'CUSTOM'
          })
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings }
  }

  /**
   * Validate scoring for YES/NO questions
   */
  private static validateScoring(question: SecurityQuestion, response: QuestionResponse): ValidationResult {
    const warnings: ValidationWarning[] = []

    if (question.type === 'YES_NO' && response.booleanValue !== undefined) {
      // Check if facility/constraint scores are provided
      if (response.facilityScore === undefined && response.constraintScore === undefined) {
        warnings.push({
          questionId: question.id,
          message: 'Évaluation de l\'impact recommandée pour une analyse complète',
          type: 'INCOMPLETE'
        })
      }

      // Check for logical consistency
      if (response.booleanValue === true && response.constraintScore && response.constraintScore > 2) {
        warnings.push({
          questionId: question.id,
          message: 'Score de contrainte élevé pour une réponse positive - vérifiez la cohérence',
          type: 'INCONSISTENT'
        })
      }

      if (response.booleanValue === false && response.facilityScore && response.facilityScore > 2) {
        warnings.push({
          questionId: question.id,
          message: 'Score de facilité élevé pour une réponse négative - vérifiez la cohérence',
          type: 'INCONSISTENT'
        })
      }
    }

    return { isValid: true, errors: [], warnings }
  }

  /**
   * Validate relationships between questions
   */
  private static validateCrossQuestions(
    questions: SecurityQuestion[],
    responses: Record<string, QuestionResponse>
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Example: Check for logical inconsistencies between related questions
    // This can be expanded based on specific business rules

    return { isValid: errors.length === 0, errors, warnings }
  }

  /**
   * Get the actual value from a response for comparison
   */
  private static getResponseValue(response: QuestionResponse): any {
    if (response.booleanValue !== undefined) return response.booleanValue
    if (response.textValue !== undefined) return response.textValue
    if (response.numberValue !== undefined) return response.numberValue
    return null
  }

  /**
   * Get validation summary for display
   */
  static getValidationSummary(validationResult: ValidationResult): string {
    const { errors, warnings } = validationResult
    
    if (errors.length === 0 && warnings.length === 0) {
      return 'Validation réussie'
    }

    const parts = []
    if (errors.length > 0) {
      parts.push(`${errors.length} erreur(s)`)
    }
    if (warnings.length > 0) {
      parts.push(`${warnings.length} avertissement(s)`)
    }

    return parts.join(', ')
  }
}
