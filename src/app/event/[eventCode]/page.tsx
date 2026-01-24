'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { WineLoader } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Wine,
  Star,
  MapPin,
  Calendar,
  ChevronRight,
  Check,
  Search,
  Filter,
  Sparkles,
  User,
  X,
  Navigation,
  ShoppingBag,
} from 'lucide-react'

// Country flags
const countryFlags: Record<string, string> = {
  'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸', 'United States': '🇺🇸', 'USA': '🇺🇸',
  'Germany': '🇩🇪', 'Portugal': '🇵🇹', 'Argentina': '🇦🇷', 'Chile': '🇨🇱', 'Australia': '🇦🇺',
  'New Zealand': '🇳🇿', 'South Africa': '🇿🇦', 'Austria': '🇦🇹', 'Greece': '🇬🇷',
}

interface EventData {
  id: string
  event_code: string
  event_name: string
  event_date: string
  location?: string
  description?: string
}

interface WineData {
  id: string
  wine_name: string
  producer?: string
  vintage?: number
  wine_type: string
  region?: string
  country?: string
  tasting_order?: number
  location_name?: string
  image_url?: string
}

interface UserRating {
  event_wine_id: string
  rating: number
  would_buy: boolean
}

interface LocationGroup {
  location_name: string
  location_address?: string
  wines: WineData[]
}

