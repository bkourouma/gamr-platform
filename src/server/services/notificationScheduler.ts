import { prisma } from '../lib/prisma'
import { NotificationService } from './simpleNotificationService'

export class NotificationScheduler {
  private static instance: NotificationScheduler
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = false

  private constructor() {}

  static getInstance(): NotificationScheduler {
    if (!NotificationScheduler.instance) {
      NotificationScheduler.instance = new NotificationScheduler()
    }
    return NotificationScheduler.instance
  }

  /**
   * Démarrer le planificateur de notifications
   */
  start(intervalMinutes: number = 30) {
    if (this.isRunning) {
      console.log('⚠️ Le planificateur de notifications est déjà en cours d\'exécution')
      return
    }

    console.log(`🔔 Démarrage du planificateur de notifications (intervalle: ${intervalMinutes} minutes)`)
    
    // Exécuter immédiatement
    this.runChecks()

    // Puis exécuter à intervalles réguliers
    this.intervalId = setInterval(() => {
      this.runChecks()
    }, intervalMinutes * 60 * 1000)

    this.isRunning = true
  }

  /**
   * Arrêter le planificateur
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('🛑 Planificateur de notifications arrêté')
  }

  /**
   * Exécuter toutes les vérifications
   */
  private async runChecks() {
    console.log('🔍 Vérification des notifications automatiques...')
    
    try {
      await Promise.all([
        this.checkOverdueActions(),
        this.checkUpcomingDeadlines(),
        this.checkCriticalRisks(),
        this.checkStaleRiskSheets()
      ])
    } catch (error) {
      console.error('❌ Erreur lors des vérifications de notifications:', error)
    }
  }

  /**
   * Vérifier les actions en retard
   */
  private async checkOverdueActions() {
    try {
      const overdueActions = await prisma.action.findMany({
        where: {
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: { lt: new Date() }
        },
        include: {
          assignee: true,
          riskSheet: true
        }
      })

      for (const action of overdueActions) {
        // Vérifier si une notification n'a pas déjà été envoyée dans les dernières 24h
        const existingNotification = await prisma.notification.findFirst({
          where: {
            type: 'ACTION_OVERDUE',
            message: { contains: action.title },
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        })

        if (!existingNotification) {
          await NotificationService.createActionOverdueAlert(action)
          console.log(`📅 Notification d'action en retard créée: ${action.title}`)
        }
      }

      if (overdueActions.length > 0) {
        console.log(`⏰ ${overdueActions.length} actions en retard détectées`)
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des actions en retard:', error)
    }
  }

  /**
   * Vérifier les échéances approchantes (dans les 3 prochains jours)
   */
  private async checkUpcomingDeadlines() {
    try {
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

      const upcomingActions = await prisma.action.findMany({
        where: {
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: {
            gte: new Date(),
            lte: threeDaysFromNow
          }
        },
        include: {
          assignee: true,
          riskSheet: true
        }
      })

      for (const action of upcomingActions) {
        // Vérifier si une notification n'a pas déjà été envoyée dans les dernières 24h
        const existingNotification = await prisma.notification.findFirst({
          where: {
            type: 'REVIEW_DUE',
            message: { contains: action.title },
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        })

        if (!existingNotification) {
          const daysRemaining = Math.ceil(
            (new Date(action.dueDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          )

          await NotificationService.create({
            title: '📅 Échéance Approchante',
            message: `L'action "${action.title}" est due dans ${daysRemaining} jour(s). Veuillez vérifier l'avancement.`,
            type: 'REVIEW_DUE',
            userId: action.assigneeId,
            tenantId: action.tenantId
          })

          console.log(`📅 Notification d'échéance approchante créée: ${action.title}`)
        }
      }

      if (upcomingActions.length > 0) {
        console.log(`📅 ${upcomingActions.length} échéances approchantes détectées`)
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des échéances:', error)
    }
  }

  /**
   * Vérifier les nouveaux risques critiques
   */
  private async checkCriticalRisks() {
    try {
      const recentCriticalRisks = await prisma.riskSheet.findMany({
        where: {
          priority: 'CRITICAL',
          isArchived: false,
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } // Dernière heure
        }
      })

      for (const riskSheet of recentCriticalRisks) {
        // Vérifier si une notification n'a pas déjà été envoyée
        const existingNotification = await prisma.notification.findFirst({
          where: {
            type: 'RISK_CRITICAL',
            message: { contains: riskSheet.target }
          }
        })

        if (!existingNotification) {
          await NotificationService.createRiskCriticalAlert(riskSheet)
          console.log(`🚨 Notification de risque critique créée: ${riskSheet.target}`)
        }
      }

      if (recentCriticalRisks.length > 0) {
        console.log(`🚨 ${recentCriticalRisks.length} nouveaux risques critiques détectés`)
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des risques critiques:', error)
    }
  }

  /**
   * Vérifier les fiches de risques qui n'ont pas été mises à jour depuis longtemps
   */
  private async checkStaleRiskSheets() {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const staleRiskSheets = await prisma.riskSheet.findMany({
        where: {
          isArchived: false,
          priority: { in: ['HIGH', 'CRITICAL'] },
          updatedAt: { lt: thirtyDaysAgo }
        }
      })

      for (const riskSheet of staleRiskSheets) {
        // Vérifier si une notification n'a pas déjà été envoyée dans les 7 derniers jours
        const existingNotification = await prisma.notification.findFirst({
          where: {
            type: 'REVIEW_DUE',
            message: { contains: riskSheet.target },
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        })

        if (!existingNotification) {
          await NotificationService.createReviewDueAlert(riskSheet)
          console.log(`📋 Notification de révision due créée: ${riskSheet.target}`)
        }
      }

      if (staleRiskSheets.length > 0) {
        console.log(`📋 ${staleRiskSheets.length} fiches de risques nécessitent une révision`)
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des fiches obsolètes:', error)
    }
  }

  /**
   * Nettoyer les anciennes notifications
   */
  async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
          isRead: true
        }
      })

      if (result.count > 0) {
        console.log(`🧹 ${result.count} anciennes notifications supprimées`)
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des notifications:', error)
    }
  }

  /**
   * Obtenir les statistiques du planificateur
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId !== null
    }
  }
}

