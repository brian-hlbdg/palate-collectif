'use client'

import React, { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass'

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  variant?: CardVariant
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const cardVariants: Record<CardVariant, string> = {
  default: cn(
    'bg-[var(--surface)]',
    'shadow-[var(--shadow-elevation-1)]'
  ),
  elevated: cn(
    'bg-[var(--surface-elevated)]',
    'shadow-[var(--shadow-elevation-2)]'
  ),
  outlined: cn(
    'bg-[var(--surface)]',
    'border border-[var(--border)]'
  ),
  glass: cn(
    'bg-[var(--glass-background)]',
    'backdrop-blur-[var(--glass-blur)]',
    'border border-[var(--glass-border)]'
  ),
}

const cardPadding: Record<'none' | 'sm' | 'md' | 'lg', string> = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      interactive = false,
      padding = 'md',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-2xl',
          'overflow-hidden',
          cardVariants[variant],
          cardPadding[padding],
          interactive && cn(
            'cursor-pointer',
            'transition-all duration-250',
            'hover:shadow-[var(--shadow-elevation-2)]'
          ),
          className
        )}
        whileHover={interactive ? { y: -2, scale: 1.005 } : undefined}
        whileTap={interactive ? { scale: 0.995 } : undefined}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

// Card Header
interface CardHeaderProps {
  className?: string
  children: React.ReactNode
}

export function CardHeader({ className, children }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between',
        'mb-4',
        className
      )}
    >
      {children}
    </div>
  )
}

// Card Title
interface CardTitleProps {
  className?: string
  children: React.ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export function CardTitle({ className, children, as: Component = 'h3' }: CardTitleProps) {
  return (
    <Component
      className={cn(
        'text-display-sm font-semibold',
        'text-[var(--foreground)]',
        className
      )}
    >
      {children}
    </Component>
  )
}

// Card Description
interface CardDescriptionProps {
  className?: string
  children: React.ReactNode
}

export function CardDescription({ className, children }: CardDescriptionProps) {
  return (
    <p
      className={cn(
        'text-body-md',
        'text-[var(--foreground-secondary)]',
        className
      )}
    >
      {children}
    </p>
  )
}

// Card Content
interface CardContentProps {
  className?: string
  children: React.ReactNode
}

export function CardContent({ className, children }: CardContentProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  )
}

// Card Footer
interface CardFooterProps {
  className?: string
  children: React.ReactNode
}

export function CardFooter({ className, children }: CardFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3',
        'mt-6 pt-4',
        'border-t border-[var(--border)]',
        className
      )}
    >
      {children}
    </div>
  )
}

// Wine Card - Specialized card for wine display
interface WineCardProps extends Omit<CardProps, 'children'> {
  wineName: string
  producer?: string
  vintage?: string
  wineType: string
  rating?: number
  onClick?: () => void
}

export function WineCard({
  wineName,
  producer,
  vintage,
  wineType,
  rating,
  onClick,
  className,
  ...props
}: WineCardProps) {
  const getWineEmoji = (type: string): string => {
    const emojiMap: Record<string, string> = {
      red: '🍷',
      white: '🥂',
      rosé: '🌸',
      sparkling: '🍾',
      dessert: '🍯',
      fortified: '🥃',
      orange: '🍊',
    }
    return emojiMap[type.toLowerCase()] || '🍷'
  }

  return (
    <Card
      variant="default"
      interactive
      padding="none"
      className={cn('group', className)}
      onClick={onClick}
      {...props}
    >
      <div className="p-5">
        {/* Wine type indicator */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl">{getWineEmoji(wineType)}</span>
          {rating !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-[var(--gold)] text-body-sm">★</span>
              <span className="text-body-sm font-medium text-[var(--foreground)]">
                {rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Wine info */}
        <h4 className="text-body-lg font-semibold text-[var(--foreground)] mb-1 line-clamp-2 group-hover:text-[var(--wine)] transition-colors">
          {wineName}
        </h4>
        
        {producer && (
          <p className="text-body-sm text-[var(--foreground-secondary)] mb-1">
            {producer}
          </p>
        )}
        
        {vintage && (
          <p className="text-body-sm text-[var(--foreground-muted)]">
            {vintage}
          </p>
        )}
      </div>

      {/* Bottom accent */}
      <div
        className="h-1 w-full bg-gradient-to-r from-[var(--wine)] to-[var(--wine-hover)] opacity-0 group-hover:opacity-100 transition-opacity duration-250"
      />
    </Card>
  )
}
