'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button, Badge } from '@/components/ui'
import { WineLoader } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  BarChart3,
  Wine,
  Star,
  Users,
  TrendingUp,
  Download,
  Calendar,
  ShoppingBag,
  Award,
  Filter,
} from 'lucide-react'

interface EventOption {
  id: string
  event_name: string
  event_code: string
  event_date: string
}

interface AnalyticsData {
  totalRatings: number
  totalParticipants: number
  averageRating: number
  wouldBuyPercentage: number
  topWines: TopWine[]
  ratingDistribution: number[]
  wineTypeBreakdown: { type: string; count: number; avgRating: number }[]
  recentActivity: ActivityItem[]
}

interface TopWine {
  id: string
  wine_name: string
  producer?: string
  wine_type: string
  avgRating: number
  ratingCount: number
  wouldBuyCount: number
}

interface ActivityItem {
  id: string
  wine_name: string
  rating: number
  created_at: string
}

export default function AnalyticsPage() {
  const { addToast } = useToast()
  
  const [events, setEvents] = useState<EventOption[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | 'all'>('all')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const adminId = typeof window !== 'undefined'
    ? localStorage.getItem('palate-admin-user')
    : null

  // Load events list
  useEffect(() => {
    const loadEvents = async () => {
      if (!adminId) return

      const { data } = await supabase
        .from('tasting_events')
        .select('id, event_name, event_code, event_date')
        .eq('admin_id', adminId)
        .eq('is_deleted', false)
        .order('event_date', { ascending: false })

      if (data) {
        setEvents(data)
      }
    }

    loadEvents()
  }, [adminId])

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!adminId) return
      setIsLoading(true)

      try {
        // Get event IDs to filter
        let eventIds: string[] = []
        
        if (selectedEventId === 'all') {
          const { data: eventsData } = await supabase
            .from('tasting_events')
            .select('id')
            .eq('admin_id', adminId)
            .eq('is_deleted', false)

          eventIds = eventsData?.map(e => e.id) || []
        } else {
          eventIds = [selectedEventId]
        }

        if (eventIds.length === 0) {
          setAnalytics(null)
          setIsLoading(false)
          return
        }

        // Get all wines for these events
        const { data: wines } = await supabase
          .from('event_wines')
          .select('id, wine_name, producer, wine_type, event_id')
          .in('event_id', eventIds)

        const wineIds = wines?.map(w => w.id) || []

        if (wineIds.length === 0) {
          setAnalytics({
            totalRatings: 0,
            totalParticipants: 0,
            averageRating: 0,
            wouldBuyPercentage: 0,
            topWines: [],
            ratingDistribution: [0, 0, 0, 0, 0],
            wineTypeBreakdown: [],
            recentActivity: [],
          })
          setIsLoading(false)
          return
        }

        // Get all ratings for these wines
        const { data: ratings } = await supabase
          .from('user_wine_ratings')
          .select('id, event_wine_id, user_id, rating, would_buy, created_at')
          .in('event_wine_id', wineIds)
          .order('created_at', { ascending: false })

        if (!ratings || ratings.length === 0) {
          setAnalytics({
            totalRatings: 0,
            totalParticipants: 0,
            averageRating: 0,
            wouldBuyPercentage: 0,
            topWines: [],
            ratingDistribution: [0, 0, 0, 0, 0],
            wineTypeBreakdown: [],
            recentActivity: [],
          })
          setIsLoading(false)
          return
        }

        // Calculate stats
        const totalRatings = ratings.length
        const uniqueUsers = new Set(ratings.map(r => r.user_id))
        const totalParticipants = uniqueUsers.size
        const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        const wouldBuyCount = ratings.filter(r => r.would_buy).length
        const wouldBuyPercentage = (wouldBuyCount / totalRatings) * 100

        // Rating distribution (1-5 stars)
        const ratingDistribution = [0, 0, 0, 0, 0]
        ratings.forEach(r => {
          if (r.rating >= 1 && r.rating <= 5) {
            ratingDistribution[r.rating - 1]++
          }
        })

        // Top wines by average rating
        const wineRatings: Record<string, { ratings: number[]; wouldBuy: number }> = {}
        ratings.forEach(r => {
          if (!wineRatings[r.event_wine_id]) {
            wineRatings[r.event_wine_id] = { ratings: [], wouldBuy: 0 }
          }
          wineRatings[r.event_wine_id].ratings.push(r.rating)
          if (r.would_buy) wineRatings[r.event_wine_id].wouldBuy++
        })

        const topWines: TopWine[] = wines
          ?.filter(w => wineRatings[w.id])
          .map(w => ({
            id: w.id,
            wine_name: w.wine_name,
            producer: w.producer,
            wine_type: w.wine_type,
            avgRating: wineRatings[w.id].ratings.reduce((a, b) => a + b, 0) / wineRatings[w.id].ratings.length,
            ratingCount: wineRatings[w.id].ratings.length,
            wouldBuyCount: wineRatings[w.id].wouldBuy,
          }))
          .sort((a, b) => b.avgRating - a.avgRating)
          .slice(0, 10) || []

        // Wine type breakdown
        const typeStats: Record<string, { count: number; totalRating: number }> = {}
        wines?.forEach(w => {
          if (!typeStats[w.wine_type]) {
            typeStats[w.wine_type] = { count: 0, totalRating: 0 }
          }
          const wineRating = wineRatings[w.id]
          if (wineRating) {
            typeStats[w.wine_type].count += wineRating.ratings.length
            typeStats[w.wine_type].totalRating += wineRating.ratings.reduce((a, b) => a + b, 0)
          }
        })

        const wineTypeBreakdown = Object.entries(typeStats)
          .map(([type, stats]) => ({
            type,
            count: stats.count,
            avgRating: stats.count > 0 ? stats.totalRating / stats.count : 0,
          }))
          .sort((a, b) => b.count - a.count)

        // Recent activity
        const recentActivity: ActivityItem[] = ratings.slice(0, 10).map(r => {
          const wine = wines?.find(w => w.id === r.event_wine_id)
          return {
            id: r.id,
            wine_name: wine?.wine_name || 'Unknown Wine',
            rating: r.rating,
            created_at: r.created_at,
          }
        })

        setAnalytics({
          totalRatings,
          totalParticipants,
          averageRating: Math.round(averageRating * 10) / 10,
          wouldBuyPercentage: Math.round(wouldBuyPercentage),
          topWines,
          ratingDistribution,
          wineTypeBreakdown,
          recentActivity,
        })
      } catch (err) {
        console.error('Error loading analytics:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalytics()
  }, [adminId, selectedEventId])

  // Export to CSV
  const handleExport = async () => {
    if (!analytics) return
    setIsExporting(true)

    try {
      // Get event IDs
      let eventIds: string[] = []
      if (selectedEventId === 'all') {
        eventIds = events.map(e => e.id)
      } else {
        eventIds = [selectedEventId]
      }

      // Get all wines
      const { data: wines } = await supabase
        .from('event_wines')
        .select('id, wine_name, producer, vintage, wine_type, region, event_id')
        .in('event_id', eventIds)

      const wineIds = wines?.map(w => w.id) || []

      // Get all ratings
      const { data: ratings } = await supabase
        .from('user_wine_ratings')
        .select('event_wine_id, user_id, rating, personal_notes, would_buy, created_at')
        .in('event_wine_id', wineIds)

      // Build CSV
      const headers = ['Wine Name', 'Producer', 'Vintage', 'Type', 'Region', 'Rating', 'Would Buy', 'Notes', 'Date']
      const rows = ratings?.map(r => {
        const wine = wines?.find(w => w.id === r.event_wine_id)
        return [
          wine?.wine_name || '',
          wine?.producer || '',
          wine?.vintage || '',
          wine?.wine_type || '',
          wine?.region || '',
          r.rating.toString(),
          r.would_buy ? 'Yes' : 'No',
          r.personal_notes?.replace(/"/g, '""') || '',
          new Date(r.created_at).toLocaleDateString(),
        ]
      }) || []

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // Download
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wine-ratings-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      addToast({ type: 'success', message: 'Export downloaded!' })
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to export data' })
    } finally {
      setIsExporting(false)
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-md font-bold text-[var(--foreground)]">
            Analytics
          </h1>
          <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
            Insights from your wine tasting events
          </p>
        </div>
        <div className="flex gap-3">
          {/* Event filter */}
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className={cn(
              'px-4 py-2.5 rounded-xl',
              'bg-[var(--surface)] border border-[var(--border)]',
              'text-body-md text-[var(--foreground)]',
              'focus:outline-none focus:border-[var(--wine)]'
            )}
          >
            <option value="all">All Events</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.event_name}
              </option>
            ))}
          </select>

          <Button
            variant="secondary"
            onClick={handleExport}
            isLoading={isExporting}
            leftIcon={<Download className="h-5 w-5" />}
            disabled={!analytics || analytics.totalRatings === 0}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {!analytics || analytics.totalRatings === 0 ? (
        <Card variant="outlined" padding="lg" className="text-center">
          <BarChart3 className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
          <h2 className="text-body-lg font-medium text-[var(--foreground)] mb-2">
            No data yet
          </h2>
          <p className="text-body-md text-[var(--foreground-secondary)]">
            Analytics will appear once participants start rating wines
          </p>
        </Card>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Star}
              label="Total Ratings"
              value={analytics.totalRatings.toLocaleString()}
              color="gold"
            />
            <StatCard
              icon={Users}
              label="Participants"
              value={analytics.totalParticipants.toLocaleString()}
              color="wine"
            />
            <StatCard
              icon={TrendingUp}
              label="Avg Rating"
              value={analytics.averageRating.toFixed(1)}
              suffix="/ 5"
              color="gold"
            />
            <StatCard
              icon={ShoppingBag}
              label="Would Buy"
              value={`${analytics.wouldBuyPercentage}%`}
              color="wine"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Wines */}
            <Card variant="outlined" padding="lg">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-[var(--gold)]" />
                <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
                  Top Rated Wines
                </h2>
              </div>
              <div className="space-y-3">
                {analytics.topWines.slice(0, 5).map((wine, index) => (
                  <div
                    key={wine.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[var(--background)]"
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-body-sm font-bold',
                        index === 0
                          ? 'bg-[var(--gold)] text-white'
                          : index === 1
                          ? 'bg-gray-400 text-white'
                          : index === 2
                          ? 'bg-amber-600 text-white'
                          : 'bg-[var(--border)] text-[var(--foreground-muted)]'
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-md font-medium text-[var(--foreground)] truncate">
                        {wine.wine_name}
                      </p>
                      <p className="text-body-sm text-[var(--foreground-muted)]">
                        {wine.ratingCount} ratings
                        {wine.wouldBuyCount > 0 && ` · ${wine.wouldBuyCount} would buy`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-[var(--gold)] fill-current" />
                      <span className="text-body-md font-semibold text-[var(--foreground)]">
                        {wine.avgRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Rating Distribution */}
            <Card variant="outlined" padding="lg">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-[var(--wine)]" />
                <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
                  Rating Distribution
                </h2>
              </div>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = analytics.ratingDistribution[stars - 1]
                  const percentage = analytics.totalRatings > 0
                    ? (count / analytics.totalRatings) * 100
                    : 0

                  return (
                    <div key={stars} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-body-sm text-[var(--foreground)]">{stars}</span>
                        <Star className="h-4 w-4 text-[var(--gold)] fill-current" />
                      </div>
                      <div className="flex-1 h-6 bg-[var(--background)] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: (5 - stars) * 0.1 }}
                          className="h-full bg-[var(--wine)] rounded-full"
                        />
                      </div>
                      <span className="text-body-sm text-[var(--foreground-muted)] w-12 text-right">
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Wine Type Breakdown */}
            <Card variant="outlined" padding="lg">
              <div className="flex items-center gap-2 mb-4">
                <Wine className="h-5 w-5 text-[var(--wine)]" />
                <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
                  By Wine Type
                </h2>
              </div>
              <div className="space-y-3">
                {analytics.wineTypeBreakdown.map((item) => (
                  <div
                    key={item.type}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--background)]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getWineEmoji(item.type)}</span>
                      <span className="text-body-md font-medium text-[var(--foreground)] capitalize">
                        {item.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-body-sm text-[var(--foreground-muted)]">
                        {item.count} ratings
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-[var(--gold)] fill-current" />
                        <span className="text-body-sm font-medium text-[var(--foreground)]">
                          {item.avgRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card variant="outlined" padding="lg">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-[var(--wine)]" />
                <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
                  Recent Activity
                </h2>
              </div>
              <div className="space-y-2">
                {analytics.recentActivity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-[var(--foreground)] truncate">
                        {item.wine_name}
                      </p>
                      <p className="text-body-xs text-[var(--foreground-muted)]">
                        {formatTimeAgo(item.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-[var(--gold)] fill-current" />
                      <span className="text-body-sm font-medium text-[var(--foreground)]">
                        {item.rating}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
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
  icon: typeof Star
  label: string
  value: string
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
            {value}
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
