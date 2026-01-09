'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button, Badge } from '@/components/ui'
import { WineLoader, RatingDisplay } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Wine,
  Star,
  Calendar,
  TrendingUp,
  ShoppingBag,
  ChevronRight,
  Sparkles,
  Trophy,
} from 'lucide-react'

interface UserStats {
  totalRatings: number
  totalEvents: number
  averageRating: number
  wouldBuyCount: number
}

interface RecentRating {
  id: string
  rating: number
  would_buy: boolean
  created_at: string
  wine: {
    id: string
    wine_name: string
    producer?: string
    wine_type: string
  }
  event: {
    event_code: string
    event_name: string
  }
}

interface EventSummary {
  id: string
  event_code: string
  event_name: string
  event_date: string
  rating_count: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [recentRatings, setRecentRatings] = useState<RecentRating[]>([])
  const [events, setEvents] = useState<EventSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Get user ID from auth or localStorage
  const getUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) return session.user.id
    return localStorage.getItem('palate-temp-user')
  }

  // Load dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      const userId = await getUserId()
      if (!userId) return

      try {
        // Get all user ratings with wine and event info
        const { data: ratings } = await supabase
          .from('user_wine_ratings')
          .select(`
            id,
            rating,
            would_buy,
            created_at,
            event_wine_id
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (!ratings || ratings.length === 0) {
          setStats({
            totalRatings: 0,
            totalEvents: 0,
            averageRating: 0,
            wouldBuyCount: 0,
          })
          setIsLoading(false)
          return
        }

        // Get wine details for ratings
        const wineIds = ratings.map(r => r.event_wine_id)
        const { data: wines } = await supabase
          .from('event_wines')
          .select('id, wine_name, producer, wine_type, event_id')
          .in('id', wineIds)

        // Get event details
        const eventIds = [...new Set(wines?.map(w => w.event_id) || [])]
        const { data: eventsData } = await supabase
          .from('tasting_events')
          .select('id, event_code, event_name, event_date')
          .in('id', eventIds)

        // Calculate stats
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        const wouldBuyCount = ratings.filter(r => r.would_buy).length

        setStats({
          totalRatings: ratings.length,
          totalEvents: eventIds.length,
          averageRating: Math.round(avgRating * 10) / 10,
          wouldBuyCount,
        })

        // Build recent ratings
        const recent: RecentRating[] = ratings.slice(0, 5).map(r => {
          const wine = wines?.find(w => w.id === r.event_wine_id)
          const event = eventsData?.find(e => e.id === wine?.event_id)
          return {
            id: r.id,
            rating: r.rating,
            would_buy: r.would_buy || false,
            created_at: r.created_at,
            wine: {
              id: wine?.id || '',
              wine_name: wine?.wine_name || 'Unknown Wine',
              producer: wine?.producer,
              wine_type: wine?.wine_type || 'red',
            },
            event: {
              event_code: event?.event_code || '',
              event_name: event?.event_name || 'Unknown Event',
            },
          }
        })
        setRecentRatings(recent)

        // Build event summaries
        const eventSummaries: EventSummary[] = (eventsData || []).map(e => {
          const eventWineIds = wines?.filter(w => w.event_id === e.id).map(w => w.id) || []
          const eventRatings = ratings.filter(r => eventWineIds.includes(r.event_wine_id))
          return {
            id: e.id,
            event_code: e.event_code,
            event_name: e.event_name,
            event_date: e.event_date,
            rating_count: eventRatings.length,
          }
        }).sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())

        setEvents(eventSummaries)
      } catch (err) {
        console.error('Error loading dashboard:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <WineLoader />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-display-md font-bold text-[var(--foreground)]">
          Your Wine Journey
        </h1>
        <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
          Track your tastings and discover your preferences
        </p>
      </div>

      {stats?.totalRatings === 0 ? (
        <Card variant="outlined" padding="lg" className="text-center">
          <Sparkles className="h-12 w-12 text-[var(--gold)] mx-auto mb-4" />
          <h2 className="text-body-lg font-semibold text-[var(--foreground)] mb-2">
            Start Your Journey
          </h2>
          <p className="text-body-md text-[var(--foreground-secondary)] mb-6">
            Join a wine tasting event to start building your profile
          </p>
          <Button onClick={() => router.push('/join')}>
            Join an Event
          </Button>
        </Card>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Wine}
              label="Wines Rated"
              value={stats?.totalRatings || 0}
              color="wine"
            />
            <StatCard
              icon={Calendar}
              label="Events"
              value={stats?.totalEvents || 0}
              color="wine"
            />
            <StatCard
              icon={TrendingUp}
              label="Avg Rating"
              value={stats?.averageRating || 0}
              suffix="/ 5"
              color="gold"
            />
            <StatCard
              icon={ShoppingBag}
              label="Would Buy"
              value={stats?.wouldBuyCount || 0}
              color="gold"
            />
          </div>

          {/* Recent Ratings */}
          {recentRatings.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
                  Recent Ratings
                </h2>
                <Link
                  href="/favorites"
                  className="text-body-sm text-[var(--wine)] hover:underline"
                >
                  View all →
                </Link>
              </div>
              <div className="space-y-3">
                {recentRatings.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/event/${item.event.event_code}/wine/${item.wine.id}`}>
                      <Card variant="default" padding="md" interactive>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[var(--background)] flex items-center justify-center text-xl">
                            {getWineEmoji(item.wine.wine_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {item.would_buy && (
                                <ShoppingBag className="h-3.5 w-3.5 text-[var(--gold)]" />
                              )}
                              <span className="text-body-xs text-[var(--foreground-muted)]">
                                {formatTimeAgo(item.created_at)}
                              </span>
                            </div>
                            <h3 className="text-body-md font-medium text-[var(--foreground)] truncate">
                              {item.wine.wine_name}
                            </h3>
                            <p className="text-body-sm text-[var(--foreground-muted)] truncate">
                              {item.event.event_name}
                            </p>
                          </div>
                          <RatingDisplay value={item.rating} size="md" />
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          {events.length > 0 && (
            <div>
              <h2 className="text-body-lg font-semibold text-[var(--foreground)] mb-4">
                Your Events
              </h2>
              <div className="space-y-3">
                {events.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/event/${event.event_code}/profile`}>
                      <Card variant="outlined" padding="md" interactive>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[var(--wine-muted)] flex items-center justify-center">
                            <span className="text-body-xs font-mono font-bold text-[var(--wine)]">
                              {event.event_code}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-body-md font-medium text-[var(--foreground)] truncate">
                              {event.event_name}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-body-sm text-[var(--foreground-muted)]">
                                {formatDate(event.event_date)}
                              </span>
                              <span className="text-body-sm text-[var(--foreground-muted)]">
                                {event.rating_count} wines rated
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-[var(--foreground-muted)]" />
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Join another event CTA */}
          <Card variant="outlined" padding="md" className="text-center">
            <p className="text-body-md text-[var(--foreground-secondary)] mb-3">
              Ready for another tasting?
            </p>
            <Button variant="secondary" onClick={() => router.push('/join')}>
              Join an Event
            </Button>
          </Card>
        </>
      )}
    </div>
  )
}

// Stat card component
function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  color,
}: {
  icon: typeof Wine
  label: string
  value: number
  suffix?: string
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
            {typeof value === 'number' && !suffix ? value.toLocaleString() : value}
            {suffix && (
              <span className="text-body-sm font-normal text-[var(--foreground-muted)]">
                {' '}{suffix}
              </span>
            )}
          </p>
          <p className="text-body-xs text-[var(--foreground-muted)]">{label}</p>
        </div>
      </div>
    </Card>
  )
}

// Helper functions
function getWineEmoji(wineType: string): string {
  const emojiMap: Record<string, string> = {
    red: '🍷',
    white: '🥂',
    rosé: '🌸',
    sparkling: '🍾',
    dessert: '🍯',
    fortified: '🥃',
    orange: '🍊',
  }
  return emojiMap[wineType?.toLowerCase()] || '🍷'
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
