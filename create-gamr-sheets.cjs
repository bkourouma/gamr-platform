const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Fonction pour calculer le score GAMR (formule classique)
function calculateRiskScore(probability, vulnerability, impact) {
  return probability * vulnerability * impact
}

// Fonction pour déterminer la priorité basée sur le score
function calculatePriority(score) {
  if (score >= 80) return 'CRITICAL'
  if (score >= 60) return 'HIGH'
  if (score >= 40) return 'MEDIUM'
  if (score >= 20) return 'LOW'
  return 'VERY_LOW'
}

async function createGamrSheets() {
  console.log('🎯 Création de 5 nouvelles fiches GAMR...')

  try {
    // Récupérer les tenants et utilisateurs existants
    const tenants = await prisma.tenant.findMany({
      include: {
        users: {
          where: {
            role: {
              in: ['ADMIN', 'AI_ANALYST', 'EVALUATOR']
            }
          }
        }
      }
    })

    if (tenants.length === 0) {
      console.error('❌ Aucun tenant trouvé. Veuillez d\'abord exécuter le seed principal.')
      return
    }

    console.log(`📋 ${tenants.length} tenant(s) trouvé(s)`)

    // Définir les 5 nouvelles fiches GAMR avec différentes catégories
    const newRiskSheets = [
      {
        target: 'Système de climatisation du data center',
        scenario: 'Panne prolongée du système de refroidissement causant une surchauffe des serveurs',
        probability: 2, // Moyen
        vulnerability: 3, // Élevé
        impact: 4, // Majeur
        category: 'Infrastructure Physique',
        tags: ['climatisation', 'data-center', 'surchauffe', 'continuité'],
        aiSuggestions: {
          recommendations: [
            'Installation d\'un système de climatisation redondant',
            'Mise en place d\'alertes de température en temps réel',
            'Contrat de maintenance préventive renforcé',
            'Plan d\'évacuation d\'urgence des équipements critiques'
          ],
          confidence: 0.92,
          estimatedCost: 45000,
          implementationTime: 30
        }
      },
      {
        target: 'Chaîne d\'approvisionnement des fournisseurs critiques',
        scenario: 'Rupture d\'approvisionnement due à une crise géopolitique affectant les fournisseurs clés',
        probability: 2, // Moyen
        vulnerability: 4, // Très élevé
        impact: 3, // Modéré
        category: 'Supply Chain',
        tags: ['fournisseurs', 'géopolitique', 'approvisionnement', 'dépendance'],
        aiSuggestions: {
          recommendations: [
            'Diversification géographique des fournisseurs',
            'Constitution de stocks de sécurité stratégiques',
            'Développement de fournisseurs locaux alternatifs',
            'Mise en place d\'un système de veille géopolitique'
          ],
          confidence: 0.87,
          estimatedCost: 75000,
          implementationTime: 90
        }
      },
      {
        target: 'Personnel clé et expertise métier',
        scenario: 'Départ simultané de plusieurs experts métier critiques sans transfert de connaissances',
        probability: 1, // Faible
        vulnerability: 4, // Très élevé
        impact: 4, // Majeur
        category: 'Ressources Humaines',
        tags: ['expertise', 'départ', 'connaissances', 'succession'],
        aiSuggestions: {
          recommendations: [
            'Programme de mentorat et transfert de connaissances',
            'Documentation des processus critiques',
            'Plan de succession pour les postes clés',
            'Amélioration de la rétention des talents'
          ],
          confidence: 0.89,
          estimatedCost: 25000,
          implementationTime: 60
        }
      },
      {
        target: 'Conformité réglementaire RGPD',
        scenario: 'Audit de la CNIL révélant des non-conformités majeures dans le traitement des données',
        probability: 2, // Moyen
        vulnerability: 2, // Faible
        impact: 5, // Critique
        category: 'Conformité Réglementaire',
        tags: ['rgpd', 'cnil', 'données-personnelles', 'sanctions'],
        aiSuggestions: {
          recommendations: [
            'Audit complet de conformité RGPD',
            'Formation du personnel sur la protection des données',
            'Mise à jour des politiques de confidentialité',
            'Implémentation d\'un système de gestion des consentements'
          ],
          confidence: 0.94,
          estimatedCost: 35000,
          implementationTime: 45
        }
      },
      {
        target: 'Réputation de l\'entreprise sur les réseaux sociaux',
        scenario: 'Crise de réputation virale suite à un incident client mal géré et amplifié sur les réseaux sociaux',
        probability: 3, // Élevé
        vulnerability: 3, // Élevé
        impact: 3, // Modéré
        category: 'Réputation & Communication',
        tags: ['réseaux-sociaux', 'crise', 'réputation', 'viral'],
        aiSuggestions: {
          recommendations: [
            'Développement d\'un plan de gestion de crise digitale',
            'Formation des équipes à la communication de crise',
            'Mise en place d\'une veille des réseaux sociaux',
            'Création d\'une cellule de réponse rapide'
          ],
          confidence: 0.85,
          estimatedCost: 20000,
          implementationTime: 21
        }
      }
    ]

    // Créer les fiches pour chaque tenant
    const createdSheets = []
    
    for (const tenant of tenants) {
      if (tenant.users.length === 0) {
        console.log(`⚠️  Aucun utilisateur approprié trouvé pour ${tenant.name}`)
        continue
      }

      // Sélectionner un utilisateur au hasard parmi ceux disponibles
      const randomUser = tenant.users[Math.floor(Math.random() * tenant.users.length)]
      
      console.log(`📝 Création des fiches pour ${tenant.name} (auteur: ${randomUser.firstName} ${randomUser.lastName})`)

      for (const [index, sheetData] of newRiskSheets.entries()) {
        const riskScore = calculateRiskScore(sheetData.probability, sheetData.vulnerability, sheetData.impact)
        const priority = calculatePriority(riskScore)
        
        // Ajouter une variation dans les dates de révision
        const reviewDate = new Date()
        reviewDate.setDate(reviewDate.getDate() + (tenant.reviewFrequency || 90) + (index * 7))

        const createdSheet = await prisma.riskSheet.create({
          data: {
            target: sheetData.target,
            scenario: sheetData.scenario,
            probability: sheetData.probability,
            vulnerability: sheetData.vulnerability,
            impact: sheetData.impact,
            riskScore: Math.round(riskScore * 100) / 100, // Arrondir à 2 décimales
            priority: priority,
            category: sheetData.category,
            tags: sheetData.tags,
            aiSuggestions: sheetData.aiSuggestions,
            reviewDate: reviewDate,
            tenantId: tenant.id,
            authorId: randomUser.id,
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Derniers 7 jours
            updatedAt: new Date()
          }
        })

        createdSheets.push(createdSheet)
        console.log(`   ✅ ${sheetData.category}: ${sheetData.target} (Score: ${Math.round(riskScore)}, Priorité: ${priority})`)
      }
    }

    console.log(`\n🎉 ${createdSheets.length} nouvelles fiches GAMR créées avec succès!`)
    
    // Afficher un résumé par catégorie
    const categorySummary = {}
    createdSheets.forEach(sheet => {
      if (!categorySummary[sheet.category]) {
        categorySummary[sheet.category] = 0
      }
      categorySummary[sheet.category]++
    })

    console.log('\n📊 Résumé par catégorie:')
    Object.entries(categorySummary).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} fiche(s)`)
    })

    // Afficher un résumé par priorité
    const prioritySummary = {}
    createdSheets.forEach(sheet => {
      if (!prioritySummary[sheet.priority]) {
        prioritySummary[sheet.priority] = 0
      }
      prioritySummary[sheet.priority]++
    })

    console.log('\n🚨 Résumé par priorité:')
    Object.entries(prioritySummary).forEach(([priority, count]) => {
      console.log(`   ${priority}: ${count} fiche(s)`)
    })

  } catch (error) {
    console.error('❌ Erreur lors de la création des fiches GAMR:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
createGamrSheets()
  .then(() => {
    console.log('\n✨ Script terminé avec succès!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })
