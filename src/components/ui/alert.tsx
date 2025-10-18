import React from 'react'

interface AlertProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'destructive' | 'warning'
}

interface AlertDescriptionProps {
  children: React.ReactNode
  className?: string
}

export const Alert: React.FC<AlertProps> = ({ 
  children, 
  className = '',
  variant = 'default'
}) => {
  const variantClasses = {
    default: 'border-blue-200 bg-blue-50 text-blue-800',
    destructive: 'border-red-200 bg-red-50 text-red-800',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800'
  }

  return (
    <div 
      className={`
        relative w-full rounded-lg border p-4 
        ${variantClasses[variant]}
        ${className}
      `}
      role="alert"
    >
      {children}
    </div>
  )
}

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`text-sm ${className}`}>
      {children}
    </div>
  )
}
