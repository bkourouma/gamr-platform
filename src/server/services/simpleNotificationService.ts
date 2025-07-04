import { prisma } from '../lib/prisma'

export class NotificationService {
  static async createNotification(data: any) {
    console.log('Creating notification:', data)
    return { id: 'mock-id', ...data }
  }

  static async getNotifications(tenantId: string) {
    console.log('Getting notifications for tenant:', tenantId)
    return []
  }

  static async markAsRead(notificationId: string) {
    console.log('Marking notification as read:', notificationId)
    return true
  }
}
