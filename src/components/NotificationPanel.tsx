import React, { useState, useEffect, useRef } from 'react'
import { Bell, X, Check, AlertTriangle, Clock, Shield, Zap, Settings } from 'lucide-react'
import { Button } from './ui/Button'
import { notificationsApi, type Notification } from '../lib/api'
import { useToast } from './Toast'

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  // Fermer le panel en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Charger les notifications
  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationsApi.getAll({ limit: 20 })
      setNotifications(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error)
      showToast('Erreur lors du chargement des notifications', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Charger le nombre de notifications non lues
  const loadUnreadCount = async () => {
    try {
      const response = await notificationsApi.getUnreadCount()
      setUnreadCount(response.count)
    } catch (error) {
      console.error('Erreur lors du chargement du compteur:', error)
    }
  }

  // Marquer une notification comme lue
  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id)
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, isRead: true, readAt: new Date() } : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      showToast('Erreur lors de la mise à jour', 'error')
    }
  }

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
      )
      setUnreadCount(0)
      showToast('Toutes les notifications ont été marquées comme lues', 'success')
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      showToast('Erreur lors de la mise à jour', 'error')
    }
  }

  // Charger les données au montage et à l'ouverture
  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
    loadUnreadCount()
  }, [isOpen])

  // Icône selon le type de notification
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'RISK_CRITICAL':
        return <AlertTriangle className="w-5 h-5 text-danger-500" />
      case 'ACTION_OVERDUE':
        return <Clock className="w-5 h-5 text-warning-500" />
      case 'REVIEW_DUE':
        return <Clock className="w-5 h-5 text-info-500" />
      case 'AI_ALERT':
        return <Zap className="w-5 h-5 text-accent-500" />
      case 'CORRELATION_ALERT':
        return <Shield className="w-5 h-5 text-primary-500" />
      case 'SYSTEM':
        return <Settings className="w-5 h-5 text-gray-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  // Couleur de fond selon le type
  const getNotificationBgColor = (type: string, isRead: boolean) => {
    const opacity = isRead ? '5' : '10'
    switch (type) {
      case 'RISK_CRITICAL':
        return `bg-danger-${opacity}`
      case 'ACTION_OVERDUE':
        return `bg-warning-${opacity}`
      case 'REVIEW_DUE':
        return `bg-info-${opacity}`
      case 'AI_ALERT':
        return `bg-accent-${opacity}`
      case 'CORRELATION_ALERT':
        return `bg-primary-${opacity}`
      default:
        return `bg-gray-${opacity}`
    }
  }

  // Formater la date
  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes}min`
    if (hours < 24) return `Il y a ${hours}h`
    if (days < 7) return `Il y a ${days}j`
    return new Date(date).toLocaleDateString('fr-FR')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      <div 
        ref={panelRef}
        className="absolute right-4 top-20 w-96 max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bell className="w-6 h-6 text-primary-600" />
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout lu'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Tout lire
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
