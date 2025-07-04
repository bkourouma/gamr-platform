import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testModalDisplay() {
  console.log('🔍 Test de l\'affichage des modals - Vérification des données...')

  try {
    // Vérifier qu'il y a des actions à afficher
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
        }
      },
      take: 5,
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`\n📊 ${actions.length} actions trouvées pour les tests`)

    if (actions.length === 0) {
      console.log('❌ Aucune action trouvée - impossible de tester l\'affichage des modals')
      return
    }

    console.log(`\n📋 Actions disponibles pour test:`)
    console.log('=' .repeat(60))

    actions.forEach((action, index) => {
      console.log(`${index + 1}. ${action.title}`)
      console.log(`   Priorité: ${action.priority} | Status: ${action.status}`)
      console.log(`   Assigné à: ${action.assignee?.firstName} ${action.assignee?.lastName}`)
      console.log(`   Fiche de risque: ${action.riskSheet?.target || 'Non liée'}`)
      console.log(`   Créée: ${action.createdAt.toLocaleDateString('fr-FR')}`)
      console.log('')
    })

    // Vérifier les données nécessaires pour l'affichage complet
    console.log(`\n🔍 Vérification de la complétude des données:`)
    console.log('-' .repeat(50))

    const actionsWithAllData = actions.filter(action => 
      action.title && 
      action.description && 
      action.assignee && 
      action.riskSheet
    )

    console.log(`Actions avec données complètes: ${actionsWithAllData.length}/${actions.length}`)

    const actionsWithMetrics = actions.filter(action => 
      action.estimatedCost || action.estimatedDuration || action.successProbability
    )

    console.log(`Actions avec métriques: ${actionsWithMetrics.length}/${actions.length}`)

    const actionsWithDueDate = actions.filter(action => action.dueDate)
    console.log(`Actions avec échéance: ${actionsWithDueDate.length}/${actions.length}`)

    // Recommandations pour les tests
    console.log(`\n💡 Recommandations pour tester l'affichage des modals:`)
    console.log('-' .repeat(50))

    if (actionsWithAllData.length > 0) {
      console.log(`✅ Testez avec l'action: "${actionsWithAllData[0].title}"`)
      console.log(`   Cette action a toutes les données nécessaires pour un affichage complet`)
    }

    if (actionsWithMetrics.length > 0) {
      const actionWithMetrics = actionsWithMetrics[0]
      console.log(`✅ Testez les métriques avec: "${actionWithMetrics.title}"`)
      if (actionWithMetrics.estimatedCost) {
        console.log(`   Coût estimé: ${actionWithMetrics.estimatedCost}€`)
      }
      if (actionWithMetrics.estimatedDuration) {
        console.log(`   Durée estimée: ${actionWithMetrics.estimatedDuration} jours`)
      }
    }

    // Vérifier les différents statuts pour tester les boutons d'action
    const statusCounts = actions.reduce((acc, action) => {
      acc[action.status] = (acc[action.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log(`\n📊 Répartition des statuts (pour tester les boutons d'action):`)
    Object.entries(statusCounts).forEach(([status, count]) => {
      const emoji = status === 'TODO' ? '📋' :
                   status === 'IN_PROGRESS' ? '🔄' :
                   status === 'COMPLETED' ? '✅' : '❌'
      console.log(`  ${emoji} ${status}: ${count}`)
    })

    // Instructions de test
    console.log(`\n🧪 Instructions de test:`)
    console.log('=' .repeat(50))
    console.log(`1. Ouvrez http://localhost:5174/actions`)
    console.log(`2. Cliquez sur l'icône "👁️" d'une action pour ouvrir la modal`)
    console.log(`3. Vérifiez que la modal s'affiche entièrement à l'écran`)
    console.log(`4. Testez la fermeture avec:`)
    console.log(`   - Le bouton X en haut à droite`)
    console.log(`   - La touche Échap`)
    console.log(`   - Un clic sur l'arrière-plan`)
    console.log(`5. Testez sur différentes tailles d'écran`)
    console.log(`6. Vérifiez que le contenu est scrollable si nécessaire`)

    // Problèmes potentiels à vérifier
    console.log(`\n⚠️  Points à vérifier:`)
    console.log('-' .repeat(30))
    console.log(`• La modal ne dépasse pas les bords de l'écran`)
    console.log(`• Le contenu est lisible et bien organisé`)
    console.log(`• Les boutons d'action fonctionnent correctement`)
    console.log(`• La sidebar s'affiche correctement sur grand écran`)
    console.log(`• Le layout s'adapte sur mobile/tablette`)
    console.log(`• Le scroll fonctionne si le contenu est long`)

    console.log(`\n✅ Test de préparation terminé!`)
    console.log(`📅 ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}`)

  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testModalDisplay()
