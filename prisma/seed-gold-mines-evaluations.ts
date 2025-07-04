import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedGoldMinesEvaluations() {
  console.log('🌱 Creating Gold Mines Inc evaluations...')

  try {
    // Récupérer le premier tenant pour l'exemple
    const tenant = await prisma.tenant.findFirst()
    if (!tenant) {
      console.error('❌ No tenant found. Please run the main seed first.')
      return
    }

    // Informations de l'entreprise Gold Mines Inc (stockées dans les métadonnées des évaluations)
    console.log('🏢 Preparing Gold Mines Inc information...')
    const goldMinesInfo = {
      name: 'Gold Mines Inc',
      type: 'COMPANY',
      description: 'Entreprise d\'extraction aurifère spécialisée dans l\'exploitation minière responsable',
      address: '123 Mining Road, Goldfield District, Johannesburg 2001, Afrique du Sud',
      contactEmail: 'contact@goldmines-inc.com',
      contactPhone: '+27-11-555-0123',
      sector: 'Industrie minière',
      employees: 450,
      foundedYear: 1998,
      website: 'www.goldmines-inc.com',
      certifications: ['ISO 14001', 'ISO 45001', 'Responsible Gold Mining Principles']
    }

    console.log(`✅ Gold Mines Inc information prepared`)

    // Récupérer les modèles d'évaluation
    const completeModel = await prisma.evaluationTemplate.findFirst({
      where: {
        name: 'GAMR - Évaluation Sécuritaire Complète (42 Objectifs)',
        tenantId: tenant.id
      },
      include: {
        questionGroups: {
          include: {
            objectives: {
              include: {
                questions: true
              }
            }
          }
        }
      }
    })

    const propertyModel = await prisma.evaluationTemplate.findFirst({
      where: {
        name: 'GAMR - Évaluation Sécurité des Biens',
        tenantId: tenant.id
      },
      include: {
        questionGroups: {
          include: {
            objectives: {
              include: {
                questions: true
              }
            }
          }
        }
      }
    })

    const personnelModel = await prisma.evaluationTemplate.findFirst({
      where: {
        name: 'GAMR - Évaluation Sécurité des Personnes',
        tenantId: tenant.id
      },
      include: {
        questionGroups: {
          include: {
            objectives: {
              include: {
                questions: true
              }
            }
          }
        }
      }
    })

    if (!completeModel || !propertyModel || !personnelModel) {
      console.error('❌ Evaluation models not found. Please run db:seed-models first.')
      return
    }

    // Créer un utilisateur évaluateur
    const evaluator = await prisma.user.findFirst({
      where: { tenantId: tenant.id }
    }) || await prisma.user.create({
      data: {
        email: 'evaluator@goldmines-inc.com',
        name: 'Sarah Johnson',
        role: 'ADMIN',
        tenantId: tenant.id,
        isActive: true
      }
    })

    console.log('\n📋 Creating evaluations...')

    // 1. Évaluation complète
    console.log('1️⃣ Creating complete evaluation...')
    const completeEvaluation = await createEvaluation(
      'Évaluation Sécuritaire Complète - Gold Mines Inc - Janvier 2024',
      'Évaluation exhaustive de tous les aspects sécuritaires du site principal',
      completeModel,
      goldMinesInfo,
      evaluator,
      'COMPLETE'
    )

    // 2-4. Trois évaluations sécurité des biens
    console.log('2️⃣ Creating property security evaluation 1...')
    const propertyEval1 = await createEvaluation(
      'Audit Sécurité Infrastructures - Gold Mines Inc - Q1 2024',
      'Audit trimestriel des infrastructures et équipements de sécurité',
      propertyModel,
      goldMinesInfo,
      evaluator,
      'PROPERTY_HIGH_RISK'
    )

    console.log('3️⃣ Creating property security evaluation 2...')
    const propertyEval2 = await createEvaluation(
      'Évaluation Périmètre et Accès - Gold Mines Inc - Février 2024',
      'Contrôle spécialisé du périmètre et des points d\'accès',
      propertyModel,
      goldMinesInfo,
      evaluator,
      'PROPERTY_MEDIUM_RISK'
    )

    console.log('4️⃣ Creating property security evaluation 3...')
    const propertyEval3 = await createEvaluation(
      'Audit Systèmes Critiques - Gold Mines Inc - Mars 2024',
      'Vérification des systèmes électriques et de surveillance',
      propertyModel,
      goldMinesInfo,
      evaluator,
      'PROPERTY_LOW_RISK'
    )

    // 5. Évaluation sécurité des personnes
    console.log('5️⃣ Creating personnel security evaluation...')
    const personnelEval = await createEvaluation(
      'Évaluation Sécurité du Personnel - Gold Mines Inc - Janvier 2024',
      'Audit des conditions de travail et formation du personnel',
      personnelModel,
      goldMinesInfo,
      evaluator,
      'PERSONNEL'
    )

    console.log('\n🎉 Gold Mines Inc evaluations created successfully!')
    console.log(`📊 Total evaluations created: 5`)
    console.log(`   - Complete: 1`)
    console.log(`   - Property Security: 3`)
    console.log(`   - Personnel Security: 1`)

  } catch (error) {
    console.error('❌ Error creating Gold Mines evaluations:', error)
    throw error
  }
}

