import { prisma } from '../lib/prisma'

// Simple, production-capable notification service used by the scheduler
export class NotificationService {
  // Generic creator used throughout the codebase
  static async create(data: {
    title: string
    message: string
    type: 'RISK_CRITICAL' | 'ACTION_OVERDUE' | 'REVIEW_DUE' | 'AI_ALERT' | 'CORRELATION_ALERT' | 'SYSTEM'
    tenantId: string
    userId?: string | null
  }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          title: data.title,
          message: data.message,
          type: data.type,
          tenantId: data.tenantId,
          userId: data.userId ?? null,
          isRead: false
        }
      })
      return notification
    } catch (error) {
      console.error('Error creating notification:', error)
      return null
    }
  }

  // Backward-compat alias used in some routes/services
  static async createNotification(data: any) {
    return this.create(data)
  }

  static async getNotifications(tenantId: string, userId?: string) {
    try {
      return await prisma.notification.findMany({
        where: {
          OR: [
            { tenantId, userId: null },
            ...(userId ? [{ userId }] : [])
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    } catch (error) {
      console.error('Error getting notifications:', error)
      return []
    }
  }

  static async markAsRead(notificationId: string) {
    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true, readAt: new Date() }
      })
      return true
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  // Specialized helpers used by the NotificationScheduler
  static async createActionOverdueAlert(action: any) {
    const title = '⏰ Action en Retard'
    const due = action.dueDate ? new Date(action.dueDate) : null
    const dueStr = due ? due.toLocaleDateString() : 'date inconnue'
    const message = `L'action "${action.title}" est en retard (échéance: ${dueStr}). Veuillez mettre à jour son statut.`

    return this.create({
      title,
      message,
      type: 'ACTION_OVERDUE',
      userId: action.assigneeId ?? null,
      tenantId: action.tenantId
    })
  }

  static async createRiskCriticalAlert(riskSheet: any) {
    const title = '🚨 Risque Critique Détecté'
    const message = `Un risque critique a été identifié: "${riskSheet.target}". Priorité: ${riskSheet.priority}.`

    return this.create({
      title,
      message,
      type: 'RISK_CRITICAL',
      userId: null,
      tenantId: riskSheet.tenantId
    })
  }

  static async createReviewDueAlert(riskSheet: any) {
    const title = '📋 Révision Requise'
    const message = `La fiche de risque "${riskSheet.target}" nécessite une révision.`

    return this.create({
      title,
      message,
      type: 'REVIEW_DUE',
      userId: null,
      tenantId: riskSheet.tenantId
    })
  }
}
