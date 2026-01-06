'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/providers'
import { Sun, Moon, Monitor } from 'lucide-react'
import type { Theme } from '@/types'

interface ThemeToggleProps {
  variant?: 'simple' | 'full'
  className?: string
}

export function ThemeToggle({ variant = 'simple', className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Only render after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return placeholder with same dimensions to prevent layout shift
    return (
      <div
        className={cn(
          'p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]',
          'w-9 h-9',
          className
        )}
      />
    )
  }

  if (variant === 'simple') {
    return (
      <button
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className={cn(
          'relative p-2 rounded-xl',
          'bg-[var(--surface)]',
          'border border-[var(--border)]',
          'hover:bg-[var(--hover-overlay)]',
          'transition-colors duration-200',
          className
        )}
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <div className="relative h-5 w-5">
          <motion.div
            initial={false}
            animate={{
              scale: resolvedTheme === 'dark' ? 1 : 0,
              opacity: resolvedTheme === 'dark' ? 1 : 0,
              rotate: resolvedTheme === 'dark' ? 0 : 90,
            }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <Moon className="h-5 w-5 text-[var(--gold)]" />
          </motion.div>

          <motion.div
            initial={false}
            animate={{
              scale: resolvedTheme === 'light' ? 1 : 0,
              opacity: resolvedTheme === 'light' ? 1 : 0,
              rotate: resolvedTheme === 'light' ? 0 : -90,
            }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <Sun className="h-5 w-5 text-[var(--gold)]" />
          </motion.div>
        </div>
      </button>
    )
  }

  // Full variant with all three options
  const options: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ]

  return (
    <div
      className={cn(
        'flex p-1 rounded-xl',
        'bg-[var(--background-secondary)]',
        'border border-[var(--border)]',
        className
      )}
    >
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'relative flex items-center gap-2 px-3 py-1.5 rounded-lg',
            'text-body-sm font-medium',
            'transition-colors duration-200',
            theme === value
              ? 'text-[var(--foreground)]'
              : 'text-[var(--foreground-muted)] hover:text-[var(--foreground-secondary)]'
          )}
        >
          {theme === value && (
            <motion.div
              layoutId="theme-indicator"
              className="absolute inset-0 bg-[var(--surface)] rounded-lg shadow-sm"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <Icon className="relative h-4 w-4" />
          <span className="relative hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}

// Compact theme selector for settings
export function ThemeSelector({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  const options: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ]

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-label-md text-[var(--foreground)]">
        Theme
      </label>
      <div className="grid grid-cols-3 gap-2">
        {options.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-xl',
              'border transition-all duration-200',
              theme === value
                ? 'bg-[var(--wine-muted)] border-[var(--wine)] text-[var(--wine)]'
                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--border-secondary)]'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-body-sm font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}