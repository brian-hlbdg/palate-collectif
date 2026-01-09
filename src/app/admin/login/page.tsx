'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button, Input, Card } from '@/components/ui'
import { ThemeToggle } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { Wine, Mail, Lock, ArrowRight } from 'lucide-react'

export default function AdminLoginPage() {
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
      // Try Supabase auth first
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        // If Supabase auth fails, try checking profiles directly by email
        // (for admins who might not have Supabase auth set up)
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name, is_admin, eventbrite_email')
          .eq('eventbrite_email', email.trim().toLowerCase())
          .eq('is_admin', true)
          .single()

        if (profile) {
          // Simple email-based admin login (no password for now)
          localStorage.setItem('palate-admin-user', profile.id)
          addToast({
            type: 'success',
            message: `Welcome back, ${profile.display_name}!`,
          })
          router.push('/admin')
          return
        }

        setError('Invalid credentials or not an admin account')
        return
      }

      // Check if user is admin
      if (authData.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name, is_admin')
          .eq('id', authData.user.id)
          .single()

        if (!profile?.is_admin) {
          await supabase.auth.signOut()
          setError('This account does not have admin access')
          return
        }

        localStorage.setItem('palate-admin-user', profile.id)
        addToast({
          type: 'success',
          message: `Welcome back, ${profile.display_name}!`,
        })
        router.push('/admin')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Header */}
      <header className="p-4 flex justify-end">
        <ThemeToggle />
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--wine-muted)] mb-4">
              <Wine className="h-8 w-8 text-[var(--wine)]" />
            </div>
            <h1 className="text-display-sm font-bold text-[var(--foreground)]">
              Admin Login
            </h1>
            <p className="text-body-md text-[var(--foreground-secondary)] mt-2">
              Sign in to manage your events
            </p>
          </div>

          {/* Login form */}
          <Card variant="elevated" padding="lg">
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="admin@example.com"
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
          </Card>

          {/* Footer */}
          <p className="mt-8 text-center text-body-sm text-[var(--foreground-muted)]">
            Need admin access?{' '}
            <a href="mailto:support@palatecollectif.com" className="text-[var(--wine)] hover:underline">
              Contact support
            </a>
          </p>
        </motion.div>
      </main>
    </div>
  )
}