// Fonction helper pour créer une évaluation avec des réponses
async function createEvaluation(
  title: string,
  description: string,
  template: any,
  companyInfo: any,
  evaluator: any,
  scenario: string
) {
  const evaluation = await prisma.evaluation.create({
    data: {
      title,
      status: 'COMPLETED',
      templateId: template.id,
      tenantId: evaluator.tenantId,
      evaluatorId: evaluator.id,
      startedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Dans les 30 derniers jours
      completedAt: new Date(),
      progress: 100.0,
      totalScore: getScenarioScore(scenario),
      riskLevel: getScenarioRiskLevel(scenario),
      entityInfo: {
        ...companyInfo,
        evaluationDetails: {
          scenario,
          location: 'Site principal - Johannesburg',
          weather: 'Ensoleillé, 24°C',
          evaluationDuration: '4h30min',
          description
        },
        evaluator: {
          name: evaluator.name,
          email: evaluator.email,
          role: 'Responsable Sécurité et Environnement'
        }
      }
    }
  })

  // Créer les réponses selon le scénario
  await createResponsesForScenario(evaluation.id, template, scenario)

  return evaluation
}

// Fonction pour générer des scores selon le scénario
function getScenarioScore(scenario: string): number {
  switch (scenario) {
    case 'COMPLETE': return 72
    case 'PROPERTY_HIGH_RISK': return 45
    case 'PROPERTY_MEDIUM_RISK': return 68
    case 'PROPERTY_LOW_RISK': return 85
    case 'PERSONNEL': return 78
    default: return 65
  }
}

function getScenarioRiskLevel(scenario: string): 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  switch (scenario) {
    case 'COMPLETE': return 'MEDIUM'
    case 'PROPERTY_HIGH_RISK': return 'HIGH'
    case 'PROPERTY_MEDIUM_RISK': return 'MEDIUM'
    case 'PROPERTY_LOW_RISK': return 'LOW'
    case 'PERSONNEL': return 'MEDIUM'
    default: return 'MEDIUM'
  }
}

async function createResponsesForScenario(evaluationId: string, template: any, scenario: string) {
  console.log(`   📝 Creating responses for scenario: ${scenario}`)

  const allQuestions = template.questionGroups.flatMap((group: any) =>
    group.objectives.flatMap((obj: any) => obj.questions)
  )

  // Créer des réponses pour toutes les questions selon le scénario
  let responseCount = 0

  for (const question of allQuestions) {
    const responseValue = getRealisticResponse(question, scenario)
    const responseData: any = {
      evaluationId,
      questionId: question.id,
      description: getResponseNote(question, scenario),
      comment: `Confiance: ${getConfidenceLevel(question, scenario)}%`,
      facilityScore: Math.floor(Math.random() * 50) + 50, // 50-100
      constraintScore: Math.floor(Math.random() * 30) + 10 // 10-40
    }

    // Assigner la valeur selon le type de question
    if (question.type === 'YES_NO') {
      responseData.booleanValue = responseValue === 'true'
    } else if (question.type === 'TEXT' || question.type === 'MULTIPLE_CHOICE') {
      responseData.textValue = responseValue
    } else if (question.type === 'NUMBER') {
      responseData.numberValue = parseFloat(responseValue)
    } else {
      responseData.textValue = responseValue
    }

    const response = await prisma.response.create({
      data: responseData
    })
    responseCount++
  }

  console.log(`   ✅ Created ${responseCount} responses`)
}

function getRealisticResponse(question: any, scenario: string): string {
  const questionText = question.text.toLowerCase()

  if (question.type === 'YES_NO') {
    const probability = getYesProbability(questionText, scenario)
    return Math.random() < probability ? 'true' : 'false'
  } else if (question.type === 'TEXT') {
    return getTextResponse(questionText, scenario)
  } else if (question.type === 'NUMBER') {
    return getNumberResponse(questionText, scenario).toString()
  } else if (question.type === 'MULTIPLE_CHOICE') {
    return getMultipleChoiceResponse(questionText, scenario)
  }
  return 'Non spécifié'
}

