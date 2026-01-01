'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <svg
      className={cn(
        'animate-spin text-[var(--wine)]',
        sizeClasses[size],
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

// Wine-themed loading animation
export function WineLoader({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Wine glass animation */}
      <div className="relative w-12 h-16">
        <svg
          viewBox="0 0 48 64"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Glass */}
          <path
            d="M6 6 C6 6 4 30 12 42 C17 48 18 51 18 54 L18 58 L12 58 L12 62 L36 62 L36 58 L30 58 L30 54 C30 51 31 48 36 42 C44 30 42 6 42 6 L6 6 Z"
            stroke="var(--border-secondary)"
            strokeWidth="2"
            fill="var(--surface)"
          />
          
          {/* Animated wine fill */}
          <defs>
            <clipPath id="wineLoaderClip">
              <path d="M8 8 C8 8 6 28 13 39 C17 45 18 50 18 54 L18 56 L30 56 L30 54 C30 50 31 45 35 39 C42 28 40 8 40 8 L8 8 Z" />
            </clipPath>
          </defs>
          
          <motion.rect
            x="4"
            y="4"
            width="40"
            height="56"
            clipPath="url(#wineLoaderClip)"
            fill="url(#wineLoaderGradient)"
            initial={{ y: 56 }}
            animate={{ y: [56, 20, 56] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          <defs>
            <linearGradient id="wineLoaderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--wine)" />
              <stop offset="100%" stopColor="var(--wine-hover)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Loading dots */}
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-[var(--wine)]"
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Full page loading state
interface PageLoaderProps {
  message?: string
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--background)]"
    >
      <WineLoader />
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-body-md text-[var(--foreground-secondary)]"
      >
        {message}
      </motion.p>
    </motion.div>
  )
}

// Skeleton loader for content placeholders
interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  }

  return (
    <div
      className={cn(
        'bg-[var(--border)]',
        'animate-pulse',
        variantClasses[variant],
        className
      )}
      style={{
        width: width,
        height: height,
      }}
    />
  )
}

// Card skeleton
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-5 rounded-2xl bg-[var(--surface)]', className)}>
      <div className="flex items-center justify-between mb-3">
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton width={48} height={20} />
      </div>
      <Skeleton className="mb-2" width="70%" height={24} />
      <Skeleton className="mb-1" width="50%" height={16} />
      <Skeleton width="30%" height={16} />
    </div>
  )
}

// List skeleton
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

// Inline loading state
interface InlineLoaderProps {
  text?: string
  className?: string
}

export function InlineLoader({ text = 'Loading', className }: InlineLoaderProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Spinner size="sm" />
      <span className="text-body-sm text-[var(--foreground-secondary)]">
        {text}
      </span>
    </div>
  )
}
