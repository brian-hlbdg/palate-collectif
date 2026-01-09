'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button, Badge } from '@/components/ui'
import { WineLoader, RatingDisplay, WineTypeBadge } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  Wine,
  Star,
  ShoppingBag,
  Trophy,
  TrendingUp,
  Sparkles,
} from 'lucide-react'

interface EventDetails {
  id: string
  event_code: string
  event_name: string
}

interface RatedWine {
  id: string
  wine_name: string
  producer?: string
  vintage?: string
  wine_type: string
  tasting_order: number
  rating: number
  personal_notes?: string
  would_buy: boolean
}

interface ProfileStats {
  totalRated: number
  averageRating: number
  wouldBuyCount: number
  favoriteType: string | null
}

export default function EventProfilePage() {
  const params = useParams()
  const router = useRouter()
  const eventCode = params.eventCode as string

  const [event, setEvent] = useState<EventDetails | null>(null)
  const [ratedWines, setRatedWines] = useState<RatedWine[]>([])
  const [stats, setStats] = useState<ProfileStats>({
    totalRated: 0,
    averageRating: 0,
    wouldBuyCount: 0,
    favoriteType: null,
  })
  const [totalWines, setTotalWines] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'order' | 'rating'>('rating')

  const userId = typeof window !== 'undefined'
    ? localStorage.getItem('palate-temp-user')
    : null

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!userId) {
        router.push(`/join`)
        return
      }

      try {
        // Get event
        const { data: eventData } = await supabase
          .from('tasting_events')
          .select('id, event_code, event_name')
          .eq('event_code', eventCode.toUpperCase())
          .single()

        if (!eventData) {
          router.push(`/join`)
          return
        }

        setEvent(eventData)

        // Get all wines for this event
        const { data: winesData } = await supabase
          .from('event_wines')
          .select('id, wine_name, producer, vintage, wine_type, tasting_order')
          .eq('event_id', eventData.id)

        if (winesData) {
          setTotalWines(winesData.length)

          // Get user's ratings for this event's wines
          const wineIds = winesData.map(w => w.id)
          const { data: ratingsData } = await supabase
            .from('user_wine_ratings')
            .select('event_wine_id, rating, personal_notes, would_buy')
            .eq('user_id', userId)
            .in('event_wine_id', wineIds)

          if (ratingsData && ratingsData.length > 0) {
            // Combine wine data with ratings
            const combined = ratingsData.map(rating => {
              const wine = winesData.find(w => w.id === rating.event_wine_id)!
              return {
                ...wine,
                rating: rating.rating,
                personal_notes: rating.personal_notes,
                would_buy: rating.would_buy || false,
              }
            })

            setRatedWines(combined)

            // Calculate stats
            const totalRated = combined.length
            const averageRating = combined.reduce((sum, w) => sum + w.rating, 0) / totalRated
            const wouldBuyCount = combined.filter(w => w.would_buy).length

            // Find favorite wine type
            const typeCount: Record<string, number> = {}
            combined.forEach(w => {
              typeCount[w.wine_type] = (typeCount[w.wine_type] || 0) + w.rating
            })
            const favoriteType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null

            setStats({
              totalRated,
              averageRating: Math.round(averageRating * 10) / 10,
              wouldBuyCount,
              favoriteType,
            })
          }
        }
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [eventCode, userId, router])

  // Sort wines
  const sortedWines = [...ratedWines].sort((a, b) => {
    if (sortBy === 'rating') {
      return b.rating - a.rating
    }
    return a.tasting_order - b.tasting_order
  })

  // Get top wine
  const topWine = ratedWines.length > 0
    ? ratedWines.reduce((prev, current) => (prev.rating > current.rating ? prev : current))
    : null

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <WineLoader />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`/event/${eventCode}`)}
              className="flex items-center gap-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-body-sm">Back to wines</span>
            </button>
          </div>
          <h1 className="text-display-sm font-bold text-[var(--foreground)] mt-3">
            Your Tasting
          </h1>
          <p className="text-body-md text-[var(--foreground-secondary)]">
            {event?.event_name}
          </p>
        </div>
      </header>

      <main className="p-4 pb-8">
        {ratedWines.length === 0 ? (
          <Card variant="outlined" padding="lg" className="text-center">
            <Wine className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
            <h2 className="text-body-lg font-medium text-[var(--foreground)] mb-2">
              No ratings yet
            </h2>
            <p className="text-body-md text-[var(--foreground-secondary)] mb-4">
              Start tasting wines to see your ratings here
            </p>
            <Button onClick={() => router.push(`/event/${eventCode}`)}>
              Browse Wines
            </Button>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Card variant="default" padding="md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--wine-muted)] flex items-center justify-center">
                    <Wine className="h-5 w-5 text-[var(--wine)]" />
                  </div>
                  <div>
                    <p className="text-display-sm font-bold text-[var(--foreground)]">
                      {stats.totalRated}/{totalWines}
                    </p>
                    <p className="text-body-xs text-[var(--foreground-muted)]">Wines Rated</p>
                  </div>
                </div>
              </Card>

              <Card variant="default" padding="md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--gold-muted)] flex items-center justify-center">
                    <Star className="h-5 w-5 text-[var(--gold)]" />
                  </div>
                  <div>
                    <p className="text-display-sm font-bold text-[var(--foreground)]">
                      {stats.averageRating}
                    </p>
                    <p className="text-body-xs text-[var(--foreground-muted)]">Avg Rating</p>
                  </div>
                </div>
              </Card>

              <Card variant="default" padding="md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--gold-muted)] flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-[var(--gold)]" />
                  </div>
                  <div>
                    <p className="text-display-sm font-bold text-[var(--foreground)]">
                      {stats.wouldBuyCount}
                    </p>
                    <p className="text-body-xs text-[var(--foreground-muted)]">Would Buy</p>
                  </div>
                </div>
              </Card>

              <Card variant="default" padding="md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--wine-muted)] flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-[var(--wine)]" />
                  </div>
                  <div>
                    <p className="text-display-sm font-bold text-[var(--foreground)] capitalize">
                      {stats.favoriteType || '-'}
                    </p>
                    <p className="text-body-xs text-[var(--foreground-muted)]">Top Type</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Top Wine */}
            {topWine && (
              <Card variant="elevated" padding="md" className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-5 w-5 text-[var(--gold)]" />
                  <span className="text-body-sm font-semibold text-[var(--gold)]">
                    Your Top Pick
                  </span>
                </div>
                <Link href={`/event/${eventCode}/wine/${topWine.id}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[var(--gold-muted)] flex items-center justify-center text-2xl">
                      {getWineEmoji(topWine.wine_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-body-md font-semibold text-[var(--foreground)] truncate">
                        {topWine.wine_name}
                      </h3>
                      <p className="text-body-sm text-[var(--foreground-secondary)] truncate">
                        {[topWine.producer, topWine.vintage].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <RatingDisplay value={topWine.rating} size="md" />
                  </div>
                </Link>
              </Card>
            )}

            {/* Sort toggle */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
                Your Ratings
              </h2>
              <div className="flex gap-1 p-1 rounded-xl bg-[var(--background)]">
                <button
                  onClick={() => setSortBy('rating')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-body-sm font-medium',
                    'transition-colors duration-200',
                    sortBy === 'rating'
                      ? 'bg-[var(--wine)] text-white'
                      : 'text-[var(--foreground-secondary)]'
                  )}
                >
                  By Rating
                </button>
                <button
                  onClick={() => setSortBy('order')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-body-sm font-medium',
                    'transition-colors duration-200',
                    sortBy === 'order'
                      ? 'bg-[var(--wine)] text-white'
                      : 'text-[var(--foreground-secondary)]'
                  )}
                >
                  By Order
                </button>
              </div>
            </div>

            {/* Rated wines list */}
            <div className="space-y-3">
              {sortedWines.map((wine, index) => (
                <motion.div
                  key={wine.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link href={`/event/${eventCode}/wine/${wine.id}`}>
                    <Card variant="default" padding="md" interactive>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--background)] flex items-center justify-center text-xl">
                          {getWineEmoji(wine.wine_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-body-xs text-[var(--foreground-muted)]">
                              #{wine.tasting_order}
                            </span>
                            {wine.would_buy && (
                              <ShoppingBag className="h-3.5 w-3.5 text-[var(--gold)]" />
                            )}
                          </div>
                          <h3 className="text-body-md font-medium text-[var(--foreground)] truncate">
                            {wine.wine_name}
                          </h3>
                          {wine.personal_notes && (
                            <p className="text-body-sm text-[var(--foreground-muted)] truncate mt-1 italic">
                              "{wine.personal_notes}"
                            </p>
                          )}
                        </div>
                        <RatingDisplay value={wine.rating} size="md" />
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Continue rating prompt */}
            {stats.totalRated < totalWines && (
              <Card variant="outlined" padding="md" className="mt-6 text-center">
                <Sparkles className="h-6 w-6 text-[var(--gold)] mx-auto mb-2" />
                <p className="text-body-md text-[var(--foreground)]">
                  {totalWines - stats.totalRated} more wines to taste!
                </p>
                <Button
                  variant="secondary"
                  className="mt-3"
                  onClick={() => router.push(`/event/${eventCode}`)}
                >
                  Continue Tasting
                </Button>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
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
