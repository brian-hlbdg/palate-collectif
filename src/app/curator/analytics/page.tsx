'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { WineLoader } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Wine,
  TrendingUp,
  Star,
  ShoppingBag,
  Users,
  Calendar,
  MapPin,
  BarChart3,
  Award,
} from 'lucide-react'

interface WineStats {
  id: string
  wine_name: string
  producer?: string
  wine_type: string
  region?: string
  country?: string
  usage_count: number
  avg_rating: number
  total_ratings: number
  would_buy_percent: number
}

interface TypeBreakdown {
  wine_type: string
  count: number
  avg_rating: number
}

interface RegionBreakdown {
  country: string
  count: number
  avg_rating: number
}

interface PlatformStats {
  totalMasterWines: number
  totalEventWines: number
  totalRatings: number
  totalEvents: number
  avgRating: number
  wouldBuyPercent: number
}

export default function CuratorAnalyticsPage() {
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)
  const [topWines, setTopWines] = useState<WineStats[]>([])
  const [mostUsedWines, setMostUsedWines] = useState<WineStats[]>([])
  const [typeBreakdown, setTypeBreakdown] = useState<TypeBreakdown[]>([])
  const [regionBreakdown, setRegionBreakdown] = useState<RegionBreakdown[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      // Get platform stats
      const { count: masterCount } = await supabase
        .from('wines_master')
        .select('*', { count: 'exact', head: true })

      const { count: eventWineCount } = await supabase
        .from('event_wines')
        .select('*', { count: 'exact', head: true })

      const { count: eventCount } = await supabase
        .from('tasting_events')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false)

      const { data: allRatings } = await supabase
        .from('user_wine_ratings')
        .select('rating, would_buy')

      const totalRatings = allRatings?.length || 0
      const avgRating = totalRatings > 0
        ? allRatings!.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0
      const wouldBuyCount = allRatings?.filter(r => r.would_buy).length || 0
      const wouldBuyPercent = totalRatings > 0 ? (wouldBuyCount / totalRatings) * 100 : 0

      setPlatformStats({
        totalMasterWines: masterCount || 0,
        totalEventWines: eventWineCount || 0,
        totalRatings,
        totalEvents: eventCount || 0,
        avgRating: Math.round(avgRating * 10) / 10,
        wouldBuyPercent: Math.round(wouldBuyPercent),
      })

      // Get most used wines from master
      const { data: usedWines } = await supabase
        .from('wines_master')
        .select('*')
        .order('usage_count', { ascending: false, nullsFirst: false })
        .limit(10)

      if (usedWines) {
        setMostUsedWines(usedWines.map(w => ({
          ...w,
          avg_rating: 0,
          total_ratings: 0,
          would_buy_percent: 0,
        })))
      }

      // Get top rated wines (aggregate from event_wines + ratings)
      const { data: eventWines } = await supabase
        .from('event_wines')
        .select('id, wine_name, producer, wine_type, region, country, wine_master_id')

      if (eventWines && allRatings) {
        // Get ratings per event_wine
        const { data: ratingsByWine } = await supabase
          .from('user_wine_ratings')
          .select('event_wine_id, rating, would_buy')

        if (ratingsByWine) {
          // Aggregate by wine_master_id or wine_name
          const wineStatsMap = new Map<string, {
            wine: typeof eventWines[0]
            ratings: number[]
            wouldBuy: number
          }>()

          for (const ew of eventWines) {
            const key = ew.wine_master_id || ew.wine_name
            const wineRatings = ratingsByWine.filter(r => r.event_wine_id === ew.id)

            if (wineStatsMap.has(key)) {
              const existing = wineStatsMap.get(key)!
              existing.ratings.push(...wineRatings.map(r => r.rating))
              existing.wouldBuy += wineRatings.filter(r => r.would_buy).length
            } else {
              wineStatsMap.set(key, {
                wine: ew,
                ratings: wineRatings.map(r => r.rating),
                wouldBuy: wineRatings.filter(r => r.would_buy).length,
              })
            }
          }

          // Convert to array and sort by avg rating
          const topRated = Array.from(wineStatsMap.values())
            .filter(ws => ws.ratings.length >= 2) // Minimum 2 ratings
            .map(ws => ({
              id: ws.wine.id,
              wine_name: ws.wine.wine_name,
              producer: ws.wine.producer,
              wine_type: ws.wine.wine_type,
              region: ws.wine.region,
              country: ws.wine.country,
              usage_count: 0,
              avg_rating: ws.ratings.reduce((a, b) => a + b, 0) / ws.ratings.length,
              total_ratings: ws.ratings.length,
              would_buy_percent: ws.ratings.length > 0 
                ? (ws.wouldBuy / ws.ratings.length) * 100 
                : 0,
            }))
            .sort((a, b) => b.avg_rating - a.avg_rating)
            .slice(0, 10)

          setTopWines(topRated)
        }
      }

      // Get type breakdown from master
      const { data: masterWines } = await supabase
        .from('wines_master')
        .select('wine_type')

      if (masterWines) {
        const typeMap = new Map<string, number>()
        for (const w of masterWines) {
          const type = w.wine_type || 'unknown'
          typeMap.set(type, (typeMap.get(type) || 0) + 1)
        }
        setTypeBreakdown(
          Array.from(typeMap.entries())
            .map(([wine_type, count]) => ({ wine_type, count, avg_rating: 0 }))
            .sort((a, b) => b.count - a.count)
        )
      }

      // Get region breakdown from master
      const { data: masterByCountry } = await supabase
        .from('wines_master')
        .select('country')

      if (masterByCountry) {
        const countryMap = new Map<string, number>()
        for (const w of masterByCountry) {
          const country = w.country || 'Unknown'
          countryMap.set(country, (countryMap.get(country) || 0) + 1)
        }
        setRegionBreakdown(
          Array.from(countryMap.entries())
            .map(([country, count]) => ({ country, count, avg_rating: 0 }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
        )
      }

    } catch (err) {
      console.error('Error loading analytics:', err)
    } finally {
      setIsLoading(false)
    }
  }

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
          Platform Analytics
        </h1>
        <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
          Aggregate wine data across all events
        </p>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          icon={Wine}
          label="Master Wines"
          value={platformStats?.totalMasterWines || 0}
        />
        <StatCard
          icon={Calendar}
          label="Event Wines"
          value={platformStats?.totalEventWines || 0}
        />
        <StatCard
          icon={Users}
          label="Total Events"
          value={platformStats?.totalEvents || 0}
        />
        <StatCard
          icon={Star}
          label="Total Ratings"
          value={platformStats?.totalRatings || 0}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Rating"
          value={platformStats?.avgRating || 0}
          suffix="/ 5"
        />
        <StatCard
          icon={ShoppingBag}
          label="Would Buy"
          value={platformStats?.wouldBuyPercent || 0}
          suffix="%"
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Rated Wines */}
        <div className="border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-[var(--wine)]" />
            <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
              Top Rated Wines
            </h2>
          </div>
          {topWines.length > 0 ? (
            <div className="space-y-3">
              {topWines.map((wine, index) => (
                <div
                  key={wine.id}
                  className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-b-0"
                >
                  <span className={cn(
                    'w-6 h-6 rounded-full border flex items-center justify-center text-body-xs font-bold',
                    index === 0 ? 'border-[var(--gold)] text-[var(--gold)]' :
                    index === 1 ? 'border-gray-400 text-gray-400' :
                    index === 2 ? 'border-amber-600 text-amber-600' :
                    'border-[var(--border)] text-[var(--foreground-muted)]'
                  )}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-[var(--foreground)] truncate">
                      {wine.wine_name}
                    </p>
                    <p className="text-body-xs text-[var(--foreground-muted)]">
                      {wine.producer} · {wine.total_ratings} ratings
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-body-sm font-semibold text-[var(--foreground)]">
                      {wine.avg_rating.toFixed(1)}
                    </p>
                    <p className="text-body-xs text-[var(--foreground-muted)]">
                      {Math.round(wine.would_buy_percent)}% buy
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-body-sm text-[var(--foreground-muted)] text-center py-8">
              Not enough ratings yet
            </p>
          )}
        </div>

        {/* Most Used Wines */}
        <div className="border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-[var(--wine)]" />
            <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
              Most Used Wines
            </h2>
          </div>
          {mostUsedWines.length > 0 ? (
            <div className="space-y-3">
              {mostUsedWines.map((wine, index) => (
                <div
                  key={wine.id}
                  className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-b-0"
                >
                  <span className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-lg">
                    {getWineEmoji(wine.wine_type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-[var(--foreground)] truncate">
                      {wine.wine_name}
                    </p>
                    <p className="text-body-xs text-[var(--foreground-muted)]">
                      {wine.producer}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-body-sm font-semibold text-[var(--foreground)]">
                      {wine.usage_count}
                    </p>
                    <p className="text-body-xs text-[var(--foreground-muted)]">uses</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-body-sm text-[var(--foreground-muted)] text-center py-8">
              No wine usage data yet
            </p>
          )}
        </div>
      </div>

      {/* Type and Region breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wine Types */}
        <div className="border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-[var(--wine)]" />
            <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
              Wine Types
            </h2>
          </div>
          {typeBreakdown.length > 0 ? (
            <div className="space-y-3">
              {typeBreakdown.map((type) => {
                const maxCount = Math.max(...typeBreakdown.map(t => t.count))
                const percentage = (type.count / maxCount) * 100

                return (
                  <div key={type.wine_type} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getWineEmoji(type.wine_type)}</span>
                        <span className="text-body-sm text-[var(--foreground)] capitalize">
                          {type.wine_type}
                        </span>
                      </div>
                      <span className="text-body-sm font-medium text-[var(--foreground)]">
                        {type.count}
                      </span>
                    </div>
                    <div className="h-2 rounded-full border border-[var(--border)] overflow-hidden">
                      <div
                        className="h-full border-r border-[var(--wine)] bg-transparent"
                        style={{ width: `${percentage}%`, borderRightWidth: '4px' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-body-sm text-[var(--foreground-muted)] text-center py-8">
              No wine type data yet
            </p>
          )}
        </div>

        {/* Countries */}
        <div className="border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-[var(--wine)]" />
            <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
              Top Countries
            </h2>
          </div>
          {regionBreakdown.length > 0 ? (
            <div className="space-y-3">
              {regionBreakdown.map((region, index) => (
                <div
                  key={region.country}
                  className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-body-sm text-[var(--foreground-muted)]">
                      {index + 1}.
                    </span>
                    <span className="text-body-sm text-[var(--foreground)]">
                      {region.country}
                    </span>
                  </div>
                  <span className="text-body-sm font-medium text-[var(--foreground)]">
                    {region.count} wines
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-body-sm text-[var(--foreground-muted)] text-center py-8">
              No country data yet
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Stat card component - outlined style
function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
}: {
  icon: typeof Wine
  label: string
  value: number
  suffix?: string
}) {
  return (
    <div className="border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl border border-[var(--border)] flex items-center justify-center">
          <Icon className="h-5 w-5 text-[var(--foreground-muted)]" />
        </div>
        <div>
          <p className="text-display-sm font-bold text-[var(--foreground)]">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && (
              <span className="text-body-sm font-normal text-[var(--foreground-muted)]">
                {' '}{suffix}
              </span>
            )}
          </p>
          <p className="text-body-xs text-[var(--foreground-muted)]">{label}</p>
        </div>
      </div>
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
