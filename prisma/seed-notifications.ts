import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedNotifications() {
  console.log('🔔 Création des notifications de test...')

  try {
    // Récupérer les tenants existants
    const tenants = await prisma.tenant.findMany()
    const users = await prisma.user.findMany()

    if (tenants.length === 0 || users.length === 0) {
      console.log('❌ Aucun tenant ou utilisateur trouvé. Veuillez d\'abord exécuter le seed principal.')
      return
    }

    const techCorpTenant = tenants.find(t => t.slug === 'techcorp')
    const healthCareTenant = tenants.find(t => t.slug === 'healthcare-plus')

    if (!techCorpTenant || !healthCareTenant) {
      console.log('❌ Tenants TechCorp ou HealthCare non trouvés.')
      return
    }

    // Notifications pour TechCorp Solutions
    const techCorpNotifications = [
      {
        title: '🚨 Risque Critique Détecté',
        message: 'Un nouveau risque critique a été identifié concernant la sécurité des serveurs. Score de risque: 85/100. Action immédiate requise.',
        type: 'RISK_CRITICAL',
        tenantId: techCorpTenant.id,
        userId: null, // Notification globale
        isRead: false
      },
      {
        title: '⏰ Action en Retard',
        message: 'L\'action "Mise à jour des pare-feu" était due le 15/01/2024. Veuillez mettre à jour son statut.',
        type: 'ACTION_OVERDUE',
        tenantId: techCorpTenant.id,
        userId: users.find(u => u.email === 'admin@techcorp.com')?.id,
        isRead: false
      },
      {
        title: '🤖 Analyse IA Terminée',
        message: 'L\'analyse prédictive des risques cybersécurité est terminée. 3 nouvelles vulnérabilités potentielles détectées.',
        type: 'AI_ALERT',
        tenantId: techCorpTenant.id,
        userId: users.find(u => u.email === 'analyst@techcorp.com')?.id,
        isRead: false
      },
      {
        title: '📋 Révision Requise',
        message: 'La fiche de risque "Accès physique aux locaux" nécessite une révision. Dernière mise à jour: 10/12/2023.',
        type: 'REVIEW_DUE',
        tenantId: techCorpTenant.id,
        userId: users.find(u => u.email === 'evaluator@techcorp.com')?.id,
        isRead: true
      },
      {
        title: '🔗 Corrélation de Risques Détectée',
        message: 'Une forte corrélation (78%) a été détectée entre "Panne électrique" et "Perte de données". Analyse recommandée.',
        type: 'CORRELATION_ALERT',
        tenantId: techCorpTenant.id,
        userId: null,
        isRead: false
      },
      {
        title: '⚙️ Mise à Jour Système',
        message: 'La plateforme GAMRDIGITALE a été mise à jour vers la version 3.1. Nouvelles fonctionnalités disponibles.',
        type: 'SYSTEM',
        tenantId: techCorpTenant.id,
        userId: null,
        isRead: true
      }
    ]

    // Notifications pour HealthCare Plus
    const healthCareNotifications = [
      {
        title: '🚨 Risque Critique - Données Patients',
        message: 'Risque critique identifié: accès non autorisé aux dossiers patients. Score: 92/100. Intervention urgente nécessaire.',
        type: 'RISK_CRITICAL',
        tenantId: healthCareTenant.id,
        userId: null,
        isRead: false
      },
      {
        title: '📋 Audit de Conformité RGPD',
        message: 'L\'audit de conformité RGPD est programmé pour la semaine prochaine. Veuillez préparer les documents requis.',
        type: 'REVIEW_DUE',
        tenantId: healthCareTenant.id,
        userId: users.find(u => u.email === 'admin@healthcare-plus.com')?.id,
        isRead: false
      },
      {
        title: '🤖 Détection d\'Anomalie',
        message: 'L\'IA a détecté une anomalie dans les patterns d\'accès aux systèmes. Analyse en cours.',
        type: 'AI_ALERT',
        tenantId: healthCareTenant.id,
        userId: null,
        isRead: false
      },
      {
        title: '⏰ Formation Sécurité en Retard',
        message: 'La formation sécurité du personnel était due le 20/01/2024. 15 employés n\'ont pas encore complété le module.',
        type: 'ACTION_OVERDUE',
        tenantId: healthCareTenant.id,
        userId: users.find(u => u.email === 'evaluator@healthcare-plus.com')?.id,
        isRead: true
      }
    ]

    // Créer toutes les notifications
    const allNotifications = [...techCorpNotifications, ...healthCareNotifications]

    for (const notificationData of allNotifications) {
      await prisma.notification.create({
        data: {
          ...notificationData,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Derniers 7 jours
          readAt: notificationData.isRead ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) : null
        }
      })
    }

    console.log(`✅ ${allNotifications.length} notifications créées avec succès`)

    // Statistiques
    const stats = await prisma.notification.groupBy({
      by: ['type'],
      _count: true
    })

    console.log('\n📊 Statistiques des notifications:')
    stats.forEach(stat => {
      console.log(`   ${stat.type}: ${stat._count} notifications`)
    })

    const unreadCount = await prisma.notification.count({
      where: { isRead: false }
    })

    console.log(`\n🔔 ${unreadCount} notifications non lues`)

  } catch (error) {
    console.error('❌ Erreur lors de la création des notifications:', error)
    throw error
  }
}

async function main() {
  try {
    await seedNotifications()
  } catch (error) {
    console.error('Erreur:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter si c'est le fichier principal
main()

export { seedNotifications }
