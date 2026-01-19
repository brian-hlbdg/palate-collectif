'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'
import { WineLoader } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Plus,
  Wine,
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  BarChart3,
} from 'lucide-react'

interface Event {
  id: string
  event_code: string
  event_name: string
  event_date: string
  location?: string
  is_active: boolean
  event_wines?: { id: string }[]
}

export default function AdminEventsPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/admin/login')
        return
      }

      const { data, error } = await supabase
        .from('tasting_events')
        .select('*, event_wines(id)')
        .eq('admin_id', session.user.id)
        .order('event_date', { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (err) {
      console.error('Error loading events:', err)
      addToast({ type: 'error', message: 'Failed to load events' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <WineLoader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-md font-bold text-[var(--foreground)]">
            Your Events
          </h1>
          <p className="text-body-md text-[var(--foreground-secondary)]">
            Manage your wine tasting events
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => router.push('/admin/events/new')}
        >
          Create Event
        </Button>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <Card variant="default" className="text-center py-12">
          <Wine className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
          <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-2">
            No events yet
          </h3>
          <p className="text-body-md text-[var(--foreground-secondary)] mb-4">
            Create your first wine tasting event to get started
          </p>
          <Button onClick={() => router.push('/admin/events/new')}>
            Create Your First Event
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => router.push(`/admin/events/${event.id}`)}
              className={cn(
                'w-full text-left p-5 rounded-xl',
                'border border-[var(--border)] bg-[var(--background)]',
                'hover:border-[var(--foreground-muted)] transition-all',
                'flex items-center gap-4'
              )}
            >
              {/* Wine count */}
              <div className={cn(
                'w-14 h-14 rounded-xl flex flex-col items-center justify-center',
                'bg-[var(--wine-muted)]'
              )}>
                <Wine className="h-5 w-5 text-[var(--wine)]" />
                <span className="text-body-xs font-bold text-[var(--wine)]">
                  {event.event_wines?.length || 0}
                </span>
              </div>

              {/* Event info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-body-lg font-semibold text-[var(--foreground)] truncate">
                    {event.event_name}
                  </h3>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-body-xs',
                    event.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  )}>
                    {event.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-body-sm text-[var(--foreground-muted)]">
                  {event.event_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(event.event_date).toLocaleDateString()}
                    </span>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {event.location}
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="font-mono text-body-xs px-2 py-1 rounded bg-[var(--surface)] text-[var(--foreground-secondary)]">
                    Code: {event.event_code}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="h-5 w-5 text-[var(--foreground-muted)] flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
