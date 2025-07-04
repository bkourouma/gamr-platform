import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSpecificEvaluation() {
  const evaluationId = 'cmcfwbjxp009jtfeker5sccc6' // ID from the URL
  
  console.log(`🔍 Checking evaluation: ${evaluationId}`)

  try {
    const evaluation = await prisma.evaluation.findUnique({
      where: {
        id: evaluationId
      },
      include: {
        template: {
          include: {
            questionGroups: {
              include: {
                objectives: {
                  include: {
                    questions: {
                      orderBy: { orderIndex: 'asc' }
                    }
                  },
                  orderBy: { orderIndex: 'asc' }
                }
              },
              orderBy: { orderIndex: 'asc' }
            }
          }
        },
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
        }
      }
    })

    if (!evaluation) {
      console.log('❌ Evaluation not found')
      return
    }

    console.log(`\n📋 ${evaluation.title}`)
    console.log(`   Status: ${evaluation.status}`)
    console.log(`   Template: ${evaluation.template?.name}`)
    console.log(`   Responses: ${evaluation.responses.length}`)
    console.log(`   Progress: ${evaluation.progress}%`)
    console.log(`   Score: ${evaluation.totalScore}`)

    if (evaluation.template?.questionGroups) {
      console.log(`\n📊 Template structure:`)
      evaluation.template.questionGroups.forEach((group, groupIndex) => {
        console.log(`   Group ${groupIndex + 1}: ${group.title} (${group.objectives.length} objectives)`)
        group.objectives.forEach((objective, objIndex) => {
          console.log(`     Obj ${objIndex + 1}: ${objective.title} (${objective.questions.length} questions)`)
        })
      })
    }

    if (evaluation.responses.length > 0) {
      console.log(`\n💬 Sample responses:`)
      evaluation.responses.slice(0, 5).forEach((response, index) => {
        console.log(`   ${index + 1}. ${response.question?.text?.substring(0, 60)}...`)
        if (response.booleanValue !== null) {
          console.log(`      → ${response.booleanValue ? 'Oui' : 'Non'}`)
        } else if (response.textValue) {
          console.log(`      → ${response.textValue.substring(0, 50)}...`)
        } else if (response.numberValue !== null) {
          console.log(`      → ${response.numberValue}`)
        }
        if (response.description) {
          console.log(`      Note: ${response.description.substring(0, 50)}...`)
        }
      })
    } else {
      console.log(`\n❌ No responses found for this evaluation`)
    }

    // Vérifier si les réponses correspondent aux questions du template
    if (evaluation.template?.questionGroups && evaluation.responses.length > 0) {
      const allQuestions = evaluation.template.questionGroups.flatMap(group =>
        group.objectives.flatMap(obj => obj.questions)
      )
      
      const responsesByQuestionId = new Map(
        evaluation.responses.map(r => [r.questionId, r])
      )
      
      console.log(`\n🔗 Question-Response mapping:`)
      console.log(`   Total questions in template: ${allQuestions.length}`)
      console.log(`   Questions with responses: ${allQuestions.filter(q => responsesByQuestionId.has(q.id)).length}`)
      console.log(`   Questions without responses: ${allQuestions.filter(q => !responsesByQuestionId.has(q.id)).length}`)
    }

  } catch (error) {
    console.error('❌ Error checking evaluation:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSpecificEvaluation()
