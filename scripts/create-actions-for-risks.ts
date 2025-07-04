import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createActionsForRisks() {
  console.log('🎯 Création d\'actions correctives pour les fiches de risques Gold Mines Inc...')

  try {
    // Récupérer les fiches de risques créées aujourd'hui avec évaluation source
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const riskSheets = await prisma.riskSheet.findMany({
      where: {
        createdAt: {
          gte: today
        },
        sourceEvaluationId: {
          not: null
        }
      },
      include: {
        author: true,
        sourceEvaluation: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        riskScore: 'desc'
      }
    })

    if (riskSheets.length === 0) {
      console.log('❌ Aucune fiche de risque trouvée')
      return
    }

    console.log(`📊 ${riskSheets.length} fiches de risques trouvées`)

    const actionsData = [
      // Actions pour "Équipements critiques d'extraction" (HIGH priority)
      {
        riskSheetTarget: "Équipements critiques d'extraction",
        actions: [
          {
            title: "Installation de systèmes d'alarme anti-intrusion",
            description: "Installer des capteurs de mouvement et des alarmes sur tous les équipements critiques d'extraction pour détecter toute tentative d'accès non autorisé",
            priority: "HIGH" as const,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
            estimatedCost: 25000,
            estimatedDuration: 15
          },
          {
            title: "Renforcement de la sécurité physique des équipements",
            description: "Mettre en place des barrières physiques, des cadenas renforcés et des systèmes de verrouillage électronique pour les équipements les plus sensibles",
            priority: "HIGH" as const,
            dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // +45 jours
            estimatedCost: 15000,
            estimatedDuration: 20
          }
        ]
      },
      // Actions pour "Personnel de sécurité" (MEDIUM priority)
      {
        riskSheetTarget: "Personnel de sécurité",
        actions: [
          {
            title: "Formation spécialisée du personnel de sécurité",
            description: "Organiser des sessions de formation sur les menaces spécifiques à l'industrie minière et les procédures de réponse aux incidents",
            priority: "MEDIUM" as const,
            dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // +21 jours
            estimatedCost: 8000,
            estimatedDuration: 10
          },
          {
            title: "Création de procédures d'urgence spécifiques",
            description: "Développer et documenter des procédures d'urgence adaptées aux risques miniers avec des exercices de simulation trimestriels",
            priority: "MEDIUM" as const,
            dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // +60 jours
            estimatedCost: 5000,
            estimatedDuration: 25
          }
        ]
      },
      // Actions pour "Accès non autorisé aux installations minières" (MEDIUM priority)
      {
        riskSheetTarget: "Accès non autorisé aux installations minières",
        actions: [
          {
            title: "Mise à niveau du système de contrôle d'accès",
            description: "Installer des badges RFID et des lecteurs biométriques aux points d'accès critiques du site minier",
            priority: "MEDIUM" as const,
            dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // +35 jours
            estimatedCost: 18000,
            estimatedDuration: 12
          },
          {
            title: "Extension du système de vidéosurveillance",
            description: "Installer des caméras supplémentaires avec vision nocturne et détection de mouvement sur le périmètre",
            priority: "MEDIUM" as const,
            dueDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), // +40 jours
            estimatedCost: 12000,
            estimatedDuration: 8
          }
        ]
      },
      // Actions pour "Systèmes informatiques et de communication" (MEDIUM priority)
      {
        riskSheetTarget: "Systèmes informatiques et de communication",
        actions: [
          {
            title: "Segmentation des réseaux industriels",
            description: "Séparer les réseaux de contrôle industriel des réseaux administratifs pour limiter les risques de cyberattaques",
            priority: "HIGH" as const,
            dueDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000), // +50 jours
            estimatedCost: 22000,
            estimatedDuration: 18
          },
          {
            title: "Formation cybersécurité du personnel",
            description: "Sensibiliser le personnel aux bonnes pratiques de cybersécurité et aux risques de phishing",
            priority: "MEDIUM" as const,
            dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // +28 jours
            estimatedCost: 3000,
            estimatedDuration: 5
          }
        ]
      },
      // Actions pour "Zones de stockage de matières dangereuses" (LOW priority)
      {
        riskSheetTarget: "Zones de stockage de matières dangereuses",
        actions: [
          {
            title: "Renforcement du contrôle d'accès aux zones sensibles",
            description: "Mettre en place un système de double authentification pour l'accès aux zones de stockage d'explosifs et de produits chimiques",
            priority: "HIGH" as const,
            dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // +25 jours
            estimatedCost: 10000,
            estimatedDuration: 7
          }
        ]
      },
      // Actions pour "Documentation et données sensibles" (LOW priority)
      {
        riskSheetTarget: "Documentation et données sensibles",
        actions: [
          {
            title: "Chiffrement des documents sensibles",
            description: "Mettre en place un système de chiffrement pour tous les documents contenant des informations confidentielles sur les réserves et procédés",
            priority: "MEDIUM" as const,
            dueDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000), // +42 jours
            estimatedCost: 6000,
            estimatedDuration: 10
          }
        ]
      }
    ]

    let totalActionsCreated = 0

    for (const actionGroup of actionsData) {
      // Trouver la fiche de risque correspondante
      const riskSheet = riskSheets.find(sheet => 
        sheet.target.includes(actionGroup.riskSheetTarget) || 
        actionGroup.riskSheetTarget.includes(sheet.target)
      )

      if (!riskSheet) {
        console.log(`⚠️  Fiche de risque non trouvée pour: ${actionGroup.riskSheetTarget}`)
        continue
      }

      console.log(`\n📋 Création d'actions pour: ${riskSheet.target}`)

      for (const actionData of actionGroup.actions) {
        const action = await prisma.action.create({
          data: {
            title: actionData.title,
            description: actionData.description,
            priority: actionData.priority,
            dueDate: actionData.dueDate,
            estimatedCost: actionData.estimatedCost,
            estimatedDuration: actionData.estimatedDuration,
            status: 'TODO',
            tenantId: riskSheet.tenantId,
            riskSheetId: riskSheet.id,
            assigneeId: riskSheet.authorId // Assigner à l'auteur de la fiche de risque
          },
          include: {
            assignee: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        })

        console.log(`   ✅ ${action.title}`)
        console.log(`      Priorité: ${action.priority} | Échéance: ${action.dueDate?.toLocaleDateString('fr-FR')}`)
        console.log(`      Coût estimé: ${action.estimatedCost}€ | Durée: ${action.estimatedDuration} jours`)
        
        totalActionsCreated++
      }
    }

    console.log(`\n🎉 ${totalActionsCreated} actions correctives créées avec succès!`)

    // Statistiques
    const allActions = await prisma.action.findMany({
      where: {
        createdAt: {
          gte: today
        }
      }
    })

    const priorityStats = allActions.reduce((acc, action) => {
      acc[action.priority] = (acc[action.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log(`\n📊 Répartition des actions par priorité:`)
    Object.entries(priorityStats).forEach(([priority, count]) => {
      const emoji = priority === 'CRITICAL' ? '🔴' : 
                   priority === 'HIGH' ? '🟠' : 
                   priority === 'MEDIUM' ? '🟡' : 
                   priority === 'LOW' ? '🟢' : '⚪'
      console.log(`   ${emoji} ${priority}: ${count} action${count > 1 ? 's' : ''}`)
    })

    const totalCost = allActions.reduce((sum, action) => sum + (action.estimatedCost || 0), 0)
    console.log(`\n💰 Coût total estimé: ${totalCost.toLocaleString('fr-FR')}€`)

  } catch (error) {
    console.error('❌ Erreur lors de la création des actions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createActionsForRisks()
