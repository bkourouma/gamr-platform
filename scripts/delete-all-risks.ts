import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteAllRisks() {
  try {
    console.log('🗑️  Suppression de tous les risques...\n')

    // 1. Compter les risques avant suppression
    const totalRisks = await prisma.riskSheet.count({
      where: {
        isArchived: false
      }
    })

    const archivedRisks = await prisma.riskSheet.count({
      where: {
        isArchived: true
      }
    })

    console.log(`📊 Statistiques avant suppression:`)
    console.log(`   - Risques actifs: ${totalRisks}`)
    console.log(`   - Risques archivés: ${archivedRisks}`)
    console.log(`   - Total: ${totalRisks + archivedRisks}\n`)

    if (totalRisks === 0 && archivedRisks === 0) {
      console.log('✅ Aucun risque à supprimer.')
      return
    }

    // 2. Compter les actions associées
    const totalActions = await prisma.action.count({})
    const totalCorrelations = await prisma.riskCorrelation.count({})

    console.log(`📋 Données associées:`)
    console.log(`   - Actions correctives: ${totalActions}`)
    console.log(`   - Corrélations: ${totalCorrelations}\n`)

    console.log('⚠️  ATTENTION: Cette opération va supprimer:')
    console.log('   - Tous les risques (actifs et archivés)')
    console.log('   - Toutes les actions correctives associées (suppression en cascade)')
    console.log('   - Toutes les corrélations associées (suppression en cascade)\n')

    // 3. Supprimer toutes les corrélations d'abord (pour éviter les contraintes)
    console.log('🗑️  Suppression des corrélations...')
    const deletedCorrelations = await prisma.riskCorrelation.deleteMany({})
    console.log(`   ✅ ${deletedCorrelations.count} corrélation(s) supprimée(s)\n`)

    // 4. Supprimer toutes les actions
    console.log('🗑️  Suppression des actions correctives...')
    const deletedActions = await prisma.action.deleteMany({})
    console.log(`   ✅ ${deletedActions.count} action(s) supprimée(s)\n`)

    // 5. Supprimer tous les risques (actifs et archivés)
    console.log('🗑️  Suppression de tous les risques...')
    const deletedRisks = await prisma.riskSheet.deleteMany({})
    console.log(`   ✅ ${deletedRisks.count} risque(s) supprimé(s)\n`)

    console.log('🎉 Suppression terminée!')
    console.log(`📊 Résumé:`)
    console.log(`   - ${deletedRisks.count} risque(s) supprimé(s)`)
    console.log(`   - ${deletedActions.count} action(s) supprimée(s)`)
    console.log(`   - ${deletedCorrelations.count} corrélation(s) supprimée(s)`)

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
deleteAllRisks()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })





