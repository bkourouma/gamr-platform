import React from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  children: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  pulse = false,
  className,
  children,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-semibold rounded-full
    transition-all duration-200 ease-out
  `

  const variants = {
    default: 'bg-gray-100 text-gray-800 border border-gray-200',
    primary: 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 border border-primary-300',
    secondary: 'bg-gray-100 text-gray-700 border border-gray-200',
    success: 'bg-gradient-to-r from-success-100 to-success-200 text-success-800 border border-success-300',
    warning: 'bg-gradient-to-r from-warning-100 to-warning-200 text-warning-800 border border-warning-300',
    danger: 'bg-gradient-to-r from-danger-100 to-danger-200 text-danger-800 border border-danger-300',
    gradient: 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-glow'
  }

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const pulseClass = pulse ? 'animate-pulse-soft' : ''

  return (
    <div
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        pulseClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
