import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkEvaluationResponses() {
  console.log('🔍 Checking evaluation responses...')

  try {
    // Récupérer toutes les évaluations Gold Mines Inc
    const evaluations = await prisma.evaluation.findMany({
      where: {
        title: {
          contains: 'Gold Mines Inc'
        }
      },
      include: {
        responses: {
          include: {
            question: {
              select: {
                id: true,
                text: true,
                type: true
              }
            }
          }
        },
        template: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log(`\n📊 Found ${evaluations.length} Gold Mines Inc evaluations`)

    for (const evaluation of evaluations) {
      console.log(`\n📋 ${evaluation.title}`)
      console.log(`   Template: ${evaluation.template?.name}`)
      console.log(`   Status: ${evaluation.status}`)
      console.log(`   Responses: ${evaluation.responses.length}`)
      
      if (evaluation.responses.length > 0) {
        console.log(`   Sample responses:`)
        evaluation.responses.slice(0, 3).forEach((response, index) => {
          console.log(`     ${index + 1}. ${response.question?.text?.substring(0, 50)}...`)
          if (response.booleanValue !== null) {
            console.log(`        Answer: ${response.booleanValue ? 'Oui' : 'Non'}`)
          } else if (response.textValue) {
            console.log(`        Answer: ${response.textValue.substring(0, 30)}...`)
          } else if (response.numberValue !== null) {
            console.log(`        Answer: ${response.numberValue}`)
          }
          if (response.description) {
            console.log(`        Note: ${response.description.substring(0, 40)}...`)
          }
        })
      }
    }

    // Vérifier une évaluation spécifique
    const specificEvaluation = await prisma.evaluation.findFirst({
      where: {
        title: {
          contains: 'Évaluation Sécuritaire Complète - Gold Mines Inc'
        }
      },
      include: {
        template: {
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
        },
        responses: {
          include: {
            question: true
          }
        }
      }
    })

    if (specificEvaluation) {
      console.log(`\n🎯 Detailed check for: ${specificEvaluation.title}`)
      console.log(`   ID: ${specificEvaluation.id}`)
      console.log(`   Template groups: ${specificEvaluation.template?.questionGroups?.length || 0}`)
      console.log(`   Total questions in template: ${
        specificEvaluation.template?.questionGroups?.reduce((total, group) => 
          total + group.objectives.reduce((objTotal, obj) => objTotal + obj.questions.length, 0), 0
        ) || 0
      }`)
      console.log(`   Responses count: ${specificEvaluation.responses.length}`)
      
      // Vérifier la correspondance questions/réponses
      const allQuestions = specificEvaluation.template?.questionGroups?.flatMap(group =>
        group.objectives.flatMap(obj => obj.questions)
      ) || []
      
      const responsesByQuestionId = new Map(
        specificEvaluation.responses.map(r => [r.questionId, r])
      )
      
      console.log(`   Questions with responses: ${
        allQuestions.filter(q => responsesByQuestionId.has(q.id)).length
      }/${allQuestions.length}`)
    }

  } catch (error) {
    console.error('❌ Error checking evaluations:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkEvaluationResponses()
