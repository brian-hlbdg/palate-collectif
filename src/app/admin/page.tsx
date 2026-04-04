'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Badge, Button } from '@/components/ui'
import { StatusBadge, CardSkeleton } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Calendar,
  Users,
  Wine,
  Star,
  TrendingUp,
  ArrowRight,
  Plus,
  BarChart3,
  MessageSquarePlus,
  X,
  CheckCircle,
} from 'lucide-react'

interface DashboardStats {
  totalEvents: number
  activeEvents: number
  totalWines: number
  totalRatings: number
}

interface RecentEvent {
  id: string
  event_code: string
  event_name: string
  event_date: string
  is_active: boolean
  is_booth_mode: boolean
  wine_count: number
  rating_count: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSuggestionModal, setShowSuggestionModal] = useState(false)
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false)

  const adminId = typeof window !== 'undefined'
    ? localStorage.getItem('palate-admin-user')
    : null

  useEffect(() => {
    const loadDashboard = async () => {
      if (!adminId) return

      try {
        // Load events for this admin
        const { data: events } = await supabase
          .from('tasting_events')
          .select('id, event_code, event_name, event_date, is_active, is_booth_mode, is_deleted')
          .eq('admin_id', adminId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })

        if (events) {
          // Calculate stats
          const activeEvents = events.filter(e => e.is_active).length

          // Get wine counts
          const eventIds = events.map(e => e.id)
          const { data: wines } = await supabase
            .from('event_wines')
            .select('id, event_id')
            .in('event_id', eventIds)

          const { data: ratings } = await supabase
            .from('user_wine_ratings')
            .select('id, event_wine_id')

          // Filter ratings to only include wines from this admin's events
          const wineIds = wines?.map(w => w.id) || []
          const relevantRatings = ratings?.filter(r => wineIds.includes(r.event_wine_id)) || []

          setStats({
            totalEvents: events.length,
            activeEvents,
            totalWines: wines?.length || 0,
            totalRatings: relevantRatings.length,
          })

          // Build recent events with counts
          const recentWithCounts = events.slice(0, 5).map(event => {
            const wineCount = wines?.filter(w => w.event_id === event.id).length || 0
            const eventWineIds = wines?.filter(w => w.event_id === event.id).map(w => w.id) || []
            const ratingCount = ratings?.filter(r => eventWineIds.includes(r.event_wine_id)).length || 0

            return {
              ...event,
              wine_count: wineCount,
              rating_count: ratingCount,
            }
          })

          setRecentEvents(recentWithCounts)
        }
      } catch (err) {
        console.error('Error loading dashboard:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [adminId])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Suggestion Modal */}
      {showSuggestionModal && (
        <SuggestionModal
          adminId={adminId!}
          onClose={() => setShowSuggestionModal(false)}
          onSubmitted={() => {
            setSuggestionSubmitted(true)
            setShowSuggestionModal(false)
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-md font-bold text-[var(--foreground)]">
            Dashboard
          </h1>
          <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
            Overview of your wine tasting events
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            leftIcon={<MessageSquarePlus className="h-5 w-5" />}
            onClick={() => { setSuggestionSubmitted(false); setShowSuggestionModal(true) }}
          >
            Send Suggestion
          </Button>
          <Link href="/admin/events/new">
            <Button leftIcon={<Plus className="h-5 w-5" />}>
              New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Suggestion submitted banner */}
      {suggestionSubmitted && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--wine-muted)] border border-[var(--wine)]">
          <CheckCircle className="h-5 w-5 text-[var(--wine)] flex-shrink-0" />
          <p className="text-body-sm text-[var(--foreground)]">
            Your suggestion has been sent to the Palate team. Thank you!
          </p>
          <button
            onClick={() => setSuggestionSubmitted(false)}
            className="ml-auto text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Calendar}
          label="Total Events"
          value={stats?.totalEvents || 0}
          color="wine"
        />
        <StatCard
          icon={TrendingUp}
          label="Active Events"
          value={stats?.activeEvents || 0}
          color="gold"
        />
        <StatCard
          icon={Wine}
          label="Total Wines"
          value={stats?.totalWines || 0}
          color="wine"
        />
        <StatCard
          icon={Star}
          label="Total Ratings"
          value={stats?.totalRatings || 0}
          color="gold"
        />
      </div>

      {/* Recent Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-display-sm font-semibold text-[var(--foreground)]">
            Recent Events
          </h2>
          <Link
            href="/admin/events"
            className="text-body-sm text-[var(--wine)] hover:underline flex items-center gap-1"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <Card variant="outlined" padding="lg" className="text-center">
            <Calendar className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
            <h3 className="text-body-lg font-medium text-[var(--foreground)] mb-2">
              No events yet
            </h3>
            <p className="text-body-md text-[var(--foreground-secondary)] mb-4">
              Create your first wine tasting event to get started
            </p>
            <Link href="/admin/events/new">
              <Button leftIcon={<Plus className="h-5 w-5" />}>
                Create Event
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-display-sm font-semibold text-[var(--foreground)] mb-4">
          Quick Actions
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            href="/admin/events/new"
            icon={Plus}
            title="Create Event"
            description="Set up a new wine tasting event"
          />
          <QuickActionCard
            href="/admin/events"
            icon={Calendar}
            title="Manage Events"
            description="View and edit your events"
          />
          <QuickActionCard
            href="/admin/analytics"
            icon={BarChart3}
            title="View Analytics"
            description="See ratings and insights"
          />
        </div>
      </div>
    </div>
  )
}

// Stat card component
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Calendar
  label: string
  value: number
  color: 'wine' | 'gold'
}) {
  return (
    <Card variant="default" padding="md">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            color === 'wine' ? 'bg-[var(--wine-muted)]' : 'bg-[var(--gold-muted)]'
          )}
        >
          <Icon
            className={cn(
              'h-5 w-5',
              color === 'wine' ? 'text-[var(--wine)]' : 'text-[var(--gold)]'
            )}
          />
        </div>
        <div>
          <p className="text-display-sm font-bold text-[var(--foreground)]">
            {value.toLocaleString()}
          </p>
          <p className="text-body-xs text-[var(--foreground-muted)]">
            {label}
          </p>
        </div>
      </div>
    </Card>
  )
}

// Event card component
function EventCard({ event }: { event: RecentEvent }) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Link href={`/admin/events/${event.id}`}>
      <Card
        variant="default"
        padding="md"
        interactive
        className="flex items-center gap-4"
      >
        {/* Event code badge */}
        <div className="w-16 h-16 rounded-xl bg-[var(--wine-muted)] flex items-center justify-center flex-shrink-0">
          <span className="text-body-sm font-mono font-bold text-[var(--wine)]">
            {event.event_code}
          </span>
        </div>

        {/* Event info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-body-md font-semibold text-[var(--foreground)] truncate">
              {event.event_name}
            </h3>
            {event.is_booth_mode && (
              <Badge variant="gold" size="sm">Booth</Badge>
            )}
          </div>
          <p className="text-body-sm text-[var(--foreground-secondary)]">
            {formatDate(event.event_date)}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-body-xs text-[var(--foreground-muted)] flex items-center gap-1">
              <Wine className="h-3.5 w-3.5" />
              {event.wine_count} wines
            </span>
            <span className="text-body-xs text-[var(--foreground-muted)] flex items-center gap-1">
              <Star className="h-3.5 w-3.5" />
              {event.rating_count} ratings
            </span>
          </div>
        </div>

        {/* Status */}
        <StatusBadge status={event.is_active ? 'active' : 'inactive'} size="sm" />
      </Card>
    </Link>
  )
}

// Suggestion Modal
function SuggestionModal({
  adminId,
  onClose,
  onSubmitted,
}: {
  adminId: string
  onClose: () => void
  onSubmitted: () => void
}) {
  const [category, setCategory] = useState<'feature' | 'bug' | 'improvement' | 'other'>('feature')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Please fill in both title and description.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    const { error: insertError } = await supabase
      .from('admin_suggestions')
      .insert({
        admin_id: adminId,
        category,
        title: title.trim(),
        description: description.trim(),
        status: 'pending',
      })

    setIsSubmitting(false)

    if (insertError) {
      console.error('Suggestion submit error:', insertError.message, insertError.details, insertError.code)
      setError(insertError.message || 'Failed to submit. Please try again.')
      return
    }

    onSubmitted()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-[var(--background)] border border-[var(--border)] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
            Send a Suggestion
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--foreground-muted)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Category */}
          <div>
            <label className="block text-body-sm font-medium text-[var(--foreground)] mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['feature', 'bug', 'improvement', 'other'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-body-sm font-medium border transition-all',
                    category === c
                      ? 'border-[var(--wine)] text-[var(--wine)] bg-[var(--wine-muted)]'
                      : 'border-[var(--border)] text-[var(--foreground-secondary)]'
                  )}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-body-sm font-medium text-[var(--foreground)] mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your suggestion"
              className={cn(
                'w-full px-4 py-3 rounded-xl border bg-[var(--surface)]',
                'border-[var(--border)] text-[var(--foreground)]',
                'placeholder:text-[var(--foreground-muted)]',
                'focus:outline-none focus:border-[var(--wine)]',
                'text-body-md'
              )}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-body-sm font-medium text-[var(--foreground)] mb-2">
              Details
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the suggestion in more detail..."
              rows={4}
              className={cn(
                'w-full px-4 py-3 rounded-xl border bg-[var(--surface)]',
                'border-[var(--border)] text-[var(--foreground)]',
                'placeholder:text-[var(--foreground-muted)]',
                'focus:outline-none focus:border-[var(--wine)]',
                'text-body-md resize-none'
              )}
            />
          </div>

          {error && (
            <p className="text-body-sm text-red-500">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} isLoading={isSubmitting}>
              Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Quick action card
function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: typeof Plus
  title: string
  description: string
}) {
  return (
    <Link href={href}>
      <Card
        variant="outlined"
        padding="md"
        interactive
        className="h-full"
      >
        <div
          className={cn(
            'w-10 h-10 rounded-xl mb-3',
            'bg-[var(--wine-muted)]',
            'flex items-center justify-center'
          )}
        >
          <Icon className="h-5 w-5 text-[var(--wine)]" />
        </div>
        <h3 className="text-body-md font-semibold text-[var(--foreground)] mb-1">
          {title}
        </h3>
        <p className="text-body-sm text-[var(--foreground-secondary)]">
          {description}
        </p>
      </Card>
    </Link>
  )
}
