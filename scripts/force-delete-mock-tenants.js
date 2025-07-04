import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function forceDeleteMockTenants() {
  try {
    console.log('=== SUPPRESSION FORCÉE DES TENANTS MOCK ===\n')
    console.log('⚠️  ATTENTION: Cette opération va supprimer DÉFINITIVEMENT:')
    console.log('   - Tous les utilisateurs des tenants mock')
    console.log('   - Toutes les fiches de risques')
    console.log('   - Toutes les évaluations')
    console.log('   - Les tenants eux-mêmes')
    console.log('')

    // Identifier les tenants mock
    const mockTenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { name: { in: ['TechCorp Solutions', 'HealthCare Plus'] } },
          { slug: { in: ['techcorp', 'healthcare-plus'] } }
        ]
      },
      include: {
        _count: {
          select: {
            users: true,
            riskSheets: true,
            evaluations: true
          }
        }
      }
    })

    if (mockTenants.length === 0) {
      console.log('✅ Aucun tenant mock trouvé.')
      return
    }

    console.log(`🔍 ${mockTenants.length} tenant(s) mock trouvé(s):`)
    mockTenants.forEach(tenant => {
      console.log(`   - ${tenant.name}:`)
      console.log(`     * ${tenant._count.users} utilisateur(s)`)
      console.log(`     * ${tenant._count.riskSheets} fiche(s) de risques`)
      console.log(`     * ${tenant._count.evaluations} évaluation(s)`)
    })

    console.log('\n❌ CETTE ACTION EST IRRÉVERSIBLE!')
    console.log('💡 Pour confirmer, tapez "SUPPRIMER" et appuyez sur Entrée.')
    console.log('   Pour annuler, tapez n\'importe quoi d\'autre.')

    // Attendre la confirmation de l'utilisateur
    const readline = await import('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const confirmation = await new Promise((resolve) => {
      rl.question('Votre choix: ', (answer) => {
        rl.close()
        resolve(answer.trim())
      })
    })

    if (confirmation !== 'SUPPRIMER') {
      console.log('\n✅ Suppression annulée.')
      return
    }

    console.log('\n🗑️  Début de la suppression...')

    // Supprimer tenant par tenant
    for (const tenant of mockTenants) {
      console.log(`\n📁 Suppression de "${tenant.name}"...`)

      // 1. Supprimer les évaluations
      if (tenant._count.evaluations > 0) {
        const deletedEvaluations = await prisma.evaluation.deleteMany({
          where: { tenantId: tenant.id }
        })
        console.log(`   ✅ ${deletedEvaluations.count} évaluation(s) supprimée(s)`)
      }

      // 2. Supprimer les fiches de risques
      if (tenant._count.riskSheets > 0) {
        const deletedRiskSheets = await prisma.riskSheet.deleteMany({
          where: { tenantId: tenant.id }
        })
        console.log(`   ✅ ${deletedRiskSheets.count} fiche(s) de risques supprimée(s)`)
      }

      // 3. Supprimer les utilisateurs
      if (tenant._count.users > 0) {
        const deletedUsers = await prisma.user.deleteMany({
          where: { tenantId: tenant.id }
        })
        console.log(`   ✅ ${deletedUsers.count} utilisateur(s) supprimé(s)`)
      }

      // 4. Supprimer le tenant
      await prisma.tenant.delete({
        where: { id: tenant.id }
      })
      console.log(`   ✅ Tenant "${tenant.name}" supprimé`)
    }

    console.log('\n🎉 Suppression terminée!')
    console.log('💡 Les tenants mock et toutes leurs données ont été supprimés.')
    console.log('   Vous pouvez maintenant créer de nouveaux tenants propres.')

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function listMockTenants() {
  try {
    console.log('=== APERÇU DES TENANTS MOCK ===\n')

    const mockTenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { name: { in: ['TechCorp Solutions', 'HealthCare Plus'] } },
          { slug: { in: ['techcorp', 'healthcare-plus'] } }
        ]
      },
      include: {
        users: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        },
        _count: {
          select: {
            users: true,
            riskSheets: true,
            evaluations: true
          }
        }
      }
    })

    if (mockTenants.length === 0) {
      console.log('✅ Aucun tenant mock trouvé.')
      return
    }

    mockTenants.forEach(tenant => {
      console.log(`📁 ${tenant.name} (${tenant.slug})`)
      console.log(`   ID: ${tenant.id}`)
      console.log(`   Utilisateurs (${tenant._count.users}):`)
      tenant.users.forEach(user => {
        console.log(`     - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`)
      })
      console.log(`   Fiches de risques: ${tenant._count.riskSheets}`)
      console.log(`   Évaluations: ${tenant._count.evaluations}`)
      console.log('')
    })

    console.log('🔧 Options disponibles:')
    console.log('   --force : Supprimer définitivement ces tenants et toutes leurs données')
    console.log('\n💡 Pour supprimer, exécutez:')
    console.log('   node scripts/force-delete-mock-tenants.js --force')
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--force')) {
    await forceDeleteMockTenants()
  } else {
    await listMockTenants()
  }
}

main()
