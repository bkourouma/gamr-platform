import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedQuestionnaire() {
  console.log('🌱 Début du seeding du questionnaire d\'évaluation...')

  // Récupérer le premier tenant disponible
  const tenant = await prisma.tenant.findFirst()
  if (!tenant) {
    console.error('❌ Aucun tenant trouvé. Exécutez d\'abord le seed principal.')
    return
  }

  console.log(`📋 Utilisation du tenant: ${tenant.name}`)

  // Créer le template d'évaluation principal
  const template = await prisma.evaluationTemplate.create({
    data: {
      name: 'Évaluation Sécurité et Sûreté Standard',
      description: 'Questionnaire complet d\'évaluation sécuritaire basé sur 42 objectifs',
      version: '1.0',
      targetSectors: ['Technologie', 'Santé', 'Finance', 'Industrie', 'Commerce'],
      companySize: ['TPE', 'PME', 'ETI', 'GE'],
      isDefault: true,
      tenantId: tenant.id
    }
  })

  console.log('📋 Template d\'évaluation créé')

  // Section 1: Entité
  const entityGroup = await prisma.questionGroup.create({
    data: {
      title: 'Informations sur l\'entité',
      description: 'Informations de base sur l\'entreprise évaluée',
      orderIndex: 1,
      icon: 'Building',
      color: 'primary',
      templateId: template.id
    }
  })

  const entityObjective = await prisma.objective.create({
    data: {
      title: 'Identification de l\'entité',
      description: 'Collecte des informations de base de l\'entreprise',
      orderIndex: 1,
      weight: 1.0,
      groupId: entityGroup.id
    }
  })

  // Questions de base pour l'entité
  const entityQuestions = [
    { text: 'Nom de l\'entité', type: 'TEXT', required: true },
    { text: 'Date de création', type: 'DATE', required: true },
    { text: 'Nom du propriétaire', type: 'TEXT', required: true },
    { text: 'Nom de la personne ressource', type: 'TEXT', required: true },
    { text: 'Adresse postale complète', type: 'TEXT', required: true },
    { text: 'Numéro de téléphone', type: 'TEXT', required: true },
    { text: 'Adresse électronique', type: 'TEXT', required: true },
    { text: 'Site internet', type: 'TEXT', required: false }
  ]

  for (let i = 0; i < entityQuestions.length; i++) {
    await prisma.question.create({
      data: {
        text: entityQuestions[i].text,
        type: entityQuestions[i].type as any,
        orderIndex: i + 1,
        isRequired: entityQuestions[i].required,
        objectiveId: entityObjective.id,
        weight: 1.0
      }
    })
  }

  // Section 2: Lignes de défenses
  const defenseGroup = await prisma.questionGroup.create({
    data: {
      title: 'Lignes de défenses',
      description: 'Évaluation des différentes lignes de défense sécuritaire',
      orderIndex: 2,
      icon: 'Shield',
      color: 'danger',
      templateId: template.id
    }
  })

  // Objectif 1: Voie d'accès (Première ligne de défense)
  const accessObjective = await prisma.objective.create({
    data: {
      title: 'DIAGNOSTIQUE SECURITAIRE DE LA VOIE D\'ACCES',
      description: 'Évaluation de la sécurité de la voie d\'accès principale',
      orderIndex: 1,
      weight: 2.0, // Poids plus élevé car critique
      groupId: defenseGroup.id
    }
  })

  // Questions pour la voie d'accès (échantillon des 27 questions)
  const accessQuestions = [
    'La voie d\'accès à votre entreprise est-elle une voie publique ?',
    'La voie d\'accès a-t-elle un bitumage en bon état ?',
    'La voie d\'accès est-elle une voie à double sens ?',
    'La voie d\'accès est-elle sous vidéo surveillance publique ?',
    'La voie d\'accès est-elle une ligne droite ?',
    'La voie d\'accès bénéficie-t-elle d\'un éclairage adéquat ?',
    'La voie d\'accès dispose-t-elle de ralentisseurs ?',
    'La voie d\'accès bénéficie-t-elle d\'une bouche d\'incendie fonctionnelle ?'
  ]

  for (let i = 0; i < accessQuestions.length; i++) {
    await prisma.question.create({
      data: {
        text: accessQuestions[i],
        type: 'YES_NO',
        orderIndex: i + 1,
        isRequired: true,
        objectiveId: accessObjective.id,
        weight: 1.0,
        helpText: 'Répondez par Oui ou Non et ajoutez des précisions si nécessaire'
      }
    })
  }

  // Objectif 2: Clôture (Deuxième ligne de défense)
  const fenceObjective = await prisma.objective.create({
    data: {
      title: 'DIAGNOSTIQUE SECURITAIRE DE LA CLOTURE',
      description: 'Évaluation de la sécurité du périmètre et de la clôture',
      orderIndex: 2,
      weight: 2.0,
      groupId: defenseGroup.id
    }
  })

  const fenceQuestions = [
    'Le périmètre de votre entreprise est-il clôturé ?',
    'La clôture de votre entreprise atteint-elle 2m40 au moins ?',
    'Votre clôture comprend-elle un dispositif anti-intrusion ?',
    'Votre clôture a-t-elle déjà été forcée par des tiers ?',
    'Des agents de sécurité patrouillent-ils le périmètre ?',
    'La clôture est-elle éclairée ?',
    'La clôture dispose-t-elle de caméras de surveillance fonctionnelles ?'
  ]

  for (let i = 0; i < fenceQuestions.length; i++) {
    await prisma.question.create({
      data: {
        text: fenceQuestions[i],
        type: 'YES_NO',
        orderIndex: i + 1,
        isRequired: true,
        objectiveId: fenceObjective.id,
        weight: 1.0
      }
    })
  }

  // Section 3: Infrastructures critiques
  const infraGroup = await prisma.questionGroup.create({
    data: {
      title: 'Infrastructures critiques',
      description: 'Évaluation des systèmes électriques, eau et communication',
      orderIndex: 3,
      icon: 'Zap',
      color: 'warning',
      templateId: template.id
    }
  })

  // Objectif 16: Installation électrique
  const electricObjective = await prisma.objective.create({
    data: {
      title: 'DIAGNOSTIQUE SECURITAIRE DE L\'INSTALLATION ELECTRIQUE',
      description: 'Évaluation de la sécurité du système électrique',
      orderIndex: 16,
      weight: 1.5,
      groupId: infraGroup.id
    }
  })

  const electricQuestions = [
    'Le principal point de raccordement au réseau électrique est-il dans le périmètre intérieur ?',
    'Le principal point de raccordement est-il protégé ?',
    'Le dispositif électrique visible est-il bien isolé ?',
    'Le système électrique bénéficie-t-il d\'un dispositif antifoudre ?',
    'Votre entreprise dispose-t-elle d\'un générateur auxiliaire ?'
  ]

  for (let i = 0; i < electricQuestions.length; i++) {
    await prisma.question.create({
      data: {
        text: electricQuestions[i],
        type: 'YES_NO',
        orderIndex: i + 1,
        isRequired: true,
        objectiveId: electricObjective.id,
        weight: 1.0
      }
    })
  }

  // Section 4: Ergonomie et commodités
  const ergoGroup = await prisma.questionGroup.create({
    data: {
      title: 'Ergonomie et commodités',
      description: 'Évaluation du confort et de la salubrité des locaux',
      orderIndex: 4,
      icon: 'Users',
      color: 'success',
      templateId: template.id
    }
  })

  // Objectif 18: Matériel de travail
  const workMaterialObjective = await prisma.objective.create({
    data: {
      title: 'DIAGNOSTIQUE SECURITAIRE DU MATERIEL DE TRAVAIL',
      description: 'Évaluation de l\'ergonomie du matériel de travail',
      orderIndex: 18,
      weight: 1.0,
      groupId: ergoGroup.id
    }
  })

  const workMaterialQuestions = [
    'Les chaises et fauteuils, les bureaux de l\'entreprise sont-ils confortables ?',
    'Le matériel de travail permet-il un rendu de travail efficient ?'
  ]

  for (let i = 0; i < workMaterialQuestions.length; i++) {
    await prisma.question.create({
      data: {
        text: workMaterialQuestions[i],
        type: 'YES_NO',
        orderIndex: i + 1,
        isRequired: true,
        objectiveId: workMaterialObjective.id,
        weight: 1.0
      }
    })
  }

  console.log('✅ Questionnaire d\'évaluation créé avec succès!')
  console.log(`📊 Template ID: ${template.id}`)
  console.log('🎯 Sections créées:')
  console.log('  - Informations sur l\'entité')
  console.log('  - Lignes de défenses')
  console.log('  - Infrastructures critiques')
  console.log('  - Ergonomie et commodités')
}

async function main() {
  try {
    await seedQuestionnaire()
  } catch (error) {
    console.error('❌ Erreur lors du seeding du questionnaire:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