function getYesProbability(questionText: string, scenario: string): number {
  // Entreprise minière - probabilités réalistes

  // Questions de sécurité physique
  if (questionText.includes('clôture') || questionText.includes('périmètre')) {
    switch (scenario) {
      case 'PROPERTY_HIGH_RISK': return 0.4 // Clôture défaillante
      case 'PROPERTY_MEDIUM_RISK': return 0.7
      case 'PROPERTY_LOW_RISK': return 0.95
      default: return 0.8
    }
  }

  if (questionText.includes('surveillance') || questionText.includes('caméra')) {
    switch (scenario) {
      case 'PROPERTY_HIGH_RISK': return 0.5
      case 'PROPERTY_MEDIUM_RISK': return 0.8
      case 'PROPERTY_LOW_RISK': return 0.9
      default: return 0.75
    }
  }

  if (questionText.includes('éclairage')) {
    return scenario.includes('PROPERTY') ? 0.85 : 0.8
  }

  if (questionText.includes('groupe électrogène') || questionText.includes('générateur')) {
    return 0.9 // Critique pour une mine
  }

  if (questionText.includes('formation') || questionText.includes('sensibilisation')) {
    return scenario === 'PERSONNEL' ? 0.85 : 0.7
  }

  if (questionText.includes('extincteur') || questionText.includes('incendie')) {
    return 0.95 // Obligatoire dans l'industrie minière
  }

  if (questionText.includes('ergonomique') || questionText.includes('confortable')) {
    return scenario === 'PERSONNEL' ? 0.75 : 0.6
  }

  if (questionText.includes('maintenance') || questionText.includes('entretien')) {
    return 0.8
  }

  return 0.7 // Valeur par défaut
}

function getTextResponse(questionText: string, scenario: string): string {
  // Réponses spécifiques à Gold Mines Inc
  if (questionText.includes('nom de l\'entité') || questionText.includes('nom complet')) {
    return 'Gold Mines Inc'
  }
  if (questionText.includes('date de création')) {
    return '15 mars 1998'
  }
  if (questionText.includes('propriétaire')) {
    return 'Marcus Thompson (PDG et actionnaire principal)'
  }
  if (questionText.includes('personne ressource')) {
    return 'Sarah Johnson - Responsable Sécurité et Environnement'
  }
  if (questionText.includes('adresse')) {
    return '123 Mining Road, Goldfield District, Johannesburg 2001, Afrique du Sud'
  }
  if (questionText.includes('téléphone')) {
    return '+27-11-555-0123'
  }
  if (questionText.includes('électronique') || questionText.includes('email')) {
    return 'contact@goldmines-inc.com'
  }
  if (questionText.includes('site internet')) {
    return 'www.goldmines-inc.com'
  }
  if (questionText.includes('emplacement')) {
    return 'Site situé à 45km au nord-est de Johannesburg, dans une zone industrielle minière'
  }
  if (questionText.includes('propose concrètement') || questionText.includes('activité')) {
    return 'Extraction aurifère, traitement de minerais, raffinage d\'or et vente de lingots certifiés'
  }
  if (questionText.includes('production') || questionText.includes('chaîne')) {
    return 'Extraction → Concassage → Broyage → Flottation → Cyanuration → Électrolyse → Raffinage → Coulée'
  }
  if (questionText.includes('productions')) {
    return 'Lingots d\'or 99.9%, concentrés aurifères, sous-produits argentifères'
  }
  if (questionText.includes('concurrents')) {
    return 'AngloGold Ashanti, Gold Fields, Harmony Gold Mining dans la région'
  }
  if (questionText.includes('ambitions')) {
    return 'Devenir le leader régional de l\'extraction aurifère responsable avec certification carbone neutre d\'ici 2030'
  }
  if (questionText.includes('matériau') || questionText.includes('matériaux')) {
    return 'Structures en béton armé, charpentes métalliques, revêtements anti-corrosion, équipements en acier inoxydable'
  }
  if (questionText.includes('clé') || questionText.includes('badge') || questionText.includes('garde')) {
    return 'Chef de sécurité (Marcus Williams) et responsable de site (Jennifer Davis)'
  }
  if (questionText.includes('fréquence') && questionText.includes('maintenance')) {
    return 'Maintenance préventive mensuelle, contrôles hebdomadaires, inspections quotidiennes'
  }
  if (questionText.includes('heures d\'ouverture') || questionText.includes('horaires')) {
    return 'Site opérationnel 24h/24, accès administratif 6h00-18h00 en semaine'
  }
  if (questionText.includes('formation') || questionText.includes('programme')) {
    return 'Programme de formation sécurité de 40h à l\'embauche, recyclage trimestriel, certifications spécialisées'
  }

  return 'Information documentée dans les registres de sécurité de Gold Mines Inc'
}

