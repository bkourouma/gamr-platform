import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function renameMockTenants() {
  try {
    console.log('=== Renommage des tenants mock ===\n')
    
    // Définir les nouveaux noms pour les tenants mock
    const tenantUpdates = [
      {
        oldSlug: 'techcorp',
        oldName: 'TechCorp Solutions',
        newName: 'TechCorp Solutions (Réel)',
        newSlug: 'techcorp-real',
        newDescription: 'Entreprise de solutions technologiques - Données réelles'
      },
      {
        oldSlug: 'healthcare-plus',
        oldName: 'HealthCare Plus',
        newName: 'HealthCare Plus (Réel)',
        newSlug: 'healthcare-plus-real',
        newDescription: 'Centre médical spécialisé - Données réelles'
      }
    ]

    for (const update of tenantUpdates) {
      // Vérifier si le tenant existe
      const tenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { slug: update.oldSlug },
            { name: update.oldName }
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

      if (tenant) {
        console.log(`🔄 Renommage de "${tenant.name}"...`)
        console.log(`   Utilisateurs: ${tenant._count.users}`)
        console.log(`   Fiches de risques: ${tenant._count.riskSheets}`)
        console.log(`   Évaluations: ${tenant._count.evaluations}`)

        // Vérifier que le nouveau slug n'existe pas déjà
        const existingTenant = await prisma.tenant.findUnique({
          where: { slug: update.newSlug }
        })

        if (existingTenant) {
          console.log(`   ⚠️  Le slug "${update.newSlug}" existe déjà, ajout d'un suffixe...`)
          update.newSlug = `${update.newSlug}-${Date.now()}`
        }

        // Mettre à jour le tenant
        const updatedTenant = await prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            name: update.newName,
            slug: update.newSlug,
            description: update.newDescription
          }
        })

        console.log(`   ✅ Renommé en "${updatedTenant.name}" (slug: ${updatedTenant.slug})`)
      } else {
        console.log(`   ℹ️  Tenant "${update.oldName}" non trouvé, ignoré.`)
      }
      console.log('')
    }

    console.log('🎉 Renommage terminé!')
    console.log('\n💡 Vos tenants ont été renommés pour indiquer qu\'ils contiennent des données réelles.')
    console.log('   Vous pouvez maintenant les gérer normalement depuis l\'interface.')

  } catch (error) {
    console.error('❌ Erreur lors du renommage:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function createCleanTenant() {
  try {
    console.log('=== Création d\'un tenant propre ===\n')
    
    // Créer un nouveau tenant propre pour les tests
    const cleanTenant = await prisma.tenant.create({
      data: {
        name: 'Mon Organisation',
        slug: 'mon-organisation',
        description: 'Organisation principale pour la gestion des risques',
        sector: 'Entreprise',
        size: 'PME',
        location: 'France',
        isActive: true
      }
    })

    console.log('✅ Nouveau tenant créé:')
    console.log(`   Nom: ${cleanTenant.name}`)
    console.log(`   Slug: ${cleanTenant.slug}`)
    console.log(`   ID: ${cleanTenant.id}`)
    console.log('\n💡 Vous pouvez maintenant créer des utilisateurs pour ce tenant.')

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('ℹ️  Un tenant avec ce slug existe déjà.')
    } else {
      console.error('❌ Erreur lors de la création du tenant:', error)
    }
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('--create-clean')) {
    await createCleanTenant()
  } else {
    await renameMockTenants()
    
    console.log('\n🔧 Options disponibles:')
    console.log('   --create-clean : Créer un nouveau tenant propre')
    console.log('\n💡 Pour créer un tenant propre, exécutez:')
    console.log('   node scripts/rename-mock-tenants.js --create-clean')
  }
}

main()
