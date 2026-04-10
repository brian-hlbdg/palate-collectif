'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import type { Toast } from '@/types'

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newToast: Toast = { ...toast, id }
    
    setToasts((prev) => [...prev, newToast])

    // Auto-dismiss
    const duration = toast.duration ?? 4000
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div
      className={cn(
        'fixed top-4 left-4 right-4 z-50',
        'space-y-3',
        'pointer-events-none',
        'max-w-md mx-auto'
      )}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-success" />,
    error: <AlertCircle className="h-5 w-5 text-error" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning" />,
    info: <Info className="h-5 w-5 text-[var(--wine)]" />,
  }

  const borderColors = {
    success: 'border-l-4 border-l-success border-[var(--border)]',
    error: 'border-l-4 border-l-error border-[var(--border)]',
    warning: 'border-l-4 border-l-warning border-[var(--border)]',
    info: 'border-l-4 border-l-[var(--wine)] border-[var(--border)]',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'pointer-events-auto',
        'flex items-start gap-3',
        'p-4 rounded-xl',
        'bg-[var(--surface)]',
        borderColors[toast.type],
        'shadow-[var(--shadow-elevation-2)]'
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        {icons[toast.type]}
      </div>

      <p className="flex-1 text-body-md text-[var(--foreground)]">
        {toast.message}
      </p>

      <button
        onClick={() => onDismiss(toast.id)}
        className={cn(
          'flex-shrink-0',
          'p-1 rounded-lg',
          'text-[var(--foreground-muted)]',
          'hover:text-[var(--foreground)]',
          'hover:bg-[var(--hover-overlay)]',
          'transition-colors duration-150'
        )}
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

// Convenience hooks for specific toast types
export function useSuccessToast() {
  const { addToast } = useToast()
  return (message: string, duration?: number) =>
    addToast({ type: 'success', message, duration })
}

export function useErrorToast() {
  const { addToast } = useToast()
  return (message: string, duration?: number) =>
    addToast({ type: 'error', message, duration })
}

export function useWarningToast() {
  const { addToast } = useToast()
  return (message: string, duration?: number) =>
    addToast({ type: 'warning', message, duration })
}

export function useInfoToast() {
  const { addToast } = useToast()
  return (message: string, duration?: number) =>
    addToast({ type: 'info', message, duration })
}
