import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDatabaseTenants() {
  try {
    console.log('=== Vérification des tenants dans la base de données ===\n')
    
    // Récupérer tous les tenants
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            riskSheets: true,
            evaluations: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    console.log(`Nombre total de tenants: ${tenants.length}\n`)

    if (tenants.length === 0) {
      console.log('❌ Aucun tenant trouvé dans la base de données.')
      console.log('💡 Vous devez créer au moins un tenant pour commencer.')
      return
    }

    // Afficher les détails de chaque tenant
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name}`)
      console.log(`   ID: ${tenant.id}`)
      console.log(`   Slug: ${tenant.slug}`)
      console.log(`   Description: ${tenant.description || 'Aucune'}`)
      console.log(`   Secteur: ${tenant.sector || 'Non défini'}`)
      console.log(`   Taille: ${tenant.size || 'Non définie'}`)
      console.log(`   Localisation: ${tenant.location || 'Non définie'}`)
      console.log(`   Statut: ${tenant.isActive ? '✅ Actif' : '❌ Inactif'}`)
      console.log(`   Créé le: ${tenant.createdAt.toLocaleDateString('fr-FR')}`)
      console.log(`   Utilisateurs: ${tenant._count.users}`)
      console.log(`   Fiches de risques: ${tenant._count.riskSheets}`)
      console.log(`   Évaluations: ${tenant._count.evaluations}`)
      console.log('')
    })

    // Identifier les potentiels tenants mock (avec des IDs simples ou des noms suspects)
    const suspiciousTenants = tenants.filter(tenant => 
      tenant.id.length < 10 || // IDs trop courts (mock data)
      ['TechCorp Solutions', 'HealthCare Plus', 'SecureBank Corp'].includes(tenant.name) || // Noms des données mock
      ['techcorp', 'healthcare-plus', 'securebank'].includes(tenant.slug) // Slugs des données mock
    )

    if (suspiciousTenants.length > 0) {
      console.log('⚠️  Tenants suspects (possibles données mock) détectés:')
      suspiciousTenants.forEach(tenant => {
        console.log(`   - ${tenant.name} (ID: ${tenant.id}, Slug: ${tenant.slug})`)
      })
      console.log('')
      console.log('💡 Ces tenants pourraient être des données de test.')
      console.log('   Vous pouvez les supprimer si ils ne sont pas nécessaires.')
    }

    // Vérifier les tenants avec des utilisateurs
    const tenantsWithUsers = tenants.filter(tenant => tenant._count.users > 0)
    if (tenantsWithUsers.length > 0) {
      console.log('👥 Tenants avec des utilisateurs:')
      tenantsWithUsers.forEach(tenant => {
        console.log(`   - ${tenant.name}: ${tenant._count.users} utilisateur(s)`)
      })
      console.log('')
    }

    // Vérifier les tenants vides (sans utilisateurs)
    const emptyTenants = tenants.filter(tenant => tenant._count.users === 0)
    if (emptyTenants.length > 0) {
      console.log('🗑️  Tenants vides (sans utilisateurs):')
      emptyTenants.forEach(tenant => {
        console.log(`   - ${tenant.name} (ID: ${tenant.id})`)
      })
      console.log('')
      console.log('💡 Ces tenants peuvent être supprimés en toute sécurité.')
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des tenants:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function cleanMockTenants() {
  try {
    console.log('=== Nettoyage des données mock ===\n')
    
    // Identifier les tenants mock par leurs noms/slugs caractéristiques
    const mockTenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { name: { in: ['TechCorp Solutions', 'HealthCare Plus', 'SecureBank Corp'] } },
          { slug: { in: ['techcorp', 'healthcare-plus', 'securebank'] } },
          { id: { in: ['1', '2', '3'] } } // IDs simples des données mock
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

    console.log(`🔍 ${mockTenants.length} tenant(s) mock détecté(s):`)
    mockTenants.forEach(tenant => {
      console.log(`   - ${tenant.name} (${tenant._count.users} utilisateurs, ${tenant._count.riskSheets} risques)`)
    })

    // Vérifier s'il y a des données associées
    const tenantsWithData = mockTenants.filter(tenant => 
      tenant._count.users > 0 || tenant._count.riskSheets > 0 || tenant._count.evaluations > 0
    )

    if (tenantsWithData.length > 0) {
      console.log('\n⚠️  Certains tenants mock contiennent des données:')
      tenantsWithData.forEach(tenant => {
        console.log(`   - ${tenant.name}: ${tenant._count.users} utilisateurs, ${tenant._count.riskSheets} risques, ${tenant._count.evaluations} évaluations`)
      })
      console.log('\n❌ Suppression annulée pour éviter la perte de données.')
      console.log('💡 Supprimez manuellement ces tenants depuis l\'interface si nécessaire.')
      return
    }

    // Supprimer les tenants mock vides
    const emptyMockTenants = mockTenants.filter(tenant => 
      tenant._count.users === 0 && tenant._count.riskSheets === 0 && tenant._count.evaluations === 0
    )

    if (emptyMockTenants.length > 0) {
      console.log(`\n🗑️  Suppression de ${emptyMockTenants.length} tenant(s) mock vide(s)...`)
      
      for (const tenant of emptyMockTenants) {
        await prisma.tenant.delete({
          where: { id: tenant.id }
        })
        console.log(`   ✅ ${tenant.name} supprimé`)
      }
      
      console.log('\n🎉 Nettoyage terminé!')
    }

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--clean')) {
    await cleanMockTenants()
  } else {
    await checkDatabaseTenants()
    console.log('\n💡 Pour nettoyer les données mock, exécutez:')
    console.log('   node scripts/check-database-tenants.js --clean')
  }
}

main()
