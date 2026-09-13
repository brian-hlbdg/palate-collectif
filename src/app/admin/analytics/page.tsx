'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button, Badge } from '@/components/ui'
import { WineLoader } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Wine,
  Star,
  Users,
  Download,
  Printer,
  Calendar,
  ShoppingBag,
  Award,
} from 'lucide-react'

interface EventOption {
  id: string
  event_name: string
  event_code: string
  event_date: string
}

interface AnalyticsData {
  totalRatings: number
  totalSkips: number
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

  const [isCurator, setIsCurator] = useState(false)

  useEffect(() => {
    if (!adminId) return
    supabase.from('profiles').select('is_curator').eq('id', adminId).single()
      .then(({ data }) => setIsCurator(data?.is_curator === true))
  }, [adminId])

  // Load events list
  useEffect(() => {
    const loadEvents = async () => {
      if (!adminId) return

      let query = supabase
        .from('tasting_events')
        .select('id, event_name, event_code, event_date')
        .eq('is_deleted', false)
        .order('event_date', { ascending: false })

      if (!isCurator) query = query.eq('admin_id', adminId)

      const { data } = await query
      if (data) setEvents(data)
    }

    loadEvents()
  }, [adminId, isCurator])

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!adminId) return
      setIsLoading(true)

      try {
        // Get event IDs to filter
        let eventIds: string[] = []

        if (selectedEventId === 'all') {
          let q = supabase.from('tasting_events').select('id').eq('is_deleted', false)
          if (!isCurator) q = q.eq('admin_id', adminId)
          const { data: eventsData } = await q
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
            totalSkips: 0,
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
          .select('id, event_wine_id, user_id, rating, would_buy, is_skipped, created_at')
          .in('event_wine_id', wineIds)
          .order('created_at', { ascending: false })

        if (!ratings || ratings.length === 0) {
          setAnalytics({
            totalRatings: 0,
            totalSkips: 0,
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

        // Separate active ratings from skips
        const activeRatings = ratings.filter(r => !r.is_skipped)
        const totalSkips = ratings.filter(r => r.is_skipped).length

        // Calculate stats (active only)
        const totalRatings = activeRatings.length
        const uniqueUsers = new Set(ratings.map(r => r.user_id))
        const totalParticipants = uniqueUsers.size
        const averageRating = totalRatings > 0 ? activeRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings : 0
        const wouldBuyCount = activeRatings.filter(r => r.would_buy).length
        const wouldBuyPercentage = totalRatings > 0 ? (wouldBuyCount / totalRatings) * 100 : 0

        // Rating distribution (active only)
        const ratingDistribution = [0, 0, 0, 0, 0]
        activeRatings.forEach(r => {
          if (r.rating >= 1 && r.rating <= 5) {
            ratingDistribution[r.rating - 1]++
          }
        })

        // All wines ranked by average rating
        const wineRatings: Record<string, { ratings: number[]; wouldBuy: number }> = {}
        activeRatings.forEach(r => {
          if (!wineRatings[r.event_wine_id]) {
            wineRatings[r.event_wine_id] = { ratings: [], wouldBuy: 0 }
          }
          wineRatings[r.event_wine_id].ratings.push(r.rating)
          if (r.would_buy) wineRatings[r.event_wine_id].wouldBuy++
        })

        const ratedWines: TopWine[] = wines
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
          .sort((a, b) => b.avgRating - a.avgRating) || []

        const unratedWines: TopWine[] = wines
          ?.filter(w => !wineRatings[w.id])
          .map(w => ({
            id: w.id,
            wine_name: w.wine_name,
            producer: w.producer,
            wine_type: w.wine_type,
            avgRating: 0,
            ratingCount: 0,
            wouldBuyCount: 0,
          })) || []

        const topWines: TopWine[] = [...ratedWines, ...unratedWines]

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

        // Recent activity (active only)
        const recentActivity: ActivityItem[] = activeRatings.slice(0, 10).map(r => {
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
          totalSkips,
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
  }, [adminId, selectedEventId, isCurator])

  // Export report CSV
  const handleExport = async () => {
    if (!analytics) return
    setIsExporting(true)

    try {
      const eventIds = selectedEventId === 'all'
        ? events.map(e => e.id)
        : [selectedEventId]

      const selectedEvent = selectedEventId !== 'all'
        ? events.find(e => e.id === selectedEventId)
        : null

      // Wines ordered by tasting order
      const { data: wines } = await supabase
        .from('event_wines')
        .select('id, wine_name, producer, vintage, wine_type, region, tasting_order')
        .in('event_id', eventIds)
        .order('tasting_order', { ascending: true })

      if (!wines || wines.length === 0) {
        addToast({ type: 'error', message: 'No wines found' })
        return
      }

      const wineIds = wines.map(w => w.id)

      // All ratings
      const { data: ratings } = await supabase
        .from('user_wine_ratings')
        .select('event_wine_id, user_id, rating, would_buy, is_skipped, skip_reason, personal_notes')
        .in('event_wine_id', wineIds)

      // Profile info for all raters
      const uniqueUserIds = [...new Set((ratings || []).map(r => r.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, first_name, last_name, eventbrite_email, ticket_type, is_temp_account')
        .in('id', uniqueUserIds)

      const profileMap: Record<string, { display_name?: string; first_name?: string; last_name?: string; eventbrite_email?: string; ticket_type?: string; is_temp_account?: boolean }> = {}
      profiles?.forEach(p => { profileMap[p.id] = p })

      type RatingRow = { event_wine_id: string; user_id: string; rating: number; would_buy: boolean; is_skipped: boolean; skip_reason: string | null; personal_notes: string | null }

      // Index ratings: by wine and by user
      const ratingsByUser: Record<string, Record<string, RatingRow>> = {}
      ;(ratings || []).forEach(r => {
        if (!ratingsByUser[r.user_id]) ratingsByUser[r.user_id] = {}
        ratingsByUser[r.user_id][r.event_wine_id] = r as RatingRow
      })

      // Wine stats for scorecard
      const wineStats: Record<string, { scores: number[]; wouldBuy: number }> = {}
      ;(ratings || []).filter(r => !r.is_skipped).forEach(r => {
        if (!wineStats[r.event_wine_id]) wineStats[r.event_wine_id] = { scores: [], wouldBuy: 0 }
        wineStats[r.event_wine_id].scores.push(r.rating)
        if (r.would_buy) wineStats[r.event_wine_id].wouldBuy++
      })

      const scorecardWines = wines
        .map(w => {
          const s = wineStats[w.id]
          const avg = s ? s.scores.reduce((a, b) => a + b, 0) / s.scores.length : null
          return { ...w, avg, tasted: s?.scores.length ?? 0, wouldBuy: s?.wouldBuy ?? 0 }
        })
        .sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1))

      // CSV helpers
      const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
      const row = (cells: unknown[]) => cells.map(q).join(',')
      const lines: string[] = []

      // — Report header —
      const title = selectedEvent ? `Palate Report — ${selectedEvent.event_name}` : 'Palate Report — All Events'
      const dateStr = selectedEvent ? new Date(selectedEvent.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''
      lines.push(q(title))
      if (dateStr) lines.push(q(`Event date: ${dateStr}`))
      lines.push(q(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`))
      lines.push(q(`${analytics.totalParticipants} guests · ${wines.length} wines · Overall avg score: ${analytics.averageRating.toFixed(1)} / 5 · ${analytics.wouldBuyPercentage}% would buy`))
      lines.push('')

      // — Section 1: Wine Scorecard —
      lines.push(q('SECTION 1 — WINE SCORECARD (ranked by score)'))
      lines.push(row(['Rank', 'Wine', 'Producer', 'Vintage', 'Type', 'Region', 'Avg Score', 'Guests Tasted', 'Would Buy', 'Would Buy %']))
      scorecardWines.forEach((w, i) => {
        lines.push(row([
          w.tasted > 0 ? i + 1 : '—',
          w.wine_name,
          w.producer || '',
          w.vintage || '',
          w.wine_type || '',
          w.region || '',
          w.avg !== null ? w.avg.toFixed(1) : 'Not tasted',
          w.tasted || 0,
          w.wouldBuy || 0,
          w.tasted > 0 ? `${Math.round((w.wouldBuy / w.tasted) * 100)}%` : '—',
        ]))
      })
      lines.push('')

      // — Section 2: Guest Ratings Grid —
      lines.push(q('SECTION 2 — GUEST RATINGS (one row per attendee)'))
      lines.push(q('Rating scale: 1–5  ·  ✓ = would buy  ·  skip = did not taste  ·  blank = not reached'))
      const wineColHeaders = wines.map(w => `${w.wine_name}${w.producer ? ` (${w.producer})` : ''}`)
      lines.push(row(['Name', 'Email', 'Ticket Type', ...wineColHeaders, 'Wines Rated', 'Wines Skipped', 'Would Buy Count']))

      // Sort guests: named accounts first, then temp
      const sortedUserIds = [...uniqueUserIds].sort((a, b) => {
        const pa = profileMap[a], pb = profileMap[b]
        if (pa?.is_temp_account && !pb?.is_temp_account) return 1
        if (!pa?.is_temp_account && pb?.is_temp_account) return -1
        const nameA = (pa?.first_name || pa?.display_name || '').toLowerCase()
        const nameB = (pb?.first_name || pb?.display_name || '').toLowerCase()
        return nameA.localeCompare(nameB)
      })

      sortedUserIds.forEach(userId => {
        const p = profileMap[userId]
        const userRatings = ratingsByUser[userId] || {}

        const name = [p?.first_name, p?.last_name].filter(Boolean).join(' ')
          || p?.display_name
          || 'Guest'
        const email = p?.eventbrite_email || ''
        const ticket = p?.ticket_type || (p?.is_temp_account ? 'Temp / Booth' : '')

        const ratingCells = wines.map(w => {
          const r = userRatings[w.id]
          if (!r) return ''
          if (r.is_skipped) return 'skip'
          return r.would_buy ? `${r.rating} ✓` : String(r.rating)
        })

        const rated = Object.values(userRatings).filter(r => !r.is_skipped).length
        const skipped = Object.values(userRatings).filter(r => r.is_skipped).length
        const wouldBuyCount = Object.values(userRatings).filter(r => r.would_buy).length

        lines.push(row([name, email, ticket, ...ratingCells, rated, skipped, wouldBuyCount]))
      })

      // Download
      const csv = '﻿' + lines.join('\n') // BOM for Excel UTF-8
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const slug = (selectedEvent?.event_name || 'all-events').replace(/[^a-z0-9]/gi, '-').toLowerCase()
      a.download = `palate-${slug}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      addToast({ type: 'success', message: 'Report downloaded!' })
    } catch (err) {
      console.error('Export error:', err)
      addToast({ type: 'error', message: 'Failed to export report' })
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
      {/* Print-only report header */}
      <div className="print-only hidden mb-6 pb-4 border-b border-gray-300">
        <h1 className="text-2xl font-bold text-black">Palate — Analytics Report</h1>
        <p className="text-sm text-gray-600 mt-1">
          {selectedEventId === 'all'
            ? 'All Events'
            : events.find(e => e.id === selectedEventId)?.event_name || ''}
          {' · '}Printed {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
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
          <Button
            variant="secondary"
            onClick={() => window.print()}
            leftIcon={<Printer className="h-5 w-5" />}
            disabled={!analytics || analytics.totalRatings === 0}
          >
            Print
          </Button>
        </div>
      </div>

      {!analytics || analytics.totalRatings === 0 ? (
        <Card variant="outlined" padding="lg" className="text-center">
          <Wine className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
          <h2 className="text-body-lg font-medium text-[var(--foreground)] mb-2">
            No data yet
          </h2>
          <p className="text-body-md text-[var(--foreground-secondary)]">
            Analytics will appear once participants start rating wines
          </p>
        </Card>
      ) : (
        <>
          {/* 3 Key Numbers */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard icon={Users} label="Guests" value={analytics.totalParticipants.toLocaleString()} color="wine" />
            <StatCard icon={Star} label="Avg Score" value={analytics.averageRating.toFixed(1)} suffix="/ 5" color="gold" />
            <StatCard icon={ShoppingBag} label="Would Buy" value={`${analytics.wouldBuyPercentage}%`} color="wine" />
          </div>

          {/* Wine Scorecard — full width, all wines */}
          <Card variant="outlined" padding="lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-[var(--gold)]" />
                <h2 className="text-body-lg font-semibold text-[var(--foreground)]">Wine Scorecard</h2>
              </div>
              <span className="text-body-sm text-[var(--foreground-muted)]">
                {analytics.topWines.length} wine{analytics.topWines.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-12 gap-2 px-3 mb-2">
              <span className="col-span-1 text-body-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">#</span>
              <span className="col-span-5 text-body-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide">Wine</span>
              <span className="col-span-2 text-body-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide text-center">Score</span>
              <span className="col-span-2 text-body-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide text-center">Tasted by</span>
              <span className="col-span-2 text-body-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wide text-right">Would Buy</span>
            </div>

            <div className="space-y-1">
              {analytics.topWines.map((wine, index) => {
                const wouldBuyPct = wine.ratingCount > 0
                  ? Math.round((wine.wouldBuyCount / wine.ratingCount) * 100)
                  : null
                const isTopThree = index < 3 && wine.ratingCount > 0

                return (
                  <div
                    key={wine.id}
                    className={cn(
                      'grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-lg',
                      isTopThree ? 'bg-[var(--wine-muted)]' : 'hover:bg-[var(--surface)]'
                    )}
                  >
                    {/* Rank */}
                    <span className={cn(
                      'col-span-1 text-body-sm font-bold',
                      index === 0 ? 'text-[var(--gold)]'
                      : index === 1 ? 'text-gray-400'
                      : index === 2 ? 'text-amber-600'
                      : 'text-[var(--foreground-muted)]'
                    )}>
                      {wine.ratingCount > 0 ? index + 1 : '—'}
                    </span>

                    {/* Wine name + producer */}
                    <div className="col-span-5 min-w-0">
                      <p className="text-body-sm font-medium text-[var(--foreground)] truncate">{wine.wine_name}</p>
                      {wine.producer && (
                        <p className="text-body-xs text-[var(--foreground-muted)] truncate">{wine.producer}</p>
                      )}
                    </div>

                    {/* Score */}
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      {wine.ratingCount > 0 ? (
                        <>
                          <Star className="h-3.5 w-3.5 text-[var(--gold)] fill-current flex-shrink-0" />
                          <span className="text-body-sm font-semibold text-[var(--foreground)]">
                            {wine.avgRating.toFixed(1)}
                          </span>
                        </>
                      ) : (
                        <span className="text-body-sm text-[var(--foreground-muted)]">—</span>
                      )}
                    </div>

                    {/* Tasted by */}
                    <div className="col-span-2 text-center">
                      {wine.ratingCount > 0 ? (
                        <span className="text-body-sm text-[var(--foreground-secondary)]">
                          {wine.ratingCount} <span className="text-[var(--foreground-muted)]">guest{wine.ratingCount !== 1 ? 's' : ''}</span>
                        </span>
                      ) : (
                        <span className="text-body-sm text-[var(--foreground-muted)]">Not tasted</span>
                      )}
                    </div>

                    {/* Would Buy */}
                    <div className="col-span-2 text-right">
                      {wouldBuyPct !== null ? (
                        <span className={cn(
                          'text-body-sm font-medium',
                          wouldBuyPct >= 50 ? 'text-[var(--wine)]' : 'text-[var(--foreground-secondary)]'
                        )}>
                          {wouldBuyPct}%
                        </span>
                      ) : (
                        <span className="text-body-sm text-[var(--foreground-muted)]">—</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {analytics.totalSkips > 0 && (
              <p className="mt-4 pt-3 border-t border-[var(--border)] text-body-xs text-[var(--foreground-muted)]">
                {analytics.totalSkips} wine{analytics.totalSkips !== 1 ? 's were' : ' was'} skipped across all participants
              </p>
            )}
          </Card>

          {/* Secondary context — screen only */}
          <div className="no-print grid lg:grid-cols-2 gap-6">
            {/* Wine Type Breakdown */}
            {analytics.wineTypeBreakdown.length > 0 && (
              <Card variant="outlined" padding="lg">
                <div className="flex items-center gap-2 mb-4">
                  <Wine className="h-5 w-5 text-[var(--wine)]" />
                  <h2 className="text-body-lg font-semibold text-[var(--foreground)]">By Type</h2>
                </div>
                <div className="space-y-2">
                  {analytics.wineTypeBreakdown.map((item) => (
                    <div key={item.type} className="flex items-center justify-between py-1.5 border-b border-[var(--border)] last:border-0">
                      <div className="flex items-center gap-2">
                        <span>{getWineEmoji(item.type)}</span>
                        <span className="text-body-sm text-[var(--foreground)] capitalize">{item.type}</span>
                      </div>
                      <div className="flex items-center gap-3 text-body-sm text-[var(--foreground-secondary)]">
                        <span>{item.count} ratings</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-[var(--gold)] fill-current" />
                          <span className="font-medium">{item.avgRating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Recent Activity */}
            <Card variant="outlined" padding="lg">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-[var(--wine)]" />
                <h2 className="text-body-lg font-semibold text-[var(--foreground)]">Recent Activity</h2>
              </div>
              <div className="space-y-2">
                {analytics.recentActivity.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-[var(--border)] last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-[var(--foreground)] truncate">{item.wine_name}</p>
                      <p className="text-body-xs text-[var(--foreground-muted)]">{formatTimeAgo(item.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-[var(--gold)] fill-current" />
                      <span className="text-body-sm font-medium text-[var(--foreground)]">{item.rating}</span>
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
