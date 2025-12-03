import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Fonction pour calculer le score de risque GAMRDIGITALE (formule classique)
function calculateRiskScore(probability: number, vulnerability: number, impact: number): number {
  return probability * vulnerability * impact
}

// Fonction pour déterminer la priorité basée sur le score
function getPriorityFromScore(score: number): string {
  if (score >= 80) return 'CRITICAL'
  if (score >= 60) return 'HIGH'
  if (score >= 40) return 'MEDIUM'
  if (score >= 20) return 'LOW'
  return 'VERY_LOW'
}

async function createRiskSheets() {
  console.log('🎯 Création de 6 fiches de risques basées sur les évaluations Gold Mines Inc...')

  try {
    // Récupérer les évaluations Gold Mines Inc
    const evaluations = await prisma.evaluation.findMany({
      where: {
        title: {
          contains: 'Gold Mines Inc'
        },
        status: 'COMPLETED'
      },
      include: {
        responses: {
          include: {
            question: true
          }
        },
        evaluator: true,
        tenant: true
      }
    })

    if (evaluations.length === 0) {
      console.log('❌ Aucune évaluation Gold Mines Inc trouvée')
      return
    }

    console.log(`📊 ${evaluations.length} évaluations trouvées`)

    // Définir les 6 fiches de risques basées sur l'analyse des évaluations
    const riskSheetsData = [
      {
        target: "Accès non autorisé aux installations minières",
        scenario: "Intrusion d'individus malveillants dans le périmètre de la mine en raison de défaillances dans le système de contrôle d'accès et de surveillance du périmètre",
        probability: 2, // Probable
        vulnerability: 3, // Vulnérabilité élevée
        impact: 4, // Impact majeur
        category: "Sécurité Physique - Périmètre",
        tags: ["accès", "périmètre", "intrusion", "surveillance"],
        aiSuggestions: {
          recommendations: [
            "Renforcer le système de contrôle d'accès avec badges RFID",
            "Installer des caméras de surveillance supplémentaires",
            "Mettre en place des rondes de sécurité régulières"
          ],
          confidence: 0.92
        }
      },
      {
        target: "Équipements critiques d'extraction",
        scenario: "Sabotage ou vol d'équipements miniers critiques causant l'arrêt de la production et des pertes financières importantes",
        probability: 2, // Probable
        vulnerability: 4, // Vulnérabilité très élevée
        impact: 5, // Impact critique
        category: "Sécurité des Biens - Équipements",
        tags: ["équipements", "sabotage", "vol", "production"],
        aiSuggestions: {
          recommendations: [
            "Sécuriser physiquement les équipements critiques",
            "Installer des systèmes d'alarme anti-intrusion",
            "Mettre en place une surveillance 24h/24"
          ],
          confidence: 0.88
        }
      },
      {
        target: "Personnel de sécurité",
        scenario: "Formation insuffisante du personnel de sécurité face aux menaces spécifiques de l'industrie minière, compromettant la capacité de réponse aux incidents",
        probability: 3, // Très probable
        vulnerability: 3, // Vulnérabilité élevée
        impact: 3, // Impact modéré
        category: "Sécurité du Personnel - Formation",
        tags: ["formation", "personnel", "sécurité", "réponse"],
        aiSuggestions: {
          recommendations: [
            "Organiser des formations spécialisées régulières",
            "Créer des procédures d'urgence spécifiques",
            "Effectuer des exercices de simulation"
          ],
          confidence: 0.85
        }
      },
      {
        target: "Systèmes informatiques et de communication",
        scenario: "Cyberattaque ciblant les systèmes de contrôle industriel et de communication, perturbant les opérations minières et compromettant la sécurité",
        probability: 2, // Probable
        vulnerability: 3, // Vulnérabilité élevée
        impact: 4, // Impact majeur
        category: "Cybersécurité - Systèmes Critiques",
        tags: ["cybersécurité", "systèmes", "communication", "contrôle"],
        aiSuggestions: {
          recommendations: [
            "Segmenter les réseaux industriels",
            "Mettre à jour les systèmes de sécurité",
            "Former le personnel aux bonnes pratiques cyber"
          ],
          confidence: 0.90
        }
      },
      {
        target: "Zones de stockage de matières dangereuses",
        scenario: "Accès non contrôlé aux zones de stockage d'explosifs et de produits chimiques utilisés dans l'extraction, risquant un incident majeur",
        probability: 1, // Peu probable mais possible
        vulnerability: 4, // Vulnérabilité très élevée
        impact: 5, // Impact critique
        category: "Sécurité Chimique - Stockage",
        tags: ["explosifs", "chimiques", "stockage", "accès"],
        aiSuggestions: {
          recommendations: [
            "Renforcer le contrôle d'accès aux zones sensibles",
            "Installer des détecteurs de mouvement",
            "Mettre en place un système de double authentification"
          ],
          confidence: 0.95
        }
      },
      {
        target: "Documentation et données sensibles",
        scenario: "Vol ou compromission de documents confidentiels contenant des informations sur les réserves, les procédés et la sécurité de l'entreprise",
        probability: 2, // Probable
        vulnerability: 2, // Vulnérabilité modérée
        impact: 3, // Impact modéré
        category: "Sécurité de l'Information",
        tags: ["documents", "confidentialité", "données", "vol"],
        aiSuggestions: {
          recommendations: [
            "Chiffrer les documents sensibles",
            "Mettre en place un système de gestion documentaire sécurisé",
            "Limiter l'accès selon le principe du moindre privilège"
          ],
          confidence: 0.82
        }
      }
    ]

    // Utiliser la première évaluation comme source
    const sourceEvaluation = evaluations[0]
    
    console.log(`\n📝 Création des fiches de risques pour le tenant: ${sourceEvaluation.tenant.name}`)
    console.log(`👤 Auteur: ${sourceEvaluation.evaluator.firstName} ${sourceEvaluation.evaluator.lastName}`)

    const createdRiskSheets = []

    for (const [index, riskData] of riskSheetsData.entries()) {
      const riskScore = calculateRiskScore(riskData.probability, riskData.vulnerability, riskData.impact)
      const priority = getPriorityFromScore(riskScore)

      const riskSheet = await prisma.riskSheet.create({
        data: {
          target: riskData.target,
          scenario: riskData.scenario,
          probability: riskData.probability,
          vulnerability: riskData.vulnerability,
          impact: riskData.impact,
          riskScore,
          priority: priority as any,
          category: riskData.category,
          tags: riskData.tags,
          aiSuggestions: riskData.aiSuggestions,
          tenantId: sourceEvaluation.tenantId,
          authorId: sourceEvaluation.evaluatorId,
          sourceEvaluationId: sourceEvaluation.id,
          reviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // +90 jours
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })

      createdRiskSheets.push(riskSheet)
      
      console.log(`✅ Fiche ${index + 1}/6 créée: ${riskSheet.target}`)
      console.log(`   Score: ${Math.round(riskScore)}/100 | Priorité: ${priority}`)
    }

    console.log(`\n🎉 ${createdRiskSheets.length} fiches de risques créées avec succès!`)
    
    // Afficher un résumé
    console.log(`\n📊 Résumé des priorités:`)
    const priorityCounts = createdRiskSheets.reduce((acc, sheet) => {
      acc[sheet.priority] = (acc[sheet.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    Object.entries(priorityCounts).forEach(([priority, count]) => {
      console.log(`   ${priority}: ${count} fiche${count > 1 ? 's' : ''}`)
    })

    return createdRiskSheets

  } catch (error) {
    console.error('❌ Erreur lors de la création des fiches de risques:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createRiskSheets()
