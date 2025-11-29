import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verify() {
  try {
    const risksCount = await prisma.riskSheet.count()
    const actionsCount = await prisma.action.count()
    const correlationsCount = await prisma.riskCorrelation.count()

    console.log('📊 Vérification après suppression:')
    console.log(`   - Risques: ${risksCount}`)
    console.log(`   - Actions: ${actionsCount}`)
    console.log(`   - Corrélations: ${correlationsCount}`)

    if (risksCount === 0) {
      console.log('\n✅ Tous les risques ont été supprimés avec succès!')
    } else {
      console.log(`\n⚠️  Il reste ${risksCount} risque(s) dans la base de données.`)
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verify()

