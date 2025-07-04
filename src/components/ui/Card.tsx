import React from 'react'
import { cn } from '../../lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'glass' | 'gradient' | 'elevated' | 'outline'
  hover?: boolean
}

export const Card: React.FC<CardProps> = ({
  className,
  children,
  variant = 'default',
  hover = true,
  ...props
}) => {
  const variants = {
    default: 'bg-white border border-gray-200 shadow-card',
    glass: 'glass border border-white/20 shadow-soft',
    gradient: 'bg-gradient-to-br from-white via-gray-50 to-white border border-gray-100 shadow-card',
    elevated: 'bg-white border border-gray-100 shadow-card-hover',
    outline: 'bg-transparent border-2 border-gray-300'
  }

  const hoverEffect = hover ? 'card-hover group' : ''

  return (
    <div
      className={cn(
        'rounded-2xl p-6 transition-all duration-300 ease-out animate-slide-up',
        variants[variant],
        hoverEffect,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  gradient?: boolean
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  className,
  children,
  gradient = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col space-y-2 pb-6 border-b border-gray-100',
        gradient && 'bg-gradient-to-r from-primary-50 to-accent-50 -m-6 mb-6 p-6 rounded-t-2xl border-b border-primary-100',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
  gradient?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const CardTitle: React.FC<CardTitleProps> = ({
  className,
  children,
  gradient = false,
  size = 'md',
  ...props
}) => {
  const sizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  }

  return (
    <h3
      className={cn(
        'font-bold leading-tight tracking-tight',
        sizes[size],
        gradient ? 'text-gradient' : 'text-gray-900',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

export const CardDescription: React.FC<CardDescriptionProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <p
      className={cn('text-sm text-gray-600 leading-relaxed', className)}
      {...props}
    >
      {children}
    </p>
  )
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const CardContent: React.FC<CardContentProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn('text-gray-700 space-y-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const CardFooter: React.FC<CardFooterProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn('flex items-center justify-between pt-6 border-t border-gray-100', className)}
      {...props}
    >
      {children}
    </div>
  )
}
