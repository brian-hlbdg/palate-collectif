'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button, Input, Card } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, User, ArrowRight, Check } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const { addToast } = useToast()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Password validation
  const passwordChecks = {
    length: password.length >= 8,
    match: password === confirmPassword && password.length > 0,
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate
    if (!displayName.trim()) {
      setError('Please enter your name')
      return
    }
    if (!passwordChecks.length) {
      setError('Password must be at least 8 characters')
      return
    }
    if (!passwordChecks.match) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
          },
        },
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('An account with this email already exists')
        } else {
          setError(authError.message)
        }
        return
      }

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            display_name: displayName.trim(),
            eventbrite_email: email.trim(),
            is_admin: false,
            is_temp_account: false,
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Continue anyway - profile might already exist from trigger
        }

        addToast({
          type: 'success',
          message: 'Account created! Please check your email to verify.',
        })

        // Redirect to login or dashboard based on email confirmation setting
        router.push('/login')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
          Create Account
        </h1>
        <p className="text-body-md text-[var(--foreground-secondary)] mt-2">
          Start your wine journey with us
        </p>
      </div>

      {/* Registration form */}
      <Card variant="elevated" padding="lg">
        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            label="Name"
            type="text"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            leftIcon={<User className="h-5 w-5" />}
            autoFocus
            autoComplete="name"
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-5 w-5" />}
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-5 w-5" />}
            showPasswordToggle
            autoComplete="new-password"
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="h-5 w-5" />}
            showPasswordToggle
            autoComplete="new-password"
          />

          {/* Password requirements */}
          <div className="space-y-2">
            <PasswordCheck
              label="At least 8 characters"
              checked={passwordChecks.length}
            />
            <PasswordCheck
              label="Passwords match"
              checked={passwordChecks.match}
            />
          </div>

          {error && (
            <p className="text-body-sm text-error">{error}</p>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="h-5 w-5" />}
            className="mt-6"
          >
            Create Account
          </Button>
        </form>
      </Card>

      {/* Sign in link */}
      <p className="mt-6 text-center text-body-md text-[var(--foreground-secondary)]">
        Already have an account?{' '}
        <Link href="/login" className="text-[var(--wine)] font-medium hover:underline">
          Sign in
        </Link>
      </p>

      {/* Terms */}
      <p className="mt-4 text-center text-body-sm text-[var(--foreground-muted)]">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="text-[var(--wine)] hover:underline">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-[var(--wine)] hover:underline">
          Privacy Policy
        </Link>
      </p>
    </motion.div>
  )
}

// Password check component
function PasswordCheck({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center',
          'transition-colors duration-200',
          checked
            ? 'bg-green-500'
            : 'bg-[var(--border)]'
        )}
      >
        {checked && <Check className="h-3 w-3 text-white" />}
      </div>
      <span
        className={cn(
          'text-body-sm',
          checked
            ? 'text-[var(--foreground)]'
            : 'text-[var(--foreground-muted)]'
        )}
      >
        {label}
      </span>
    </div>
  )
}
