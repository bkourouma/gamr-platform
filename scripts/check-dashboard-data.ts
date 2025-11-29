import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDashboardData() {
  try {
    console.log('📊 Vérification des données du Dashboard...\n')

    // 1. Compter les risques
    const totalRisks = await prisma.riskSheet.count({
      where: { isArchived: false }
    })
    
    const criticalRisks = await prisma.riskSheet.count({
      where: { 
        isArchived: false,
        priority: 'CRITICAL'
      }
    })

    const highRisks = await prisma.riskSheet.count({
      where: { 
        isArchived: false,
        priority: 'HIGH'
      }
    })

    // 2. Compter les évaluations
    const totalEvaluations = await prisma.evaluation.count()
    
    const completedEvaluations = await prisma.evaluation.count({
      where: {
        status: 'COMPLETED',
        totalScore: { not: null }
      }
    })

    const evaluationsWithScores = await prisma.evaluation.findMany({
      where: {
        status: 'COMPLETED',
        totalScore: { not: null }
      },
      select: {
        id: true,
        title: true,
        totalScore: true,
        tenantId: true
      }
    })

    // 3. Compter les actions
    const totalActions = await prisma.action.count()
    
    const todoActions = await prisma.action.count({
      where: { status: 'TODO' }
    })

    const inProgressActions = await prisma.action.count({
      where: { status: 'IN_PROGRESS' }
    })

    const completedActions = await prisma.action.count({
      where: { status: 'COMPLETED' }
    })

    const overdueActions = await prisma.action.count({
      where: {
        status: { in: ['TODO', 'IN_PROGRESS'] },
        dueDate: { lt: new Date() }
      }
    })

    // 4. Actions par risque critique
    const criticalRisksWithActions = await prisma.riskSheet.findMany({
      where: {
        isArchived: false,
        priority: 'CRITICAL'
      },
      include: {
        actions: {
          select: {
            id: true,
            status: true,
            completedAt: true
          }
        }
      }
    })

    // 5. Afficher les résultats
    console.log('=== RISQUES ===')
    console.log(`Total risques actifs: ${totalRisks}`)
    console.log(`Risques critiques: ${criticalRisks}`)
    console.log(`Risques élevés: ${highRisks}\n`)

    console.log('=== ÉVALUATIONS ===')
    console.log(`Total évaluations: ${totalEvaluations}`)
    console.log(`Évaluations complétées avec score: ${completedEvaluations}`)
    
    if (evaluationsWithScores.length > 0) {
      console.log('\nDétails des évaluations:')
      evaluationsWithScores.forEach((evaluation, index) => {
        console.log(`  ${index + 1}. ${evaluation.title}`)
        console.log(`     Score: ${evaluation.totalScore}`)
        console.log(`     Tenant: ${evaluation.tenantId}`)
      })
    }
    console.log()

    console.log('=== ACTIONS ===')
    console.log(`Total actions: ${totalActions}`)
    console.log(`  - À faire (TODO): ${todoActions}`)
    console.log(`  - En cours (IN_PROGRESS): ${inProgressActions}`)
    console.log(`  - Terminées (COMPLETED): ${completedActions}`)
    console.log(`  - En retard: ${overdueActions}\n`)

    console.log('=== RISQUES CRITIQUES ET ACTIONS ===')
    console.log(`Nombre de risques critiques: ${criticalRisksWithActions.length}`)
    
    criticalRisksWithActions.forEach((risk, index) => {
      console.log(`\n  Risque ${index + 1}:`)
      console.log(`    ID: ${risk.id}`)
      console.log(`    Cible: ${risk.target}`)
      console.log(`    Nombre d'actions: ${risk.actions.length}`)
      if (risk.actions.length > 0) {
        risk.actions.forEach((action, aIndex) => {
          console.log(`      Action ${aIndex + 1}: ${action.status}`)
        })
      }
    })

    // 6. Compter les tenants
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true
      }
    })

    console.log('\n=== TENANTS ===')
    console.log(`Nombre de tenants: ${tenants.length}`)
    tenants.forEach((tenant, index) => {
      console.log(`  ${index + 1}. ${tenant.name} (${tenant.slug}) - ID: ${tenant.id}`)
    })

  } catch (error) {
    console.error('❌ Erreur:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkDashboardData()
  .then(() => {
    console.log('\n✅ Vérification terminée')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })

