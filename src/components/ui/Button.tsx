import React from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'success' | 'warning' | 'gradient' | 'ghost' | 'default'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
  loading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  loading = false,
  disabled,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center rounded-xl font-semibold
    transition-all duration-200 ease-out transform
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed
    active:scale-95 hover:scale-105 hover:shadow-lg
    relative overflow-hidden
  `

  const variants = {
    primary: `
      bg-gradient-to-r from-primary-500 to-primary-600 text-white
      hover:from-primary-600 hover:to-primary-700
      focus-visible:ring-primary-500 shadow-soft hover:shadow-glow
    `,
    secondary: `
      bg-white text-gray-700 border border-gray-200
      hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900
      focus-visible:ring-gray-500 shadow-soft
    `,
    danger: `
      bg-gradient-to-r from-danger-500 to-danger-600 text-white
      hover:from-danger-600 hover:to-danger-700
      focus-visible:ring-danger-500 shadow-soft hover:shadow-lg
    `,
    success: `
      bg-gradient-to-r from-success-500 to-success-600 text-white
      hover:from-success-600 hover:to-success-700
      focus-visible:ring-success-500 shadow-soft hover:shadow-lg
    `,
    warning: `
      bg-gradient-to-r from-warning-500 to-warning-600 text-white
      hover:from-warning-600 hover:to-warning-700
      focus-visible:ring-warning-500 shadow-soft hover:shadow-lg
    `,
    outline: `
      border-2 border-primary-200 bg-white/60 text-primary-700 backdrop-blur-sm
      hover:bg-primary-50 hover:border-primary-300 hover:text-primary-800
      focus-visible:ring-primary-500 shadow-soft
    `,
    gradient: `
      bg-gradient-to-r from-primary-500 via-accent-500 to-primary-600 text-white
      hover:from-primary-600 hover:via-accent-600 hover:to-primary-700
      focus-visible:ring-accent-500 shadow-glow hover:shadow-glow-accent
    `,
    ghost: `
      bg-transparent text-gray-600 border-none
      hover:bg-gray-100 hover:text-gray-900
      focus-visible:ring-gray-500
    `,
    default: `
      bg-gray-100 text-gray-700 border border-gray-200
      hover:bg-gray-200 hover:border-gray-300
      focus-visible:ring-gray-500 shadow-soft
    `
  }

  const sizes = {
    sm: 'h-8 px-3 text-sm gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2',
    xl: 'h-14 px-8 text-lg gap-3'
  }

  return (
    <button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-xl">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
    </button>
  )
}
