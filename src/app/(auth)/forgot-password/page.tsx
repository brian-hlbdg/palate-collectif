'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button, Input, Card } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const { addToast } = useToast()

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      )

      if (resetError) {
        setError(resetError.message)
        return
      }

      setIsSuccess(true)
    } catch (err) {
      console.error('Reset password error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card variant="elevated" padding="lg" className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-display-sm font-bold text-[var(--foreground)] mb-2">
            Check Your Email
          </h1>
          <p className="text-body-md text-[var(--foreground-secondary)] mb-6">
            We've sent a password reset link to{' '}
            <span className="font-medium text-[var(--foreground)]">{email}</span>
          </p>
          <p className="text-body-sm text-[var(--foreground-muted)] mb-6">
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <div className="space-y-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setIsSuccess(false)
                setEmail('')
              }}
            >
              Try Another Email
            </Button>
            <Link href="/login">
              <Button variant="ghost" fullWidth>
                Back to Sign In
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-display-sm font-bold text-[var(--foreground)]">
          Forgot Password?
        </h1>
        <p className="text-body-md text-[var(--foreground-secondary)] mt-2">
          No worries, we'll send you reset instructions
        </p>
      </div>

      {/* Form */}
      <Card variant="elevated" padding="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-5 w-5" />}
            autoFocus
            autoComplete="email"
          />

          {error && (
            <p className="text-body-sm text-error">{error}</p>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            rightIcon={<Send className="h-5 w-5" />}
            disabled={!email.trim()}
          >
            Send Reset Link
          </Button>
        </form>
      </Card>

      {/* Back to login */}
      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-2 text-body-md text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sign In
      </Link>
    </motion.div>
  )
}
