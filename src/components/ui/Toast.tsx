import React, { useEffect, useState } from 'react'
import { cn } from '../../lib/utils'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'

interface ToastProps {
  type?: 'success' | 'warning' | 'error' | 'info'
  title: string
  description?: string
  duration?: number
  onClose?: () => void
  className?: string
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  title,
  description,
  duration = 5000,
  onClose,
  className
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(), 300)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose?.(), 300)
  }

  const configs = {
    success: {
      icon: CheckCircle,
      gradient: 'from-success-500 to-success-600',
      bg: 'from-success-50 to-success-100',
      border: 'border-success-200',
      text: 'text-success-800'
    },
    warning: {
      icon: AlertTriangle,
      gradient: 'from-warning-500 to-warning-600',
      bg: 'from-warning-50 to-warning-100',
      border: 'border-warning-200',
      text: 'text-warning-800'
    },
    error: {
      icon: XCircle,
      gradient: 'from-danger-500 to-danger-600',
      bg: 'from-danger-50 to-danger-100',
      border: 'border-danger-200',
      text: 'text-danger-800'
    },
    info: {
      icon: Info,
      gradient: 'from-primary-500 to-primary-600',
      bg: 'from-primary-50 to-primary-100',
      border: 'border-primary-200',
      text: 'text-primary-800'
    }
  }

  const config = configs[type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm w-full transition-all duration-300 ease-out',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        className
      )}
    >
      <div className={`
        glass border rounded-2xl p-4 shadow-card-hover
        bg-gradient-to-r ${config.bg} ${config.border}
      `}>
        <div className="flex items-start space-x-3">
          <div className={`
            p-2 rounded-xl bg-gradient-to-r ${config.gradient} shadow-soft
          `}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-semibold ${config.text}`}>
              {title}
            </h4>
            {description && (
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-white/60 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  )
}
