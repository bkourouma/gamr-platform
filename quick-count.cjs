const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function quickCount() {
  try {
    const count = await prisma.evaluationTemplate.count()
    console.log(`📊 Total des modèles d'évaluation: ${count}`)
    
    const templates = await prisma.evaluationTemplate.findMany({
      select: {
        name: true,
        tenant: {
          select: {
            name: true
          }
        }
      }
    })
    
    console.log('\n📋 Liste des templates:')
    templates.forEach(template => {
      console.log(`   - ${template.name} (${template.tenant.name})`)
    })
    
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

quickCount()
