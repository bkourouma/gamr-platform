import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyRiskSheets() {
  console.log('🔍 Vérification des fiches de risques créées...')

  try {
    // Récupérer toutes les fiches de risques récemment créées (dernières 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const riskSheets = await prisma.riskSheet.findMany({
      where: {
        createdAt: {
          gte: yesterday
        }
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        sourceEvaluation: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        tenant: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        riskScore: 'desc'
      }
    })

    console.log(`\n📊 ${riskSheets.length} fiches de risques trouvées`)

    if (riskSheets.length === 0) {
      console.log('❌ Aucune fiche de risque trouvée')
      return
    }

    console.log(`\n📋 Détails des fiches de risques:`)
    console.log('=' .repeat(80))

    riskSheets.forEach((sheet, index) => {
      console.log(`\n${index + 1}. ${sheet.target}`)
      console.log(`   📊 Score: ${Math.round(sheet.riskScore)}/100`)
      console.log(`   🚨 Priorité: ${sheet.priority}`)
      console.log(`   📂 Catégorie: ${sheet.category}`)
      console.log(`   👤 Auteur: ${sheet.author.firstName} ${sheet.author.lastName}`)
      console.log(`   🏢 Tenant: ${sheet.tenant.name}`)
      
      if (sheet.sourceEvaluation) {
        console.log(`   📝 Évaluation source: ${sheet.sourceEvaluation.title}`)
      }
      
      console.log(`   📅 Créé le: ${sheet.createdAt.toLocaleDateString('fr-FR')}`)
      console.log(`   🔄 Révision prévue: ${sheet.reviewDate?.toLocaleDateString('fr-FR') || 'Non définie'}`)
      
      // Afficher le scénario (tronqué)
      console.log(`   📖 Scénario: ${sheet.scenario.substring(0, 100)}...`)
      
      // Afficher les tags si disponibles
      if (sheet.tags && Array.isArray(sheet.tags)) {
        console.log(`   🏷️  Tags: ${sheet.tags.join(', ')}`)
      }
      
      // Afficher les suggestions IA si disponibles
      if (sheet.aiSuggestions && sheet.aiSuggestions.recommendations) {
        console.log(`   🤖 Suggestions IA (${sheet.aiSuggestions.recommendations.length}):`)
        sheet.aiSuggestions.recommendations.slice(0, 2).forEach((rec: string, i: number) => {
          console.log(`      ${i + 1}. ${rec}`)
        })
      }
    })

    // Statistiques
    console.log(`\n📈 Statistiques:`)
    console.log('=' .repeat(40))
    
    const priorityStats = riskSheets.reduce((acc, sheet) => {
      acc[sheet.priority] = (acc[sheet.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log(`Répartition par priorité:`)
    Object.entries(priorityStats).forEach(([priority, count]) => {
      const emoji = priority === 'CRITICAL' ? '🔴' : 
                   priority === 'HIGH' ? '🟠' : 
                   priority === 'MEDIUM' ? '🟡' : 
                   priority === 'LOW' ? '🟢' : '⚪'
      console.log(`  ${emoji} ${priority}: ${count} fiche${count > 1 ? 's' : ''}`)
    })
    
    const avgScore = riskSheets.reduce((sum, sheet) => sum + sheet.riskScore, 0) / riskSheets.length
    console.log(`\nScore moyen: ${Math.round(avgScore)}/100`)
    
    const categories = [...new Set(riskSheets.map(sheet => sheet.category).filter(Boolean))]
    console.log(`Catégories: ${categories.length} (${categories.join(', ')})`)

    // Vérifier les liens avec les évaluations
    const linkedSheets = riskSheets.filter(sheet => sheet.sourceEvaluation)
    console.log(`\n🔗 Fiches liées aux évaluations: ${linkedSheets.length}/${riskSheets.length}`)

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyRiskSheets()
