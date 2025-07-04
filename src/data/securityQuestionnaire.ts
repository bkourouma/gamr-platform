export interface QuestionnaireData {
  id: string
  title: string
  description: string
  version: string
  sections: QuestionSection[]
}

export interface QuestionSection {
  id: string
  title: string
  description: string
  icon: string
  color: string
  objectives: SecurityObjective[]
}

export interface SecurityObjective {
  id: string
  objectiveNumber: number
  title: string
  description: string
  category: string
  questions: SecurityQuestion[]
  scoringCriteria: ScoringCriteria
}

export interface SecurityQuestion {
  id: string
  text: string
  type: 'YES_NO' | 'TEXT' | 'NUMBER' | 'SCALE' | 'MULTIPLE_CHOICE' | 'PHOTO' | 'DOCUMENT'
  isRequired: boolean
  helpText?: string
  placeholder?: string
  options?: string[]
  conditionalLogic?: ConditionalLogic
  validation?: ValidationRule
}

export interface ConditionalLogic {
  dependsOn: string // Question ID
  showWhen: any // Value that triggers showing this question
  hideWhen?: any // Value that triggers hiding this question
}

export interface ValidationRule {
  minLength?: number
  maxLength?: number
  pattern?: string
  customMessage?: string
}

export interface ScoringCriteria {
  facilityWeight: number // Weight for facility score (vulnerability reduction)
  constraintWeight: number // Weight for constraint score (vulnerability increase)
  criticalityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  impactAreas: string[]
}

