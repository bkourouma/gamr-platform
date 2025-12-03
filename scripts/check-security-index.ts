import { PrismaClient } from '@prisma/client'
import { SecurityIndexService } from '../src/server/services/securityIndexService'

const prisma = new PrismaClient()

async function checkSecurityIndex() {
  try {
    console.log('📊 Vérification de l\'Indice Global de Sécurité...\n')

    // Récupérer tous les tenants
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true
      }
    })

    for (const tenant of tenants) {
      console.log(`\n=== TENANT: ${tenant.name} (${tenant.slug}) ===\n`)

      // Vérifier les données
      const [
        evaluations,
        criticalRisks,
        allActions,
        allRisks
      ] = await Promise.all([
        prisma.evaluation.findMany({
          where: {
            tenantId: tenant.id,
            status: 'COMPLETED',
            totalScore: { not: null }
          },
          select: {
            id: true,
            title: true,
            totalScore: true,
            status: true
          }
        }),
        
        prisma.riskSheet.findMany({
          where: {
            tenantId: tenant.id,
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
        }),
        
        prisma.action.findMany({
          where: {
            tenantId: tenant.id,
            status: { not: 'CANCELLED' }
          }
        }),
        
        prisma.riskSheet.findMany({
          where: {
            tenantId: tenant.id,
            isArchived: false
          }
        })
      ])

      console.log(`📋 Données brutes:`)
      console.log(`  - Évaluations complétées: ${evaluations.length}`)
      if (evaluations.length > 0) {
        evaluations.forEach((e, i) => {
          console.log(`    ${i + 1}. ${e.title} - Score: ${e.totalScore}`)
        })
      }
      
      console.log(`  - Risques critiques: ${criticalRisks.length}`)
      console.log(`  - Total actions: ${allActions.length}`)
      console.log(`  - Total risques: ${allRisks.length}`)

      // Calculer l'Indice Global de Sécurité
      const securityIndex = await SecurityIndexService.calculateSecurityIndex(tenant.id)
      
      console.log(`\n🔢 Indice Global de Sécurité:`)
      console.log(`  - Score Évaluations (40%): ${securityIndex.evaluationScore}`)
      console.log(`  - Couverture Actions (30%): ${securityIndex.correctiveActionCoverage}`)
      console.log(`  - Résolution Risques Critiques (20%): ${securityIndex.criticalRisksResolutionRate}`)
      console.log(`  - Conformité Objectifs (10%): ${securityIndex.securityObjectivesCompliance}`)
      console.log(`  - 🌟 INDICE GLOBAL: ${securityIndex.globalSecurityIndex}`)

      // Vérifier aussi toutes les évaluations (même non complétées)
      const allEvaluations = await prisma.evaluation.findMany({
        where: { tenantId: tenant.id },
        select: {
          id: true,
          title: true,
          status: true,
          totalScore: true
        }
      })

      console.log(`\n📝 Toutes les évaluations (tous statuts): ${allEvaluations.length}`)
      allEvaluations.forEach((e, i) => {
        console.log(`  ${i + 1}. ${e.title}`)
        console.log(`     Statut: ${e.status}`)
        console.log(`     Score: ${e.totalScore || 'Non calculé'}`)
      })
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkSecurityIndex()
  .then(() => {
    console.log('\n✅ Vérification terminée')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })





