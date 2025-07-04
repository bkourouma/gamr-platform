import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedActions() {
  console.log('🎯 Création des actions correctives de test...')

  try {
    // Récupérer les données existantes
    const tenants = await prisma.tenant.findMany()
    const users = await prisma.user.findMany()
    const riskSheets = await prisma.riskSheet.findMany()

    if (tenants.length === 0 || users.length === 0 || riskSheets.length === 0) {
      console.log('❌ Données de base manquantes. Veuillez d\'abord exécuter le seed principal.')
      return
    }

    const techCorpTenant = tenants.find(t => t.slug === 'techcorp')
    const healthCareTenant = tenants.find(t => t.slug === 'healthcare-plus')

    if (!techCorpTenant || !healthCareTenant) {
      console.log('❌ Tenants TechCorp ou HealthCare non trouvés.')
      return
    }

    // Actions pour TechCorp Solutions
    const techCorpRisks = riskSheets.filter(r => r.tenantId === techCorpTenant.id)
    const techCorpUsers = users.filter(u => u.tenantId === techCorpTenant.id)

    const techCorpActions = [
      {
        title: 'Mise à jour des pare-feu',
        description: 'Mettre à jour tous les pare-feu réseau avec les derniers correctifs de sécurité pour corriger les vulnérabilités identifiées.',
        dueDate: new Date('2024-02-15'),
        status: 'TODO',
        priority: 'HIGH',
        successProbability: 85,
        estimatedCost: 5000,
        estimatedDuration: 48, // heures
        riskSheetId: techCorpRisks[0]?.id,
        assigneeId: techCorpUsers.find(u => u.role === 'AI_ANALYST')?.id,
        tenantId: techCorpTenant.id
      },
      {
        title: 'Formation cybersécurité équipe IT',
        description: 'Organiser une formation complète sur les bonnes pratiques de cybersécurité pour l\'équipe informatique.',
        dueDate: new Date('2024-02-20'),
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        successProbability: 90,
        estimatedCost: 2500,
        estimatedDuration: 16,
        riskSheetId: techCorpRisks[1]?.id,
        assigneeId: techCorpUsers.find(u => u.role === 'EVALUATOR')?.id,
        tenantId: techCorpTenant.id
      },
      {
        title: 'Audit des accès privilégiés',
        description: 'Effectuer un audit complet de tous les comptes à privilèges élevés et réviser les permissions.',
        dueDate: new Date('2024-01-30'), // En retard
        status: 'TODO',
        priority: 'CRITICAL',
        successProbability: 75,
        estimatedCost: 8000,
        estimatedDuration: 72,
        riskSheetId: techCorpRisks[2]?.id,
        assigneeId: techCorpUsers.find(u => u.role === 'ADMIN')?.id,
        tenantId: techCorpTenant.id
      },
      {
        title: 'Sauvegarde système critique',
        description: 'Mettre en place un système de sauvegarde redondant pour les données critiques de l\'entreprise.',
        dueDate: new Date('2024-03-01'),
        status: 'COMPLETED',
        priority: 'HIGH',
        successProbability: 95,
        estimatedCost: 12000,
        estimatedDuration: 120,
        riskSheetId: techCorpRisks[3]?.id,
        assigneeId: techCorpUsers.find(u => u.role === 'AI_ANALYST')?.id,
        tenantId: techCorpTenant.id,
        completedAt: new Date('2024-01-25')
      },
      {
        title: 'Renforcement sécurité physique',
        description: 'Installer des systèmes de contrôle d\'accès biométrique dans les zones sensibles du datacenter.',
        dueDate: new Date('2024-02-28'),
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        successProbability: 80,
        estimatedCost: 15000,
        estimatedDuration: 96,
        riskSheetId: techCorpRisks[4]?.id,
        assigneeId: techCorpUsers.find(u => u.role === 'EVALUATOR')?.id,
        tenantId: techCorpTenant.id
      }
    ]

    // Actions pour HealthCare Plus
    const healthCareRisks = riskSheets.filter(r => r.tenantId === healthCareTenant.id)
    const healthCareUsers = users.filter(u => u.tenantId === healthCareTenant.id)

    const healthCareActions = [
      {
        title: 'Conformité RGPD données patients',
        description: 'Mettre en conformité tous les systèmes de gestion des données patients selon le RGPD.',
        dueDate: new Date('2024-02-10'),
        status: 'TODO',
        priority: 'CRITICAL',
        successProbability: 70,
        estimatedCost: 25000,
        estimatedDuration: 200,
        riskSheetId: healthCareRisks[0]?.id,
        assigneeId: healthCareUsers.find(u => u.role === 'ADMIN')?.id,
        tenantId: healthCareTenant.id
      },
      {
        title: 'Chiffrement base de données médicales',
        description: 'Implémenter un chiffrement de bout en bout pour toutes les bases de données contenant des informations médicales.',
        dueDate: new Date('2024-01-25'), // En retard
        status: 'IN_PROGRESS',
        priority: 'CRITICAL',
        successProbability: 85,
        estimatedCost: 18000,
        estimatedDuration: 144,
        riskSheetId: healthCareRisks[1]?.id,
        assigneeId: healthCareUsers.find(u => u.role === 'AI_ANALYST')?.id,
        tenantId: healthCareTenant.id
      },
      {
        title: 'Formation HIPAA personnel médical',
        description: 'Formation obligatoire sur les règles HIPAA pour tout le personnel ayant accès aux données patients.',
        dueDate: new Date('2024-02-25'),
        status: 'TODO',
        priority: 'HIGH',
        successProbability: 95,
        estimatedCost: 3500,
        estimatedDuration: 24,
        riskSheetId: healthCareRisks[2]?.id,
        assigneeId: healthCareUsers.find(u => u.role === 'EVALUATOR')?.id,
        tenantId: healthCareTenant.id
      },
      {
        title: 'Système de détection d\'intrusion',
        description: 'Déployer un système IDS/IPS pour surveiller les accès non autorisés aux systèmes médicaux.',
        dueDate: new Date('2024-03-15'),
        status: 'COMPLETED',
        priority: 'HIGH',
        successProbability: 90,
        estimatedCost: 22000,
        estimatedDuration: 160,
        riskSheetId: healthCareRisks[3]?.id,
        assigneeId: healthCareUsers.find(u => u.role === 'AI_ANALYST')?.id,
        tenantId: healthCareTenant.id,
        completedAt: new Date('2024-01-20')
      }
    ]

    // Créer toutes les actions
    const allActions = [...techCorpActions, ...healthCareActions].filter(action => action.riskSheetId)

    for (const actionData of allActions) {
      await prisma.action.create({
        data: {
          ...actionData,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Derniers 30 jours
          updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Derniers 7 jours
        }
      })
    }

    console.log(`✅ ${allActions.length} actions correctives créées avec succès`)

    // Statistiques
    const stats = await prisma.action.groupBy({
      by: ['status'],
      _count: true
    })

    console.log('\n📊 Statistiques des actions:')
    stats.forEach(stat => {
      console.log(`   ${stat.status}: ${stat._count} actions`)
    })

    const overdueActions = await prisma.action.count({
      where: {
        status: { in: ['TODO', 'IN_PROGRESS'] },
        dueDate: { lt: new Date() }
      }
    })

    console.log(`\n⏰ ${overdueActions} actions en retard`)

  } catch (error) {
    console.error('❌ Erreur lors de la création des actions:', error)
    throw error
  }
}

async function main() {
  try {
    await seedActions()
  } catch (error) {
    console.error('Erreur:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter si c'est le fichier principal
main()

export { seedActions }
