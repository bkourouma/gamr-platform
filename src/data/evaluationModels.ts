import type { QuestionnaireData, QuestionSection, SecurityObjective, SecurityQuestion } from './securityQuestionnaire'

// ===== MODÈLE COMPLET - 42 OBJECTIFS =====
export const COMPLETE_SECURITY_MODEL: QuestionnaireData = {
  id: 'gamr-complete-security-v1',
  title: 'GAMR - Évaluation Sécuritaire Complète (42 Objectifs)',
  description: 'Questionnaire complet d\'évaluation des risques sécuritaires avec 42 objectifs couvrant tous les aspects de la sécurité des biens et des personnes',
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
        },
        {
          id: 'obj-8',
          objectiveNumber: 8,
          title: 'Diagnostic des systèmes de surveillance',
          description: 'Évaluation des moyens de surveillance et détection',
          category: 'SURVEILLANCE',
          scoringCriteria: {
            facilityWeight: 0.8,
            constraintWeight: 0.7,
            criticalityLevel: 'HIGH',
            impactAreas: ['surveillance', 'intrusion_detection']
          },
          questions: [
            {
              id: 'q8-1',
              text: 'Disposez-vous d\'un système de vidéosurveillance ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Caméras de surveillance couvrant les zones sensibles'
            },
            {
              id: 'q8-2',
              text: 'Le système de surveillance fonctionne-t-il 24h/24 ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Surveillance continue ou programmée'
            },
            {
              id: 'q8-3',
              text: 'Y a-t-il un système d\'alarme anti-intrusion ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Détecteurs de mouvement, contacts de porte, etc.'
            }
          ]
        }
      ]
    },
    {
      id: 'building-security',
      title: 'Sécurité du Bâtiment',
      description: 'Évaluation de la sécurité structurelle et des locaux',
      icon: 'Home',
      color: 'info',
      objectives: [
        {
          id: 'obj-9',
          objectiveNumber: 9,
          title: 'Diagnostic de la structure du bâtiment',
          description: 'Évaluation de la solidité et sécurité structurelle',
          category: 'BUILDING',
          scoringCriteria: {
            facilityWeight: 0.8,
            constraintWeight: 0.9,
            criticalityLevel: 'HIGH',
            impactAreas: ['structural_safety', 'building_integrity']
          },
          questions: [
            {
              id: 'q9-1',
              text: 'Le bâtiment respecte-t-il les normes de construction en vigueur ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Conformité aux normes parasismiques et de sécurité'
            },
            {
              id: 'q9-2',
              text: 'Y a-t-il des fissures visibles dans la structure ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Inspection visuelle des murs, plafonds et fondations'
            }
          ]
        },
        {
          id: 'obj-10',
          objectiveNumber: 10,
          title: 'Diagnostic des fenêtres et ouvertures',
          description: 'Évaluation de la sécurité des fenêtres et ouvertures',
          category: 'BUILDING',
          scoringCriteria: {
            facilityWeight: 0.7,
            constraintWeight: 0.8,
            criticalityLevel: 'MEDIUM',
            impactAreas: ['physical_security', 'intrusion_prevention']
          },
          questions: [
            {
              id: 'q10-1',
              text: 'Les fenêtres du rez-de-chaussée sont-elles sécurisées ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Barreaux, volets roulants ou vitrage sécurisé'
            },
            {
              id: 'q10-2',
              text: 'Les fenêtres disposent-elles de systèmes de verrouillage ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Serrures ou systèmes de fermeture sécurisés'
            }
          ]
        },
        {
          id: 'obj-11',
          objectiveNumber: 11,
          title: 'Diagnostic des toitures et terrasses',
          description: 'Évaluation de la sécurité des accès en hauteur',
          category: 'BUILDING',
          scoringCriteria: {
            facilityWeight: 0.6,
            constraintWeight: 0.7,
            criticalityLevel: 'MEDIUM',
            impactAreas: ['roof_security', 'height_access']
          },
          questions: [
            {
              id: 'q11-1',
              text: 'L\'accès à la toiture est-il sécurisé ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Trappe verrouillée ou accès contrôlé'
            },
            {
              id: 'q11-2',
              text: 'Y a-t-il des garde-corps sur les terrasses accessibles ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Protection contre les chutes de hauteur'
            }
          ]
        }
      ]
    },
    {
      id: 'equipment-security',
      title: 'Sécurité des Équipements',
      description: 'Évaluation de la sécurité des équipements et matériels',
      icon: 'Settings',
      color: 'secondary',
      objectives: [
        {
          id: 'obj-12',
          objectiveNumber: 12,
          title: 'Diagnostic des équipements informatiques',
          description: 'Évaluation de la sécurité du matériel informatique',
          category: 'EQUIPMENT',
          scoringCriteria: {
            facilityWeight: 0.8,
            constraintWeight: 0.8,
            criticalityLevel: 'HIGH',
            impactAreas: ['equipment_security', 'data_protection']
          },
          questions: [
            {
              id: 'q12-1',
              text: 'Les équipements informatiques sont-ils physiquement sécurisés ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Câbles antivol, armoires verrouillées, fixation au mobilier'
            },
            {
              id: 'q12-2',
              text: 'Y a-t-il un inventaire à jour des équipements ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Liste complète avec numéros de série et responsables'
            }
          ]
        },
        {
          id: 'obj-13',
          objectiveNumber: 13,
          title: 'Diagnostic des équipements de production',
          description: 'Évaluation de la sécurité des machines et équipements de production',
          category: 'EQUIPMENT',
          scoringCriteria: {
            facilityWeight: 0.9,
            constraintWeight: 0.9,
            criticalityLevel: 'CRITICAL',
            impactAreas: ['production_safety', 'equipment_protection']
          },
          questions: [
            {
              id: 'q13-1',
              text: 'Les machines dangereuses sont-elles protégées ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Protections, arrêts d\'urgence, signalisation'
            },
            {
              id: 'q13-2',
              text: 'Y a-t-il une maintenance préventive programmée ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Planning de maintenance et contrôles réguliers'
            }
          ]
        },
        {
          id: 'obj-14',
          objectiveNumber: 14,
          title: 'Diagnostic des véhicules et engins',
          description: 'Évaluation de la sécurité des véhicules d\'entreprise',
          category: 'VEHICLES',
          scoringCriteria: {
            facilityWeight: 0.7,
            constraintWeight: 0.8,
            criticalityLevel: 'MEDIUM',
            impactAreas: ['vehicle_security', 'transport_safety']
          },
          questions: [
            {
              id: 'q14-1',
              text: 'Les véhicules sont-ils garés dans un lieu sécurisé ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Parking fermé, surveillé ou éclairé'
            },
            {
              id: 'q14-2',
              text: 'Y a-t-il un système de géolocalisation sur les véhicules ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'GPS ou système de tracking pour la sécurité'
            }
          ]
        }
      ]
    },
    {
      id: 'personnel-training',
      title: 'Formation et Sensibilisation du Personnel',
      description: 'Évaluation de la formation sécuritaire du personnel',
      icon: 'GraduationCap',
      color: 'success',
      objectives: [
        {
          id: 'obj-15',
          objectiveNumber: 15,
          title: 'Diagnostic de la formation sécurité',
          description: 'Évaluation des programmes de formation à la sécurité',
          category: 'TRAINING',
          scoringCriteria: {
            facilityWeight: 0.8,
            constraintWeight: 0.6,
            criticalityLevel: 'HIGH',
            impactAreas: ['personnel_training', 'security_awareness']
          },
          questions: [
            {
              id: 'q15-1',
              text: 'Le personnel reçoit-il une formation sécurité à l\'embauche ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Formation obligatoire sur les consignes de sécurité'
            },
            {
              id: 'q15-2',
              text: 'Y a-t-il des formations de recyclage régulières ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Mise à jour des connaissances sécuritaires'
            },
            {
              id: 'q15-3',
              text: 'Le personnel connaît-il les procédures d\'urgence ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Évacuation, alerte, premiers secours'
            }
          ]
        },
        {
          id: 'obj-16',
          objectiveNumber: 16,
          title: 'Diagnostic de la sensibilisation aux risques',
          description: 'Évaluation de la culture sécuritaire',
          category: 'AWARENESS',
          scoringCriteria: {
            facilityWeight: 0.7,
            constraintWeight: 0.5,
            criticalityLevel: 'MEDIUM',
            impactAreas: ['risk_awareness', 'safety_culture']
          },
          questions: [
            {
              id: 'q16-1',
              text: 'Y a-t-il des campagnes de sensibilisation sécurité ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Affiches, réunions, communications internes'
            },
            {
              id: 'q16-2',
              text: 'Le personnel peut-il signaler facilement les incidents ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Système de remontée d\'information accessible'
            }
          ]
        },
        {
          id: 'obj-17',
          objectiveNumber: 17,
          title: 'Diagnostic des habilitations et certifications',
          description: 'Évaluation des qualifications sécuritaires du personnel',
          category: 'CERTIFICATIONS',
          scoringCriteria: {
            facilityWeight: 0.8,
            constraintWeight: 0.7,
            criticalityLevel: 'HIGH',
            impactAreas: ['personnel_qualifications', 'regulatory_compliance']
          },
          questions: [
            {
              id: 'q17-1',
              text: 'Le personnel a-t-il les habilitations requises ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Habilitations électriques, CACES, etc.'
            },
            {
              id: 'q17-2',
              text: 'Les certifications sont-elles à jour ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Suivi des dates de validité et renouvellements'
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
        },
        {
          id: 'obj-19',
          objectiveNumber: 19,
          title: 'Diagnostic de l\'éclairage et ventilation',
          description: 'Évaluation de la qualité de l\'environnement de travail',
          category: 'ENVIRONMENT',
          scoringCriteria: {
            facilityWeight: 0.7,
            constraintWeight: 0.6,
            criticalityLevel: 'MEDIUM',
            impactAreas: ['work_environment', 'health_safety']
          },
          questions: [
            {
              id: 'q19-1',
              text: 'L\'éclairage des postes de travail est-il suffisant ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Minimum 500 lux pour le travail de bureau'
            },
            {
              id: 'q19-2',
              text: 'La ventilation est-elle adaptée ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Renouvellement d\'air et température contrôlée'
            }
          ]
        },
        {
          id: 'obj-20',
          objectiveNumber: 20,
          title: 'Diagnostic du bruit et nuisances',
          description: 'Évaluation des nuisances sonores et environnementales',
          category: 'NOISE',
          scoringCriteria: {
            facilityWeight: 0.6,
            constraintWeight: 0.7,
            criticalityLevel: 'MEDIUM',
            impactAreas: ['noise_control', 'work_comfort']
          },
          questions: [
            {
              id: 'q20-1',
              text: 'Le niveau sonore est-il acceptable ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Maximum 55 dB pour le travail de bureau'
            },
            {
              id: 'q20-2',
              text: 'Y a-t-il des protections contre le bruit ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Isolation phonique, équipements de protection'
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
          id: 'obj-21',
          objectiveNumber: 21,
          title: 'Diagnostic de l\'hygiène et santé au travail',
          description: 'Évaluation des conditions d\'hygiène et de santé',
          category: 'HEALTH',
          scoringCriteria: {
            facilityWeight: 0.7,
            constraintWeight: 0.6,
            criticalityLevel: 'HIGH',
            impactAreas: ['workplace_health', 'hygiene_standards']
          },
          questions: [
            {
              id: 'q21-1',
              text: 'Les installations sanitaires sont-elles en bon état ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Toilettes, lavabos, vestiaires propres et fonctionnels'
            },
            {
              id: 'q21-2',
              text: 'Y a-t-il des équipements de protection individuelle ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'EPI adaptés aux risques du poste de travail'
            }
          ]
        },
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
      id: 'transport-logistics',
      title: 'Transport et Logistique',
      description: 'Évaluation de la sécurité des transports et de la logistique',
      icon: 'Truck',
      color: 'warning',
      objectives: [
        {
          id: 'obj-24',
          objectiveNumber: 24,
          title: 'Diagnostic des réseaux et télécommunications',
          description: 'Évaluation de la sécurité des réseaux informatiques',
          category: 'NETWORK',
          scoringCriteria: {
            facilityWeight: 0.8,
            constraintWeight: 0.8,
            criticalityLevel: 'HIGH',
            impactAreas: ['network_security', 'data_transmission']
          },
          questions: [
            {
              id: 'q24-1',
              text: 'Le réseau Wi-Fi est-il sécurisé ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Chiffrement WPA2/WPA3 et mot de passe fort'
            },
            {
              id: 'q24-2',
              text: 'Y a-t-il une séparation entre réseau invité et professionnel ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Isolation des accès externes'
            }
          ]
        },
        {
          id: 'obj-25',
          objectiveNumber: 25,
          title: 'Diagnostic de la sauvegarde et archivage',
          description: 'Évaluation des systèmes de sauvegarde des données',
          category: 'BACKUP',
          scoringCriteria: {
            facilityWeight: 0.9,
            constraintWeight: 0.8,
            criticalityLevel: 'CRITICAL',
            impactAreas: ['data_backup', 'business_continuity']
          },
          questions: [
            {
              id: 'q25-1',
              text: 'Les sauvegardes sont-elles automatisées ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Sauvegarde programmée sans intervention manuelle'
            },
            {
              id: 'q25-2',
              text: 'Les sauvegardes sont-elles testées régulièrement ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Vérification de l\'intégrité et restauration test'
            }
          ]
        },
        {
          id: 'obj-26',
          objectiveNumber: 26,
          title: 'Diagnostic transport-logistique',
          description: 'Évaluation de la sécurité des flux logistiques',
          category: 'LOGISTICS',
          scoringCriteria: {
            facilityWeight: 0.7,
            constraintWeight: 0.8,
            criticalityLevel: 'MEDIUM',
            impactAreas: ['logistics_security', 'supply_chain']
          },
          questions: [
            {
              id: 'q26-1',
              text: 'Les livraisons sont-elles contrôlées ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Vérification des livreurs et des marchandises'
            },
            {
              id: 'q26-2',
              text: 'Y a-t-il une zone de stockage sécurisée ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Entrepôt ou zone de stockage avec accès contrôlé'
            }
          ]
        }
      ]
    }
  ]
}

// ===== MODÈLE SÉCURITÉ DES BIENS =====
export const PROPERTY_SECURITY_MODEL: QuestionnaireData = {
  id: 'gamr-property-security-v1',
  title: 'GAMR - Évaluation Sécurité des Biens',
  description: 'Questionnaire spécialisé pour l\'évaluation de la sécurité des biens, infrastructures et équipements',
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
          title: 'Informations générales de l\'entité',
          description: 'Collecte des informations de base sur l\'organisation et ses biens',
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
              text: 'Le nom de l\'entité',
              type: 'TEXT',
              isRequired: true,
              placeholder: 'Saisissez le nom officiel de l\'entreprise'
            },
            {
              id: 'q1-2',
              text: 'Date de création',
              type: 'TEXT',
              isRequired: true,
              placeholder: 'JJ/MM/AAAA'
            },
            {
              id: 'q1-3',
              text: 'Le nom du propriétaire',
              type: 'TEXT',
              isRequired: true
            },
            {
              id: 'q1-4',
              text: 'L\'adresse postale complète',
              type: 'TEXT',
              isRequired: true,
              placeholder: 'Adresse complète avec code postal et ville'
            },
            {
              id: 'q1-5',
              text: 'Possédez-vous les plans des installations, immeubles et dépendances ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Plans architecturaux et techniques des bâtiments'
            },
            {
              id: 'q1-6',
              text: 'Dans quelle catégorie, les types de matériaux, les installations de l\'entreprise sont-elles faites ? Précisez.',
              type: 'TEXT',
              isRequired: true,
              helpText: 'Béton, métal, bois, etc.'
            },
            {
              id: 'q1-7',
              text: 'Avez-vous déjà été victime d\'inondation ou d\'écoulement d\'eaux dans vos locaux pendant la saison des pluies ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Historique des dégâts des eaux'
            }
          ]
        }
      ]
    },
    {
      id: 'periphery-access',
      title: 'Première ligne de défense : La périphérie',
      description: 'Diagnostic sécuritaire de la voie d\'accès et des environs',
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
              helpText: 'Une voie publique offre généralement plus de sécurité'
            },
            {
              id: 'q2-2',
              text: 'La voie d\'accès a-t-elle un bitumage en bon état ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'État de la chaussée pour l\'accès des secours'
            },
            {
              id: 'q2-3',
              text: 'La voie d\'accès bénéficie-t-elle d\'un éclairage adéquat ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Éclairage public pour la sécurité nocturne'
            },
            {
              id: 'q2-4',
              text: 'La voie d\'accès bénéficie-t-elle d\'une bouche d\'incendie fonctionnelle ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Point d\'eau pour les pompiers'
            },
            {
              id: 'q2-5',
              text: 'Il y a-t-il des poteaux électriques fonctionnels aux alentours de l\'entreprise ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Infrastructure électrique disponible'
            }
          ]
        }
      ]
    },
    {
      id: 'perimeter-security',
      title: 'Deuxième ligne de défense : Le périmètre',
      description: 'Diagnostic sécuritaire de la clôture et de la structure',
      icon: 'Shield',
      color: 'danger',
      objectives: [
        {
          id: 'obj-3',
          objectiveNumber: 3,
          title: 'Diagnostic sécuritaire de la clôture',
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
              text: 'Le périmètre de votre entreprise est-il clôturé ? Indiquez le matériau utilisé pour la clôture',
              type: 'TEXT',
              isRequired: true,
              helpText: 'Type de clôture : grillage, béton, métal, etc.'
            },
            {
              id: 'q3-2',
              text: 'La clôture de votre entreprise atteint-elle 2m40 au moins ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Hauteur minimale recommandée pour la sécurité'
            },
            {
              id: 'q3-3',
              text: 'Votre clôture comprend-elle un dispositif anti-intrusion (barbelé anti-intrusion, alarme anti-intrusion etc.) ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Dispositifs de dissuasion supplémentaires'
            },
            {
              id: 'q3-4',
              text: 'La clôture est-elle éclairée ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Éclairage périmétrique pour la surveillance'
            },
            {
              id: 'q3-5',
              text: 'La clôture de votre entreprise dispose-t-elle de caméras de surveillance fonctionnelles ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Vidéosurveillance du périmètre'
            }
          ]
        },
        {
          id: 'obj-4',
          objectiveNumber: 4,
          title: 'Diagnostic sécuritaire de la structure de l\'entreprise',
          description: 'Évaluation de la sécurité structurelle et des installations',
          category: 'BUILDING',
          scoringCriteria: {
            facilityWeight: 0.8,
            constraintWeight: 0.9,
            criticalityLevel: 'HIGH',
            impactAreas: ['structural_safety', 'building_integrity']
          },
          questions: [
            {
              id: 'q4-1',
              text: 'Les installations de l\'entreprise sont-elles sous vidéos surveillance ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Surveillance des bâtiments et installations'
            },
            {
              id: 'q4-2',
              text: 'Les installations de l\'entreprise sont-elles éclairées ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Éclairage des zones sensibles'
            },
            {
              id: 'q4-3',
              text: 'Il y a-t-il dans l\'entreprise des défauts, des dégradations de sa structure physique ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'État général de la structure'
            },
            {
              id: 'q4-4',
              text: 'Le matériau de construction de l\'entreprise est-il résistant ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Solidité des matériaux de construction'
            }
          ]
        }
      ]
    },
    {
      id: 'entries-access',
      title: 'Troisième ligne de défense : Les entrées et accès',
      description: 'Diagnostic sécuritaire des points d\'entrée et fenêtres',
      icon: 'DoorOpen',
      color: 'warning',
      objectives: [
        {
          id: 'obj-5',
          objectiveNumber: 5,
          title: 'Diagnostic sécuritaire de l\'entrée principale',
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
              id: 'q5-1',
              text: 'L\'entrée principale dispose-t-elle d\'un portail ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Portail de sécurité à l\'entrée'
            },
            {
              id: 'q5-2',
              text: 'Le portail ferme-t-il à clé/de façon biométrique ? Préciser qui garde la clé/le badge d\'accès.',
              type: 'TEXT',
              isRequired: true,
              helpText: 'Type de fermeture et responsable des accès'
            },
            {
              id: 'q5-3',
              text: 'L\'entrée principale est-elle sous vidéo surveillance ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Surveillance de l\'accès principal'
            }
          ]
        },
        {
          id: 'obj-14',
          objectiveNumber: 14,
          title: 'Diagnostic sécuritaire de l\'ensemble des fenêtres',
          description: 'Évaluation de la sécurité des ouvertures',
          category: 'BUILDING',
          scoringCriteria: {
            facilityWeight: 0.7,
            constraintWeight: 0.8,
            criticalityLevel: 'MEDIUM',
            impactAreas: ['physical_security', 'intrusion_prevention']
          },
          questions: [
            {
              id: 'q14-1',
              text: 'La fenêtre dispose-t-elle protection fermant à clé/de façon biométrique etc. ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Sécurisation des fenêtres'
            },
            {
              id: 'q14-2',
              text: 'Le dispositif de fermeture fonctionne-t-il correctement ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'État des systèmes de fermeture'
            },
            {
              id: 'q14-3',
              text: 'La fenêtre dispose-t-elle de rideaux, store etc. ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Protection visuelle et thermique'
            },
            {
              id: 'q14-4',
              text: 'La fenêtre est-elle sous vidéo surveillance ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Surveillance des ouvertures'
            }
          ]
        }
      ]
    },
    {
      id: 'critical-infrastructure',
      title: 'Quatrième ligne de défense : Protection de l\'espace névralgique',
      description: 'Diagnostic des installations électriques, eau et informatiques',
      icon: 'Zap',
      color: 'danger',
      objectives: [
        {
          id: 'obj-16',
          objectiveNumber: 16,
          title: 'Diagnostic sécuritaire de l\'installation électrique',
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
              id: 'q16-1',
              text: 'Le principal point de raccordement au réseau électrique est-il dans le périmètre intérieur de l\'entreprise ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Localisation du point de raccordement'
            },
            {
              id: 'q16-2',
              text: 'Le principal point de raccordement au réseau électrique est-il protégé (niche ou local dédié) ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Protection physique du raccordement'
            },
            {
              id: 'q16-3',
              text: 'Votre entreprise dispose-t-elle de générateur auxiliaire (groupe électrogène, énergie solaire etc.) en cas de panne ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Système de backup électrique'
            },
            {
              id: 'q16-4',
              text: 'Le générateur auxiliaire est-il protégé des intempéries et/ou des intrusions ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Protection du générateur de secours'
            }
          ]
        },
        {
          id: 'obj-17',
          objectiveNumber: 17,
          title: 'Diagnostic sécuritaire de l\'installation d\'eau',
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
              id: 'q17-1',
              text: 'Le principal point de raccordement au réseau d\'eau potable est-il dans le périmètre intérieur de l\'entreprise ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Localisation du point de raccordement eau'
            },
            {
              id: 'q17-2',
              text: 'L\'entreprise dispose-t-elle d\'un point de réserve d\'eau potable ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Réservoir ou citerne d\'eau'
            },
            {
              id: 'q17-3',
              text: 'Le générateur auxiliaire est-il protégé des intempéries ou intrusions ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Protection du système d\'eau de secours'
            }
          ]
        }
      ]
    }
  ]
}

