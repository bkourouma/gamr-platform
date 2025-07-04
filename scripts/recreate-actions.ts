import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function recreateActions() {
  console.log('🗑️ Suppression de toutes les actions correctives existantes...')

  try {
    // 1. Supprimer toutes les actions existantes
    const deletedActions = await prisma.action.deleteMany({})
    console.log(`✅ ${deletedActions.count} actions supprimées`)

    // 2. Récupérer toutes les fiches de risques existantes
    const riskSheets = await prisma.riskSheet.findMany({
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { riskScore: 'desc' }
      ]
    })

    console.log(`📊 ${riskSheets.length} fiches de risques trouvées`)

    if (riskSheets.length === 0) {
      console.log('❌ Aucune fiche de risque trouvée')
      return
    }

    // 3. Définir 10 actions correctives diversifiées
    const actionsTemplate = [
      {
        title: "Audit de sécurité complet",
        description: "Réaliser un audit de sécurité approfondi pour identifier toutes les vulnérabilités et points d'amélioration",
        priority: "HIGH" as const,
        daysFromNow: 14,
        estimatedCost: 15000,
        estimatedDuration: 7
      },
      {
        title: "Formation du personnel de sécurité",
        description: "Organiser des sessions de formation spécialisées pour le personnel de sécurité sur les dernières menaces et procédures",
        priority: "MEDIUM" as const,
        daysFromNow: 21,
        estimatedCost: 8000,
        estimatedDuration: 5
      },
      {
        title: "Mise à jour des systèmes de surveillance",
        description: "Moderniser et étendre le système de vidéosurveillance avec des caméras haute définition et détection intelligente",
        priority: "HIGH" as const,
        daysFromNow: 30,
        estimatedCost: 25000,
        estimatedDuration: 10
      },
      {
        title: "Renforcement du contrôle d'accès",
        description: "Installer des systèmes de contrôle d'accès biométriques et des badges RFID pour sécuriser les zones sensibles",
        priority: "HIGH" as const,
        daysFromNow: 35,
        estimatedCost: 20000,
        estimatedDuration: 12
      },
      {
        title: "Plan de continuité d'activité",
        description: "Développer et tester un plan de continuité d'activité pour maintenir les opérations en cas d'incident majeur",
        priority: "MEDIUM" as const,
        daysFromNow: 45,
        estimatedCost: 12000,
        estimatedDuration: 20
      },
      {
        title: "Sécurisation des données sensibles",
        description: "Mettre en place un système de chiffrement et de sauvegarde sécurisée pour protéger les informations critiques",
        priority: "HIGH" as const,
        daysFromNow: 25,
        estimatedCost: 18000,
        estimatedDuration: 8
      },
      {
        title: "Exercices de simulation d'urgence",
        description: "Organiser des exercices réguliers de simulation d'incidents pour tester la réactivité des équipes",
        priority: "MEDIUM" as const,
        daysFromNow: 28,
        estimatedCost: 5000,
        estimatedDuration: 3
      },
      {
        title: "Maintenance préventive des équipements",
        description: "Établir un programme de maintenance préventive pour tous les équipements de sécurité critiques",
        priority: "MEDIUM" as const,
        daysFromNow: 40,
        estimatedCost: 10000,
        estimatedDuration: 15
      },
      {
        title: "Analyse des vulnérabilités réseau",
        description: "Effectuer une analyse complète des vulnérabilités du réseau informatique et des systèmes connectés",
        priority: "HIGH" as const,
        daysFromNow: 20,
        estimatedCost: 22000,
        estimatedDuration: 6
      },
      {
        title: "Mise en conformité réglementaire",
        description: "Assurer la conformité avec toutes les réglementations de sécurité applicables et obtenir les certifications nécessaires",
        priority: "CRITICAL" as const,
        daysFromNow: 60,
        estimatedCost: 30000,
        estimatedDuration: 25
      }
    ]

    console.log('\n🎯 Création de 10 nouvelles actions correctives...')

    const createdActions = []

    for (let i = 0; i < Math.min(10, actionsTemplate.length); i++) {
      // Sélectionner une fiche de risque (rotation pour distribuer les actions)
      const riskSheet = riskSheets[i % riskSheets.length]
      const actionTemplate = actionsTemplate[i]

      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + actionTemplate.daysFromNow)

      const action = await prisma.action.create({
        data: {
          title: actionTemplate.title,
          description: actionTemplate.description,
          priority: actionTemplate.priority,
          dueDate: dueDate,
          estimatedCost: actionTemplate.estimatedCost,
          estimatedDuration: actionTemplate.estimatedDuration,
          status: 'TODO',
          tenantId: riskSheet.tenantId,
          riskSheetId: riskSheet.id,
          assigneeId: riskSheet.authorId
        },
        include: {
          assignee: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          riskSheet: {
            select: {
              target: true,
              priority: true
            }
          }
        }
      })

      createdActions.push(action)

      console.log(`✅ Action ${i + 1}/10: ${action.title}`)
      console.log(`   Priorité: ${action.priority} | Échéance: ${action.dueDate?.toLocaleDateString('fr-FR')}`)
      console.log(`   Coût: ${action.estimatedCost?.toLocaleString('fr-FR')}€ | Durée: ${action.estimatedDuration} jours`)
      console.log(`   Fiche de risque: ${action.riskSheet?.target.substring(0, 40)}...`)
      console.log(`   Assigné à: ${action.assignee?.firstName} ${action.assignee?.lastName}`)
    }

    console.log(`\n🎉 ${createdActions.length} actions correctives créées avec succès!`)

    // 4. Statistiques
    console.log(`\n📊 Statistiques des nouvelles actions:`)
    
    const priorityStats = createdActions.reduce((acc, action) => {
      acc[action.priority] = (acc[action.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log(`Répartition par priorité:`)
    Object.entries(priorityStats).forEach(([priority, count]) => {
      const emoji = priority === 'CRITICAL' ? '🔴' : 
                   priority === 'HIGH' ? '🟠' : 
                   priority === 'MEDIUM' ? '🟡' : 
                   priority === 'LOW' ? '🟢' : '⚪'
      console.log(`  ${emoji} ${priority}: ${count} action${count > 1 ? 's' : ''}`)
    })

    const totalCost = createdActions.reduce((sum, action) => sum + (action.estimatedCost || 0), 0)
    console.log(`\n💰 Coût total estimé: ${totalCost.toLocaleString('fr-FR')}€`)

    const avgDuration = createdActions.reduce((sum, action) => sum + (action.estimatedDuration || 0), 0) / createdActions.length
    console.log(`⏱️  Durée moyenne: ${Math.round(avgDuration)} jours`)

    // 5. Actions prioritaires
    const criticalAndHighActions = createdActions.filter(a => a.priority === 'CRITICAL' || a.priority === 'HIGH')
    console.log(`\n🚨 Actions prioritaires à traiter en premier: ${criticalAndHighActions.length}`)
    
    criticalAndHighActions.slice(0, 3).forEach((action, index) => {
      console.log(`${index + 1}. ${action.title} (${action.priority})`)
      console.log(`   Échéance: ${action.dueDate?.toLocaleDateString('fr-FR')}`)
    })

    // 6. Répartition par tenant
    const tenantStats = createdActions.reduce((acc, action) => {
      const tenantName = riskSheets.find(r => r.id === action.riskSheetId)?.tenant.name || 'Inconnu'
      acc[tenantName] = (acc[tenantName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    console.log(`\n🏢 Répartition par tenant:`)
    Object.entries(tenantStats).forEach(([tenant, count]) => {
      console.log(`  ${tenant}: ${count} action${count > 1 ? 's' : ''}`)
    })

    console.log(`\n✅ Recréation des actions terminée avec succès!`)
    console.log(`📅 ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}`)

  } catch (error) {
    console.error('❌ Erreur lors de la recréation des actions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

recreateActions()
