'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button, Badge } from '@/components/ui'
import { WineLoader, RatingDisplay } from '@/components/ui'
import { ThemeToggle } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Wine,
  MapPin,
  Calendar,
  Search,
  Filter,
  User,
  ChevronRight,
  Check,
  Star,
  Clock,
} from 'lucide-react'

interface EventDetails {
  id: string
  event_code: string
  event_name: string
  event_date: string
  location?: string
  description?: string
}

interface EventWine {
  id: string
  wine_name: string
  producer?: string
  vintage?: string
  wine_type: string
  region?: string
  country?: string
  tasting_order: number
  location_name?: string
  location_order?: number
}

interface GroupedWines {
  location: string | null
  wines: EventWine[]
}

export default function EventPage() {
  const params = useParams()
  const router = useRouter()
  const eventCode = params.eventCode as string

  const [event, setEvent] = useState<EventDetails | null>(null)
  const [wines, setWines] = useState<EventWine[]>([])
  const [userRatings, setUserRatings] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const userId = typeof window !== 'undefined'
    ? localStorage.getItem('palate-temp-user')
    : null

  // Load event and wines
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load event by event_code
        const { data: eventData, error: eventError } = await supabase
          .from('tasting_events')
          .select('id, event_code, event_name, event_date, location, description, is_active, is_deleted')
          .eq('event_code', eventCode.toUpperCase())
          .single()

        if (eventError || !eventData) {
          setError('Event not found')
          return
        }

        if (!eventData.is_active || eventData.is_deleted) {
          setError('This event is no longer active')
          return
        }

        setEvent(eventData)

        // Load wines
        const { data: winesData } = await supabase
          .from('event_wines')
          .select('id, wine_name, producer, vintage, wine_type, region, country, tasting_order, location_name, location_order')
          .eq('event_id', eventData.id)
          .order('location_order', { ascending: true, nullsFirst: false })
          .order('tasting_order', { ascending: true })

        if (winesData) {
          setWines(winesData)
        }

        // Load user's ratings
        if (userId) {
          const { data: ratingsData } = await supabase
            .from('user_wine_ratings')
            .select('event_wine_id, rating')
            .eq('user_id', userId)

          if (ratingsData) {
            const ratingsMap: Record<string, number> = {}
            ratingsData.forEach((r) => {
              ratingsMap[r.event_wine_id] = r.rating
            })
            setUserRatings(ratingsMap)
          }
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load event')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [eventCode, userId])

  // Get unique wine types for filter
  const wineTypes = [...new Set(wines.map((w) => w.wine_type))]

  // Filter wines
  const filteredWines = wines.filter((wine) => {
    const matchesSearch =
      !searchQuery ||
      wine.wine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wine.producer?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = !filterType || wine.wine_type === filterType

    return matchesSearch && matchesType
  })

  // Group wines by location
  const groupedWines: GroupedWines[] = React.useMemo(() => {
    const groups: Record<string, EventWine[]> = {}
    
    filteredWines.forEach((wine) => {
      const location = wine.location_name || 'All Wines'
      if (!groups[location]) {
        groups[location] = []
      }
      groups[location].push(wine)
    })

    // Sort by location_order
    return Object.entries(groups)
      .sort(([, a], [, b]) => {
        const aOrder = a[0]?.location_order ?? 999
        const bOrder = b[0]?.location_order ?? 999
        return aOrder - bOrder
      })
      .map(([location, wines]) => ({
        location: location === 'All Wines' ? null : location,
        wines,
      }))
  }, [filteredWines])

  // Stats
  const totalWines = wines.length
  const ratedWines = Object.keys(userRatings).length
  const progress = totalWines > 0 ? (ratedWines / totalWines) * 100 : 0

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <WineLoader />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
        <Card variant="outlined" padding="lg" className="max-w-md w-full text-center">
          <Wine className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
          <h1 className="text-display-sm font-bold text-[var(--foreground)] mb-2">
            {error}
          </h1>
          <p className="text-body-md text-[var(--foreground-secondary)] mb-6">
            Please check the event code and try again
          </p>
          <Button onClick={() => router.push('/join')}>
            Back to Join
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="px-4 py-4">
          {/* Event info */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="wine" size="sm">{event?.event_code}</Badge>
              </div>
              <h1 className="text-body-lg font-bold text-[var(--foreground)] truncate">
                {event?.event_name}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-body-sm text-[var(--foreground-secondary)]">
                {event?.event_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(event.event_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
                {event?.location && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href={`/event/${eventCode}/profile`}
                className={cn(
                  'p-2 rounded-xl',
                  'bg-[var(--wine-muted)]',
                  'text-[var(--wine)]',
                  'hover:bg-[var(--wine)] hover:text-white',
                  'transition-colors duration-200'
                )}
              >
                <User className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[var(--wine)] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <span className="text-body-sm font-medium text-[var(--foreground-secondary)]">
              {ratedWines}/{totalWines}
            </span>
          </div>
        </div>

        {/* Search and filter */}
        <div className="px-4 pb-4 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)]" />
            <input
              type="text"
              placeholder="Search wines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-2.5 rounded-xl',
                'bg-[var(--background)] border border-[var(--border)]',
                'text-body-md text-[var(--foreground)]',
                'placeholder:text-[var(--foreground-muted)]',
                'focus:outline-none focus:border-[var(--wine)]',
                'transition-colors duration-200'
              )}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'px-4 py-2.5 rounded-xl border',
              'transition-colors duration-200',
              showFilters || filterType
                ? 'bg-[var(--wine-muted)] border-[var(--wine)] text-[var(--wine)]'
                : 'bg-[var(--background)] border-[var(--border)] text-[var(--foreground-secondary)]'
            )}
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>

        {/* Filter pills */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType(null)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-body-sm font-medium',
                    'transition-colors duration-200',
                    !filterType
                      ? 'bg-[var(--wine)] text-white'
                      : 'bg-[var(--background)] border border-[var(--border)] text-[var(--foreground-secondary)]'
                  )}
                >
                  All
                </button>
                {wineTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-body-sm font-medium',
                      'transition-colors duration-200',
                      filterType === type
                        ? 'bg-[var(--wine)] text-white'
                        : 'bg-[var(--background)] border border-[var(--border)] text-[var(--foreground-secondary)]'
                    )}
                  >
                    {getWineEmoji(type)} {type}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Wine list */}
      <main className="p-4 pb-24">
        {filteredWines.length === 0 ? (
          <div className="text-center py-12">
            <Wine className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
            <p className="text-body-lg text-[var(--foreground-secondary)]">
              {searchQuery || filterType
                ? 'No wines match your search'
                : 'No wines available yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedWines.map((group, groupIndex) => (
              <div key={group.location || 'all'}>
                {/* Location header */}
                {group.location && (
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-[var(--wine)]" />
                    <h2 className="text-body-md font-semibold text-[var(--foreground)]">
                      {group.location}
                    </h2>
                    <span className="text-body-sm text-[var(--foreground-muted)]">
                      ({group.wines.length})
                    </span>
                  </div>
                )}

                {/* Wines in this location */}
                <div className="space-y-3">
                  {group.wines.map((wine, index) => (
                    <motion.div
                      key={wine.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (groupIndex * group.wines.length + index) * 0.03 }}
                    >
                      <WineCard
                        wine={wine}
                        userRating={userRatings[wine.id]}
                        onClick={() => router.push(`/event/${eventCode}/wine/${wine.id}`)}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom action bar */}
      {ratedWines > 0 && ratedWines < totalWines && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--surface)] border-t border-[var(--border)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-sm text-[var(--foreground)]">
                <span className="font-semibold">{ratedWines}</span> of {totalWines} wines rated
              </p>
              <p className="text-body-xs text-[var(--foreground-muted)]">
                Keep going!
              </p>
            </div>
            <Button
              onClick={() => {
                const unratedWine = wines.find((w) => !userRatings[w.id])
                if (unratedWine) {
                  router.push(`/event/${eventCode}/wine/${unratedWine.id}`)
                }
              }}
            >
              Continue
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Wine card component
function WineCard({
  wine,
  userRating,
  onClick,
}: {
  wine: EventWine
  userRating?: number
  onClick: () => void
}) {
  const isRated = userRating !== undefined

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left',
        'p-4 rounded-2xl',
        'bg-[var(--surface)] border',
        'transition-all duration-200',
        isRated
          ? 'border-[var(--wine)]/30 bg-[var(--wine-muted)]/30'
          : 'border-[var(--border)] hover:border-[var(--border-secondary)]',
        'hover:shadow-[var(--shadow-elevation-1)]',
        'active:scale-[0.99]'
      )}
    >
      <div className="flex items-center gap-4">
        {/* Wine type indicator */}
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
            isRated ? 'bg-[var(--wine)]/20' : 'bg-[var(--background)]'
          )}
        >
          {isRated ? (
            <Check className="h-6 w-6 text-[var(--wine)]" />
          ) : (
            getWineEmoji(wine.wine_type)
          )}
        </div>

        {/* Wine info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-body-xs text-[var(--foreground-muted)]">
              #{wine.tasting_order}
            </span>
            {isRated && <RatingDisplay value={userRating!} size="sm" />}
          </div>
          <h3 className="text-body-md font-medium text-[var(--foreground)] truncate">
            {wine.wine_name}
          </h3>
          <p className="text-body-sm text-[var(--foreground-secondary)] truncate">
            {[wine.producer, wine.vintage].filter(Boolean).join(' · ')}
          </p>
        </div>

        {/* Arrow */}
        <ChevronRight className="h-5 w-5 text-[var(--foreground-muted)] flex-shrink-0" />
      </div>
    </button>
  )
}

// Helper function
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
