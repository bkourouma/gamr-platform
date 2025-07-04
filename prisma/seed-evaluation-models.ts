import { PrismaClient } from '@prisma/client'
import { 
  COMPLETE_SECURITY_MODEL, 
  PROPERTY_SECURITY_MODEL, 
  PERSONNEL_SECURITY_MODEL 
} from '../src/data/evaluationModels'

const prisma = new PrismaClient()

async function seedEvaluationModels() {
  console.log('🌱 Seeding evaluation models...')

  try {
    // Récupérer tous les tenants
    const tenants = await prisma.tenant.findMany()

    if (tenants.length === 0) {
      console.error('❌ No tenants found. Please run the main seed first.')
      return
    }

    const models = [
      COMPLETE_SECURITY_MODEL,
      PROPERTY_SECURITY_MODEL,
      PERSONNEL_SECURITY_MODEL
    ]

    for (const tenant of tenants) {
      console.log(`\n📋 Creating evaluation models for tenant: ${tenant.name}`)

      for (const model of models) {
        // Vérifier si le modèle existe déjà
        const existingTemplate = await prisma.evaluationTemplate.findFirst({
          where: {
            name: model.title,
            tenantId: tenant.id
          }
        })

        if (existingTemplate) {
          console.log(`✅ Model "${model.title}" already exists for ${tenant.name}, skipping...`)
          continue
        }

        // Créer le modèle d'évaluation
        const template = await prisma.evaluationTemplate.create({
          data: {
            name: model.title,
            description: model.description,
            version: model.version,
            tenantId: tenant.id,
            isActive: true,
            questionGroups: {
              create: model.sections.map((section, groupIndex) => ({
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
                        helpText: question.helpText || null,
                        placeholder: question.placeholder || null,
                        dependsOn: question.conditionalLogic ? JSON.stringify(question.conditionalLogic) : null
                      }))
                    }
                  }))
                }
              }))
            }
          }
        })

        console.log(`✅ Created model: ${template.name}`)

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
          const totalObjectives = stats.questionGroups.reduce((total, group) => 
            total + group._count.objectives, 0
          )
          const totalQuestions = stats.questionGroups.reduce((total, group) => 
            total + group.objectives.reduce((objTotal, obj) => objTotal + obj._count.questions, 0), 0
          )

          console.log(`   📊 Sections: ${stats._count.questionGroups}`)
          console.log(`   📊 Objectifs: ${totalObjectives}`)
          console.log(`   📊 Questions: ${totalQuestions}`)
        }
      }
    }

    console.log('\n🎉 Evaluation models seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding evaluation models:', error)
    throw error
  }
}

async function main() {
  try {
    await seedEvaluationModels()
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le seeding
main()

export { seedEvaluationModels }
