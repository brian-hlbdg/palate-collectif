'use client'

import React from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'wine' | 'gold' | 'success' | 'warning' | 'error' | 'outline'

interface BadgeProps {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  className?: string
  children: React.ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--background-tertiary)] text-[var(--foreground-secondary)]',
  wine: 'bg-[var(--wine-muted)] text-[var(--wine)]',
  gold: 'bg-[var(--gold-muted)] text-[var(--gold)]',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  outline: 'bg-transparent border border-[var(--border)] text-[var(--foreground-secondary)]',
}

const sizeStyles: Record<'sm' | 'md', string> = {
  sm: 'px-2 py-0.5 text-body-xs',
  md: 'px-3 py-1 text-label-sm',
}

export function Badge({
  variant = 'default',
  size = 'md',
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-full font-medium',
        'whitespace-nowrap',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  )
}

// Wine type badge with automatic styling
interface WineTypeBadgeProps {
  wineType: string
  size?: 'sm' | 'md'
  className?: string
}

export function WineTypeBadge({ wineType, size = 'md', className }: WineTypeBadgeProps) {
  const getWineTypeStyle = (type: string): string => {
    const lowerType = type.toLowerCase()
    const styles: Record<string, string> = {
      red: 'bg-red-500/10 text-red-600 dark:text-red-400',
      white: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      rosé: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
      sparkling: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      dessert: 'bg-amber-600/10 text-amber-700 dark:text-amber-500',
      fortified: 'bg-amber-700/10 text-amber-800 dark:text-amber-600',
      orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    }
    return styles[lowerType] || styles['red']
  }

  const getEmoji = (type: string): string => {
    const lowerType = type.toLowerCase()
    const emojis: Record<string, string> = {
      red: '🍷',
      white: '🥂',
      rosé: '🌸',
      sparkling: '🍾',
      dessert: '🍯',
      fortified: '🥃',
      orange: '🍊',
    }
    return emojis[lowerType] || '🍷'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1',
        'rounded-full font-medium',
        getWineTypeStyle(wineType),
        sizeStyles[size],
        className
      )}
    >
      <span>{getEmoji(wineType)}</span>
      <span className="capitalize">{wineType}</span>
    </span>
  )
}

// Status badge
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed'
  size?: 'sm' | 'md'
  className?: string
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'default', label: 'Inactive' },
    pending: { variant: 'warning', label: 'Pending' },
    completed: { variant: 'wine', label: 'Completed' },
  }

  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} size={size} className={className}>
      <span className="relative flex h-2 w-2 mr-1.5">
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full opacity-75',
            status === 'active' && 'animate-ping bg-success',
            status === 'inactive' && 'bg-[var(--foreground-muted)]',
            status === 'pending' && 'animate-ping bg-warning',
            status === 'completed' && 'bg-[var(--wine)]'
          )}
        />
        <span
          className={cn(
            'relative inline-flex h-2 w-2 rounded-full',
            status === 'active' && 'bg-success',
            status === 'inactive' && 'bg-[var(--foreground-muted)]',
            status === 'pending' && 'bg-warning',
            status === 'completed' && 'bg-[var(--wine)]'
          )}
        />
      </span>
      {config.label}
    </Badge>
  )
}
