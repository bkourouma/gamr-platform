import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function generateSummary() {
  console.log('📊 RÉSUMÉ COMPLET - GOLD MINES INC')
  console.log('=' .repeat(60))

  try {
    // 1. Évaluations
    const evaluations = await prisma.evaluation.findMany({
      where: {
        title: {
          contains: 'Gold Mines Inc'
        }
      },
      include: {
        template: {
          select: {
            name: true
          }
        },
        responses: true,
        generatedRisks: true
      }
    })

    console.log(`\n🔍 ÉVALUATIONS (${evaluations.length})`)
    console.log('-' .repeat(40))
    evaluations.forEach((evaluation, index) => {
      console.log(`${index + 1}. ${evaluation.title}`)
      console.log(`   Template: ${evaluation.template?.name}`)
      console.log(`   Status: ${evaluation.status} | Progress: ${evaluation.progress}%`)
      console.log(`   Score: ${evaluation.totalScore || 'N/A'} | Risque: ${evaluation.riskLevel || 'N/A'}`)
      console.log(`   Réponses: ${evaluation.responses.length}`)
      console.log(`   Créé: ${evaluation.createdAt.toLocaleDateString('fr-FR')}`)
    })

    // 2. Fiches de risques générées
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const riskSheets = await prisma.riskSheet.findMany({
      where: {
        createdAt: {
          gte: today
        },
        sourceEvaluationId: {
          not: null
        }
      },
      include: {
        sourceEvaluation: {
          select: {
            title: true
          }
        },
        actions: true
      },
      orderBy: {
        riskScore: 'desc'
      }
    })

    console.log(`\n🚨 FICHES DE RISQUES GÉNÉRÉES (${riskSheets.length})`)
    console.log('-' .repeat(40))
    riskSheets.forEach((risk, index) => {
      console.log(`${index + 1}. ${risk.target}`)
      console.log(`   Score: ${Math.round(risk.riskScore)}/100 | Priorité: ${risk.priority}`)
      console.log(`   Catégorie: ${risk.category}`)
      console.log(`   Actions liées: ${risk.actions.length}`)
      console.log(`   Source: ${risk.sourceEvaluation?.title?.substring(0, 50)}...`)
    })

    // 3. Actions correctives
    const actions = await prisma.action.findMany({
      where: {
        createdAt: {
          gte: today
        },
        riskSheet: {
          sourceEvaluationId: {
            not: null
          }
        }
      },
      include: {
        riskSheet: {
          select: {
            target: true
          }
        },
        assignee: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    })

    console.log(`\n⚡ ACTIONS CORRECTIVES (${actions.length})`)
    console.log('-' .repeat(40))
    actions.forEach((action, index) => {
      console.log(`${index + 1}. ${action.title}`)
      console.log(`   Priorité: ${action.priority} | Status: ${action.status}`)
      console.log(`   Échéance: ${action.dueDate?.toLocaleDateString('fr-FR') || 'Non définie'}`)
      console.log(`   Coût: ${action.estimatedCost?.toLocaleString('fr-FR')}€ | Durée: ${action.estimatedDuration} jours`)
      console.log(`   Risque: ${action.riskSheet?.target.substring(0, 40)}...`)
      console.log(`   Assigné à: ${action.assignee?.firstName} ${action.assignee?.lastName}`)
    })

    // 4. Statistiques globales
    console.log(`\n📈 STATISTIQUES GLOBALES`)
    console.log('-' .repeat(40))
    
    const totalResponses = evaluations.reduce((sum, evaluation) => sum + evaluation.responses.length, 0)
    console.log(`Total réponses collectées: ${totalResponses}`)

    const avgScore = evaluations
      .filter(e => e.totalScore !== null)
      .reduce((sum, e) => sum + (e.totalScore || 0), 0) / evaluations.filter(e => e.totalScore !== null).length
    console.log(`Score moyen des évaluations: ${Math.round(avgScore || 0)}/100`)
    
    const riskPriorities = riskSheets.reduce((acc, risk) => {
      acc[risk.priority] = (acc[risk.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log(`\nRépartition des risques:`)
    Object.entries(riskPriorities).forEach(([priority, count]) => {
      const emoji = priority === 'CRITICAL' ? '🔴' : 
                   priority === 'HIGH' ? '🟠' : 
                   priority === 'MEDIUM' ? '🟡' : 
                   priority === 'LOW' ? '🟢' : '⚪'
      console.log(`  ${emoji} ${priority}: ${count}`)
    })
    
    const actionPriorities = actions.reduce((acc, action) => {
      acc[action.priority] = (acc[action.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log(`\nRépartition des actions:`)
    Object.entries(actionPriorities).forEach(([priority, count]) => {
      const emoji = priority === 'CRITICAL' ? '🔴' : 
                   priority === 'HIGH' ? '🟠' : 
                   priority === 'MEDIUM' ? '🟡' : 
                   priority === 'LOW' ? '🟢' : '⚪'
      console.log(`  ${emoji} ${priority}: ${count}`)
    })
    
    const totalCost = actions.reduce((sum, action) => sum + (action.estimatedCost || 0), 0)
    console.log(`\n💰 Investissement total prévu: ${totalCost.toLocaleString('fr-FR')}€`)
    
    const avgDuration = actions.reduce((sum, action) => sum + (action.estimatedDuration || 0), 0) / actions.length
    console.log(`⏱️  Durée moyenne des actions: ${Math.round(avgDuration)} jours`)

    // 5. Recommandations
    console.log(`\n🎯 RECOMMANDATIONS PRIORITAIRES`)
    console.log('-' .repeat(40))
    
    const highPriorityActions = actions.filter(a => a.priority === 'HIGH' || a.priority === 'CRITICAL')
    console.log(`Actions à traiter en priorité: ${highPriorityActions.length}`)
    
    highPriorityActions.slice(0, 3).forEach((action, index) => {
      console.log(`${index + 1}. ${action.title}`)
      console.log(`   Échéance: ${action.dueDate?.toLocaleDateString('fr-FR')}`)
    })

    console.log(`\n✅ RÉSUMÉ CRÉÉ AVEC SUCCÈS`)
    console.log(`📅 Date: ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}`)

  } catch (error) {
    console.error('❌ Erreur lors de la génération du résumé:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateSummary()
