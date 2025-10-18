import { prisma } from '../lib/prisma'

export class NotificationService {
  static async createNotification(data: {
    type: string
    title: string
    message: string
    tenantId: string
    userId?: string
    metadata?: any
  }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          type: data.type as any,
          title: data.title,
          message: data.message,
          tenantId: data.tenantId,
          userId: data.userId,
          // metadata: data.metadata || {},
          isRead: false
        }
      })
      return notification
    } catch (error) {
      console.error('Error creating notification:', error)
      return null
    }
  }

  static async getNotifications(tenantId: string, userId?: string) {
    try {
      return await prisma.notification.findMany({
        where: {
          tenantId,
          ...(userId && { userId })
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
        data: { isRead: true }
      })
      return true
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  static async getUnreadCount(tenantId: string, userId?: string) {
    try {
      return await prisma.notification.count({
        where: {
          tenantId,
          ...(userId && { userId }),
          isRead: false
        }
      })
    } catch (error) {
      console.error('Error getting unread count:', error)
      return 0
    }
  }
}
