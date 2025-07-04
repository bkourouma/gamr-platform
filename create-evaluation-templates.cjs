const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Définition des 10 modèles d'évaluation
const EVALUATION_TEMPLATES = [
  {
    name: 'Évaluation Cybersécurité PME',
    description: 'Questionnaire spécialisé pour évaluer la maturité cybersécurité des PME',
    version: '1.0',
    targetSectors: ['Technologie', 'Commerce', 'Services'],
    companySize: ['TPE', 'PME'],
    questionGroups: [
      {
        title: 'Infrastructure IT',
        description: 'Évaluation de l\'infrastructure informatique',
        icon: 'Server',
        color: 'blue',
        objectives: [
          {
            title: 'Sécurité des serveurs',
            description: 'Évaluation de la sécurité des serveurs et systèmes',
            questions: [
              { text: 'Vos serveurs sont-ils protégés par un antivirus professionnel ?', type: 'YES_NO' },
              { text: 'Combien de serveurs physiques possédez-vous ?', type: 'NUMBER' },
              { text: 'Fréquence des mises à jour de sécurité', type: 'MULTIPLE_CHOICE', options: ['Automatique', 'Hebdomadaire', 'Mensuelle', 'Trimestrielle', 'Jamais'] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Audit Conformité RGPD',
    description: 'Évaluation complète de la conformité au Règlement Général sur la Protection des Données',
    version: '1.0',
    targetSectors: ['Santé', 'Finance', 'Commerce', 'Services'],
    companySize: ['PME', 'ETI', 'GE'],
    questionGroups: [
      {
        title: 'Traitement des données',
        description: 'Gestion et traitement des données personnelles',
        icon: 'Shield',
        color: 'green',
        objectives: [
          {
            title: 'Registre des traitements',
            description: 'Tenue du registre des activités de traitement',
            questions: [
              { text: 'Disposez-vous d\'un registre des traitements à jour ?', type: 'YES_NO' },
              { text: 'Qui est responsable de la mise à jour du registre ?', type: 'TEXT' },
              { text: 'Évaluez la complétude de votre registre', type: 'SCALE' }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Évaluation Sécurité Industrielle',
    description: 'Questionnaire pour l\'évaluation des risques en environnement industriel',
    version: '1.0',
    targetSectors: ['Industrie', 'Énergie', 'Chimie'],
    companySize: ['PME', 'ETI', 'GE'],
    questionGroups: [
      {
        title: 'Sécurité des équipements',
        description: 'Sécurité des machines et équipements industriels',
        icon: 'Cog',
        color: 'orange',
        objectives: [
          {
            title: 'Maintenance préventive',
            description: 'Programme de maintenance préventive des équipements',
            questions: [
              { text: 'Avez-vous un programme de maintenance préventive ?', type: 'YES_NO' },
              { text: 'Fréquence des inspections de sécurité', type: 'MULTIPLE_CHOICE', options: ['Quotidienne', 'Hebdomadaire', 'Mensuelle', 'Trimestrielle'] },
              { text: 'Date de la dernière inspection complète', type: 'DATE' }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Audit Sécurité Financière',
    description: 'Évaluation des risques financiers et de la sécurité des transactions',
    version: '1.0',
    targetSectors: ['Finance', 'Banque', 'Assurance'],
    companySize: ['PME', 'ETI', 'GE'],
    questionGroups: [
      {
        title: 'Contrôles financiers',
        description: 'Procédures de contrôle et validation financière',
        icon: 'DollarSign',
        color: 'emerald',
        objectives: [
          {
            title: 'Séparation des tâches',
            description: 'Séparation des responsabilités dans les processus financiers',
            questions: [
              { text: 'Les fonctions d\'autorisation et d\'exécution sont-elles séparées ?', type: 'YES_NO' },
              { text: 'Nombre de personnes autorisées à valider les paiements', type: 'NUMBER' },
              { text: 'Montant maximum autorisé par personne (€)', type: 'NUMBER' }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Évaluation Télétravail',
    description: 'Questionnaire pour évaluer la sécurité et l\'organisation du télétravail',
    version: '1.0',
    targetSectors: ['Technologie', 'Services', 'Conseil'],
    companySize: ['TPE', 'PME', 'ETI'],
    questionGroups: [
      {
        title: 'Sécurité à distance',
        description: 'Mesures de sécurité pour le travail à distance',
        icon: 'Home',
        color: 'purple',
        objectives: [
          {
            title: 'Accès sécurisé',
            description: 'Sécurisation des accès distants',
            questions: [
              { text: 'Utilisez-vous un VPN pour les connexions distantes ?', type: 'YES_NO' },
              { text: 'L\'authentification à deux facteurs est-elle obligatoire ?', type: 'YES_NO' },
              { text: 'Évaluez la sécurité de vos connexions distantes', type: 'SCALE' }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Audit Sécurité Santé',
    description: 'Évaluation spécialisée pour les établissements de santé et données médicales',
    version: '1.0',
    targetSectors: ['Santé', 'Médical', 'Pharmacie'],
    companySize: ['PME', 'ETI', 'GE'],
    questionGroups: [
      {
        title: 'Protection des données patients',
        description: 'Sécurité et confidentialité des données médicales',
        icon: 'Heart',
        color: 'red',
        objectives: [
          {
            title: 'Accès aux dossiers médicaux',
            description: 'Contrôle d\'accès aux informations patients',
            questions: [
              { text: 'L\'accès aux dossiers patients est-il tracé et audité ?', type: 'YES_NO' },
              { text: 'Combien de personnes ont accès aux dossiers complets ?', type: 'NUMBER' },
              { text: 'Fréquence de révision des droits d\'accès', type: 'MULTIPLE_CHOICE', options: ['Mensuelle', 'Trimestrielle', 'Semestrielle', 'Annuelle'] }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Évaluation Continuité d\'Activité',
    description: 'Plan de continuité d\'activité et gestion de crise',
    version: '1.0',
    targetSectors: ['Tous secteurs'],
    companySize: ['PME', 'ETI', 'GE'],
    questionGroups: [
      {
        title: 'Plan de continuité',
        description: 'Préparation et gestion des situations de crise',
        icon: 'RefreshCw',
        color: 'indigo',
        objectives: [
          {
            title: 'Procédures d\'urgence',
            description: 'Existence et test des procédures d\'urgence',
            questions: [
              { text: 'Disposez-vous d\'un plan de continuité d\'activité documenté ?', type: 'YES_NO' },
              { text: 'Date du dernier test du plan de continuité', type: 'DATE' },
              { text: 'Évaluez l\'efficacité de votre plan de continuité', type: 'SCALE' }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Audit Sécurité E-commerce',
    description: 'Évaluation spécialisée pour les plateformes de commerce électronique',
    version: '1.0',
    targetSectors: ['Commerce', 'E-commerce', 'Retail'],
    companySize: ['TPE', 'PME', 'ETI'],
    questionGroups: [
      {
        title: 'Sécurité des transactions',
        description: 'Protection des paiements et données clients',
        icon: 'ShoppingCart',
        color: 'yellow',
        objectives: [
          {
            title: 'Paiements sécurisés',
            description: 'Sécurisation des transactions financières',
            questions: [
              { text: 'Votre site est-il certifié PCI DSS ?', type: 'YES_NO' },
              { text: 'Utilisez-vous un certificat SSL/TLS valide ?', type: 'YES_NO' },
              { text: 'Nombre de tentatives de fraude détectées par mois', type: 'NUMBER' }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Évaluation Sécurité Physique',
    description: 'Audit complet de la sécurité physique des locaux',
    version: '1.0',
    targetSectors: ['Tous secteurs'],
    companySize: ['TPE', 'PME', 'ETI', 'GE'],
    questionGroups: [
      {
        title: 'Contrôle d\'accès physique',
        description: 'Sécurisation des accès aux locaux',
        icon: 'Lock',
        color: 'gray',
        objectives: [
          {
            title: 'Systèmes d\'accès',
            description: 'Contrôle et surveillance des accès',
            questions: [
              { text: 'Disposez-vous d\'un système de badges d\'accès ?', type: 'YES_NO' },
              { text: 'Les zones sensibles sont-elles sous vidéosurveillance ?', type: 'YES_NO' },
              { text: 'Durée de conservation des enregistrements (jours)', type: 'NUMBER' }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'Audit Environnemental et RSE',
    description: 'Évaluation des risques environnementaux et de responsabilité sociale',
    version: '1.0',
    targetSectors: ['Industrie', 'Énergie', 'Transport'],
    companySize: ['PME', 'ETI', 'GE'],
    questionGroups: [
      {
        title: 'Impact environnemental',
        description: 'Gestion des risques environnementaux',
        icon: 'Leaf',
        color: 'green',
        objectives: [
          {
            title: 'Gestion des déchets',
            description: 'Traitement et élimination des déchets',
            questions: [
              { text: 'Avez-vous un plan de gestion des déchets ?', type: 'YES_NO' },
              { text: 'Pourcentage de déchets recyclés', type: 'NUMBER' },
              { text: 'Évaluez votre impact environnemental', type: 'SCALE' }
            ]
          }
        ]
      }
    ]
  }
]

async function createEvaluationTemplates() {
  console.log('📋 Création de 10 modèles d\'évaluation...')

  try {
    // Récupérer les tenants existants
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true }
    })

    if (tenants.length === 0) {
      console.error('❌ Aucun tenant actif trouvé. Veuillez d\'abord exécuter le seed principal.')
      return
    }

    console.log(`🏢 ${tenants.length} tenant(s) actif(s) trouvé(s)`)

    let totalCreated = 0

    // Créer les templates pour chaque tenant
    for (const tenant of tenants) {
      console.log(`\n📝 Création des templates pour ${tenant.name}...`)

      for (const [index, templateData] of EVALUATION_TEMPLATES.entries()) {
        try {
          // Vérifier si le template existe déjà
          const existingTemplate = await prisma.evaluationTemplate.findFirst({
            where: {
              name: templateData.name,
              tenantId: tenant.id
            }
          })

          if (existingTemplate) {
            console.log(`   ⚠️  Template "${templateData.name}" existe déjà, ignoré`)
            continue
          }

          // Créer le template avec ses groupes de questions
          const createdTemplate = await prisma.evaluationTemplate.create({
            data: {
              name: templateData.name,
              description: templateData.description,
              version: templateData.version,
              targetSectors: templateData.targetSectors,
              companySize: templateData.companySize,
              isActive: true,
              isDefault: index === 0, // Le premier template est défini comme défaut
              tenantId: tenant.id,
              questionGroups: {
                create: templateData.questionGroups.map((group, groupIndex) => ({
                  title: group.title,
                  description: group.description,
                  orderIndex: groupIndex,
                  icon: group.icon,
                  color: group.color,
                  objectives: {
                    create: group.objectives.map((objective, objIndex) => ({
                      title: objective.title,
                      description: objective.description,
                      orderIndex: objIndex,
                      weight: 1.0,
                      questions: {
                        create: objective.questions.map((question, qIndex) => ({
                          text: question.text,
                          type: question.type,
                          orderIndex: qIndex,
                          isRequired: true,
                          weight: 1.0,
                          ...(question.options && { helpText: `Options: ${question.options.join(', ')}` })
                        }))
                      }
                    }))
                  }
                }))
              }
            }
          })

          totalCreated++
          console.log(`   ✅ ${templateData.name}`)

        } catch (error) {
          console.error(`   ❌ Erreur lors de la création de "${templateData.name}":`, error.message)
        }
      }
    }

    console.log(`\n🎉 ${totalCreated} modèles d'évaluation créés avec succès!`)

    // Afficher un résumé par secteur
    const sectorSummary = {}
    EVALUATION_TEMPLATES.forEach(template => {
      template.targetSectors.forEach(sector => {
        if (!sectorSummary[sector]) {
          sectorSummary[sector] = 0
        }
        sectorSummary[sector]++
      })
    })

    console.log('\n📊 Résumé par secteur cible:')
    Object.entries(sectorSummary).forEach(([sector, count]) => {
      console.log(`   ${sector}: ${count} template(s)`)
    })

  } catch (error) {
    console.error('❌ Erreur lors de la création des templates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
createEvaluationTemplates()
  .then(() => {
    console.log('\n✨ Script terminé avec succès!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })
