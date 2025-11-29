import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verify() {
  try {
    console.log('📊 Vérification complète des données réelles...\n')

    // 1. Tous les risques (tous tenants)
    const allRisks = await prisma.riskSheet.findMany({
      where: { isArchived: false },
      include: {
        tenant: { select: { name: true } },
        author: { select: { firstName: true, lastName: true } },
        actions: { select: { id: true, status: true } }
      }
    })

    console.log(`=== RISQUES (tous tenants) ===`)
    console.log(`Total: ${allRisks.length}\n`)
    
    if (allRisks.length > 0) {
      allRisks.forEach((risk, i) => {
        console.log(`${i + 1}. ${risk.target}`)
        console.log(`   Tenant: ${risk.tenant.name}`)
        console.log(`   Auteur: ${risk.author.firstName} ${risk.author.lastName}`)
        console.log(`   Priorité: ${risk.priority}`)
        console.log(`   Score: ${risk.riskScore}`)
        console.log(`   Actions: ${risk.actions.length}`)
        console.log()
      })
    }

    // 2. Toutes les évaluations (tous tenants)
    const allEvaluations = await prisma.evaluation.findMany({
      include: {
        tenant: { select: { name: true } },
        evaluator: { select: { firstName: true, lastName: true } }
      }
    })

    console.log(`=== ÉVALUATIONS (tous tenants) ===`)
    console.log(`Total: ${allEvaluations.length}\n`)
    
    if (allEvaluations.length > 0) {
      allEvaluations.forEach((evaluation, i) => {
        console.log(`${i + 1}. ${evaluation.title}`)
        console.log(`   Tenant: ${evaluation.tenant.name}`)
        console.log(`   Évaluateur: ${evaluation.evaluator.firstName} ${evaluation.evaluator.lastName}`)
        console.log(`   Statut: ${evaluation.status}`)
        console.log(`   Score: ${evaluation.totalScore || 'Non calculé'}`)
        console.log()
      })
    }

    // 3. Toutes les actions (tous tenants)
    const allActions = await prisma.action.findMany({
      include: {
        tenant: { select: { name: true } },
        riskSheet: { select: { target: true } }
      }
    })

    console.log(`=== ACTIONS (tous tenants) ===`)
    console.log(`Total: ${allActions.length}\n`)
    
    if (allActions.length > 0) {
      allActions.forEach((action, i) => {
        console.log(`${i + 1}. ${action.title}`)
        console.log(`   Tenant: ${action.tenant.name}`)
        console.log(`   Risque: ${action.riskSheet.target}`)
        console.log(`   Statut: ${action.status}`)
        console.log()
      })
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verify()

