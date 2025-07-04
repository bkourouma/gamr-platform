const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Templates qui ont échoué à cause des options
const FAILED_TEMPLATES = [
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
              { text: 'Fréquence des mises à jour de sécurité', type: 'MULTIPLE_CHOICE', helpText: 'Options: Automatique, Hebdomadaire, Mensuelle, Trimestrielle, Jamais' }
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
              { text: 'Fréquence des inspections de sécurité', type: 'MULTIPLE_CHOICE', helpText: 'Options: Quotidienne, Hebdomadaire, Mensuelle, Trimestrielle' },
              { text: 'Date de la dernière inspection complète', type: 'DATE' }
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
              { text: 'Fréquence de révision des droits d\'accès', type: 'MULTIPLE_CHOICE', helpText: 'Options: Mensuelle, Trimestrielle, Semestrielle, Annuelle' }
            ]
          }
        ]
      }
    ]
  }
]

async function fixEvaluationTemplates() {
  console.log('🔧 Correction des modèles d\'évaluation échoués...')

  try {
    // Récupérer les tenants existants
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true }
    })

    if (tenants.length === 0) {
      console.error('❌ Aucun tenant actif trouvé.')
      return
    }

    console.log(`🏢 ${tenants.length} tenant(s) actif(s) trouvé(s)`)

    let totalCreated = 0

    // Créer les templates pour chaque tenant
    for (const tenant of tenants) {
      console.log(`\n🔧 Correction des templates pour ${tenant.name}...`)

      for (const [index, templateData] of FAILED_TEMPLATES.entries()) {
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
              isDefault: false,
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
                          helpText: question.helpText || null
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

    console.log(`\n🎉 ${totalCreated} modèles d'évaluation corrigés avec succès!`)

  } catch (error) {
    console.error('❌ Erreur lors de la correction des templates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
fixEvaluationTemplates()
  .then(() => {
    console.log('\n✨ Script de correction terminé avec succès!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })
