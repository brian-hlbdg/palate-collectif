'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button, Input, Card } from '@/components/ui'
import { ThemeToggle } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Wine,
  ArrowLeft,
  ArrowRight,
  Ticket,
  Mail,
  User,
  Sparkles,
} from 'lucide-react'

type JoinStep = 'code' | 'details'

export default function JoinEventPage() {
  const router = useRouter()
  const { addToast } = useToast()
  
  const [step, setStep] = useState<JoinStep>('code')
  const [eventCode, setEventCode] = useState('')
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [event, setEvent] = useState<{ id: string; event_name: string; event_type: string } | null>(null)
  const [error, setError] = useState('')

  // Validate event code
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { data, error: fetchError } = await supabase
        .from('tasting_events')
        .select('id, event_name, event_type, is_active')
        .eq('event_code', eventCode.toUpperCase().trim())
        .single()

      if (fetchError || !data) {
        setError('Event not found. Please check the code and try again.')
        return
      }

      if (!data.is_active) {
        setError('This event is no longer active.')
        return
      }

      setEvent(data)
      setStep('details')
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Join the event
  const handleJoinEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Create temp user
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: tempId,
          display_name: displayName.trim() || 'Guest',
          eventbrite_email: email.trim() || null,
          is_temp_account: true,
          account_expires_at: expiresAt.toISOString(),
          is_admin: false,
        })

      if (profileError) {
        throw profileError
      }

      // Store temp user ID
      localStorage.setItem('palate-temp-user', tempId)
      localStorage.setItem('palate-current-event', event!.id)

      addToast({
        type: 'success',
        message: `Welcome to ${event!.event_name}!`,
      })

      // Navigate to event
      router.push(`/event/${event!.id}`)
    } catch (err) {
      setError('Failed to join event. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-body-sm">Back</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--wine-muted)] mb-4">
              <Wine className="h-8 w-8 text-[var(--wine)]" />
            </div>
            <h1 className="text-display-sm font-bold text-[var(--foreground)]">
              Join Event
            </h1>
            <p className="text-body-md text-[var(--foreground-secondary)] mt-2">
              Enter your event code to start tasting
            </p>
          </motion.div>

          {/* Form container */}
          <AnimatePresence mode="wait">
            {step === 'code' ? (
              <motion.div
                key="code"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Card variant="outlined" padding="lg">
                  <form onSubmit={handleCodeSubmit} className="space-y-6">
                    <Input
                      label="Event Code"
                      placeholder="Enter 6-digit code"
                      value={eventCode}
                      onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                      leftIcon={<Ticket className="h-5 w-5" />}
                      error={error}
                      autoFocus
                      className="text-center text-xl tracking-widest font-mono uppercase"
                      maxLength={8}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      size="lg"
                      isLoading={isLoading}
                      rightIcon={<ArrowRight className="h-5 w-5" />}
                      disabled={eventCode.length < 4}
                    >
                      Continue
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

                  {/* QR Scanner option */}
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => addToast({ type: 'info', message: 'QR Scanner coming soon!' })}
                  >
                    Scan QR Code
                  </Button>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card variant="outlined" padding="lg">
                  {/* Event info */}
                  <div className="mb-6 p-4 rounded-xl bg-[var(--wine-muted)] border border-[var(--border-accent)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--wine)] flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-body-sm text-[var(--wine)]">Joining</p>
                        <p className="text-body-lg font-semibold text-[var(--foreground)]">
                          {event?.event_name}
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleJoinEvent} className="space-y-4">
                    <Input
                      label="Your Name"
                      placeholder="How should we call you?"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      leftIcon={<User className="h-5 w-5" />}
                      autoFocus
                    />

                    <Input
                      label="Email (Optional)"
                      placeholder="To save your ratings"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      leftIcon={<Mail className="h-5 w-5" />}
                      hint="We'll use this to save your tasting history"
                    />

                    {error && (
                      <p className="text-body-sm text-error">{error}</p>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setStep('code')
                          setEvent(null)
                        }}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        fullWidth
                        size="lg"
                        isLoading={isLoading}
                        rightIcon={<ArrowRight className="h-5 w-5" />}
                      >
                        Join Event
                      </Button>
                    </div>
                  </form>
                </Card>

                {/* Privacy note */}
                <p className="mt-4 text-center text-body-sm text-[var(--foreground-muted)]">
                  By joining, you agree to our{' '}
                  <Link href="/terms" className="text-[var(--wine)] hover:underline">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-[var(--wine)] hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
