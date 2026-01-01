'use client'

import React, { forwardRef } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-[var(--wine)] text-white',
    'hover:bg-[var(--wine-hover)]',
    'focus-visible:ring-[var(--wine)]',
    'shadow-sm hover:shadow-md',
    'active:shadow-sm'
  ),
  secondary: cn(
    'bg-[var(--surface)] text-[var(--foreground)]',
    'border border-[var(--border)]',
    'hover:bg-[var(--hover-overlay)] hover:border-[var(--border-secondary)]',
    'focus-visible:ring-[var(--wine)]'
  ),
  ghost: cn(
    'bg-transparent text-[var(--foreground-secondary)]',
    'hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)]',
    'focus-visible:ring-[var(--wine)]'
  ),
  gold: cn(
    'bg-[var(--gold)] text-[var(--foreground-inverse)]',
    'hover:bg-[var(--gold-hover)]',
    'focus-visible:ring-[var(--gold)]',
    'shadow-sm hover:shadow-[0_0_20px_-5px_var(--gold-glow)]'
  ),
  danger: cn(
    'bg-error text-white',
    'hover:bg-error-muted',
    'focus-visible:ring-error'
  ),
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-body-sm rounded-lg gap-1.5',
  md: 'h-11 px-6 text-body-md rounded-xl gap-2',
  lg: 'h-13 px-8 text-body-lg rounded-xl gap-2.5',
  icon: 'h-10 w-10 rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <motion.button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center',
          'font-medium',
          'transition-colors duration-250',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Variant styles
          buttonVariants[variant],
          // Size styles
          buttonSizes[size],
          // Full width
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        whileHover={!isDisabled ? { y: -1 } : undefined}
        transition={{ duration: 0.15 }}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {size !== 'icon' && <span>{children}</span>}
        {!isLoading && rightIcon}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

// Icon button variant
interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode
  'aria-label': string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size="icon"
        className={className}
        {...props}
      >
        {icon}
      </Button>
    )
  }
)

IconButton.displayName = 'IconButton'
