'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button, Input, Card } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, ArrowRight, Wine } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { addToast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        if (authError.message.includes('Invalid login')) {
          setError('Invalid email or password')
        } else {
          setError(authError.message)
        }
        return
      }

      if (data.user) {
        // Check if user has a profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name, is_admin')
          .eq('id', data.user.id)
          .single()

        if (profile?.is_admin) {
          // Redirect admins to admin dashboard
          router.push('/admin')
        } else {
          // Redirect regular users to user dashboard
          router.push('/dashboard')
        }

        addToast({
          type: 'success',
          message: `Welcome back${profile?.display_name ? `, ${profile.display_name}` : ''}!`,
        })
      }
    } catch (err) {
      console.error('Login error:', err)
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
          Welcome Back
        </h1>
        <p className="text-body-md text-[var(--foreground-secondary)] mt-2">
          Sign in to access your wine journey
        </p>
      </div>

      {/* Login form */}
      <Card variant="elevated" padding="lg">
        <form onSubmit={handleLogin} className="space-y-4">
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

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-5 w-5" />}
            showPasswordToggle
            autoComplete="current-password"
          />

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-body-sm text-[var(--wine)] hover:underline"
            >
              Forgot password?
            </Link>
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
            Sign In
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border)]" />
          </div>
          <div className="relative flex justify-center text-body-sm">
            <span className="px-3 bg-[var(--surface)] text-[var(--foreground-muted)]">
              or
            </span>
          </div>
        </div>

        {/* Join event link */}
        <Link href="/join">
          <Button variant="secondary" fullWidth>
            Join an Event with Code
          </Button>
        </Link>
      </Card>

      {/* Sign up link */}
      <p className="mt-6 text-center text-body-md text-[var(--foreground-secondary)]">
        Don't have an account?{' '}
        <Link href="/register" className="text-[var(--wine)] font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </motion.div>
  )
}
