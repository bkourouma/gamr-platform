import { PrismaClient } from '@prisma/client'
import { SECURITY_QUESTIONNAIRE } from '../src/data/securityQuestionnaire'

const prisma = new PrismaClient()

async function seedSecurityTemplate() {
  console.log('🌱 Seeding security evaluation template...')

  try {
    // Récupérer le tenant TechCorp pour l'exemple
    const tenant = await prisma.tenant.findFirst({
      where: { slug: 'techcorp' }
    })

    if (!tenant) {
      console.error('❌ Tenant TechCorp not found. Please run the main seed first.')
      return
    }

    // Vérifier si le template existe déjà
    const existingTemplate = await prisma.evaluationTemplate.findFirst({
      where: {
        name: 'Évaluation Sécuritaire GAMRDIGITALE',
        tenantId: tenant.id
      }
    })

    if (existingTemplate) {
      console.log('✅ Security template already exists, skipping...')
      return
    }

    // Créer le template d'évaluation sécuritaire
    const template = await prisma.evaluationTemplate.create({
      data: {
        name: 'Évaluation Sécuritaire GAMRDIGITALE',
        description: 'Questionnaire complet d\'évaluation sécuritaire avec 42 objectifs couvrant tous les aspects de la sécurité physique et organisationnelle',
        version: '1.0',
        tenantId: tenant.id,
        isActive: true,
        questionGroups: {
          create: SECURITY_QUESTIONNAIRE.sections.map((section, groupIndex) => ({
            title: section.title,
            description: section.description,
            orderIndex: groupIndex,
            objectives: {
              create: section.objectives.map((objective, objIndex) => ({
                objectiveNumber: objective.objectiveNumber,
                title: objective.title,
                description: objective.description,
                category: objective.category,
                orderIndex: objIndex,
                questions: {
                  create: objective.questions.map((question, qIndex) => ({
                    text: question.text,
                    type: question.type,
                    isRequired: question.isRequired || false,
                    orderIndex: qIndex,
                    options: question.options || null,
                    conditionalLogic: question.conditionalLogic || null
                  }))
                }
              }))
            }
          }))
        }
      }
    })

    console.log(`✅ Created security template: ${template.name}`)

    // Compter les éléments créés
    const stats = await prisma.evaluationTemplate.findUnique({
      where: { id: template.id },
      include: {
        _count: {
          select: {
            questionGroups: true
          }
        },
        questionGroups: {
          include: {
            _count: {
              select: {
                objectives: true
              }
            },
            objectives: {
              include: {
                _count: {
                  select: {
                    questions: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (stats) {
      const totalObjectives = stats.questionGroups.reduce((sum, group) => sum + group._count.objectives, 0)
      const totalQuestions = stats.questionGroups.reduce((sum, group) => 
        sum + group.objectives.reduce((objSum, obj) => objSum + obj._count.questions, 0), 0
      )

      console.log(`📊 Template statistics:`)
      console.log(`   - Groups: ${stats._count.questionGroups}`)
      console.log(`   - Objectives: ${totalObjectives}`)
      console.log(`   - Questions: ${totalQuestions}`)
    }

    // Créer également le template pour les autres tenants
    const otherTenants = await prisma.tenant.findMany({
      where: {
        slug: { not: 'techcorp' },
        isActive: true
      }
    })

    for (const otherTenant of otherTenants) {
      const existingForTenant = await prisma.evaluationTemplate.findFirst({
        where: {
          name: 'Évaluation Sécuritaire GAMRDIGITALE',
          tenantId: otherTenant.id
        }
      })

      if (!existingForTenant) {
        await prisma.evaluationTemplate.create({
          data: {
            name: 'Évaluation Sécuritaire GAMRDIGITALE',
            description: 'Questionnaire complet d\'évaluation sécuritaire avec 42 objectifs couvrant tous les aspects de la sécurité physique et organisationnelle',
            version: '1.0',
            tenantId: otherTenant.id,
            isActive: true,
            questionGroups: {
              create: SECURITY_QUESTIONNAIRE.sections.map((section, groupIndex) => ({
                title: section.title,
                description: section.description,
                orderIndex: groupIndex,
                objectives: {
                  create: section.objectives.map((objective, objIndex) => ({
                    title: objective.title,
                    description: objective.description,
                    orderIndex: objIndex,
                    questions: {
                      create: objective.questions.map((question, qIndex) => ({
                        text: question.text,
                        type: question.type,
                        isRequired: question.isRequired || false,
                        orderIndex: qIndex,
                        options: question.options || null,
                        conditionalLogic: question.conditionalLogic || null
                      }))
                    }
                  }))
                }
              }))
            }
          }
        })
        console.log(`✅ Created template for tenant: ${otherTenant.name}`)
      }
    }

    console.log('🎉 Security template seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding security template:', error)
    throw error
  }
}

async function main() {
  try {
    await seedSecurityTemplate()
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le seeding
main()

export { seedSecurityTemplate }
