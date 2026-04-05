'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui'
import { WineLoader } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { Calendar, Wine, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui'
import { useRouter } from 'next/navigation'

interface EventSummary {
  id: string
  event_code: string
  event_name: string
  event_date: string
  location?: string
  rating_count: number
  avg_rating: number
}

export default function MyEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<EventSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id || localStorage.getItem('palate-temp-user')
      if (!userId) {
        setIsLoading(false)
        return
      }

      try {
        const { data: ratings } = await supabase
          .from('user_wine_ratings')
          .select('rating, event_wine_id')
          .eq('user_id', userId)

        if (!ratings || ratings.length === 0) {
          setIsLoading(false)
          return
        }

        const wineIds = ratings.map(r => r.event_wine_id)
        const { data: wines } = await supabase
          .from('event_wines')
          .select('id, event_id')
          .in('id', wineIds)

        const eventIds = [...new Set(wines?.map(w => w.event_id) || [])]
        const { data: eventsData } = await supabase
          .from('tasting_events')
          .select('id, event_code, event_name, event_date, location')
          .in('id', eventIds)
          .order('event_date', { ascending: false })

        const summaries: EventSummary[] = (eventsData || []).map(e => {
          const eventWineIds = wines?.filter(w => w.event_id === e.id).map(w => w.id) || []
          const eventRatings = ratings.filter(r => eventWineIds.includes(r.event_wine_id))
          const avg = eventRatings.length
            ? eventRatings.reduce((sum, r) => sum + r.rating, 0) / eventRatings.length
            : 0
          return {
            ...e,
            rating_count: eventRatings.length,
            avg_rating: Math.round(avg * 10) / 10,
          }
        })

        setEvents(summaries)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <WineLoader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-md font-bold text-[var(--foreground)]">My Events</h1>
        <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
          Every tasting you've been a part of
        </p>
      </div>

      {events.length === 0 ? (
        <Card variant="outlined" padding="lg" className="text-center">
          <Sparkles className="h-12 w-12 text-[var(--gold)] mx-auto mb-4" />
          <h2 className="text-body-lg font-semibold text-[var(--foreground)] mb-2">
            No events yet
          </h2>
          <p className="text-body-md text-[var(--foreground-secondary)] mb-6">
            Join a wine tasting to start building your history
          </p>
          <Button onClick={() => router.push('/join')}>Join an Event</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Link href={`/event/${event.event_code}/profile`}>
                <Card variant="outlined" padding="md" interactive>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--wine-muted)] flex items-center justify-center flex-shrink-0">
                      <span className="text-body-xs font-mono font-bold text-[var(--wine)]">
                        {event.event_code}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-body-md font-semibold text-[var(--foreground)] truncate">
                        {event.event_name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-body-sm text-[var(--foreground-muted)]">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(event.event_date)}
                        </span>
                        <span className="flex items-center gap-1 text-body-sm text-[var(--foreground-muted)]">
                          <Wine className="h-3.5 w-3.5" />
                          {event.rating_count} rated
                        </span>
                        {event.avg_rating > 0 && (
                          <span className="text-body-sm text-[var(--foreground-muted)]">
                            {event.avg_rating}★ avg
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[var(--foreground-muted)] flex-shrink-0" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