function getNumberResponse(questionText: string, scenario: string): number {
  if (questionText.includes('employés') || questionText.includes('personnel')) return 450
  if (questionText.includes('entrées secondaires')) return 4
  if (questionText.includes('véhicules') || questionText.includes('flotte')) return 28
  if (questionText.includes('personnes quotidiennement') || questionText.includes('visiteurs')) return 85
  if (questionText.includes('hauteur') && questionText.includes('clôture')) return 280 // 2.8m
  if (questionText.includes('largeur') || questionText.includes('passage')) return 450 // 4.5m
  return Math.floor(Math.random() * 10) + 1
}

function getMultipleChoiceResponse(questionText: string, scenario: string): string {
  if (questionText.includes('secteur') || questionText.includes('activité')) {
    return 'Industrie manufacturière'
  }
  if (questionText.includes('hauteur') && questionText.includes('clôture')) {
    return 'Plus de 2,5m'
  }
  return 'Autre'
}

function getConfidenceLevel(question: any, scenario: string): number {
  // Niveau de confiance basé sur le type de question et le scénario
  const questionText = question.text.toLowerCase()

  if (questionText.includes('nom') || questionText.includes('adresse')) {
    return 100 // Information factuelle
  }

  if (scenario.includes('PROPERTY') && questionText.includes('surveillance')) {
    return Math.floor(Math.random() * 20) + 80 // 80-100%
  }

  if (scenario === 'PERSONNEL' && questionText.includes('formation')) {
    return Math.floor(Math.random() * 15) + 85 // 85-100%
  }

  return Math.floor(Math.random() * 30) + 70 // 70-100%
}

function getResponseNote(question: any, scenario: string): string {
  const questionText = question.text.toLowerCase()

  // Notes spécifiques selon le contexte
  if (questionText.includes('clôture')) {
    const notes = [
      'Clôture périmétrique conforme aux standards miniers',
      'Inspection mensuelle de l\'intégrité de la clôture',
      'Remplacement prévu section nord en Q2 2024',
      'Hauteur conforme aux exigences de sécurité'
    ]
    return notes[Math.floor(Math.random() * notes.length)]
  }

  if (questionText.includes('formation')) {
    const notes = [
      'Programme de formation certifié ISO 45001',
      'Taux de participation: 98% du personnel',
      'Formation dispensée par organisme agréé',
      'Mise à jour selon évolution réglementaire'
    ]
    return notes[Math.floor(Math.random() * notes.length)]
  }

  if (questionText.includes('surveillance') || questionText.includes('caméra')) {
    const notes = [
      'Système de vidéosurveillance HD 24h/24',
      'Enregistrement conservé 30 jours',
      'Monitoring depuis poste de sécurité central',
      'Maintenance trimestrielle par prestataire'
    ]
    return notes[Math.floor(Math.random() * notes.length)]
  }

  if (questionText.includes('électrique') || questionText.includes('générateur')) {
    const notes = [
      'Groupe électrogène testé mensuellement',
      'Autonomie de 72h en cas de panne réseau',
      'Maintenance préventive par électricien certifié',
      'Conformité aux normes électriques minières'
    ]
    return notes[Math.floor(Math.random() * notes.length)]
  }

  // Notes génériques
  const genericNotes = [
    'Conforme aux standards de l\'industrie minière',
    'Procédure documentée et appliquée',
    'Contrôle qualité effectué régulièrement',
    'Amélioration continue en cours',
    'Conforme aux réglementations sud-africaines',
    'Audit interne validé'
  ]
  return genericNotes[Math.floor(Math.random() * genericNotes.length)]
}

function getAttachments(question: any, scenario: string): any {
  // Simule des pièces jointes selon le type de question
  const questionText = question.text.toLowerCase()

  if (questionText.includes('plan') || questionText.includes('installation')) {
    return {
      files: ['plan_site_goldmines_2024.pdf', 'schema_installations.dwg'],
      photos: ['vue_aerienne_site.jpg']
    }
  }

  if (questionText.includes('certificat') || questionText.includes('formation')) {
    return {
      files: ['certificats_formation_2024.pdf', 'registre_formations.xlsx']
    }
  }

  if (questionText.includes('surveillance') || questionText.includes('caméra')) {
    return {
      photos: ['cameras_perimetrie.jpg', 'poste_surveillance.jpg']
    }
  }

  return null
}

async function main() {
  try {
    await seedGoldMinesEvaluations()
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

export { seedGoldMinesEvaluations }
