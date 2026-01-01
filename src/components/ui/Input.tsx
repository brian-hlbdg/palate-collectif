'use client'

import React, { forwardRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  showPasswordToggle?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      success,
      hint,
      leftIcon,
      rightIcon,
      showPasswordToggle,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    const inputType = type === 'password' && showPassword ? 'text' : type

    const hasError = !!error
    const hasSuccess = !!success && !hasError

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-label-md mb-2',
              'text-[var(--foreground)]',
              disabled && 'opacity-50'
            )}
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
              {leftIcon}
            </div>
          )}

          {/* Input field */}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            disabled={disabled}
            className={cn(
              // Base styles
              'w-full px-4 py-3 rounded-xl',
              'text-body-md',
              'bg-[var(--surface)]',
              'border transition-all duration-250',
              'placeholder:text-[var(--foreground-muted)]',
              'focus:outline-none',
              
              // Border states
              hasError
                ? 'border-error focus:border-error focus:ring-2 focus:ring-error/20'
                : hasSuccess
                ? 'border-success focus:border-success focus:ring-2 focus:ring-success/20'
                : cn(
                    'border-[var(--border)]',
                    'focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine-muted)]'
                  ),
              
              // Disabled state
              disabled && 'opacity-50 cursor-not-allowed',
              
              // Icon padding
              leftIcon && 'pl-12',
              (rightIcon || showPasswordToggle || hasError || hasSuccess) && 'pr-12',
              
              className
            )}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />

          {/* Right side icons */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Password toggle */}
            {showPasswordToggle && type === 'password' && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            )}

            {/* Status icons */}
            {hasError && (
              <AlertCircle className="h-5 w-5 text-error" />
            )}
            {hasSuccess && (
              <Check className="h-5 w-5 text-success" />
            )}

            {/* Custom right icon */}
            {rightIcon && !hasError && !hasSuccess && !showPasswordToggle && (
              <span className="text-[var(--foreground-muted)]">
                {rightIcon}
              </span>
            )}
          </div>

          {/* Focus ring animation */}
          <AnimatePresence>
            {isFocused && !hasError && !hasSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  boxShadow: '0 0 0 3px var(--wine-muted)',
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Error, success, or hint message */}
        <AnimatePresence mode="wait">
          {(error || success || hint) && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'mt-2 text-body-sm',
                hasError && 'text-error',
                hasSuccess && 'text-success',
                !hasError && !hasSuccess && 'text-[var(--foreground-muted)]'
              )}
            >
              {error || success || hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

Input.displayName = 'Input'

// Textarea variant
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, disabled, id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
    const hasError = !!error

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'block text-label-md mb-2',
              'text-[var(--foreground)]',
              disabled && 'opacity-50'
            )}
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-3 rounded-xl',
            'text-body-md',
            'bg-[var(--surface)]',
            'border transition-all duration-250',
            'placeholder:text-[var(--foreground-muted)]',
            'focus:outline-none',
            'resize-none',
            'min-h-[120px]',
            hasError
              ? 'border-error focus:border-error focus:ring-2 focus:ring-error/20'
              : cn(
                  'border-[var(--border)]',
                  'focus:border-[var(--wine)] focus:ring-2 focus:ring-[var(--wine-muted)]'
                ),
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          {...props}
        />

        <AnimatePresence mode="wait">
          {(error || hint) && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'mt-2 text-body-sm',
                hasError ? 'text-error' : 'text-[var(--foreground-muted)]'
              )}
            >
              {error || hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
