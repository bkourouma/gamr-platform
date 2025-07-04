import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyNewActions() {
  console.log('🔍 Vérification des nouvelles actions correctives...')

  try {
    // Récupérer toutes les actions
    const actions = await prisma.action.findMany({
      include: {
        assignee: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        riskSheet: {
          select: {
            target: true,
            priority: true,
            riskScore: true,
            category: true
          }
        },
        tenant: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    })

    console.log(`\n📊 ${actions.length} actions correctives trouvées`)

    if (actions.length === 0) {
      console.log('❌ Aucune action trouvée')
      return
    }

    console.log(`\n📋 Détails des actions correctives:`)
    console.log('=' .repeat(80))

    actions.forEach((action, index) => {
      const priorityEmoji = action.priority === 'CRITICAL' ? '🔴' : 
                           action.priority === 'HIGH' ? '🟠' : 
                           action.priority === 'MEDIUM' ? '🟡' : 
                           action.priority === 'LOW' ? '🟢' : '⚪'
      
      const statusEmoji = action.status === 'TODO' ? '📋' :
                         action.status === 'IN_PROGRESS' ? '🔄' :
                         action.status === 'COMPLETED' ? '✅' : '❌'

      console.log(`\n${index + 1}. ${action.title}`)
      console.log(`   ${priorityEmoji} Priorité: ${action.priority} | ${statusEmoji} Status: ${action.status}`)
      console.log(`   📅 Échéance: ${action.dueDate?.toLocaleDateString('fr-FR') || 'Non définie'}`)
      console.log(`   💰 Coût estimé: ${action.estimatedCost?.toLocaleString('fr-FR')}€`)
      console.log(`   ⏱️  Durée estimée: ${action.estimatedDuration} jours`)
      console.log(`   👤 Assigné à: ${action.assignee?.firstName} ${action.assignee?.lastName}`)
      console.log(`   🏢 Tenant: ${action.tenant?.name}`)
      console.log(`   🎯 Fiche de risque: ${action.riskSheet?.target}`)
      console.log(`   📊 Score du risque: ${Math.round(action.riskSheet?.riskScore || 0)}/100`)
      console.log(`   📂 Catégorie: ${action.riskSheet?.category || 'Non définie'}`)
      console.log(`   📝 Description: ${action.description.substring(0, 80)}...`)
      
      // Calculer les jours restants
      if (action.dueDate) {
        const today = new Date()
        const dueDate = new Date(action.dueDate)
        const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysRemaining < 0) {
          console.log(`   ⚠️  EN RETARD de ${Math.abs(daysRemaining)} jour(s)`)
        } else if (daysRemaining <= 7) {
          console.log(`   🚨 URGENT - ${daysRemaining} jour(s) restant(s)`)
        } else {
          console.log(`   ⏰ ${daysRemaining} jour(s) restant(s)`)
        }
      }
    })

    // Statistiques détaillées
    console.log(`\n📈 STATISTIQUES DÉTAILLÉES`)
    console.log('=' .repeat(50))

    // Par priorité
    const priorityStats = actions.reduce((acc, action) => {
      acc[action.priority] = (acc[action.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log(`\n🎯 Répartition par priorité:`)
    Object.entries(priorityStats).forEach(([priority, count]) => {
      const emoji = priority === 'CRITICAL' ? '🔴' : 
                   priority === 'HIGH' ? '🟠' : 
                   priority === 'MEDIUM' ? '🟡' : 
                   priority === 'LOW' ? '🟢' : '⚪'
      const percentage = ((count / actions.length) * 100).toFixed(1)
      console.log(`  ${emoji} ${priority}: ${count} (${percentage}%)`)
    })

    // Par status
    const statusStats = actions.reduce((acc, action) => {
      acc[action.status] = (acc[action.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log(`\n📊 Répartition par status:`)
    Object.entries(statusStats).forEach(([status, count]) => {
      const emoji = status === 'TODO' ? '📋' :
                   status === 'IN_PROGRESS' ? '🔄' :
                   status === 'COMPLETED' ? '✅' : '❌'
      console.log(`  ${emoji} ${status}: ${count}`)
    })

    // Par assigné
    const assigneeStats = actions.reduce((acc, action) => {
      const assigneeName = `${action.assignee?.firstName} ${action.assignee?.lastName}`
      acc[assigneeName] = (acc[assigneeName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log(`\n👥 Répartition par assigné:`)
    Object.entries(assigneeStats).forEach(([assignee, count]) => {
      console.log(`  👤 ${assignee}: ${count} action${count > 1 ? 's' : ''}`)
    })

    // Coûts et durées
    const totalCost = actions.reduce((sum, action) => sum + (action.estimatedCost || 0), 0)
    const avgCost = totalCost / actions.length
    const totalDuration = actions.reduce((sum, action) => sum + (action.estimatedDuration || 0), 0)
    const avgDuration = totalDuration / actions.length

    console.log(`\n💰 Analyse financière:`)
    console.log(`  Total estimé: ${totalCost.toLocaleString('fr-FR')}€`)
    console.log(`  Coût moyen: ${Math.round(avgCost).toLocaleString('fr-FR')}€`)
    console.log(`  Action la plus coûteuse: ${Math.max(...actions.map(a => a.estimatedCost || 0)).toLocaleString('fr-FR')}€`)
    console.log(`  Action la moins coûteuse: ${Math.min(...actions.map(a => a.estimatedCost || 0)).toLocaleString('fr-FR')}€`)

    console.log(`\n⏱️  Analyse temporelle:`)
    console.log(`  Durée totale: ${totalDuration} jours`)
    console.log(`  Durée moyenne: ${Math.round(avgDuration)} jours`)
    console.log(`  Action la plus longue: ${Math.max(...actions.map(a => a.estimatedDuration || 0))} jours`)
    console.log(`  Action la plus courte: ${Math.min(...actions.map(a => a.estimatedDuration || 0))} jours`)

    // Actions urgentes
    const urgentActions = actions.filter(action => {
      if (!action.dueDate) return false
      const today = new Date()
      const dueDate = new Date(action.dueDate)
      const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysRemaining <= 14 // Actions à faire dans les 2 prochaines semaines
    })

    console.log(`\n🚨 Actions urgentes (≤ 14 jours): ${urgentActions.length}`)
    urgentActions.forEach((action, index) => {
      const daysRemaining = Math.ceil((new Date(action.dueDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      console.log(`  ${index + 1}. ${action.title} (${daysRemaining} jours)`)
    })

    console.log(`\n✅ Vérification terminée avec succès!`)
    console.log(`📅 ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}`)

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyNewActions()