export const SECURITY_QUESTIONNAIRE: QuestionnaireData = {
  id: 'gamr-security-eval-v1',
  title: 'GAMR - Évaluation Sécuritaire Intelligente',
  description: 'Questionnaire complet d\'évaluation des risques sécuritaires avec 42 objectifs de diagnostic',
  version: '1.0.0',
  sections: [
    {
      id: 'entity-info',
      title: 'Informations sur l\'entité',
      description: 'Identification et caractérisation de l\'entité évaluée',
      icon: 'Building',
      color: 'primary',
      objectives: [
        {
          id: 'obj-1',
          objectiveNumber: 1,
          title: 'Identification de l\'entité',
          description: 'Collecte des informations de base sur l\'organisation',
          category: 'IDENTIFICATION',
          scoringCriteria: {
            facilityWeight: 0.1,
            constraintWeight: 0.1,
            criticalityLevel: 'LOW',
            impactAreas: ['administrative']
          },
          questions: [
            {
              id: 'q1-1',
              text: 'Nom complet de l\'entité',
              type: 'TEXT',
              isRequired: true,
              placeholder: 'Saisissez le nom officiel de l\'entreprise',
              validation: { minLength: 2, maxLength: 100 }
            },
            {
              id: 'q1-2',
              text: 'Secteur d\'activité principal',
              type: 'MULTIPLE_CHOICE',
              isRequired: true,
              options: [
                'Technologie et informatique',
                'Santé et pharmaceutique',
                'Finance et banque',
                'Industrie manufacturière',
                'Commerce et distribution',
                'Éducation et formation',
                'Transport et logistique',
                'Énergie et utilities',
                'Autre'
              ]
            },
            {
              id: 'q1-3',
              text: 'Nombre d\'employés',
              type: 'NUMBER',
              isRequired: true,
              helpText: 'Nombre total d\'employés sur le site évalué'
            },
            {
              id: 'q1-4',
              text: 'Adresse complète du site',
              type: 'TEXT',
              isRequired: true,
              placeholder: 'Adresse complète avec code postal et ville'
            }
          ]
        }
      ]
    },
    {
      id: 'periphery-access',
      title: 'Périphérie - Voie d\'accès',
      description: 'Diagnostic sécuritaire de la voie d\'accès principale',
      icon: 'MapPin',
      color: 'warning',
      objectives: [
        {
          id: 'obj-2',
          objectiveNumber: 2,
          title: 'Diagnostic sécuritaire de la voie d\'accès',
          description: 'Évaluation de la sécurité et de l\'accessibilité de la voie d\'accès principale',
          category: 'PERIPHERY',
          scoringCriteria: {
            facilityWeight: 0.7,
            constraintWeight: 0.8,
            criticalityLevel: 'MEDIUM',
            impactAreas: ['physical_access', 'emergency_response']
          },
          questions: [
            {
              id: 'q2-1',
              text: 'La voie d\'accès à votre entreprise est-elle une voie publique ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Une voie publique offre généralement plus de sécurité et facilite l\'intervention des secours'
            },
            {
              id: 'q2-2',
              text: 'La voie d\'accès a-t-elle un bitumage en bon état ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Un bon état de la voie facilite l\'accès des secours et réduit les risques d\'accident'
            },
            {
              id: 'q2-3',
              text: 'Y a-t-il un éclairage public sur la voie d\'accès ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'L\'éclairage améliore la sécurité nocturne et la surveillance'
            },
            {
              id: 'q2-4',
              text: 'La voie d\'accès permet-elle le passage de véhicules de secours ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Largeur minimale de 3,5m requise pour les véhicules d\'urgence'
            }
          ]
        }
      ]
    },
    {
      id: 'perimeter-security',
      title: 'Périmètre - Clôture',
      description: 'Évaluation de la sécurité périmétrique et des clôtures',
      icon: 'Shield',
      color: 'danger',
      objectives: [
        {
          id: 'obj-3',
          objectiveNumber: 3,
          title: 'Diagnostic sécuritaire du périmètre',
          description: 'Évaluation de l\'efficacité de la clôture et de la sécurisation du périmètre',
          category: 'PERIMETER',
          scoringCriteria: {
            facilityWeight: 0.8,
            constraintWeight: 0.9,
            criticalityLevel: 'HIGH',
            impactAreas: ['physical_security', 'intrusion_prevention']
          },
          questions: [
            {
              id: 'q3-1',
              text: 'Votre entreprise dispose-t-elle d\'une clôture ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Une clôture constitue la première barrière de sécurité physique'
            },
            {
              id: 'q3-2',
              text: 'La clôture fait-elle le tour complet de la propriété ?',
              type: 'YES_NO',
              isRequired: true,
              conditionalLogic: {
                dependsOn: 'q3-1',
                showWhen: true
              },
              helpText: 'Une clôture complète évite les points d\'accès non contrôlés'
            },
            {
              id: 'q3-3',
              text: 'Quelle est la hauteur de la clôture ?',
              type: 'MULTIPLE_CHOICE',
              isRequired: true,
              conditionalLogic: {
                dependsOn: 'q3-1',
                showWhen: true
              },
              options: [
                'Moins de 1,5m',
                'Entre 1,5m et 2m',
                'Entre 2m et 2,5m',
                'Plus de 2,5m'
              ],
              helpText: 'Hauteur minimale recommandée : 2m pour une sécurité efficace'
            }
          ]
        }
      ]
    },
    {
      id: 'entries-access',
      title: 'Entrées et Accès',
      description: 'Évaluation des points d\'accès et de leur sécurisation',
      icon: 'DoorOpen',
      color: 'warning',
      objectives: [
        {
          id: 'obj-4',
          objectiveNumber: 4,
          title: 'Diagnostic de l\'entrée principale',
          description: 'Évaluation de la sécurité de l\'entrée principale',
          category: 'ACCESS_CONTROL',
          scoringCriteria: {
            facilityWeight: 0.8,
            constraintWeight: 0.7,
            criticalityLevel: 'HIGH',
            impactAreas: ['access_control', 'visitor_management']
          },
          questions: [
            {
              id: 'q4-1',
              text: 'L\'entrée principale est-elle clairement identifiée ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Une entrée bien identifiée facilite l\'orientation et le contrôle d\'accès'
            },
            {
              id: 'q4-2',
              text: 'Y a-t-il un système de contrôle d\'accès à l\'entrée ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Badge, code, interphone, ou présence humaine'
            },
            {
              id: 'q4-3',
              text: 'L\'entrée est-elle surveillée en permanence ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Surveillance humaine ou par caméra'
            }
          ]
        },
        {
          id: 'obj-5',
          objectiveNumber: 5,
          title: 'Diagnostic des entrées secondaires',
          description: 'Évaluation de la sécurité des entrées secondaires',
          category: 'ACCESS_CONTROL',
          scoringCriteria: {
            facilityWeight: 0.7,
            constraintWeight: 0.8,
            criticalityLevel: 'MEDIUM',
            impactAreas: ['access_control', 'perimeter_security']
          },
          questions: [
            {
              id: 'q5-1',
              text: 'Combien d\'entrées secondaires votre site possède-t-il ?',
              type: 'NUMBER',
              isRequired: true,
              helpText: 'Incluez toutes les portes, portails et accès alternatifs'
            },
            {
              id: 'q5-2',
              text: 'Les entrées secondaires sont-elles sécurisées ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Verrouillage, alarme, ou surveillance'
            }
          ]
        }
      ]
    },
    {
      id: 'critical-infrastructure',
      title: 'Infrastructures Critiques',
      description: 'Évaluation des systèmes électriques, eau et infrastructures vitales',
      icon: 'Zap',
      color: 'danger',
      objectives: [
        {
          id: 'obj-6',
          objectiveNumber: 6,
          title: 'Diagnostic du système électrique',
          description: 'Évaluation de la sécurité et fiabilité du système électrique',
          category: 'INFRASTRUCTURE',
          scoringCriteria: {
            facilityWeight: 0.9,
            constraintWeight: 0.9,
            criticalityLevel: 'CRITICAL',
            impactAreas: ['power_supply', 'business_continuity']
          },
          questions: [
            {
              id: 'q6-1',
              text: 'Disposez-vous d\'un groupe électrogène de secours ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Système de backup en cas de coupure électrique'
            },
            {
              id: 'q6-2',
              text: 'Le tableau électrique principal est-il sécurisé ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Accès restreint et protection contre les manipulations'
            },
            {
              id: 'q6-3',
              text: 'Y a-t-il un éclairage de secours ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Éclairage automatique en cas de panne'
            }
          ]
        },
        {
          id: 'obj-7',
          objectiveNumber: 7,
          title: 'Diagnostic du système d\'eau',
          description: 'Évaluation de l\'approvisionnement et sécurité de l\'eau',
          category: 'INFRASTRUCTURE',
          scoringCriteria: {
            facilityWeight: 0.7,
            constraintWeight: 0.8,
            criticalityLevel: 'HIGH',
            impactAreas: ['water_supply', 'fire_safety']
          },
          questions: [
            {
              id: 'q7-1',
              text: 'Disposez-vous d\'une réserve d\'eau ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Citerne ou réservoir pour l\'autonomie en eau'
            },
            {
              id: 'q7-2',
              text: 'Le système d\'eau est-il protégé contre la contamination ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Sécurisation des points d\'accès au réseau d\'eau'
            }
          ]
        }
      ]
    },
    {
      id: 'ergonomics',
      title: 'Ergonomie et Conditions de Travail',
      description: 'Évaluation des conditions de travail et de l\'ergonomie des postes',
      icon: 'Users',
      color: 'success',
      objectives: [
        {
          id: 'obj-18',
          objectiveNumber: 18,
          title: 'Diagnostic de l\'ergonomie des postes de travail',
          description: 'Évaluation de l\'aménagement et du confort des espaces de travail',
          category: 'ERGONOMICS',
          scoringCriteria: {
            facilityWeight: 0.6,
            constraintWeight: 0.5,
            criticalityLevel: 'MEDIUM',
            impactAreas: ['workplace_safety', 'productivity']
          },
          questions: [
            {
              id: 'q18-1',
              text: 'Les postes de travail sont-ils ergonomiques ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Sièges ajustables, écrans à bonne hauteur, éclairage adapté'
            },
            {
              id: 'q18-2',
              text: 'Y a-t-il suffisamment d\'espace de circulation ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Largeur minimale de 80cm pour les passages'
            }
          ]
        }
      ]
    },
    {
      id: 'communication-it',
      title: 'Communication et Systèmes IT',
      description: 'Évaluation des systèmes de communication et informatiques',
      icon: 'Wifi',
      color: 'primary',
      objectives: [
        {
          id: 'obj-22',
          objectiveNumber: 22,
          title: 'Diagnostic des systèmes de communication',
          description: 'Évaluation de la fiabilité des moyens de communication',
          category: 'COMMUNICATION',
          scoringCriteria: {
            facilityWeight: 0.8,
            constraintWeight: 0.7,
            criticalityLevel: 'HIGH',
            impactAreas: ['communication', 'emergency_response']
          },
          questions: [
            {
              id: 'q22-1',
              text: 'Disposez-vous de moyens de communication redondants ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Téléphone fixe, mobile, internet, radio'
            },
            {
              id: 'q22-2',
              text: 'Les systèmes de communication fonctionnent-ils en cas de panne électrique ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Alimentation de secours pour les équipements critiques'
            }
          ]
        },
        {
          id: 'obj-23',
          objectiveNumber: 23,
          title: 'Diagnostic de la sécurité informatique',
          description: 'Évaluation de la cybersécurité et protection des données',
          category: 'IT_SECURITY',
          scoringCriteria: {
            facilityWeight: 0.9,
            constraintWeight: 0.9,
            criticalityLevel: 'CRITICAL',
            impactAreas: ['data_security', 'cyber_threats']
          },
          questions: [
            {
              id: 'q23-1',
              text: 'Disposez-vous d\'un antivirus à jour sur tous les postes ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Protection contre les malwares et virus'
            },
            {
              id: 'q23-2',
              text: 'Les données sensibles sont-elles sauvegardées régulièrement ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Sauvegarde automatique et sécurisée'
            },
            {
              id: 'q23-3',
              text: 'Y a-t-il un pare-feu configuré ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Protection du réseau contre les intrusions'
            }
          ]
        }
      ]
    },
    {
      id: 'fire-safety',
      title: 'Sécurité Incendie et Équipements Médicaux',
      description: 'Évaluation des systèmes de sécurité incendie et équipements de premiers secours',
      icon: 'Flame',
      color: 'danger',
      objectives: [
        {
          id: 'obj-27',
          objectiveNumber: 27,
          title: 'Diagnostic de la sécurité incendie',
          description: 'Évaluation des moyens de prévention et lutte contre l\'incendie',
          category: 'FIRE_SAFETY',
          scoringCriteria: {
            facilityWeight: 0.9,
            constraintWeight: 0.9,
            criticalityLevel: 'CRITICAL',
            impactAreas: ['fire_prevention', 'emergency_evacuation']
          },
          questions: [
            {
              id: 'q27-1',
              text: 'Disposez-vous d\'extincteurs en nombre suffisant ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Un extincteur pour 200m² maximum'
            },
            {
              id: 'q27-2',
              text: 'Y a-t-il un système de détection incendie ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Détecteurs de fumée ou système d\'alarme incendie'
            },
            {
              id: 'q27-3',
              text: 'Les issues de secours sont-elles clairement signalées ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Signalisation lumineuse et pictogrammes'
            }
          ]
        },
        {
          id: 'obj-28',
          objectiveNumber: 28,
          title: 'Diagnostic des équipements médicaux',
          description: 'Évaluation des moyens de premiers secours',
          category: 'MEDICAL',
          scoringCriteria: {
            facilityWeight: 0.7,
            constraintWeight: 0.6,
            criticalityLevel: 'HIGH',
            impactAreas: ['first_aid', 'emergency_response']
          },
          questions: [
            {
              id: 'q28-1',
              text: 'Disposez-vous d\'une trousse de premiers secours ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Trousse complète et à jour'
            },
            {
              id: 'q28-2',
              text: 'Y a-t-il du personnel formé aux premiers secours ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Formation SST (Sauveteur Secouriste du Travail)'
            }
          ]
        }
      ]
    }
  ]
}

// Helper functions for questionnaire management
export const getObjectiveById = (objectiveId: string): SecurityObjective | undefined => {
  for (const section of SECURITY_QUESTIONNAIRE.sections) {
    const objective = section.objectives.find(obj => obj.id === objectiveId)
    if (objective) return objective
  }
  return undefined
}

export const getQuestionById = (questionId: string): SecurityQuestion | undefined => {
  for (const section of SECURITY_QUESTIONNAIRE.sections) {
    for (const objective of section.objectives) {
      const question = objective.questions.find(q => q.id === questionId)
      if (question) return question
    }
  }
  return undefined
}

export const getTotalQuestions = (): number => {
  return SECURITY_QUESTIONNAIRE.sections.reduce((total, section) =>
    total + section.objectives.reduce((objTotal, obj) => objTotal + obj.questions.length, 0), 0
  )
}

export const getTotalObjectives = (): number => {
  return SECURITY_QUESTIONNAIRE.sections.reduce((total, section) =>
    total + section.objectives.length, 0
  )
}
