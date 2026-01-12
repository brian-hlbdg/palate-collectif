'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button, Badge } from '@/components/ui'
import { WineLoader, RatingDisplay } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Wine,
  ShoppingBag,
  Star,
  Filter,
  Heart,
  Calendar,
} from 'lucide-react'

interface FavoriteWine {
  id: string
  rating: number
  would_buy: boolean
  personal_notes?: string
  created_at: string
  wine: {
    id: string
    wine_name: string
    producer?: string
    vintage?: string
    wine_type: string
    region?: string
  }
  event: {
    event_code: string
    event_name: string
    event_date: string
  }
}

type FilterType = 'all' | 'would_buy' | 'top_rated'
type SortType = 'recent' | 'rating' | 'name'

export default function FavoritesPage() {
  const [wines, setWines] = useState<FavoriteWine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortType, setSortType] = useState<SortType>('recent')

  // Get user ID from auth or localStorage
  const getUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) return session.user.id
    return localStorage.getItem('palate-temp-user')
  }

  // Load all user ratings
  useEffect(() => {
    const loadWines = async () => {
      const userId = await getUserId()
      if (!userId) return

      try {
        const { data: ratings } = await supabase
          .from('user_wine_ratings')
          .select('id, rating, would_buy, personal_notes, created_at, event_wine_id')
          .eq('user_id', userId)

        if (!ratings || ratings.length === 0) {
          setIsLoading(false)
          return
        }

        // Get wine details
        const wineIds = ratings.map(r => r.event_wine_id)
        const { data: winesData } = await supabase
          .from('event_wines')
          .select('id, wine_name, producer, vintage, wine_type, region, event_id')
          .in('id', wineIds)

        // Get event details
        const eventIds = [...new Set(winesData?.map(w => w.event_id) || [])]
        const { data: eventsData } = await supabase
          .from('tasting_events')
          .select('id, event_code, event_name, event_date')
          .in('id', eventIds)

        // Build favorites list
        const favorites: FavoriteWine[] = ratings.map(r => {
          const wine = winesData?.find(w => w.id === r.event_wine_id)
          const event = eventsData?.find(e => e.id === wine?.event_id)
          return {
            id: r.id,
            rating: r.rating,
            would_buy: r.would_buy || false,
            personal_notes: r.personal_notes,
            created_at: r.created_at,
            wine: {
              id: wine?.id || '',
              wine_name: wine?.wine_name || 'Unknown Wine',
              producer: wine?.producer,
              vintage: wine?.vintage,
              wine_type: wine?.wine_type || 'red',
              region: wine?.region,
            },
            event: {
              event_code: event?.event_code || '',
              event_name: event?.event_name || 'Unknown Event',
              event_date: event?.event_date || '',
            },
          }
        })

        setWines(favorites)
      } catch (err) {
        console.error('Error loading wines:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadWines()
  }, [])

  // Filter and sort wines
  const filteredWines = wines
    .filter(w => {
      if (filterType === 'would_buy') return w.would_buy
      if (filterType === 'top_rated') return w.rating >= 4
      return true
    })
    .sort((a, b) => {
      if (sortType === 'rating') return b.rating - a.rating
      if (sortType === 'name') return a.wine.wine_name.localeCompare(b.wine.wine_name)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  // Stats
  const wouldBuyCount = wines.filter(w => w.would_buy).length
  const topRatedCount = wines.filter(w => w.rating >= 4).length

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
      <div>
        <h1 className="text-display-md font-bold text-[var(--foreground)]">
          Would Buy
        </h1>
        <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
          Wines you loved and want to purchase
        </p>
      </div>

      {wines.length === 0 ? (
        <Card variant="outlined" padding="lg" className="text-center">
          <ShoppingBag className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
          <h2 className="text-body-lg font-semibold text-[var(--foreground)] mb-2">
            No wines yet
          </h2>
          <p className="text-body-md text-[var(--foreground-secondary)] mb-6">
            Mark wines as "Would Buy" when rating to see them here
          </p>
          <Link href="/join">
            <Button>Join an Event</Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* Quick stats */}
          <div className="flex gap-4">
            <Card variant="default" padding="sm" className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--wine-muted)] flex items-center justify-center">
                  <Wine className="h-5 w-5 text-[var(--wine)]" />
                </div>
                <div>
                  <p className="text-display-sm font-bold text-[var(--foreground)]">
                    {wines.length}
                  </p>
                  <p className="text-body-xs text-[var(--foreground-muted)]">Total</p>
                </div>
              </div>
            </Card>
            <Card variant="default" padding="sm" className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--gold-muted)] flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-[var(--gold)]" />
                </div>
                <div>
                  <p className="text-display-sm font-bold text-[var(--foreground)]">
                    {wouldBuyCount}
                  </p>
                  <p className="text-body-xs text-[var(--foreground-muted)]">Would Buy</p>
                </div>
              </div>
            </Card>
            <Card variant="default" padding="sm" className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--gold-muted)] flex items-center justify-center">
                  <Star className="h-5 w-5 text-[var(--gold)]" />
                </div>
                <div>
                  <p className="text-display-sm font-bold text-[var(--foreground)]">
                    {topRatedCount}
                  </p>
                  <p className="text-body-xs text-[var(--foreground-muted)]">4+ Stars</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              {(['all', 'would_buy', 'top_rated'] as FilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-body-sm font-medium',
                    'transition-colors duration-200',
                    filterType === type
                      ? 'bg-[var(--wine)] text-white'
                      : 'text-[var(--foreground-secondary)]'
                  )}
                >
                  {type === 'all' && 'All'}
                  {type === 'would_buy' && '💰 Would Buy'}
                  {type === 'top_rated' && '⭐ Top Rated'}
                </button>
              ))}
            </div>

            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value as SortType)}
              className={cn(
                'px-3 py-2 rounded-xl text-body-sm',
                'bg-[var(--surface)] border border-[var(--border)]',
                'text-[var(--foreground)]',
                'focus:outline-none focus:border-[var(--wine)]'
              )}
            >
              <option value="recent">Most Recent</option>
              <option value="rating">Highest Rated</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          {/* Wines list */}
          <div className="space-y-3">
            {filteredWines.length === 0 ? (
              <Card variant="outlined" padding="md" className="text-center">
                <p className="text-body-md text-[var(--foreground-secondary)]">
                  No wines match this filter
                </p>
              </Card>
            ) : (
              filteredWines.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link href={`/event/${item.event.event_code}/wine/${item.wine.id}`}>
                    <Card variant="default" padding="md" interactive>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--background)] flex items-center justify-center text-xl flex-shrink-0">
                          {getWineEmoji(item.wine.wine_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {item.would_buy && (
                              <ShoppingBag className="h-4 w-4 text-[var(--gold)]" />
                            )}
                            <RatingDisplay value={item.rating} size="sm" />
                          </div>
                          <h3 className="text-body-md font-medium text-[var(--foreground)]">
                            {item.wine.wine_name}
                          </h3>
                          <p className="text-body-sm text-[var(--foreground-secondary)]">
                            {[item.wine.producer, item.wine.vintage, item.wine.region]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="default" size="sm">
                              {item.event.event_name}
                            </Badge>
                            <span className="text-body-xs text-[var(--foreground-muted)]">
                              {formatDate(item.event.event_date)}
                            </span>
                          </div>
                          {item.personal_notes && (
                            <p className="text-body-sm text-[var(--foreground-muted)] mt-2 italic truncate">
                              "{item.personal_notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </>
      )}
    </div>
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

function formatDate(dateString: string): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
