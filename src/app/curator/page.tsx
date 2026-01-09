'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { WineLoader } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Wine,
  Database,
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Star,
} from 'lucide-react'

interface DashboardStats {
  totalMasterWines: number
  pendingReviews: number
  totalAdmins: number
  totalEvents: number
  totalRatings: number
  recentSubmissions: RecentSubmission[]
}

interface RecentSubmission {
  id: string
  wine_name: string
  producer?: string
  submitted_at: string
  user_name?: string
}

export default function CuratorDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Get master wines count
        const { count: masterCount } = await supabase
          .from('wines_master')
          .select('*', { count: 'exact', head: true })

        // Get pending reviews
        const { count: pendingCount, data: recentPending } = await supabase
          .from('user_wines')
          .select('id, wine_name, producer, added_date, user_id')
          .eq('status', 'pending')
          .order('added_date', { ascending: false })
          .limit(5)

        // Get total admins
        const { count: adminCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_admin', true)

        // Get total events
        const { count: eventCount } = await supabase
          .from('tasting_events')
          .select('*', { count: 'exact', head: true })
          .eq('is_deleted', false)

        // Get total ratings
        const { count: ratingCount } = await supabase
          .from('user_wine_ratings')
          .select('*', { count: 'exact', head: true })

        // Get user names for recent submissions
        const recentSubmissions: RecentSubmission[] = []
        if (recentPending) {
          for (const submission of recentPending) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', submission.user_id)
              .single()

            recentSubmissions.push({
              id: submission.id,
              wine_name: submission.wine_name,
              producer: submission.producer,
              submitted_at: submission.added_date,
              user_name: profile?.display_name,
            })
          }
        }

        setStats({
          totalMasterWines: masterCount || 0,
          pendingReviews: pendingCount || 0,
          totalAdmins: adminCount || 0,
          totalEvents: eventCount || 0,
          totalRatings: ratingCount || 0,
          recentSubmissions,
        })
      } catch (err) {
        console.error('Error loading stats:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

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
          Curator Dashboard
        </h1>
        <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
          Platform overview and data stewardship
        </p>
      </div>

      {/* Alert for pending reviews */}
      {stats && stats.pendingReviews > 0 && (
        <div className={cn(
          'flex items-center justify-between p-4 rounded-xl',
          'border border-[var(--gold)]'
        )}>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-[var(--gold)]" />
            <div>
              <p className="text-body-md font-medium text-[var(--foreground)]">
                {stats.pendingReviews} wine{stats.pendingReviews !== 1 ? 's' : ''} pending review
              </p>
              <p className="text-body-sm text-[var(--foreground-secondary)]">
                User-submitted wines awaiting approval
              </p>
            </div>
          </div>
          <Link
            href="/curator/wines"
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl',
              'text-body-sm font-medium',
              'border border-[var(--gold)] text-[var(--gold)]',
              'hover:bg-[var(--gold)]/10 transition-colors'
            )}
          >
            Review
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Database}
          label="Master Wines"
          value={stats?.totalMasterWines || 0}
        />
        <StatCard
          icon={Clock}
          label="Pending Review"
          value={stats?.pendingReviews || 0}
          highlight={stats?.pendingReviews ? stats.pendingReviews > 0 : false}
        />
        <StatCard
          icon={Users}
          label="Admins"
          value={stats?.totalAdmins || 0}
        />
        <StatCard
          icon={Calendar}
          label="Events"
          value={stats?.totalEvents || 0}
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform activity */}
        <div className="border border-[var(--border)] rounded-xl p-6">
          <h2 className="text-body-lg font-semibold text-[var(--foreground)] mb-4">
            Platform Activity
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-[var(--foreground-muted)]" />
                <span className="text-body-md text-[var(--foreground-secondary)]">
                  Total Ratings
                </span>
              </div>
              <span className="text-body-lg font-semibold text-[var(--foreground)]">
                {stats?.totalRatings.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-[var(--foreground-muted)]" />
                <span className="text-body-md text-[var(--foreground-secondary)]">
                  Avg. Wines per Event
                </span>
              </div>
              <span className="text-body-lg font-semibold text-[var(--foreground)]">
                {stats?.totalEvents ? Math.round((stats.totalMasterWines / stats.totalEvents) * 10) / 10 : 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-[var(--foreground-muted)]" />
                <span className="text-body-md text-[var(--foreground-secondary)]">
                  Data Health
                </span>
              </div>
              <Link
                href="/curator/health"
                className="text-body-sm text-[var(--wine)] hover:underline"
              >
                View Report →
              </Link>
            </div>
          </div>
        </div>

        {/* Recent submissions */}
        <div className="border border-[var(--border)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
              Recent Submissions
            </h2>
            {stats && stats.recentSubmissions.length > 0 && (
              <Link
                href="/curator/wines"
                className="text-body-sm text-[var(--wine)] hover:underline"
              >
                View all →
              </Link>
            )}
          </div>
          
          {stats && stats.recentSubmissions.length > 0 ? (
            <div className="space-y-3">
              {stats.recentSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-body-md font-medium text-[var(--foreground)] truncate">
                      {submission.wine_name}
                    </p>
                    <p className="text-body-sm text-[var(--foreground-muted)]">
                      {submission.producer && `${submission.producer} · `}
                      by {submission.user_name || 'Unknown'}
                    </p>
                  </div>
                  <span className="text-body-xs text-[var(--foreground-muted)] ml-4">
                    {formatTimeAgo(submission.submitted_at)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-10 w-10 text-[var(--foreground-muted)] mx-auto mb-3" />
              <p className="text-body-md text-[var(--foreground-secondary)]">
                No pending submissions
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="border border-[var(--border)] rounded-xl p-6">
        <h2 className="text-body-lg font-semibold text-[var(--foreground)] mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction
            href="/curator/wines"
            icon={Wine}
            label="Review Wines"
          />
          <QuickAction
            href="/curator/wines?tab=master"
            icon={Database}
            label="Browse Master List"
          />
          <QuickAction
            href="/curator/analytics"
            icon={TrendingUp}
            label="View Analytics"
          />
          <QuickAction
            href="/curator/health"
            icon={AlertTriangle}
            label="Check Data Health"
          />
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
  highlight = false,
}: {
  icon: typeof Wine
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <div className={cn(
      'p-4 rounded-xl border',
      highlight ? 'border-[var(--gold)]' : 'border-[var(--border)]'
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl border flex items-center justify-center',
          highlight ? 'border-[var(--gold)]' : 'border-[var(--border)]'
        )}>
          <Icon className={cn(
            'h-5 w-5',
            highlight ? 'text-[var(--gold)]' : 'text-[var(--foreground-muted)]'
          )} />
        </div>
        <div>
          <p className={cn(
            'text-display-sm font-bold',
            highlight ? 'text-[var(--gold)]' : 'text-[var(--foreground)]'
          )}>
            {value.toLocaleString()}
          </p>
          <p className="text-body-xs text-[var(--foreground-muted)]">{label}</p>
        </div>
      </div>
    </div>
  )
}

// Quick action button - outlined style
function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: typeof Wine
  label: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-xl',
        'border border-[var(--border)]',
        'hover:border-[var(--wine)] hover:text-[var(--wine)]',
        'transition-all duration-200',
        'text-[var(--foreground-secondary)]'
      )}
    >
      <Icon className="h-6 w-6" />
      <span className="text-body-sm font-medium text-center">{label}</span>
    </Link>
  )
}

// Helper function
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
