'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  max?: number
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
  showValue?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-7 w-7',
  lg: 'h-9 w-9',
}

const gapClasses = {
  sm: 'gap-1',
  md: 'gap-1.5',
  lg: 'gap-2',
}

export function StarRating({
  value,
  onChange,
  max = 5,
  size = 'md',
  readonly = false,
  showValue = false,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const displayValue = hoverValue ?? value

  const handleClick = (rating: number) => {
    if (readonly) return
    onChange?.(rating)
  }

  return (
    <div className={cn('flex items-center', gapClasses[size], className)}>
      <div
        className={cn('flex items-center', gapClasses[size])}
        onMouseLeave={() => !readonly && setHoverValue(null)}
      >
        {Array.from({ length: max }, (_, i) => {
          const rating = i + 1
          const isFilled = rating <= displayValue
          const isHovered = hoverValue !== null && rating <= hoverValue

          return (
            <motion.button
              key={rating}
              type="button"
              disabled={readonly}
              onClick={() => handleClick(rating)}
              onMouseEnter={() => !readonly && setHoverValue(rating)}
              className={cn(
                'relative transition-transform duration-150',
                !readonly && 'cursor-pointer hover:scale-110',
                readonly && 'cursor-default'
              )}
              whileTap={!readonly ? { scale: 0.9 } : undefined}
            >
              {/* Empty star (background) */}
              <Star
                className={cn(
                  sizeClasses[size],
                  'text-[var(--star-empty)]',
                  'transition-colors duration-150'
                )}
                strokeWidth={1.5}
              />

              {/* Filled star (overlay) */}
              <AnimatePresence>
                {isFilled && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 25,
                      delay: isHovered ? 0 : i * 0.05,
                    }}
                    className="absolute inset-0"
                  >
                    <Star
                      className={cn(
                        sizeClasses[size],
                        'text-[var(--star-filled)] fill-[var(--star-filled)]',
                        isHovered && 'text-[var(--star-hover)] fill-[var(--star-hover)]'
                      )}
                      strokeWidth={1.5}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Glow effect on filled stars */}
              {isFilled && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, var(--gold-glow) 0%, transparent 70%)',
                    transform: 'scale(1.5)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Numeric value display */}
      {showValue && (
        <motion.span
          key={displayValue}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'ml-2 font-medium tabular-nums',
            size === 'sm' && 'text-body-sm',
            size === 'md' && 'text-body-md',
            size === 'lg' && 'text-body-lg',
            'text-[var(--foreground)]'
          )}
        >
          {displayValue.toFixed(1)}
        </motion.span>
      )}
    </div>
  )
}

// Compact rating display (non-interactive)
interface RatingDisplayProps {
  value: number
  max?: number
  size?: 'sm' | 'md'
  showCount?: number
  className?: string
}

export function RatingDisplay({
  value,
  size = 'sm',
  showCount,
  className,
}: RatingDisplayProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <Star
        className={cn(
          size === 'sm' ? 'h-4 w-4' : 'h-5 w-5',
          'text-[var(--star-filled)] fill-[var(--star-filled)]'
        )}
        strokeWidth={1.5}
      />
      <span
        className={cn(
          'font-medium tabular-nums text-[var(--foreground)]',
          size === 'sm' ? 'text-body-sm' : 'text-body-md'
        )}
      >
        {value.toFixed(1)}
      </span>
      {showCount !== undefined && (
        <span
          className={cn(
            'text-[var(--foreground-muted)]',
            size === 'sm' ? 'text-body-xs' : 'text-body-sm'
          )}
        >
          ({showCount})
        </span>
      )}
    </div>
  )
}

// Wine glass fill animation rating (alternative style)
interface WineGlassRatingProps {
  value: number
  onChange?: (value: number) => void
  max?: number
  readonly?: boolean
  className?: string
}

export function WineGlassRating({
  value,
  onChange,
  max = 5,
  readonly = false,
  className,
}: WineGlassRatingProps) {
  const percentage = (value / max) * 100

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {/* Wine glass visualization */}
      <div className="relative w-16 h-24">
        {/* Glass outline */}
        <svg
          viewBox="0 0 64 96"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Glass bowl */}
          <path
            d="M8 8 C8 8 6 40 16 56 C22 64 24 68 24 72 L24 88 L16 88 L16 92 L48 92 L48 88 L40 88 L40 72 C40 68 42 64 48 56 C58 40 56 8 56 8 L8 8 Z"
            stroke="var(--border-secondary)"
            strokeWidth="2"
            fill="var(--surface)"
          />
          
          {/* Wine fill with animation */}
          <defs>
            <clipPath id="glassClip">
              <path d="M10 10 C10 10 8 38 17 53 C22 60 24 66 24 72 L24 86 L40 86 L40 72 C40 66 42 60 47 53 C56 38 54 10 54 10 L10 10 Z" />
            </clipPath>
          </defs>
          
          <motion.rect
            x="8"
            y="8"
            width="48"
            height="80"
            clipPath="url(#glassClip)"
            initial={{ y: 80 }}
            animate={{ y: 80 - (percentage * 0.7) }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            fill="url(#wineGradient)"
          />
          
          {/* Wine gradient */}
          <defs>
            <linearGradient id="wineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--wine)" />
              <stop offset="100%" stopColor="var(--wine-hover)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Rating value */}
      <motion.div
        key={value}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-display-sm font-semibold text-[var(--foreground)]"
      >
        {value.toFixed(1)}
      </motion.div>

      {/* Slider for interaction */}
      {!readonly && onChange && (
        <input
          type="range"
          min="0"
          max={max}
          step="0.5"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={cn(
            'w-full h-2 rounded-full appearance-none cursor-pointer',
            'bg-[var(--border)]',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-5',
            '[&::-webkit-slider-thumb]:h-5',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-[var(--wine)]',
            '[&::-webkit-slider-thumb]:shadow-md',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:transition-transform',
            '[&::-webkit-slider-thumb]:hover:scale-110'
          )}
        />
      )}
    </div>
  )
}
