'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'
import { WineLoader } from '@/components/ui'
import {
  Trophy,
  Users,
  Star,
  TrendingUp,
  Zap,
  Heart,
  Wine,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react'
import {
  getEventStats,
  getEventBuddies,
  getBuddyComparison,
  type EventStats,
  type EventBuddy,
  type BuddyComparison,
} from '@/lib/buddies'

interface EventResultsProps {
  eventId: string
  eventName: string
  userId: string
}

export function EventResults({ eventId, eventName, userId }: EventResultsProps) {
  const [stats, setStats] = useState<EventStats | null>(null)
  const [buddies, setBuddies] = useState<EventBuddy[]>([])
  const [buddyComparisons, setBuddyComparisons] = useState<BuddyComparison[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedBuddy, setExpandedBuddy] = useState<string | null>(null)

  useEffect(() => {
    loadResults()
  }, [eventId, userId])

  const loadResults = async () => {
    setIsLoading(true)
    
    // Load event stats (for everyone)
    const eventStats = await getEventStats(eventId)
    setStats(eventStats)

    // Load buddies
    const eventBuddies = await getEventBuddies(userId, eventId)
    setBuddies(eventBuddies)

    // Load comparison for each buddy
    if (eventBuddies.length > 0) {
      const comparisons = await Promise.all(
        eventBuddies.map(buddy => 
          getBuddyComparison(userId, buddy.buddy_id, eventId)
        )
      )
      setBuddyComparisons(comparisons.filter(Boolean) as BuddyComparison[])
    }

    setIsLoading(false)
  }

  const getTasteMatchEmoji = (percent: number) => {
    if (percent >= 80) return '🎯'
    if (percent >= 60) return '😊'
    if (percent >= 40) return '🤔'
    return '😅'
  }

  const getTasteMatchLabel = (percent: number) => {
    if (percent >= 80) return 'Wine Twins!'
    if (percent >= 60) return 'Similar Tastes'
    if (percent >= 40) return 'Some Overlap'
    return 'Opposites Attract'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <WineLoader />
      </div>
    )
  }

  if (!stats) {
    return (
      <Card variant="outlined" padding="lg" className="text-center">
        <Wine className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
        <p className="text-body-md text-[var(--foreground-secondary)]">
          No results available yet
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-display-sm font-bold text-[var(--foreground)]">
          🎉 Event Results
        </h2>
        <p className="text-body-md text-[var(--foreground-secondary)]">
          {eventName}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card variant="outlined" padding="md" className="text-center">
          <Users className="h-5 w-5 text-[var(--wine)] mx-auto mb-1" />
          <p className="text-display-sm font-bold text-[var(--foreground)]">
            {stats.total_tasters}
          </p>
          <p className="text-body-xs text-[var(--foreground-muted)]">Tasters</p>
        </Card>
        <Card variant="outlined" padding="md" className="text-center">
          <Wine className="h-5 w-5 text-[var(--wine)] mx-auto mb-1" />
          <p className="text-display-sm font-bold text-[var(--foreground)]">
            {stats.total_ratings}
          </p>
          <p className="text-body-xs text-[var(--foreground-muted)]">Ratings</p>
        </Card>
        <Card variant="outlined" padding="md" className="text-center">
          <Star className="h-5 w-5 text-[var(--gold)] mx-auto mb-1" />
          <p className="text-display-sm font-bold text-[var(--foreground)]">
            {stats.average_rating}★
          </p>
          <p className="text-body-xs text-[var(--foreground-muted)]">Average</p>
        </Card>
      </div>

      {/* Top Rated Wines */}
      <Card variant="outlined" padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-[var(--gold)]" />
          <h3 className="text-body-lg font-semibold text-[var(--foreground)]">
            Top Rated Wines
          </h3>
        </div>
        <div className="space-y-3">
          {stats.top_wines.map((wine, index) => (
            <div
              key={wine.wine_id}
              className="flex items-center gap-3"
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-body-sm',
                index === 0 ? 'bg-yellow-500' :
                index === 1 ? 'bg-gray-400' :
                index === 2 ? 'bg-amber-600' :
                'bg-[var(--foreground-muted)]'
              )}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-medium text-[var(--foreground)] truncate">
                  {wine.wine_name}
                </p>
                {wine.producer && (
                  <p className="text-body-xs text-[var(--foreground-muted)] truncate">
                    {wine.producer}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 text-[var(--foreground)]">
                <Star className="h-4 w-4 text-[var(--gold)] fill-[var(--gold)]" />
                <span className="font-semibold">
                  {wine.average_rating.toFixed(1)}
                </span>
                <span className="text-body-xs text-[var(--foreground-muted)]">
                  ({wine.rating_count})
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Most Divisive */}
      {stats.most_divisive && stats.most_divisive.rating_spread >= 2 && (
        <Card variant="outlined" padding="lg">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-orange-500" />
            <h3 className="text-body-lg font-semibold text-[var(--foreground)]">
              Most Divisive Wine
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-md font-medium text-[var(--foreground)]">
                {stats.most_divisive.wine_name}
              </p>
              {stats.most_divisive.producer && (
                <p className="text-body-xs text-[var(--foreground-muted)]">
                  {stats.most_divisive.producer}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-body-sm text-[var(--foreground-secondary)]">
                Ratings ranged from
              </p>
              <p className="font-semibold">
                <span className="text-red-500">{stats.most_divisive.min_rating}★</span>
                {' → '}
                <span className="text-green-500">{stats.most_divisive.max_rating}★</span>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Rating Distribution */}
      <Card variant="outlined" padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-[var(--wine)]" />
          <h3 className="text-body-lg font-semibold text-[var(--foreground)]">
            Rating Distribution
          </h3>
        </div>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const dist = stats.rating_distribution.find(d => d.rating === rating)
            const percent = dist?.percent || 0
            return (
              <div key={rating} className="flex items-center gap-3">
                <span className="w-6 text-body-sm text-[var(--foreground-secondary)]">
                  {rating}★
                </span>
                <div className="flex-1 h-4 bg-[var(--surface)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.5, delay: (5 - rating) * 0.1 }}
                    className={cn(
                      'h-full rounded-full',
                      rating >= 4 ? 'bg-green-500' :
                      rating === 3 ? 'bg-yellow-500' :
                      'bg-red-400'
                    )}
                  />
                </div>
                <span className="w-10 text-body-xs text-[var(--foreground-muted)] text-right">
                  {percent}%
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Buddy Comparisons */}
      {buddyComparisons.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-[var(--wine)]" />
            <h3 className="text-body-lg font-semibold text-[var(--foreground)]">
              Your Buddy Comparisons
            </h3>
          </div>

          {buddyComparisons.map((comparison) => (
            <Card key={comparison.buddy_id} variant="wine" padding="lg">
              {/* Buddy Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--wine)] text-white flex items-center justify-center font-bold">
                    {comparison.buddy_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-body-md font-semibold text-[var(--foreground)]">
                      You & {comparison.buddy_name}
                    </p>
                    <p className="text-body-xs text-[var(--foreground-muted)]">
                      {comparison.common_wines} wines in common
                    </p>
                  </div>
                </div>
                
                {/* Taste Match */}
                <div className="text-center">
                  <div className="text-2xl mb-1">
                    {getTasteMatchEmoji(comparison.taste_match_percent)}
                  </div>
                  <p className="text-display-sm font-bold text-[var(--wine)]">
                    {comparison.taste_match_percent}%
                  </p>
                  <p className="text-body-xs text-[var(--foreground-muted)]">
                    {getTasteMatchLabel(comparison.taste_match_percent)}
                  </p>
                </div>
              </div>

              {/* Wines Agreed */}
              {comparison.wines_agreed.length > 0 && (
                <div className="mb-4">
                  <p className="text-body-xs text-[var(--foreground-muted)] uppercase tracking-wide mb-2">
                    🤝 You both agreed on
                  </p>
                  <div className="space-y-2">
                    {comparison.wines_agreed.slice(0, 2).map((wine) => (
                      <div key={wine.wine_id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface)]">
                        <span className="text-body-sm text-[var(--foreground)]">
                          {wine.wine_name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-body-xs">You: {wine.user_rating}★</span>
                          <span className="text-body-xs">{comparison.buddy_name}: {wine.buddy_rating}★</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wines Disagreed */}
              {comparison.wines_disagreed.length > 0 && (
                <div className="mb-4">
                  <p className="text-body-xs text-[var(--foreground-muted)] uppercase tracking-wide mb-2">
                    🔥 Your hot takes
                  </p>
                  <div className="space-y-2">
                    {comparison.wines_disagreed.slice(0, 2).map((wine) => (
                      <div key={wine.wine_id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface)]">
                        <span className="text-body-sm text-[var(--foreground)]">
                          {wine.wine_name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-body-xs text-green-600">You: {wine.user_rating}★</span>
                          <span className="text-body-xs text-orange-500">{comparison.buddy_name}: {wine.buddy_rating}★</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expand/Collapse */}
              <button
                onClick={() => setExpandedBuddy(
                  expandedBuddy === comparison.buddy_id ? null : comparison.buddy_id
                )}
                className="flex items-center gap-1 text-body-sm text-[var(--wine)] hover:underline"
              >
                {expandedBuddy === comparison.buddy_id ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    See all {comparison.common_wines} wines
                  </>
                )}
              </button>

              {/* Expanded Wine List */}
              {expandedBuddy === comparison.buddy_id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-[var(--border)] space-y-3"
                >
                  {[...comparison.wines_agreed, ...comparison.wines_disagreed].map((wine) => (
                    <div key={wine.wine_id} className="p-3 rounded-xl bg-[var(--surface)]">
                      <p className="text-body-md font-medium text-[var(--foreground)] mb-2">
                        {wine.wine_name}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-body-xs text-[var(--foreground-muted)] mb-1">You</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'h-4 w-4',
                                  i < wine.user_rating
                                    ? 'text-[var(--gold)] fill-[var(--gold)]'
                                    : 'text-[var(--border)]'
                                )}
                              />
                            ))}
                          </div>
                          {wine.user_notes && (
                            <p className="text-body-xs text-[var(--foreground-secondary)] mt-1 italic flex items-start gap-1">
                              <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              {wine.user_notes}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-body-xs text-[var(--foreground-muted)] mb-1">
                            {comparison.buddy_name}
                          </p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'h-4 w-4',
                                  i < wine.buddy_rating
                                    ? 'text-[var(--gold)] fill-[var(--gold)]'
                                    : 'text-[var(--border)]'
                                )}
                              />
                            ))}
                          </div>
                          {wine.buddy_notes && (
                            <p className="text-body-xs text-[var(--foreground-secondary)] mt-1 italic flex items-start gap-1">
                              <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              {wine.buddy_notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* No Buddies Message */}
      {buddies.length === 0 && (
        <Card variant="outlined" padding="lg" className="text-center">
          <Users className="h-8 w-8 text-[var(--foreground-muted)] mx-auto mb-3" />
          <p className="text-body-md text-[var(--foreground-secondary)]">
            You didn't connect with any tasting buddies at this event.
          </p>
          <p className="text-body-sm text-[var(--foreground-muted)] mt-1">
            Next time, share your code to compare results!
          </p>
        </Card>
      )}
    </div>
  )
}

export default EventResults