export default function EventWinesPage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  const eventCode = params.eventCode as string

  const [event, setEvent] = useState<EventData | null>(null)
  const [wines, setWines] = useState<WineData[]>([])
  const [userRatings, setUserRatings] = useState<Record<string, UserRating>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isTempUser, setIsTempUser] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Search & filter
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterType, setFilterType] = useState<string | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)

  // Check user
  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      setIsTempUser(false)
      setUserId(session.user.id)
      return session.user.id
    }
    const tempId = localStorage.getItem('palate-temp-user')
    if (tempId) {
      setIsTempUser(true)
      setUserId(tempId)
    }
    return tempId
  }

  useEffect(() => {
    if (eventCode) {
      loadData()
    }
  }, [eventCode])

  const loadData = async () => {
    const currentUserId = await checkUser()
    if (!currentUserId) {
      router.push('/join')
      return
    }

    try {
      // Load event by code
      const { data: eventData, error: eventError } = await supabase
        .from('tasting_events')
        .select('*')
        .eq('event_code', eventCode)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)

      // Load wines
      const { data: wineData, error: wineError } = await supabase
        .from('event_wines')
        .select('*')
        .eq('event_id', eventData.id)
        .order('tasting_order', { ascending: true })

      if (wineError) throw wineError
      setWines(wineData || [])

      // Load user ratings
      if (wineData && wineData.length > 0) {
        const wineIds = wineData.map(w => w.id)
        const { data: ratings } = await supabase
          .from('user_wine_ratings')
          .select('event_wine_id, rating, would_buy')
          .eq('user_id', currentUserId)
          .in('event_wine_id', wineIds)

        if (ratings) {
          const ratingsMap: Record<string, UserRating> = {}
          ratings.forEach(r => {
            ratingsMap[r.event_wine_id] = r
          })
          setUserRatings(ratingsMap)
        }
      }
    } catch (err) {
      console.error('Error loading event:', err)
      addToast({ type: 'error', message: 'Failed to load event' })
    } finally {
      setIsLoading(false)
    }
  }

  // Group wines by location
  const groupedWines = (): LocationGroup[] => {
    const locations = new Map<string, WineData[]>()
    const unassigned: WineData[] = []

    // Filter wines based on search and type filter
    const filteredWines = wines.filter(wine => {
      const matchesSearch = !searchQuery || 
        wine.wine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wine.producer?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = !filterType || wine.wine_type === filterType
      return matchesSearch && matchesType
    })

    filteredWines.forEach(wine => {
      if (wine.location_name) {
        const existing = locations.get(wine.location_name) || []
        existing.push(wine)
        locations.set(wine.location_name, existing)
      } else {
        unassigned.push(wine)
      }
    })

    const groups: LocationGroup[] = []
    
    if (unassigned.length > 0 && locations.size === 0) {
      groups.push({ location_name: '', wines: unassigned })
    } else {
      locations.forEach((wines, location) => {
        groups.push({ location_name: location, wines })
      })
      if (unassigned.length > 0) {
        groups.push({ location_name: 'Other Wines', wines: unassigned })
      }
    }

    return groups
  }

  // Stats
  const totalWines = wines.length
  const ratedCount = Object.keys(userRatings).length
  const progressPercent = totalWines > 0 ? (ratedCount / totalWines) * 100 : 0
  const isWineCrawl = wines.some(w => w.location_name)

  // Get unique wine types for filter
  const wineTypes = [...new Set(wines.map(w => w.wine_type).filter(Boolean))]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <WineLoader />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <Wine className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
          <p className="text-body-md text-[var(--foreground-secondary)]">
            Event not found
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Compact Header - Matching Original */}
      <header className="bg-[var(--surface)] border-b border-[var(--border)] p-4 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto">
          {/* Top row: Event code badge and actions */}
          <div className="flex items-center justify-between mb-2">
            <span className="px-2 py-0.5 bg-[var(--wine-muted)] text-[var(--wine)] text-body-xs font-mono rounded">
              {event.event_code}
            </span>
            <div className="flex items-center gap-2">
              {/* Dark mode toggle placeholder */}
              <button className="p-2 rounded-lg text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors">
                <User className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Event name */}
          <h1 className="text-lg font-bold text-[var(--foreground)] mb-1">
            {event.event_name}
          </h1>

          {/* Date and location */}
          <div className="flex items-center gap-4 text-body-sm text-[var(--foreground-secondary)]">
            {event.event_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
            {isWineCrawl && (
              <div className="flex items-center gap-1 text-[var(--wine)]">
                <Navigation className="h-4 w-4" />
                <span>Wine Crawl</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[var(--wine)] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-body-xs text-[var(--foreground-muted)] whitespace-nowrap">
              {ratedCount}/{totalWines}
            </span>
          </div>
        </div>
      </header>

      {/* Search and Filter Bar */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          {/* Search input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search wines..."
              className={cn(
                'w-full pl-10 pr-4 py-2.5 rounded-xl',
                'bg-[var(--background)] border border-[var(--border)]',
                'text-body-sm text-[var(--foreground)]',
                'placeholder:text-[var(--foreground-muted)]',
                'focus:outline-none focus:border-[var(--wine)]',
                'transition-colors'
              )}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'p-2.5 rounded-xl border transition-colors',
              showFilters || filterType
                ? 'bg-[var(--wine-muted)] border-[var(--wine)] text-[var(--wine)]'
                : 'bg-[var(--background)] border-[var(--border)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
            )}
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>

        {/* Filter options */}
        <AnimatePresence>
          {showFilters && wineTypes.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="max-w-2xl mx-auto overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 pt-3">
                <button
                  onClick={() => setFilterType(null)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-body-xs transition-colors',
                    !filterType
                      ? 'bg-[var(--wine)] text-white'
                      : 'bg-[var(--background)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                  )}
                >
                  All
                </button>
                {wineTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(filterType === type ? null : type)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-body-xs capitalize transition-colors',
                      filterType === type
                        ? 'bg-[var(--wine)] text-white'
                        : 'bg-[var(--background)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Wine List */}
      <main className="p-4 pb-24 max-w-2xl mx-auto">
        {wines.length === 0 ? (
          <div className="text-center py-12">
            <Wine className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
            <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-2">
              No Wines Yet
            </h3>
            <p className="text-body-md text-[var(--foreground-secondary)]">
              The event organizer hasn't added any wines yet.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedWines().map((group) => (
              <div key={group.location_name || 'main'}>
                {/* Location header for wine crawls */}
                {group.location_name && (
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <MapPin className="h-4 w-4 text-[var(--wine)]" />
                    <h2 className="text-body-sm font-semibold text-[var(--foreground)]">
                      {group.location_name}
                    </h2>
                    <span className="text-body-xs text-[var(--foreground-muted)]">
                      ({group.wines.length})
                    </span>
                  </div>
                )}

                {/* Wine cards */}
                <div className="space-y-3">
                  {group.wines.map((wine, index) => {
                    const rating = userRatings[wine.id]
                    const isRated = !!rating
                    const flag = wine.country ? countryFlags[wine.country] : null

                    return (
                      <motion.button
                        key={wine.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => router.push(`/event/${eventCode}/wine/${wine.id}`)}
                        className={cn(
                          'w-full text-left',
                          'bg-[var(--surface)] border rounded-xl p-4',
                          'transition-all duration-200',
                          isRated
                            ? 'border-[var(--wine)]/30'
                            : 'border-[var(--border)] hover:border-[var(--foreground-muted)]'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          {/* Wine emoji/image */}
                          <div className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl',
                            getWineTypeBg(wine.wine_type)
                          )}>
                            {wine.image_url ? (
                              <img
                                src={wine.image_url}
                                alt={wine.wine_name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              getWineEmoji(wine.wine_type)
                            )}
                          </div>

                          {/* Wine info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {wine.tasting_order && (
                                <span className="text-body-xs text-[var(--foreground-muted)]">
                                  #{wine.tasting_order}
                                </span>
                              )}
                              <h3 className="text-body-md font-semibold text-[var(--foreground)] truncate">
                                {wine.wine_name}
                              </h3>
                            </div>
                            <p className="text-body-sm text-[var(--foreground-secondary)] truncate">
                              {[wine.producer, wine.vintage].filter(Boolean).join(' · ')}
                            </p>
                            {(flag || wine.region) && (
                              <div className="flex items-center gap-1 mt-0.5">
                                {flag && <span className="text-sm">{flag}</span>}
                                {wine.region && (
                                  <span className="text-body-xs text-[var(--foreground-muted)]">
                                    {wine.region}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Rating status */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isRated ? (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-[var(--wine)] text-[var(--wine)]" />
                                  <span className="text-body-sm font-medium text-[var(--foreground)]">
                                    {rating.rating}
                                  </span>
                                </div>
                                {rating.would_buy && (
                                  <ShoppingBag className="h-4 w-4 text-[var(--wine)]" />
                                )}
                                <Check className="h-5 w-5 text-[var(--wine)]" />
                              </div>
                            ) : (
                              <ChevronRight className="h-5 w-5 text-[var(--foreground-muted)]" />
                            )}
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* No results from search/filter */}
            {groupedWines().length === 0 && wines.length > 0 && (
              <div className="text-center py-8">
                <p className="text-body-md text-[var(--foreground-secondary)]">
                  No wines match your search
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setFilterType(null); }}
                  className="mt-2 text-body-sm text-[var(--wine)] hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--surface)]/95 backdrop-blur-xl border-t border-[var(--border)] z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-around py-2 px-4 safe-area-inset-bottom">
          <button
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-[var(--wine)]"
          >
            <Wine className="h-5 w-5" />
            <span className="text-body-xs font-medium">Wines</span>
          </button>
          
          <button
            onClick={() => router.push('/recommendations')}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-body-xs">For You</span>
          </button>
          
          <button
            onClick={() => router.push(`/event/${eventCode}/profile`)}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            <User className="h-5 w-5" />
            <span className="text-body-xs">Profile</span>
          </button>

          {isTempUser && (
            <button
              onClick={() => router.push('/convert')}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-[var(--wine)] bg-[var(--wine-muted)] relative"
            >
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--wine)] animate-pulse" />
              <User className="h-5 w-5" />
              <span className="text-body-xs font-medium">Save</span>
            </button>
          )}
        </div>
      </nav>

      {/* Event Description Modal */}
      <AnimatePresence>
        {showEventModal && event.description && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setShowEventModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--surface)] rounded-2xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-[var(--foreground)] mb-2">
                {event.event_name}
              </h2>
              <p className="text-body-md text-[var(--foreground-secondary)]">
                {event.description}
              </p>
              <button
                onClick={() => setShowEventModal(false)}
                className="mt-4 w-full py-2 bg-[var(--wine)] text-white rounded-xl font-medium"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Helper functions
function getWineEmoji(wineType: string | null | undefined): string {
  const emojiMap: Record<string, string> = {
    red: '🍷',
    white: '🥂',
    rosé: '🌸',
    sparkling: '🍾',
    dessert: '🍯',
    fortified: '🥃',
    orange: '🍊',
  }
  return emojiMap[wineType?.toLowerCase() || 'red'] || '🍷'
}

function getWineTypeBg(wineType: string | null | undefined): string {
  const bgMap: Record<string, string> = {
    red: 'bg-red-900/20',
    white: 'bg-yellow-900/20',
    rosé: 'bg-pink-900/20',
    sparkling: 'bg-amber-900/20',
    dessert: 'bg-orange-900/20',
    fortified: 'bg-amber-900/20',
    orange: 'bg-orange-900/20',
  }
  return bgMap[wineType?.toLowerCase() || 'red'] || 'bg-red-900/20'
}