// ===== MODÈLE SÉCURITÉ DES PERSONNES =====
export const PERSONNEL_SECURITY_MODEL: QuestionnaireData = {
  id: 'gamr-personnel-security-v1',
  title: 'GAMR - Évaluation Sécurité des Personnes',
  description: 'Questionnaire spécialisé pour l\'évaluation de la sécurité des personnes, formation et procédures',
  version: '1.0.0',
  sections: [
    {
      id: 'entity-info',
      title: 'Informations sur l\'entité',
      description: 'Identification et caractérisation du personnel',
      icon: 'Users',
      color: 'primary',
      objectives: [
        {
          id: 'obj-1',
          objectiveNumber: 1,
          title: 'Informations générales de l\'entité',
          description: 'Collecte des informations sur l\'organisation et le personnel',
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
              text: 'Le nom de l\'entité',
              type: 'TEXT',
              isRequired: true,
              placeholder: 'Saisissez le nom officiel de l\'entreprise'
            },
            {
              id: 'q1-2',
              text: 'Le nom de la personne ressource',
              type: 'TEXT',
              isRequired: true,
              helpText: 'Responsable sécurité ou contact principal'
            },
            {
              id: 'q1-3',
              text: 'Qu\'est-ce que votre entreprise propose concrètement ?',
              type: 'TEXT',
              isRequired: true,
              helpText: 'Description des activités principales'
            },
            {
              id: 'q1-4',
              text: 'Comment se déroule la production (la chaîne de production) / Comment se déroule la chaîne de distribution',
              type: 'TEXT',
              isRequired: true,
              helpText: 'Processus de travail et organisation'
            }
          ]
        }
      ]
    },
    {
      id: 'workplace-conditions',
      title: 'Conditions de travail et ergonomie',
      description: 'Évaluation de l\'environnement de travail et du bien-être du personnel',
      icon: 'Heart',
      color: 'success',
      objectives: [
        {
          id: 'obj-18',
          objectiveNumber: 18,
          title: 'Diagnostic du matériel de travail (ergonomie)',
          description: 'Évaluation de l\'ergonomie et du confort des postes de travail',
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
              text: 'Les chaises et fauteuils, les bureaux de l\'entreprise sont-ils confortables ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Confort et ergonomie du mobilier'
            },
            {
              id: 'q18-2',
              text: 'Le matériel de travail permet-il un rendu de travail efficient ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Efficacité des outils de travail'
            }
          ]
        }
      ]
    },
    {
      id: 'safety-training',
      title: 'Formation et sensibilisation à la sécurité',
      description: 'Évaluation de la formation sécuritaire du personnel',
      icon: 'GraduationCap',
      color: 'info',
      objectives: [
        {
          id: 'obj-30',
          objectiveNumber: 30,
          title: 'Diagnostic de la capacité des employés à réagir face à la menace',
          description: 'Évaluation de la préparation du personnel aux situations d\'urgence',
          category: 'TRAINING',
          scoringCriteria: {
            facilityWeight: 0.8,
            constraintWeight: 0.6,
            criticalityLevel: 'HIGH',
            impactAreas: ['personnel_training', 'emergency_response']
          },
          questions: [
            {
              id: 'q30-1',
              text: 'Les employés de l\'entreprise ont-ils été formés pour répondre à tous les types d\'incidents susceptibles de survenir (attaques, incendie, explosion, chute, heurts, effondrements de la structure etc.) ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Formation complète aux situations d\'urgence'
            }
          ]
        },
        {
          id: 'obj-33',
          objectiveNumber: 33,
          title: 'Diagnostic de l\'habilité des employés à comprendre la sécurité',
          description: 'Évaluation des programmes de sensibilisation sécuritaire',
          category: 'AWARENESS',
          scoringCriteria: {
            facilityWeight: 0.7,
            constraintWeight: 0.5,
            criticalityLevel: 'MEDIUM',
            impactAreas: ['security_awareness', 'safety_culture']
          },
          questions: [
            {
              id: 'q33-1',
              text: 'Vos activités comprennent-elles un programme d\'éducation ou de sensibilisation sur la sécurité (formation) visant à éduquer, sensibiliser les employés sur l\'importance de la sécurité et sur les méthodes de travail dans un environnement plus sécurisé ? Veuillez élaborer sur le sujet.',
              type: 'TEXT',
              isRequired: true,
              helpText: 'Description des programmes de formation sécurité'
            }
          ]
        },
        {
          id: 'obj-34',
          objectiveNumber: 34,
          title: 'Diagnostic de la communication de sécurité de l\'entreprise',
          description: 'Évaluation de la communication sur la sécurité',
          category: 'COMMUNICATION',
          scoringCriteria: {
            facilityWeight: 0.6,
            constraintWeight: 0.4,
            criticalityLevel: 'MEDIUM',
            impactAreas: ['safety_communication', 'awareness']
          },
          questions: [
            {
              id: 'q34-1',
              text: 'A-t-on posé des affiches, distribué des feuillets, fait des rappels sur la sécurité pour informer les employés des menaces possibles et l\'importance des mesures de sécurité ? Veuillez élaborer sur le sujet.',
              type: 'TEXT',
              isRequired: true,
              helpText: 'Supports de communication sécurité'
            },
            {
              id: 'q34-2',
              text: 'Votre entreprise dispose-t-elle de réseaux de communication installés pour informer les employés et les visiteurs de la procédure de sécurité à suivre en cas d\'urgence ou d\'infraction à la sécurité ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Système d\'alerte et de communication d\'urgence'
            }
          ]
        }
      ]
    },
    {
      id: 'health-safety',
      title: 'Santé et sécurité au travail',
      description: 'Évaluation des conditions de santé et sécurité du personnel',
      icon: 'Shield',
      color: 'danger',
      objectives: [
        {
          id: 'obj-19',
          objectiveNumber: 19,
          title: 'Diagnostic du caractère salubre du cadre de travail',
          description: 'Évaluation de la salubrité de l\'environnement de travail',
          category: 'HEALTH',
          scoringCriteria: {
            facilityWeight: 0.7,
            constraintWeight: 0.6,
            criticalityLevel: 'HIGH',
            impactAreas: ['workplace_health', 'hygiene_standards']
          },
          questions: [
            {
              id: 'q19-1',
              text: 'L\'entreprise dispose-t-elle d\'un service d\'entretien ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Service de nettoyage et maintenance'
            },
            {
              id: 'q19-2',
              text: 'L\'entretien des locaux de l\'entreprise se fait-il régulièrement ? Veuillez préciser la fréquence',
              type: 'TEXT',
              isRequired: true,
              helpText: 'Fréquence du nettoyage des espaces de travail'
            },
            {
              id: 'q19-3',
              text: 'Le personnel de votre entreprise est-il sensibilisé sur l\'entretien de son lieu de travail (hall bureaux etc.)',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Sensibilisation à l\'hygiène du poste de travail'
            }
          ]
        },
        {
          id: 'obj-20',
          objectiveNumber: 20,
          title: 'Diagnostic de la température à l\'intérieur des locaux',
          description: 'Évaluation du confort thermique',
          category: 'COMFORT',
          scoringCriteria: {
            facilityWeight: 0.6,
            constraintWeight: 0.5,
            criticalityLevel: 'MEDIUM',
            impactAreas: ['work_comfort', 'productivity']
          },
          questions: [
            {
              id: 'q20-1',
              text: 'Les locaux de votre entreprise sont-ils climatisés/ventilés ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Système de climatisation ou ventilation'
            },
            {
              id: 'q20-2',
              text: 'La climatisation/ventilation est-elle entretenue régulièrement ? Veuillez préciser la fréquence.',
              type: 'TEXT',
              isRequired: true,
              helpText: 'Maintenance des systèmes de climatisation'
            },
            {
              id: 'q20-3',
              text: 'Votre entreprise dispose-t-elle d\'un réfectoire ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Espace de restauration pour le personnel'
            }
          ]
        },
        {
          id: 'obj-29',
          objectiveNumber: 29,
          title: 'Diagnostic du matériel médical',
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
              id: 'q29-1',
              text: 'Votre entreprise dispose-t-elle d\'une infirmerie/boîte à pharmacie ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Équipements de premiers secours'
            },
            {
              id: 'q29-2',
              text: 'L\'infirmerie/boîte à pharmacie est-elle équipée convenablement et disponible en tout temps ?',
              type: 'YES_NO',
              isRequired: true,
              helpText: 'Accessibilité et complétude des équipements médicaux'
            }
          ]
        }
      ]
    }
  ]
}

// Helper functions
export const getModelById = (modelId: string): QuestionnaireData | undefined => {
  const models = [COMPLETE_SECURITY_MODEL, PROPERTY_SECURITY_MODEL, PERSONNEL_SECURITY_MODEL]
  return models.find(model => model.id === modelId)
}

export const getAllModels = (): QuestionnaireData[] => {
  return [COMPLETE_SECURITY_MODEL, PROPERTY_SECURITY_MODEL, PERSONNEL_SECURITY_MODEL]
}
