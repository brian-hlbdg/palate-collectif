'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button, Input, Card } from '@/components/ui'
import { WineLoader } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { Wine, Mail, ArrowRight, Sparkles } from 'lucide-react'

interface BoothEvent {
  id: string
  event_code: string
  event_name: string
  is_booth_mode: boolean
  access_type: string
  booth_logo_url?: string
  booth_welcome_message?: string
  booth_primary_color?: string
  booth_background_color?: string
}

export default function BoothEntryPage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  const eventCode = params.eventId as string // This is actually the event_code now

  const [event, setEvent] = useState<BoothEvent | null>(null)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Load event details
  useEffect(() => {
    const loadEvent = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('tasting_events')
          .select(`
            id, 
            event_code,
            event_name, 
            is_booth_mode, 
            access_type, 
            booth_logo_url, 
            booth_welcome_message, 
            booth_primary_color,
            booth_background_color,
            is_active,
            is_deleted
          `)
          .eq('event_code', eventCode.toUpperCase())
          .single()

        if (fetchError || !data) {
          setError('Event not found')
          return
        }

        if (!data.is_active || data.is_deleted) {
          setError('This event is no longer active')
          return
        }

        if (!data.is_booth_mode) {
          // Redirect to regular join flow if not a booth event
          router.push(`/join`)
          return
        }

        setEvent(data)
      } catch (err) {
        setError('Failed to load event')
      } finally {
        setIsLoading(false)
      }
    }

    loadEvent()
  }, [eventCode, router])

  // Check if user already exists for this event
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedEmail) {
      setError('Please enter your email')
      setIsSubmitting(false)
      return
    }

    try {
      // Check if user already exists with this email
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('eventbrite_email', trimmedEmail)
        .single()

      let userId: string

      if (existingUser) {
        // User exists, use their ID
        userId = existingUser.id
      } else {
        // Create new temp user
        const tempId = `booth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30) // 30 days for booth users

        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: tempId,
            display_name: trimmedEmail.split('@')[0], // Use email prefix as name
            eventbrite_email: trimmedEmail,
            is_temp_account: true,
            account_expires_at: expiresAt.toISOString(),
            is_admin: false,
          })

        if (createError) {
          throw createError
        }

        userId = tempId
      }

      // Store user info in localStorage
      localStorage.setItem('palate-booth-user', userId)
      localStorage.setItem('palate-booth-email', trimmedEmail)
      localStorage.setItem('palate-booth-event', event!.id)

      addToast({
        type: 'success',
        message: 'Welcome! Let\'s explore some wines.',
      })

      // Navigate to wines list using event_code
      router.push(`/booth/${event!.event_code}/wines`)
    } catch (err) {
      console.error('Error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <WineLoader />
      </div>
    )
  }

  // Error state
  if (error && !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
        <Card variant="outlined" padding="lg" className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
            <Wine className="h-8 w-8 text-error" />
          </div>
          <h1 className="text-display-sm font-bold text-[var(--foreground)] mb-2">
            Oops!
          </h1>
          <p className="text-body-md text-[var(--foreground-secondary)]">
            {error}
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, var(--wine-muted) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, var(--gold-muted) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Event branding */}
          <div className="text-center mb-8">
            {event?.booth_logo_url ? (
              <img
                src={event.booth_logo_url}
                alt={event.event_name}
                className="h-16 mx-auto mb-4 object-contain"
              />
            ) : (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--wine-muted)] mb-4">
                <Wine className="h-10 w-10 text-[var(--wine)]" />
              </div>
            )}
            <h1 className="text-display-md font-bold text-[var(--foreground)] mb-2">
              {event?.event_name}
            </h1>
            <p className="text-body-lg text-[var(--foreground-secondary)]">
              {event?.booth_welcome_message || 'Welcome to our wine tasting experience'}
            </p>
          </div>

          {/* Email form */}
          <Card variant="elevated" padding="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Intro text */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--gold-muted)] border border-[var(--gold)]/20">
                <Sparkles className="h-5 w-5 text-[var(--gold)] flex-shrink-0" />
                <p className="text-body-sm text-[var(--foreground)]">
                  Enter your email to start rating wines and save your favorites
                </p>
              </div>

              <Input
                label="Email Address"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-5 w-5" />}
                error={error}
                autoFocus
                autoComplete="email"
              />

              <Button
                type="submit"
                fullWidth
                size="lg"
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Start Tasting
              </Button>
            </form>

            {/* Privacy note */}
            <p className="mt-4 text-center text-body-xs text-[var(--foreground-muted)]">
              Your email is only used to save your ratings for this event
            </p>
          </Card>

          {/* Footer branding */}
          <div className="mt-8 text-center">
            <p className="text-body-xs text-[var(--foreground-muted)]">
              Powered by{' '}
              <span className="font-medium text-[var(--wine)]">Palate Collectif</span>
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
