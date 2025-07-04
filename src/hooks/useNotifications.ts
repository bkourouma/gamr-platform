import { useState, useEffect, useCallback } from 'react'
import { notificationsApi, type Notification } from '../lib/api'

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  // Charger le nombre de notifications non lues
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await notificationsApi.getUnreadCount()
      setUnreadCount(response.count)
    } catch (error) {
      console.error('Erreur lors du chargement du compteur de notifications:', error)
    }
  }, [])

  // Charger les notifications récentes
  const loadNotifications = useCallback(async (limit = 10) => {
    try {
      setLoading(true)
      const response = await notificationsApi.getAll({ limit })
      setNotifications(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, isRead: true, readAt: new Date() } : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la notification:', error)
      throw error
    }
  }, [])

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Erreur lors de la mise à jour des notifications:', error)
      throw error
    }
  }, [])

  // Créer une nouvelle notification (pour les admins)
  const createNotification = useCallback(async (data: {
    title: string
    message: string
    type: string
    userId?: string
  }) => {
    try {
      const notification = await notificationsApi.create(data)
      // Recharger les données après création
      await loadUnreadCount()
      await loadNotifications()
      return notification
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error)
      throw error
    }
  }, [loadUnreadCount, loadNotifications])

  // Supprimer une notification (pour les admins)
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationsApi.delete(id)
      setNotifications(prev => prev.filter(notif => notif.id !== id))
      // Recharger le compteur
      await loadUnreadCount()
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error)
      throw error
    }
  }, [loadUnreadCount])

  // Rafraîchir les données
  const refresh = useCallback(async () => {
    await Promise.all([
      loadUnreadCount(),
      loadNotifications()
    ])
  }, [loadUnreadCount, loadNotifications])

  // Charger les données au montage
  useEffect(() => {
    loadUnreadCount()
  }, [loadUnreadCount])

  // Polling pour les mises à jour en temps réel (toutes les 30 secondes)
  useEffect(() => {
    const interval = setInterval(() => {
      loadUnreadCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [loadUnreadCount])

  return {
    unreadCount,
    notifications,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification,
    refresh
  }
}
