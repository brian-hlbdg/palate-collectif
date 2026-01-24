'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'
import { WineLoader } from '@/components/ui'
import { 
  buildTasteProfile, 
  getRecommendations,
  type UserTasteProfile,
  type WineRecommendation 
} from '@/lib/recommendations'
import {
  Sparkles,
  Wine,
  MapPin,
  Grape,
  TrendingUp,
  Heart,
  ChevronRight,
  RefreshCw,
  Info,
  Star,
  ShoppingBag,
} from 'lucide-react'

// Country flags
const countryFlags: Record<string, string> = {
  'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸', 'United States': '🇺🇸', 'USA': '🇺🇸',
  'Germany': '🇩🇪', 'Portugal': '🇵🇹', 'Argentina': '🇦🇷', 'Chile': '🇨🇱', 'Australia': '🇦🇺',
  'New Zealand': '🇳🇿', 'South Africa': '🇿🇦', 'Austria': '🇦🇹', 'Greece': '🇬🇷',
}

// Wine type colors
const wineTypeColors: Record<string, { bg: string; text: string; emoji: string }> = {
  red: { bg: 'bg-red-100', text: 'text-red-700', emoji: '🍷' },
  white: { bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '🥂' },
  rosé: { bg: 'bg-pink-100', text: 'text-pink-700', emoji: '🌸' },
  sparkling: { bg: 'bg-amber-100', text: 'text-amber-700', emoji: '🍾' },
  dessert: { bg: 'bg-orange-100', text: 'text-orange-700', emoji: '🍯' },
  fortified: { bg: 'bg-amber-100', text: 'text-amber-800', emoji: '🥃' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', emoji: '🍊' },
}

interface WineRecommendationsProps {
  userId: string
  eventId?: string
  onWineSelect?: (wine: WineRecommendation) => void
  showProfile?: boolean
  maxRecommendations?: number
}

export function WineRecommendations({
  userId,
  eventId,
  onWineSelect,
  showProfile = true,
  maxRecommendations = 6
}: WineRecommendationsProps) {
  const [profile, setProfile] = useState<UserTasteProfile | null>(null)
  const [recommendations, setRecommendations] = useState<WineRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRecommendations()
  }, [userId, eventId])

  const loadRecommendations = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Build taste profile
      const userProfile = await buildTasteProfile(userId)
      setProfile(userProfile)

      // Get recommendations
      const recs = await getRecommendations(userId, {
        eventId,
        excludeRated: true,
        limit: maxRecommendations,
        source: eventId ? 'event' : 'all'
      })

      setRecommendations(recs)
    } catch (err) {
      console.error('Error loading recommendations:', err)
      setError('Unable to load recommendations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadRecommendations()
    setIsRefreshing(false)
  }

  const getWineTypeStyle = (type: string | null | undefined) => {
    return wineTypeColors[type?.toLowerCase() || 'red'] || wineTypeColors.red
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <WineLoader />
      </div>
    )
  }

  if (error) {
    return (
      <Card variant="outlined" padding="lg" className="text-center">
        <p className="text-body-md text-[var(--foreground-secondary)]">{error}</p>
        <Button variant="secondary" className="mt-4" onClick={loadRecommendations}>
          Try Again
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Taste Profile Summary */}
      {showProfile && profile && profile.totalRatings >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="wine" padding="lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--wine-muted)] flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-[var(--wine)]" />
              </div>
              <div>
                <h3 className="text-body-lg font-semibold text-[var(--foreground)]">
                  Your Taste Profile
                </h3>
                <p className="text-body-sm text-[var(--foreground-muted)]">
                  Based on {profile.totalRatings} wines rated
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Favorite Types */}
              {profile.preferredTypes.length > 0 && (
                <div>
                  <p className="text-body-xs text-[var(--foreground-muted)] uppercase tracking-wide mb-2">
                    Favorite Types
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.preferredTypes.slice(0, 3).map((pref, i) => {
                      const style = getWineTypeStyle(pref.type)
                      return (
                        <span
                          key={i}
                          className={cn(
                            'px-2 py-1 rounded-full text-body-xs capitalize',
                            style.bg, style.text
                          )}
                        >
                          {style.emoji} {pref.type}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Favorite Regions */}
              {profile.preferredRegions.length > 0 && (
                <div>
                  <p className="text-body-xs text-[var(--foreground-muted)] uppercase tracking-wide mb-2">
                    Favorite Regions
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.preferredRegions.slice(0, 2).map((pref, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-full text-body-xs bg-[var(--surface)] border border-[var(--border)]"
                      >
                        {pref.country && countryFlags[pref.country]} {pref.region}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Favorite Styles */}
              {profile.preferredStyles.length > 0 && (
                <div>
                  <p className="text-body-xs text-[var(--foreground-muted)] uppercase tracking-wide mb-2">
                    Style Preferences
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.preferredStyles.slice(0, 3).map((pref, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-full text-body-xs bg-[var(--surface)] text-[var(--foreground-secondary)]"
                      >
                        {pref.style}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Average Rating */}
              <div>
                <p className="text-body-xs text-[var(--foreground-muted)] uppercase tracking-wide mb-2">
                  Your Average
                </p>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-[var(--gold)] fill-[var(--gold)]" />
                  <span className="text-body-lg font-bold text-[var(--foreground)]">
                    {profile.averageRating.toFixed(1)}
                  </span>
                  <span className="text-body-xs text-[var(--foreground-muted)]">
                    / 5
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Not Enough Data */}
      {(!profile || profile.totalRatings < 3) && (
        <Card variant="outlined" padding="lg" className="text-center">
          <Info className="h-8 w-8 text-[var(--foreground-muted)] mx-auto mb-3" />
          <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-2">
            Rate More Wines
          </h3>
          <p className="text-body-md text-[var(--foreground-secondary)]">
            Rate at least 3 wines to get personalized recommendations
          </p>
          <p className="text-body-sm text-[var(--foreground-muted)] mt-2">
            {profile ? `${profile.totalRatings}/3 wines rated` : '0/3 wines rated'}
          </p>
        </Card>
      )}

      {/* Recommendations Header */}
      {recommendations.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--wine)]" />
            <h3 className="text-body-lg font-semibold text-[var(--foreground)]">
              Recommended for You
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          </Button>
        </div>
      )}

      {/* Recommendation Cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {recommendations.map((wine, index) => {
            const typeStyle = getWineTypeStyle(wine.wine_type)
            
            return (
              <motion.div
                key={wine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => onWineSelect?.(wine)}
                  className={cn(
                    'w-full text-left p-4 rounded-xl',
                    'border border-[var(--border)] bg-[var(--background)]',
                    'hover:border-[var(--wine)] hover:shadow-md',
                    'transition-all duration-200',
                    'flex items-start gap-4'
                  )}
                >
                  {/* Wine Image or Emoji */}
                  {wine.image_url ? (
                    <img
                      src={wine.image_url}
                      alt={wine.wine_name}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className={cn(
                      'w-16 h-16 rounded-lg flex items-center justify-center text-2xl flex-shrink-0',
                      typeStyle.bg
                    )}>
                      {typeStyle.emoji}
                    </div>
                  )}

                  {/* Wine Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-body-md font-semibold text-[var(--foreground)] line-clamp-1">
                          {wine.wine_name}
                        </h4>
                        {wine.producer && (
                          <p className="text-body-sm text-[var(--foreground-secondary)]">
                            {wine.producer}
                            {wine.vintage && ` · ${wine.vintage}`}
                          </p>
                        )}
                      </div>
                      
                      {/* Match Score */}
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--wine-muted)] flex-shrink-0">
                        <Heart className="h-3 w-3 text-[var(--wine)]" />
                        <span className="text-body-xs font-bold text-[var(--wine)]">
                          {wine.matchScore}%
                        </span>
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="flex items-center gap-3 mt-2 text-body-xs text-[var(--foreground-muted)]">
                      <span className={cn(
                        'px-2 py-0.5 rounded capitalize',
                        typeStyle.bg, typeStyle.text
                      )}>
                        {wine.wine_type}
                      </span>
                      {wine.region && (
                        <span className="flex items-center gap-1">
                          {wine.country && countryFlags[wine.country]}
                          {wine.region}
                        </span>
                      )}
                    </div>

                    {/* Match Reasons */}
                    {wine.matchReasons.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {wine.matchReasons.slice(0, 2).map((reason, i) => (
                          <span
                            key={i}
                            className="text-body-xs text-[var(--wine)] bg-[var(--wine-muted)] px-2 py-0.5 rounded-full"
                          >
                            ✓ {reason}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <ChevronRight className="h-5 w-5 text-[var(--foreground-muted)] flex-shrink-0 self-center" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {recommendations.length === 0 && profile && profile.totalRatings >= 3 && (
        <Card variant="outlined" padding="lg" className="text-center">
          <Wine className="h-8 w-8 text-[var(--foreground-muted)] mx-auto mb-3" />
          <p className="text-body-md text-[var(--foreground-secondary)]">
            {eventId 
              ? "You've rated all the wines at this event!" 
              : "No new recommendations right now"}
          </p>
        </Card>
      )}
    </div>
  )
}

export default WineRecommendations
