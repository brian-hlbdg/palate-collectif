'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, Button } from '@/components/ui'
import { WineLoader } from '@/components/ui'
import { EventResults } from '@/components/EventResults'
import { supabase } from '@/lib/supabase'
import { isEventClosed } from '@/lib/buddies'
import {
  ArrowLeft,
  Lock,
  Calendar,
  Clock,
} from 'lucide-react'

export default function EventResultsPage() {
  const params = useParams()
  const router = useRouter()
  const eventCode = params.eventCode as string

  const [event, setEvent] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isClosed, setIsClosed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [eventCode])

  const loadData = async () => {
    // Get user
    const { data: { session } } = await supabase.auth.getSession()
    let currentUserId = session?.user?.id
    if (!currentUserId) {
      currentUserId = localStorage.getItem('palate-temp-user')
    }
    
    if (!currentUserId) {
      router.push('/join')
      return
    }
    setUserId(currentUserId)

    // Get event
    const { data: eventData, error } = await supabase
      .from('tasting_events')
      .select('*')
      .eq('event_code', eventCode)
      .single()

    if (error || !eventData) {
      router.push('/join')
      return
    }
    setEvent(eventData)

    // Check if event is closed
    const closed = await isEventClosed(eventData.id)
    setIsClosed(closed)

    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <WineLoader />
      </div>
    )
  }

  // Event not closed yet
  if (!isClosed) {
    const eventDate = event?.event_date ? new Date(event.event_date) : null
    
    return (
      <div className="min-h-screen bg-[var(--background)]">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)]">
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => router.push(`/event/${eventCode}`)}
              className="p-2 -ml-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-body-lg font-semibold text-[var(--foreground)]">
              Event Results
            </h1>
          </div>
        </header>

        <main className="p-4 max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-[var(--surface)] flex items-center justify-center mx-auto mb-6">
              <Lock className="h-10 w-10 text-[var(--foreground-muted)]" />
            </div>
            
            <h2 className="text-display-sm font-bold text-[var(--foreground)] mb-3">
              Results Not Available Yet
            </h2>
            
            <p className="text-body-md text-[var(--foreground-secondary)] mb-6">
              Results will be available after the event ends.
            </p>

            {eventDate && (
              <Card variant="wine" padding="md" className="inline-block">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-[var(--wine)]" />
                  <div className="text-left">
                    <p className="text-body-xs text-[var(--foreground-muted)]">
                      Event Date
                    </p>
                    <p className="text-body-md font-semibold text-[var(--foreground)]">
                      {eventDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <div className="mt-8">
              <Button
                onClick={() => router.push(`/event/${eventCode}`)}
              >
                Back to Event
              </Button>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  // Event is closed - show results
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push(`/event/${eventCode}`)}
            className="p-2 -ml-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-body-lg font-semibold text-[var(--foreground)]">
            Event Results
          </h1>
        </div>
      </header>

      <main className="p-4 pb-24 max-w-lg mx-auto">
        {userId && event && (
          <EventResults
            eventId={event.id}
            eventName={event.event_name}
            userId={userId}
          />
        )}
      </main>
    </div>
  )
}
