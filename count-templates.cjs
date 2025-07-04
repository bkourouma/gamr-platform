const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function countTemplates() {
  console.log('📊 Comptage des modèles d\'évaluation...')

  try {
    // Compter les templates par tenant
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            evaluationTemplates: true
          }
        },
        evaluationTemplates: {
          select: {
            name: true,
            isActive: true,
            isDefault: true
          }
        }
      }
    })

    console.log('\n📋 Résumé par tenant:')
    let totalTemplates = 0

    for (const tenant of tenants) {
      console.log(`\n🏢 ${tenant.name}:`)
      console.log(`   📊 Total: ${tenant._count.evaluationTemplates} template(s)`)
      
      const activeTemplates = tenant.evaluationTemplates.filter(t => t.isActive)
      const defaultTemplates = tenant.evaluationTemplates.filter(t => t.isDefault)
      
      console.log(`   ✅ Actifs: ${activeTemplates.length}`)
      console.log(`   ⭐ Par défaut: ${defaultTemplates.length}`)
      
      console.log('   📝 Templates:')
      tenant.evaluationTemplates.forEach(template => {
        const status = template.isActive ? '✅' : '❌'
        const isDefault = template.isDefault ? ' ⭐' : ''
        console.log(`      ${status} ${template.name}${isDefault}`)
      })
      
      totalTemplates += tenant._count.evaluationTemplates
    }

    console.log(`\n🎯 TOTAL GÉNÉRAL: ${totalTemplates} modèles d'évaluation`)

    // Compter par secteur cible
    const allTemplates = await prisma.evaluationTemplate.findMany({
      where: { isActive: true },
      select: {
        name: true,
        targetSectors: true
      }
    })

    const sectorCount = {}
    allTemplates.forEach(template => {
      if (template.targetSectors && Array.isArray(template.targetSectors)) {
        template.targetSectors.forEach(sector => {
          sectorCount[sector] = (sectorCount[sector] || 0) + 1
        })
      }
    })

    console.log('\n📈 Répartition par secteur:')
    Object.entries(sectorCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([sector, count]) => {
        console.log(`   ${sector}: ${count} template(s)`)
      })

  } catch (error) {
    console.error('❌ Erreur lors du comptage:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
countTemplates()
  .then(() => {
    console.log('\n✨ Comptage terminé!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })
