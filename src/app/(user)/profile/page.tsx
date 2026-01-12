'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui'
import { WineLoader } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Wine,
  Star,
  MapPin,
  TrendingUp,
  ShoppingBag,
  Heart,
  Sparkles,
  Trophy,
  Calendar,
  Target,
} from 'lucide-react'

interface TasteProfile {
  totalRatings: number
  totalEvents: number
  averageRating: number
  wouldBuyCount: number
  wouldBuyPercent: number
  
  // Type preferences
  typeBreakdown: { type: string; count: number; avgRating: number }[]
  favoriteType: string
  
  // Regional preferences
  regionBreakdown: { region: string; count: number; avgRating: number }[]
  favoriteRegion: string
  
  // Country preferences
  countryBreakdown: { country: string; count: number; avgRating: number }[]
  favoriteCountry: string
  
  // Rating patterns
  ratingDistribution: { rating: number; count: number }[]
  
  // Top wines
  topRatedWines: {
    wine_name: string
    producer?: string
    wine_type: string
    rating: number
  }[]
  
  // Journey
  firstTasting: string | null
  monthlyActivity: { month: string; count: number }[]
}

export default function TasteProfilePage() {
  const [profile, setProfile] = useState<TasteProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Get user ID
  const getUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) return session.user.id
    return localStorage.getItem('palate-temp-user')
  }

  // Load taste profile
  useEffect(() => {
    const loadProfile = async () => {
      const userId = await getUserId()
      if (!userId) return

      try {
        // Get all ratings with wine info
        const { data: ratings } = await supabase
          .from('user_wine_ratings')
          .select(`
            id,
            rating,
            would_buy,
            created_at,
            event_wines (
              wine_name,
              producer,
              wine_type,
              region,
              country
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: true })

        if (!ratings || ratings.length === 0) {
          setProfile({
            totalRatings: 0,
            totalEvents: 0,
            averageRating: 0,
            wouldBuyCount: 0,
            wouldBuyPercent: 0,
            typeBreakdown: [],
            favoriteType: '',
            regionBreakdown: [],
            favoriteRegion: '',
            countryBreakdown: [],
            favoriteCountry: '',
            ratingDistribution: [],
            topRatedWines: [],
            firstTasting: null,
            monthlyActivity: [],
          })
          setIsLoading(false)
          return
        }

        // Get unique events
        const { data: eventData } = await supabase
          .from('user_wine_ratings')
          .select('event_wines!inner(event_id)')
          .eq('user_id', userId)

        const uniqueEvents = new Set(
          eventData?.map((r: any) => r.event_wines?.event_id).filter(Boolean) || []
        )

        // Calculate stats
        const totalRatings = ratings.length
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        const wouldBuyCount = ratings.filter(r => r.would_buy).length

        // Type breakdown
        const typeMap = new Map<string, { count: number; totalRating: number }>()
        ratings.forEach((r: any) => {
          const type = r.event_wines?.wine_type || 'unknown'
          const current = typeMap.get(type) || { count: 0, totalRating: 0 }
          typeMap.set(type, {
            count: current.count + 1,
            totalRating: current.totalRating + r.rating,
          })
        })

        const typeBreakdown = Array.from(typeMap.entries())
          .map(([type, data]) => ({
            type,
            count: data.count,
            avgRating: data.totalRating / data.count,
          }))
          .sort((a, b) => b.count - a.count)

        // Region breakdown
        const regionMap = new Map<string, { count: number; totalRating: number }>()
        ratings.forEach((r: any) => {
          const region = r.event_wines?.region
          if (region) {
            const current = regionMap.get(region) || { count: 0, totalRating: 0 }
            regionMap.set(region, {
              count: current.count + 1,
              totalRating: current.totalRating + r.rating,
            })
          }
        })

        const regionBreakdown = Array.from(regionMap.entries())
          .map(([region, data]) => ({
            region,
            count: data.count,
            avgRating: data.totalRating / data.count,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        // Country breakdown
        const countryMap = new Map<string, { count: number; totalRating: number }>()
        ratings.forEach((r: any) => {
          const country = r.event_wines?.country
          if (country) {
            const current = countryMap.get(country) || { count: 0, totalRating: 0 }
            countryMap.set(country, {
              count: current.count + 1,
              totalRating: current.totalRating + r.rating,
            })
          }
        })

        const countryBreakdown = Array.from(countryMap.entries())
          .map(([country, data]) => ({
            country,
            count: data.count,
            avgRating: data.totalRating / data.count,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        // Rating distribution
        const ratingDist = new Map<number, number>()
        for (let i = 1; i <= 5; i++) ratingDist.set(i, 0)
        ratings.forEach(r => {
          ratingDist.set(r.rating, (ratingDist.get(r.rating) || 0) + 1)
        })

        const ratingDistribution = Array.from(ratingDist.entries())
          .map(([rating, count]) => ({ rating, count }))
          .sort((a, b) => a.rating - b.rating)

        // Top rated wines
        const topRatedWines = ratings
          .filter(r => r.rating >= 4)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 5)
          .map((r: any) => ({
            wine_name: r.event_wines?.wine_name || 'Unknown',
            producer: r.event_wines?.producer,
            wine_type: r.event_wines?.wine_type || 'red',
            rating: r.rating,
          }))

        // Monthly activity
        const monthMap = new Map<string, number>()
        ratings.forEach(r => {
          const month = new Date(r.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            year: '2-digit' 
          })
          monthMap.set(month, (monthMap.get(month) || 0) + 1)
        })

        const monthlyActivity = Array.from(monthMap.entries())
          .map(([month, count]) => ({ month, count }))
          .slice(-6)

        // Find favorite (highest average rating with minimum 2 ratings)
        const findFavorite = (breakdown: any[], key: string) => {
          const qualified = breakdown.filter(b => b.count >= 2)
          if (qualified.length === 0) return breakdown[0]?.[key] || ''
          return qualified.sort((a, b) => b.avgRating - a.avgRating)[0]?.[key] || ''
        }

        setProfile({
          totalRatings,
          totalEvents: uniqueEvents.size,
          averageRating: Math.round(avgRating * 10) / 10,
          wouldBuyCount,
          wouldBuyPercent: Math.round((wouldBuyCount / totalRatings) * 100),
          typeBreakdown,
          favoriteType: findFavorite(typeBreakdown, 'type'),
          regionBreakdown,
          favoriteRegion: findFavorite(regionBreakdown, 'region'),
          countryBreakdown,
          favoriteCountry: findFavorite(countryBreakdown, 'country'),
          ratingDistribution,
          topRatedWines,
          firstTasting: ratings[0]?.created_at || null,
          monthlyActivity,
        })
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <WineLoader />
      </div>
    )
  }

  if (!profile || profile.totalRatings === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-display-md font-bold text-[var(--foreground)]">
            Taste Profile
          </h1>
          <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
            Discover your wine preferences
          </p>
        </div>

        <Card variant="default" className="text-center py-12">
          <Sparkles className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
          <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-2">
            Start Your Journey
          </h3>
          <p className="text-body-md text-[var(--foreground-secondary)] max-w-md mx-auto">
            Rate wines at events to build your taste profile. We'll analyze your preferences 
            and help you discover wines you'll love.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-display-md font-bold text-[var(--foreground)]">
          Taste Profile
        </h1>
        <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
          Based on {profile.totalRatings} wine{profile.totalRatings !== 1 ? 's' : ''} across {profile.totalEvents} event{profile.totalEvents !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Star}
          label="Avg. Rating"
          value={profile.averageRating.toString()}
          suffix="/ 5"
        />
        <StatCard
          icon={Wine}
          label="Wines Rated"
          value={profile.totalRatings.toString()}
        />
        <StatCard
          icon={ShoppingBag}
          label="Would Buy"
          value={`${profile.wouldBuyPercent}%`}
        />
        <StatCard
          icon={Calendar}
          label="Events"
          value={profile.totalEvents.toString()}
        />
      </div>

      {/* Your Style */}
      <Card variant="wine" className="overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-[var(--wine)]" />
            <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
              Your Wine Style
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Favorite Type */}
            {profile.favoriteType && (
              <div className="text-center p-4 rounded-xl bg-[var(--surface)]">
                <div className="text-4xl mb-2">
                  {getWineEmoji(profile.favoriteType)}
                </div>
                <p className="text-body-sm text-[var(--foreground-muted)]">Favorite Type</p>
                <p className="text-body-lg font-semibold text-[var(--foreground)] capitalize">
                  {profile.favoriteType}
                </p>
              </div>
            )}

            {/* Favorite Region */}
            {profile.favoriteRegion && (
              <div className="text-center p-4 rounded-xl bg-[var(--surface)]">
                <div className="text-4xl mb-2">📍</div>
                <p className="text-body-sm text-[var(--foreground-muted)]">Favorite Region</p>
                <p className="text-body-lg font-semibold text-[var(--foreground)]">
                  {profile.favoriteRegion}
                </p>
              </div>
            )}

            {/* Favorite Country */}
            {profile.favoriteCountry && (
              <div className="text-center p-4 rounded-xl bg-[var(--surface)]">
                <div className="text-4xl mb-2">🌍</div>
                <p className="text-body-sm text-[var(--foreground-muted)]">Favorite Country</p>
                <p className="text-body-lg font-semibold text-[var(--foreground)]">
                  {profile.favoriteCountry}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type Breakdown */}
        <Card variant="default">
          <div className="flex items-center gap-2 mb-4">
            <Wine className="h-5 w-5 text-[var(--wine)]" />
            <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
              Wine Types
            </h2>
          </div>
          
          <div className="space-y-3">
            {profile.typeBreakdown.map((item) => {
              const maxCount = Math.max(...profile.typeBreakdown.map(t => t.count))
              const percentage = (item.count / maxCount) * 100

              return (
                <div key={item.type} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getWineEmoji(item.type)}</span>
                      <span className="text-body-sm text-[var(--foreground)] capitalize">
                        {item.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-body-xs text-[var(--foreground-muted)]">
                        {item.count} rated
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-[var(--wine)] text-[var(--wine)]" />
                        <span className="text-body-sm font-medium text-[var(--foreground)]">
                          {item.avgRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="h-full bg-[var(--wine)] rounded-full"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Rating Distribution */}
        <Card variant="default">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-[var(--wine)]" />
            <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
              Rating Pattern
            </h2>
          </div>
          
          <div className="flex items-end justify-between h-32 gap-2">
            {profile.ratingDistribution.map((item) => {
              const maxCount = Math.max(...profile.ratingDistribution.map(r => r.count))
              const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0

              return (
                <div key={item.rating} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: item.rating * 0.1 }}
                    className="w-full bg-[var(--wine)] rounded-t-lg min-h-[4px]"
                    style={{ maxHeight: '100px' }}
                  />
                  <div className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-[var(--wine)] text-[var(--wine)]" />
                    <span className="text-body-xs text-[var(--foreground)]">
                      {item.rating}
                    </span>
                  </div>
                  <span className="text-body-xs text-[var(--foreground-muted)]">
                    {item.count}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Top Wines */}
      {profile.topRatedWines.length > 0 && (
        <Card variant="default">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-[var(--wine)]" />
            <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
              Your Top Rated Wines
            </h2>
          </div>
          
          <div className="space-y-3">
            {profile.topRatedWines.map((wine, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 rounded-xl bg-[var(--surface)]"
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  index === 0 ? 'bg-[var(--gold)]/20 text-[var(--gold)]' :
                  index === 1 ? 'bg-gray-400/20 text-gray-500' :
                  index === 2 ? 'bg-amber-600/20 text-amber-600' :
                  'bg-[var(--border)] text-[var(--foreground-muted)]'
                )}>
                  <span className="text-body-sm font-bold">{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-medium text-[var(--foreground)] truncate">
                    {wine.wine_name}
                  </p>
                  <p className="text-body-sm text-[var(--foreground-muted)]">
                    {wine.producer}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-[var(--wine)] text-[var(--wine)]" />
                  <span className="text-body-md font-semibold text-[var(--foreground)]">
                    {wine.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Regional Preferences */}
      {profile.countryBreakdown.length > 0 && (
        <Card variant="default">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-[var(--wine)]" />
            <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
              Countries Explored
            </h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {profile.countryBreakdown.map((item) => (
              <div
                key={item.country}
                className={cn(
                  'px-4 py-2 rounded-xl border',
                  'flex items-center gap-2',
                  item.country === profile.favoriteCountry
                    ? 'border-[var(--wine)] bg-[var(--wine-muted)]'
                    : 'border-[var(--border)]'
                )}
              >
                <span className="text-body-sm text-[var(--foreground)]">
                  {item.country}
                </span>
                <span className="text-body-xs text-[var(--foreground-muted)]">
                  ({item.count})
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Journey */}
      {profile.firstTasting && (
        <Card variant="default" className="text-center py-6">
          <p className="text-body-sm text-[var(--foreground-muted)]">
            Your wine journey started
          </p>
          <p className="text-body-lg font-semibold text-[var(--foreground)]">
            {new Date(profile.firstTasting).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </Card>
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
}: {
  icon: typeof Star
  label: string
  value: string
  suffix?: string
}) {
  return (
    <Card variant="default" className="text-center">
      <Icon className="h-6 w-6 text-[var(--wine)] mx-auto mb-2" />
      <p className="text-display-sm font-bold text-[var(--foreground)]">
        {value}
        {suffix && (
          <span className="text-body-md font-normal text-[var(--foreground-muted)]">
            {' '}{suffix}
          </span>
        )}
      </p>
      <p className="text-body-sm text-[var(--foreground-muted)]">{label}</p>
    </Card>
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
