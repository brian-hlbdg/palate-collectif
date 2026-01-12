'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { Shield, Mail, Lock, ArrowRight, Wine } from 'lucide-react'

export default function CuratorLoginPage() {
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
      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        setError('Invalid email or password')
        setIsLoading(false)
        return
      }

      if (!authData.user) {
        setError('Authentication failed')
        setIsLoading(false)
        return
      }

      // Check if user is a curator
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, is_curator')
        .eq('id', authData.user.id)
        .single()

      if (profileError || !profile) {
        setError('Profile not found. Contact administrator.')
        await supabase.auth.signOut()
        setIsLoading(false)
        return
      }

      if (!profile.is_curator) {
        setError('Access denied. Curator privileges required.')
        await supabase.auth.signOut()
        setIsLoading(false)
        return
      }

      // Success - store curator user ID
      localStorage.setItem('palate-curator-user', profile.id)

      addToast({
        type: 'success',
        message: `Welcome back, ${profile.display_name || 'Curator'}`,
      })

      router.push('/curator')
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
      <header className="p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl border border-[var(--border)] flex items-center justify-center">
            <Wine className="h-5 w-5 text-[var(--foreground-muted)]" />
          </div>
          <span className="text-body-lg font-semibold text-[var(--foreground)]">
            Palate
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border-2 border-[var(--wine)] mb-4">
                <Shield className="h-8 w-8 text-[var(--wine)]" />
              </div>
              <h1 className="text-display-sm font-bold text-[var(--foreground)]">
                Curator Access
              </h1>
              <p className="text-body-md text-[var(--foreground-secondary)] mt-2">
                Data stewardship & platform management
              </p>
            </div>

            {/* Login form */}
            <div className="border border-[var(--border)] rounded-xl p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="text-label-md text-[var(--foreground)] block mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--foreground-muted)]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="curator@example.com"
                      autoFocus
                      autoComplete="email"
                      className={cn(
                        'w-full pl-10 pr-4 py-3 rounded-xl',
                        'bg-transparent border border-[var(--border)]',
                        'text-body-md text-[var(--foreground)]',
                        'placeholder:text-[var(--foreground-muted)]',
                        'focus:outline-none focus:border-[var(--wine)]',
                        'transition-colors duration-200'
                      )}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-label-md text-[var(--foreground)] block mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--foreground-muted)]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className={cn(
                        'w-full pl-10 pr-4 py-3 rounded-xl',
                        'bg-transparent border border-[var(--border)]',
                        'text-body-md text-[var(--foreground)]',
                        'placeholder:text-[var(--foreground-muted)]',
                        'focus:outline-none focus:border-[var(--wine)]',
                        'transition-colors duration-200'
                      )}
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <p className="text-body-sm text-error">{error}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-3 rounded-xl',
                    'text-body-md font-medium',
                    'border-2 border-[var(--wine)] text-[var(--wine)]',
                    'hover:bg-[var(--wine)] hover:text-white',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-all duration-200'
                  )}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Footer note */}
            <p className="mt-6 text-center text-body-sm text-[var(--foreground-muted)]">
              Curator access is restricted. Contact the platform owner if you need access.
            </p>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-body-sm text-[var(--foreground-muted)]">
          © {new Date().getFullYear()} Palate Collectif
        </p>
      </footer>
    </div>
  )
}
