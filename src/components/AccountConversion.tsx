'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button, Input } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  User,
  Mail,
  Lock,
  Wine,
  Star,
  Gift,
  Check,
  ArrowRight,
  Sparkles,
  Shield,
} from 'lucide-react'

interface AccountConversionProps {
  tempUserId: string
  onConversionComplete?: (newUserId: string) => void
  onSkip?: () => void
}

export function AccountConversion({
  tempUserId,
  onConversionComplete,
  onSkip
}: AccountConversionProps) {
  const router = useRouter()
  const { addToast } = useToast()
  
  const [step, setStep] = useState<'benefits' | 'form' | 'success'>('benefits')
  const [isLoading, setIsLoading] = useState(false)
  
  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  
  // Stats from temp account
  const [stats, setStats] = useState<{
    totalRatings: number
    eventsAttended: number
  } | null>(null)

  useEffect(() => {
    loadTempAccountStats()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempUserId])

  const loadTempAccountStats = async () => {
    try {
      // Get rating count
      const { count: ratingCount } = await supabase
        .from('user_wine_ratings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', tempUserId)

      // Get events attended
      const { data: ratings } = await supabase
        .from('user_wine_ratings')
        .select('event_wines(event_id)')
        .eq('user_id', tempUserId)

      const uniqueEvents = new Set(
        ratings?.map((r: any) => r.event_wines?.event_id).filter(Boolean)
      )

      setStats({
        totalRatings: ratingCount || 0,
        eventsAttended: uniqueEvents.size
      })
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }

  const handleConvert = async () => {
    if (!email || !password) {
      addToast({ type: 'error', message: 'Please fill in all fields' })
      return
    }

    if (password.length < 6) {
      addToast({ type: 'error', message: 'Password must be at least 6 characters' })
      return
    }

    setIsLoading(true)

    try {
      // 1. Create Supabase auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0],
            converted_from_temp: tempUserId
          }
        }
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Failed to create account')
      }

      const newUserId = authData.user.id

      // 2. Create permanent profile for the new auth user
      const { error: profileError } = await supabase.from('profiles').insert({
        id: newUserId,
        display_name: displayName || email.split('@')[0],
        eventbrite_email: email,
        is_temp_account: false,
        converted_at: new Date().toISOString(),
        converted_from_temp: tempUserId,
        is_admin: false,
      })

      if (profileError) throw profileError

      // 3. Migrate ratings (and their descriptors) from temp → permanent user.
      // Runs server-side via SECURITY DEFINER to bypass RLS on the old temp rows.
      const { error: migrateError } = await supabase.rpc('convert_temp_account', {
        temp_id: tempUserId,
      })

      if (migrateError) throw migrateError

      // 3. Update local storage
      localStorage.setItem('palate-user', newUserId)
      localStorage.removeItem('palate-temp-user')

      // 4. Success!
      setStep('success')
      
      addToast({ type: 'success', message: 'Account created successfully!' })

      // Callback
      onConversionComplete?.(newUserId)

    } catch (err: any) {
      console.error('Error converting account:', err)
      
      if (err.message?.includes('already registered')) {
        addToast({ type: 'error', message: 'This email is already registered. Try logging in instead.' })
      } else {
        addToast({ type: 'error', message: err.message || 'Failed to create account' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const benefits = [
    {
      icon: Wine,
      title: 'Your ratings, saved',
      description: 'Nothing disappears when the event ends — it\'s all yours to keep'
    },
    {
      icon: Star,
      title: 'Your tasting history',
      description: 'Every event, every wine, every note — one place, building over time'
    },
    {
      icon: Sparkles,
      title: 'Start understanding your palate',
      description: 'Patterns in what you like become clearer the more you taste'
    },
    {
      icon: Shield,
      title: 'Access from anywhere',
      description: 'Your account works across any event, any device'
    }
  ]

  // Benefits screen
  if (step === 'benefits') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--wine-muted)] flex items-center justify-center mx-auto mb-4">
            <Gift className="h-8 w-8 text-[var(--wine)]" />
          </div>
          <h2 className="text-display-sm font-bold text-[var(--foreground)] mb-2">
            Save Your Wine Journey
          </h2>
          <p className="text-body-md text-[var(--foreground-secondary)]">
            Create an account to keep your ratings forever
          </p>
        </div>

        {/* Stats */}
        {stats && stats.totalRatings > 0 && (
          <Card variant="wine" padding="md">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-display-sm font-bold text-[var(--wine)]">
                  {stats.totalRatings}
                </p>
                <p className="text-body-xs text-[var(--foreground-muted)]">
                  Wines Rated
                </p>
              </div>
              <div className="w-px h-10 bg-[var(--border)]" />
              <div className="text-center">
                <p className="text-display-sm font-bold text-[var(--wine)]">
                  {stats.eventsAttended}
                </p>
                <p className="text-body-xs text-[var(--foreground-muted)]">
                  Events
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Benefits */}
        <div className="space-y-3">
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-[var(--surface)]"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--wine-muted)] flex items-center justify-center flex-shrink-0">
                <benefit.icon className="h-5 w-5 text-[var(--wine)]" />
              </div>
              <div>
                <h4 className="text-body-md font-semibold text-[var(--foreground)]">
                  {benefit.title}
                </h4>
                <p className="text-body-sm text-[var(--foreground-muted)]">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Button
            fullWidth
            size="lg"
            onClick={() => setStep('form')}
            rightIcon={<ArrowRight className="h-5 w-5" />}
          >
            Create Account
          </Button>
          
          {onSkip && (
            <Button
              variant="ghost"
              fullWidth
              onClick={onSkip}
            >
              Maybe Later
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Form screen
  if (step === 'form') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-display-sm font-bold text-[var(--foreground)] mb-2">
            Create Your Account
          </h2>
          <p className="text-body-md text-[var(--foreground-secondary)]">
            Quick and easy - just a few details
          </p>
        </div>

        <div className="space-y-4">
          <Input
            label="Display Name (optional)"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            leftIcon={<User className="h-5 w-5" />}
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-5 w-5" />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-5 w-5" />}
            required
          />
        </div>

        <div className="space-y-3 pt-4">
          <Button
            fullWidth
            size="lg"
            onClick={handleConvert}
            isLoading={isLoading}
            rightIcon={<Check className="h-5 w-5" />}
          >
            Create Account
          </Button>
          
          <Button
            variant="ghost"
            fullWidth
            onClick={() => setStep('benefits')}
          >
            Back
          </Button>
        </div>

        <p className="text-body-xs text-[var(--foreground-muted)] text-center">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    )
  }

  // Success screen
  if (step === 'success') {
    return (
      <div className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto"
        >
          <Check className="h-10 w-10 text-green-600" />
        </motion.div>

        <div>
          <h2 className="text-display-sm font-bold text-[var(--foreground)] mb-2">
            You're all set
          </h2>
          <p className="text-body-md text-[var(--foreground-secondary)]">
            Your account is ready. Everything you've tasted is saved.
          </p>
        </div>

        {stats && (
          <Card variant="outlined" padding="md">
            <p className="text-body-sm text-[var(--foreground-secondary)]">
              <span className="font-bold text-[var(--wine)]">{stats.totalRatings}</span> ratings 
              from <span className="font-bold text-[var(--wine)]">{stats.eventsAttended}</span> events 
              are now saved to your account
            </p>
          </Card>
        )}

        <Button
          fullWidth
          size="lg"
          onClick={() => router.push('/dashboard')}
        >
          Go to Dashboard
        </Button>
      </div>
    )
  }

  return null
}

export default AccountConversion
