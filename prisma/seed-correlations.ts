import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCorrelations() {
  console.log('🔗 Création des corrélations de risques de test...')

  try {
    // Récupérer les fiches de risques existantes
    const riskSheets = await prisma.riskSheet.findMany({
      include: {
        tenant: true
      }
    })

    if (riskSheets.length < 2) {
      console.log('❌ Pas assez de fiches de risques pour créer des corrélations. Veuillez d\'abord exécuter le seed principal.')
      return
    }

    console.log(`📊 ${riskSheets.length} fiches de risques trouvées`)

    // Grouper par tenant
    const techCorpRisks = riskSheets.filter(r => r.tenant.slug === 'techcorp')
    const healthCareRisks = riskSheets.filter(r => r.tenant.slug === 'healthcare-plus')

    const correlations = []

    // Corrélations pour TechCorp (cybersécurité/IT)
    if (techCorpRisks.length >= 2) {
      correlations.push(
        // Corrélation causale forte : Panne électrique → Perte de données
        {
          sourceRiskId: techCorpRisks[0].id,
          targetRiskId: techCorpRisks[1].id,
          coefficient: 0.85,
          correlationType: 'CAUSAL',
          isActive: true
        }
      )

      // Corrélation temporelle : Cyberattaque → Fuite de données (si au moins 3 risques)
      if (techCorpRisks.length >= 3) {
        correlations.push({
          sourceRiskId: techCorpRisks[1].id,
          targetRiskId: techCorpRisks[2].id,
          coefficient: 0.78,
          correlationType: 'TEMPORAL',
          isActive: true
        })
      }

      // Autres corrélations si assez de risques
      if (techCorpRisks.length >= 4) {
        correlations.push(
          // Corrélation de ressource : Défaillance serveur → Interruption service
          {
            sourceRiskId: techCorpRisks[2].id,
            targetRiskId: techCorpRisks[3].id,
            coefficient: 0.92,
            correlationType: 'RESOURCE',
            isActive: true
          },
          // Corrélation conditionnelle : Accès non autorisé → Vol de données
          {
            sourceRiskId: techCorpRisks[0].id,
            targetRiskId: techCorpRisks[3].id,
            coefficient: 0.65,
            correlationType: 'CONDITIONAL',
            isActive: true
          }
        )
      }

      // Corrélation géographique : Catastrophe naturelle → Panne infrastructure
      correlations.push({
        sourceRiskId: techCorpRisks[1].id,
        targetRiskId: techCorpRisks[0].id,
        coefficient: 0.45,
        correlationType: 'GEOGRAPHIC',
        isActive: true
      })
    }

    // Corrélations pour HealthCare (santé/conformité)
    if (healthCareRisks.length >= 2) {
      correlations.push(
        // Corrélation causale : Non-conformité RGPD → Sanctions financières
        {
          sourceRiskId: healthCareRisks[0].id,
          targetRiskId: healthCareRisks[1].id,
          coefficient: 0.88,
          correlationType: 'CAUSAL',
          isActive: true
        }
      )

      // Corrélation temporelle si au moins 3 risques
      if (healthCareRisks.length >= 3) {
        correlations.push({
          sourceRiskId: healthCareRisks[1].id,
          targetRiskId: healthCareRisks[2].id,
          coefficient: 0.72,
          correlationType: 'TEMPORAL',
          isActive: true
        })
      }

      // Autres corrélations si au moins 4 risques
      if (healthCareRisks.length >= 4) {
        correlations.push(
          {
            sourceRiskId: healthCareRisks[2].id,
            targetRiskId: healthCareRisks[3].id,
            coefficient: 0.95,
            correlationType: 'RESOURCE',
            isActive: true
          },
          {
            sourceRiskId: healthCareRisks[0].id,
            targetRiskId: healthCareRisks[3].id,
            coefficient: 0.58,
            correlationType: 'CONDITIONAL',
            isActive: true
          }
        )
      }
    }

    // Corrélations inter-secteurs (plus faibles mais intéressantes)
    if (techCorpRisks.length > 0 && healthCareRisks.length > 0) {
      correlations.push({
        sourceRiskId: techCorpRisks[0].id,
        targetRiskId: healthCareRisks[0].id,
        coefficient: 0.35,
        correlationType: 'GEOGRAPHIC',
        isActive: true
      })

      // Deuxième corrélation inter-secteurs si assez de risques
      if (techCorpRisks.length >= 2 && healthCareRisks.length >= 2) {
        correlations.push({
          sourceRiskId: techCorpRisks[1].id,
          targetRiskId: healthCareRisks[1].id,
          coefficient: 0.42,
          correlationType: 'TEMPORAL',
          isActive: true
        })
      }
    }

    // Quelques corrélations désactivées pour les tests
    if (techCorpRisks.length >= 2) {
      correlations.push({
        sourceRiskId: techCorpRisks[0].id,
        targetRiskId: techCorpRisks[1].id,
        coefficient: 0.25,
        correlationType: 'CONDITIONAL',
        isActive: false // Corrélation désactivée
      })
    }

    // Créer toutes les corrélations
    for (const correlationData of correlations) {
      try {
        await prisma.riskCorrelation.create({
          data: {
            ...correlationData,
            createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000), // Derniers 14 jours
            updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Derniers 7 jours
          }
        })
      } catch (error) {
        console.log(`⚠️ Corrélation ignorée (peut-être déjà existante): ${error.message}`)
      }
    }

    console.log(`✅ ${correlations.length} corrélations de risques créées`)

    // Statistiques
    const stats = await prisma.riskCorrelation.groupBy({
      by: ['correlationType'],
      _count: true
    })

    console.log('\n📊 Statistiques des corrélations:')
    stats.forEach(stat => {
      console.log(`   ${stat.correlationType}: ${stat._count} corrélations`)
    })

    const strongCorrelations = await prisma.riskCorrelation.count({
      where: {
        coefficient: { gte: 0.7 },
        isActive: true
      }
    })

    const averageCoefficient = await prisma.riskCorrelation.aggregate({
      where: { isActive: true },
      _avg: { coefficient: true }
    })

    console.log(`\n🔗 ${strongCorrelations} corrélations fortes (≥ 70%)`)
    console.log(`📈 Coefficient moyen: ${Math.round((averageCoefficient._avg.coefficient || 0) * 100)}%`)

    // Afficher les corrélations les plus fortes
    const topCorrelations = await prisma.riskCorrelation.findMany({
      where: { isActive: true },
      include: {
        sourceRisk: {
          select: { target: true }
        },
        targetRisk: {
          select: { target: true }
        }
      },
      orderBy: { coefficient: 'desc' },
      take: 3
    })

    console.log('\n🏆 Top 3 des corrélations les plus fortes:')
    topCorrelations.forEach((corr, index) => {
      console.log(`   ${index + 1}. ${corr.sourceRisk.target} → ${corr.targetRisk.target} (${Math.round(corr.coefficient * 100)}%)`)
    })

  } catch (error) {
    console.error('❌ Erreur lors de la création des corrélations:', error)
    throw error
  }
}

async function main() {
  try {
    await seedCorrelations()
  } catch (error) {
    console.error('Erreur:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter si c'est le fichier principal
main()

export { seedCorrelations }
