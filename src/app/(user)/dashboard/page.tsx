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
  MessageSquarePlus,
  CalendarPlus,
  X,
  Check,
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

  // Suggestion modal
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [suggestionCategory, setSuggestionCategory] = useState('Feature')
  const [suggestionTitle, setSuggestionTitle] = useState('')
  const [suggestionBody, setSuggestionBody] = useState('')
  const [suggestionSent, setSuggestionSent] = useState(false)
  const [suggestionLoading, setSuggestionLoading] = useState(false)

  // Host inquiry modal
  const [showHostInquiry, setShowHostInquiry] = useState(false)
  const [inquiryName, setInquiryName] = useState('')
  const [inquiryVenue, setInquiryVenue] = useState('')
  const [inquiryGuests, setInquiryGuests] = useState('')
  const [inquiryNotes, setInquiryNotes] = useState('')
  const [inquirySent, setInquirySent] = useState(false)
  const [inquiryLoading, setInquiryLoading] = useState(false)

  const [userId, setUserId] = useState<string | null>(null)

  const getUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) return session.user.id
    return localStorage.getItem('palate-temp-user')
  }

  const handleSendSuggestion = async () => {
    if (!suggestionTitle.trim()) return
    setSuggestionLoading(true)
    try {
      await supabase.from('admin_suggestions').insert({
        admin_id: userId,
        category: suggestionCategory,
        title: suggestionTitle.trim(),
        description: suggestionBody.trim(),
        status: 'pending',
      })
      setSuggestionSent(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSuggestionLoading(false)
    }
  }

  const handleHostInquiry = async () => {
    if (!inquiryName.trim()) return
    setInquiryLoading(true)
    try {
      await supabase.from('admin_suggestions').insert({
        admin_id: userId,
        category: 'Hosting Inquiry',
        title: `Host inquiry from ${inquiryName.trim()}`,
        description: [
          inquiryVenue ? `Venue: ${inquiryVenue}` : null,
          inquiryGuests ? `Expected guests: ${inquiryGuests}` : null,
          inquiryNotes ? `Notes: ${inquiryNotes}` : null,
        ].filter(Boolean).join('\n'),
        status: 'pending',
      })
      setInquirySent(true)
    } catch (err) {
      console.error(err)
    } finally {
      setInquiryLoading(false)
    }
  }

  // Load dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      const userId = await getUserId()
      if (!userId) return
      setUserId(userId)

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-display-md font-bold text-[var(--foreground)]">
            Your Wine Journey
          </h1>
          <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
            Track your tastings and discover your preferences
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => { setShowSuggestion(true); setSuggestionSent(false) }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-body-sm font-medium text-[var(--foreground-secondary)] hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)] transition-colors border border-[var(--border)]"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span className="hidden sm:inline">Suggest</span>
          </button>
          <button
            onClick={() => { setShowHostInquiry(true); setInquirySent(false) }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-body-sm font-medium text-[var(--wine)] bg-[var(--wine-muted)] hover:bg-[var(--wine-muted)]/80 transition-colors"
          >
            <CalendarPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Host an Event</span>
          </button>
        </div>
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

      {/* Send Suggestion Modal */}
      {showSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowSuggestion(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-md space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-body-lg font-semibold text-[var(--foreground)]">Send a Suggestion</h2>
              <button onClick={() => setShowSuggestion(false)} className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {suggestionSent ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-body-md font-medium text-[var(--foreground)]">Thanks for the feedback!</p>
                <p className="text-body-sm text-[var(--foreground-secondary)]">We read every suggestion.</p>
                <Button variant="secondary" fullWidth onClick={() => setShowSuggestion(false)}>Close</Button>
              </div>
            ) : (
              <>
                <div className="flex gap-2 flex-wrap">
                  {['Feature', 'Improvement', 'Bug', 'Other'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSuggestionCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors ${
                        suggestionCategory === cat
                          ? 'bg-[var(--wine)] text-white'
                          : 'bg-[var(--background)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-body-md text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--wine)]"
                  placeholder="Title"
                  value={suggestionTitle}
                  onChange={e => setSuggestionTitle(e.target.value)}
                />
                <textarea
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-body-md text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--wine)] resize-none"
                  placeholder="Tell us more (optional)"
                  rows={3}
                  value={suggestionBody}
                  onChange={e => setSuggestionBody(e.target.value)}
                />
                <Button fullWidth onClick={handleSendSuggestion} isLoading={suggestionLoading} disabled={!suggestionTitle.trim()}>
                  Send Suggestion
                </Button>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Host Inquiry Modal */}
      {showHostInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowHostInquiry(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--surface)] rounded-2xl p-6 w-full max-w-md space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-body-lg font-semibold text-[var(--foreground)]">Interested in Hosting?</h2>
              <button onClick={() => setShowHostInquiry(false)} className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {inquirySent ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-body-md font-medium text-[var(--foreground)]">We'll be in touch!</p>
                <p className="text-body-sm text-[var(--foreground-secondary)]">We'll reach out with pricing and next steps.</p>
                <Button variant="secondary" fullWidth onClick={() => setShowHostInquiry(false)}>Close</Button>
              </div>
            ) : (
              <>
                <p className="text-body-sm text-[var(--foreground-secondary)]">
                  Tell us a little about what you have in mind and we'll follow up with pricing and details.
                </p>
                <input
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-body-md text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--wine)]"
                  placeholder="Your name"
                  value={inquiryName}
                  onChange={e => setInquiryName(e.target.value)}
                />
                <input
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-body-md text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--wine)]"
                  placeholder="Venue or setting (optional)"
                  value={inquiryVenue}
                  onChange={e => setInquiryVenue(e.target.value)}
                />
                <input
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-body-md text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--wine)]"
                  placeholder="Expected number of guests (optional)"
                  value={inquiryGuests}
                  onChange={e => setInquiryGuests(e.target.value)}
                />
                <textarea
                  className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-body-md text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--wine)] resize-none"
                  placeholder="Anything else we should know? (optional)"
                  rows={3}
                  value={inquiryNotes}
                  onChange={e => setInquiryNotes(e.target.value)}
                />
                <Button fullWidth onClick={handleHostInquiry} isLoading={inquiryLoading} disabled={!inquiryName.trim()}>
                  Send Inquiry
                </Button>
              </>
            )}
          </motion.div>
        </div>
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
