'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'
import { WineLoader } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import ExportReports from '@/components/ExportReports'
import {
  ArrowLeft,
  BarChart3,
  Users,
  Wine,
  Star,
  TrendingUp,
  Download,
  ShoppingBag,
  SkipForward,
} from 'lucide-react'

interface EventData {
  id: string
  event_code: string
  event_name: string
  event_date: string
  location?: string
}

interface WineRating {
  id: string
  wine_name: string
  producer?: string
  wine_type: string
  avg_rating: number
  rating_count: number
  would_buy_count: number
  would_buy_percent: number
}

interface SkippedWine {
  id: string
  wine_name: string
  producer?: string
  skip_count: number
  skip_percent: number
  top_reason: string
}

interface Analytics {
  totalRatings: number
  totalSkips: number
  averageRating: number
  totalParticipants: number
  totalWines: number
  wouldBuyPercent: number
  wineRankings: WineRating[]
  skippedWines: SkippedWine[]
  ratingDistribution: number[]
  topDescriptors: { name: string; count: number }[]
}

export default function AdminAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  // Admin routes use UUID (eventId), not event code
  const eventId = params.eventId as string

  const [event, setEvent] = useState<EventData | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showExport, setShowExport] = useState(false)

  useEffect(() => {
    if (eventId) {
      loadData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const loadData = async () => {
    try {
      // Load event by ID (UUID)
      const { data: eventData, error: eventError } = await supabase
        .from('tasting_events')
        .select('id, event_code, event_name, event_date, location')
        .eq('id', eventId)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)

      // Load wines
      const { data: wines } = await supabase
        .from('event_wines')
        .select('id, wine_name, producer, wine_type')
        .eq('event_id', eventId)

      if (!wines || wines.length === 0) {
        setAnalytics({
          totalRatings: 0,
          totalSkips: 0,
          averageRating: 0,
          totalParticipants: 0,
          totalWines: 0,
          wouldBuyPercent: 0,
          wineRankings: [],
          skippedWines: [],
          ratingDistribution: [0, 0, 0, 0, 0],
          topDescriptors: [],
        })
        setIsLoading(false)
        return
      }

      const wineIds = wines.map(w => w.id)

      // Load ratings
      const { data: ratings } = await supabase
        .from('user_wine_ratings')
        .select('*')
        .in('event_wine_id', wineIds)

      if (!ratings || ratings.length === 0) {
        setAnalytics({
          totalRatings: 0,
          totalSkips: 0,
          averageRating: 0,
          totalParticipants: 0,
          totalWines: wines.length,
          wouldBuyPercent: 0,
          wineRankings: wines.map(w => ({
            id: w.id,
            wine_name: w.wine_name,
            producer: w.producer,
            wine_type: w.wine_type,
            avg_rating: 0,
            rating_count: 0,
            would_buy_count: 0,
            would_buy_percent: 0,
          })),
          skippedWines: [],
          ratingDistribution: [0, 0, 0, 0, 0],
          topDescriptors: [],
        })
        setIsLoading(false)
        return
      }

      // Separate real ratings from skips
      const activeRatings = ratings.filter((r: any) => !r.is_skipped)
      const skippedRatings = ratings.filter((r: any) => r.is_skipped)

      // Calculate analytics (using only active ratings)
      const totalRatings = activeRatings.length
      const totalSkips = skippedRatings.length
      const avgRating = totalRatings > 0 ? activeRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / totalRatings : 0
      const uniqueUsers = new Set(ratings.map((r: any) => r.user_id))
      const wouldBuyCount = activeRatings.filter((r: any) => r.would_buy).length

      // Wine rankings (active only)
      const wineRankings: WineRating[] = wines.map(wine => {
        const wineRatings = activeRatings.filter((r: any) => r.event_wine_id === wine.id)
        const count = wineRatings.length
        const avg = count > 0 ? wineRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / count : 0
        const wouldBuy = wineRatings.filter((r: any) => r.would_buy).length

        return {
          id: wine.id,
          wine_name: wine.wine_name,
          producer: wine.producer,
          wine_type: wine.wine_type,
          avg_rating: Math.round(avg * 10) / 10,
          rating_count: count,
          would_buy_count: wouldBuy,
          would_buy_percent: count > 0 ? Math.round((wouldBuy / count) * 100) : 0,
        }
      }).sort((a, b) => b.avg_rating - a.avg_rating)

      // Skipped wines analysis
      const totalInteractions = ratings.length
      const skippedWines: SkippedWine[] = wines
        .map(wine => {
          const wineSkips = skippedRatings.filter((r: any) => r.event_wine_id === wine.id)
          if (wineSkips.length === 0) return null
          const reasonCounts: Record<string, number> = {}
          wineSkips.forEach((r: any) => {
            const reason = r.skip_reason || 'No reason given'
            reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
          })
          const topReason = Object.entries(reasonCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || ''
          const wineInteractions = ratings.filter((r: any) => r.event_wine_id === wine.id).length
          return {
            id: wine.id,
            wine_name: wine.wine_name,
            producer: wine.producer,
            skip_count: wineSkips.length,
            skip_percent: wineInteractions > 0 ? Math.round((wineSkips.length / wineInteractions) * 100) : 0,
            top_reason: topReason,
          }
        })
        .filter(Boolean)
        .sort((a, b) => b!.skip_count - a!.skip_count) as SkippedWine[]

      // Rating distribution (active only)
      const distribution = [0, 0, 0, 0, 0]
      activeRatings.forEach((r: any) => {
        if (r.rating >= 1 && r.rating <= 5) {
          distribution[r.rating - 1]++
        }
      })

      // Load descriptors (active ratings only)
      const { data: descriptorData } = await supabase
        .from('user_wine_descriptors')
        .select('descriptor_id, descriptors(name)')
        .in('rating_id', activeRatings.map((r: any) => r.id))

      const descriptorCounts: Record<string, number> = {}
      descriptorData?.forEach((d: any) => {
        const name = d.descriptors?.name
        if (name) {
          descriptorCounts[name] = (descriptorCounts[name] || 0) + 1
        }
      })

      const topDescriptors = Object.entries(descriptorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }))

      setAnalytics({
        totalRatings,
        totalSkips,
        averageRating: Math.round(avgRating * 10) / 10,
        totalParticipants: uniqueUsers.size,
        totalWines: wines.length,
        wouldBuyPercent: totalRatings > 0 ? Math.round((wouldBuyCount / totalRatings) * 100) : 0,
        wineRankings,
        skippedWines,
        ratingDistribution: distribution,
        topDescriptors,
      })
    } catch (err) {
      console.error('Error loading analytics:', err)
      addToast({ type: 'error', message: 'Failed to load analytics' })
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

  if (!event || !analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-body-md text-[var(--foreground-secondary)]">
          Event not found
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-display-md font-bold text-[var(--foreground)]">
              {event.event_name}
            </h1>
            <p className="text-body-md text-[var(--foreground-secondary)]">
              Event Analytics · Code: {event.event_code}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowExport(true)}
          leftIcon={<Download className="h-4 w-4" />}
        >
          Export Report
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard icon={Star} label="Avg Rating" value={analytics.averageRating.toString()} suffix="/ 5" color="wine" />
        <StatCard icon={BarChart3} label="Total Ratings" value={analytics.totalRatings.toString()} color="blue" />
        <StatCard icon={Users} label="Participants" value={analytics.totalParticipants.toString()} color="green" />
        <StatCard icon={Wine} label="Wines" value={analytics.totalWines.toString()} color="purple" />
        <StatCard icon={ShoppingBag} label="Would Buy" value={`${analytics.wouldBuyPercent}%`} color="gold" />
        <StatCard icon={SkipForward} label="Skipped" value={analytics.totalSkips.toString()} color="muted" />
      </div>

      {analytics.totalRatings === 0 ? (
        <Card variant="default" className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
          <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-2">No Ratings Yet</h3>
          <p className="text-body-md text-[var(--foreground-secondary)]">Ratings will appear here once participants start tasting wines.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Wine Rankings */}
          <Card variant="default">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-[var(--wine)]" />
              <h2 className="text-body-lg font-semibold text-[var(--foreground)]">Wine Rankings</h2>
            </div>
            <div className="space-y-3">
              {analytics.wineRankings.map((wine, index) => (
                <div key={wine.id} className="flex items-center gap-4 p-3 rounded-xl bg-[var(--surface)]">
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
                    <p className="text-body-md font-medium text-[var(--foreground)] truncate">{wine.wine_name}</p>
                    <p className="text-body-sm text-[var(--foreground-muted)]">{wine.producer} · {wine.rating_count} rating{wine.rating_count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-[var(--wine)] text-[var(--wine)]" />
                      <span className="text-body-md font-semibold text-[var(--foreground)]">{wine.avg_rating}</span>
                    </div>
                    {wine.would_buy_percent > 0 && <p className="text-body-xs text-[var(--foreground-muted)]">{wine.would_buy_percent}% would buy</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Rating Distribution */}
          <Card variant="default">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-[var(--wine)]" />
              <h2 className="text-body-lg font-semibold text-[var(--foreground)]">Rating Distribution</h2>
            </div>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = analytics.ratingDistribution[rating - 1]
                const percentage = analytics.totalRatings > 0 ? (count / analytics.totalRatings) * 100 : 0
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <Star className="h-4 w-4 fill-[var(--wine)] text-[var(--wine)]" />
                      <span className="text-body-sm text-[var(--foreground)]">{rating}</span>
                    </div>
                    <div className="flex-1 h-4 bg-[var(--border)] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: 0.1 * (5 - rating) }}
                        className="h-full bg-[var(--wine)] rounded-full"
                      />
                    </div>
                    <span className="text-body-sm text-[var(--foreground-muted)] w-12 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Top Descriptors */}
          {analytics.topDescriptors.length > 0 && (
            <Card variant="default" className="lg:col-span-2">
              <h2 className="text-body-lg font-semibold text-[var(--foreground)] mb-4">Most Common Descriptors</h2>
              <div className="flex flex-wrap gap-2">
                {analytics.topDescriptors.map((desc) => (
                  <span key={desc.name} className={cn('px-3 py-1.5 rounded-full', 'bg-[var(--wine-muted)] text-[var(--wine)]', 'text-body-sm font-medium')}>
                    {desc.name}<span className="ml-1 opacity-70">({desc.count})</span>
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Skipped Wines */}
          {analytics.skippedWines.length > 0 && (
            <Card variant="default" className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <SkipForward className="h-5 w-5 text-[var(--foreground-muted)]" />
                <h2 className="text-body-lg font-semibold text-[var(--foreground)]">Skipped Wines</h2>
                <span className="text-body-xs text-[var(--foreground-muted)]">— not counted in ratings</span>
              </div>
              <div className="space-y-3">
                {analytics.skippedWines.map(wine => (
                  <div key={wine.id} className="flex items-center gap-4 p-3 rounded-xl bg-[var(--surface)]">
                    <div className="flex-1 min-w-0">
                      <p className="text-body-md font-medium text-[var(--foreground)] truncate">{wine.wine_name}</p>
                      {wine.producer && <p className="text-body-sm text-[var(--foreground-muted)]">{wine.producer}</p>}
                      {wine.top_reason && (
                        <p className="text-body-xs text-[var(--foreground-secondary)] mt-0.5">
                          Top reason: {wine.top_reason}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-body-md font-semibold text-[var(--foreground)]">{wine.skip_count}×</p>
                      <p className="text-body-xs text-[var(--foreground-muted)]">{wine.skip_percent}% of tasters</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Export Modal */}
      <ExportReports isOpen={showExport} onClose={() => setShowExport(false)} eventId={event.id} eventName={event.event_name} />
    </div>
  )
}

function StatCard({ icon: Icon, label, value, suffix, color }: { icon: typeof Star; label: string; value: string; suffix?: string; color: 'wine' | 'blue' | 'green' | 'purple' | 'gold' | 'muted' }) {
  const colorClasses = { wine: 'text-[var(--wine)]', blue: 'text-blue-500', green: 'text-green-500', purple: 'text-purple-500', gold: 'text-[var(--gold)]', muted: 'text-[var(--foreground-muted)]' }
  return (
    <Card variant="default" className="text-center">
      <Icon className={cn('h-6 w-6 mx-auto mb-2', colorClasses[color])} />
      <p className="text-display-sm font-bold text-[var(--foreground)]">{value}{suffix && <span className="text-body-md font-normal text-[var(--foreground-muted)]"> {suffix}</span>}</p>
      <p className="text-body-sm text-[var(--foreground-muted)]">{label}</p>
    </Card>
  )
}
