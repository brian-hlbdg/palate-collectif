'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { WineLoader } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wine,
  Users,
  FileWarning,
  RefreshCw,
  Trash2,
  Search,
  Database,
} from 'lucide-react'

interface HealthCheck {
  id: string
  name: string
  description: string
  status: 'pass' | 'warning' | 'fail'
  count: number
  items?: any[]
}

interface DuplicateWine {
  wine_name: string
  producer?: string
  count: number
  ids: string[]
}

interface OrphanedRecord {
  id: string
  type: string
  details: string
}

export default function CuratorHealthPage() {
  const { addToast } = useToast()
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([])
  const [duplicates, setDuplicates] = useState<DuplicateWine[]>([])
  const [orphans, setOrphans] = useState<OrphanedRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    runHealthChecks()
  }, [])

  const runHealthChecks = async () => {
    setIsRefreshing(true)
    const checks: HealthCheck[] = []

    try {
      // 1. Check for wines without required fields
      const { data: incompleteWines, count: incompleteCount } = await supabase
        .from('wines_master')
        .select('id, wine_name, producer, wine_type', { count: 'exact' })
        .or('producer.is.null,wine_type.is.null')

      checks.push({
        id: 'incomplete-wines',
        name: 'Incomplete Wine Records',
        description: 'Master wines missing producer or type',
        status: (incompleteCount || 0) === 0 ? 'pass' : 'warning',
        count: incompleteCount || 0,
        items: incompleteWines || [],
      })

      // 2. Check for duplicate wines in master
      const { data: masterWines } = await supabase
        .from('wines_master')
        .select('id, wine_name, producer')

      const duplicateMap = new Map<string, { ids: string[], producer?: string }>()
      if (masterWines) {
        for (const wine of masterWines) {
          const key = wine.wine_name.toLowerCase().trim()
          if (duplicateMap.has(key)) {
            duplicateMap.get(key)!.ids.push(wine.id)
          } else {
            duplicateMap.set(key, { ids: [wine.id], producer: wine.producer })
          }
        }
      }

      const dupes: DuplicateWine[] = Array.from(duplicateMap.entries())
        .filter(([_, v]) => v.ids.length > 1)
        .map(([name, v]) => ({
          wine_name: name,
          producer: v.producer,
          count: v.ids.length,
          ids: v.ids,
        }))

      setDuplicates(dupes)

      checks.push({
        id: 'duplicate-wines',
        name: 'Potential Duplicate Wines',
        description: 'Master wines with same name',
        status: dupes.length === 0 ? 'pass' : 'warning',
        count: dupes.length,
      })

      // 3. Check for orphaned event wines (no event)
      const { count: orphanedEventWines } = await supabase
        .from('event_wines')
        .select('*', { count: 'exact', head: true })
        .is('event_id', null)

      checks.push({
        id: 'orphaned-event-wines',
        name: 'Orphaned Event Wines',
        description: 'Event wines not linked to an event',
        status: (orphanedEventWines || 0) === 0 ? 'pass' : 'fail',
        count: orphanedEventWines || 0,
      })

      // 4. Check for temp accounts older than 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { count: oldTempAccounts } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_temp_account', true)
        .lt('created_at', thirtyDaysAgo.toISOString())

      checks.push({
        id: 'old-temp-accounts',
        name: 'Old Temporary Accounts',
        description: 'Temp accounts older than 30 days',
        status: (oldTempAccounts || 0) === 0 ? 'pass' : 'warning',
        count: oldTempAccounts || 0,
      })

      // 5. Check for ratings without valid wine
      const { data: ratings } = await supabase
        .from('user_wine_ratings')
        .select('id, event_wine_id')

      const { data: validWineIds } = await supabase
        .from('event_wines')
        .select('id')

      const validIds = new Set(validWineIds?.map(w => w.id) || [])
      const orphanedRatings = ratings?.filter(r => !validIds.has(r.event_wine_id)) || []

      checks.push({
        id: 'orphaned-ratings',
        name: 'Orphaned Ratings',
        description: 'Ratings linked to deleted wines',
        status: orphanedRatings.length === 0 ? 'pass' : 'warning',
        count: orphanedRatings.length,
      })

      // 6. Check wines_master usage accuracy
      const { data: masterWithUsage } = await supabase
        .from('wines_master')
        .select('id, wine_name, usage_count')
        .gt('usage_count', 0)

      const { data: eventWinesWithMaster } = await supabase
        .from('event_wines')
        .select('wine_master_id')
        .not('wine_master_id', 'is', null)

      const actualUsage = new Map<string, number>()
      if (eventWinesWithMaster) {
        for (const ew of eventWinesWithMaster) {
          actualUsage.set(ew.wine_master_id, (actualUsage.get(ew.wine_master_id) || 0) + 1)
        }
      }

      let usageMismatch = 0
      if (masterWithUsage) {
        for (const m of masterWithUsage) {
          const actual = actualUsage.get(m.id) || 0
          if (actual !== m.usage_count) {
            usageMismatch++
          }
        }
      }

      checks.push({
        id: 'usage-mismatch',
        name: 'Usage Count Accuracy',
        description: 'Master wines with incorrect usage counts',
        status: usageMismatch === 0 ? 'pass' : 'warning',
        count: usageMismatch,
      })

      // 7. Check for events without wines
      const { data: events } = await supabase
        .from('tasting_events')
        .select('id')
        .eq('is_deleted', false)

      const { data: eventWinesList } = await supabase
        .from('event_wines')
        .select('event_id')

      const eventsWithWines = new Set(eventWinesList?.map(ew => ew.event_id) || [])
      const emptyEvents = events?.filter(e => !eventsWithWines.has(e.id)) || []

      checks.push({
        id: 'empty-events',
        name: 'Events Without Wines',
        description: 'Active events with no wines added',
        status: emptyEvents.length === 0 ? 'pass' : 'warning',
        count: emptyEvents.length,
      })

      setHealthChecks(checks)
    } catch (err) {
      console.error('Health check error:', err)
      addToast({ type: 'error', message: 'Failed to run health checks' })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Calculate overall health score
  const passCount = healthChecks.filter(c => c.status === 'pass').length
  const warningCount = healthChecks.filter(c => c.status === 'warning').length
  const failCount = healthChecks.filter(c => c.status === 'fail').length
  const healthScore = healthChecks.length > 0
    ? Math.round((passCount / healthChecks.length) * 100)
    : 100

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-md font-bold text-[var(--foreground)]">
            Data Health
          </h1>
          <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
            Monitor and maintain data quality
          </p>
        </div>
        <button
          onClick={runHealthChecks}
          disabled={isRefreshing}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl',
            'text-body-sm font-medium',
            'border border-[var(--border)] text-[var(--foreground-secondary)]',
            'hover:border-[var(--wine)] hover:text-[var(--wine)]',
            'disabled:opacity-50',
            'transition-colors'
          )}
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Health score */}
      <div className="border border-[var(--border)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
            Overall Health Score
          </h2>
          <span className={cn(
            'text-display-md font-bold',
            healthScore >= 80 ? 'text-green-500' :
            healthScore >= 50 ? 'text-[var(--gold)]' :
            'text-error'
          )}>
            {healthScore}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-3 rounded-full border border-[var(--border)] overflow-hidden mb-4">
          <div
            className={cn(
              'h-full transition-all duration-500',
              healthScore >= 80 ? 'bg-green-500' :
              healthScore >= 50 ? 'bg-[var(--gold)]' :
              'bg-error'
            )}
            style={{ width: `${healthScore}%` }}
          />
        </div>

        {/* Summary */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-body-sm text-[var(--foreground-secondary)]">
              {passCount} passed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[var(--gold)]" />
            <span className="text-body-sm text-[var(--foreground-secondary)]">
              {warningCount} warnings
            </span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-error" />
            <span className="text-body-sm text-[var(--foreground-secondary)]">
              {failCount} failed
            </span>
          </div>
        </div>
      </div>

      {/* Health checks */}
      <div className="space-y-3">
        <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
          Health Checks
        </h2>

        {healthChecks.map((check) => (
          <div
            key={check.id}
            className={cn(
              'border rounded-xl p-4',
              check.status === 'pass' ? 'border-[var(--border)]' :
              check.status === 'warning' ? 'border-[var(--gold)]' :
              'border-error'
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-10 h-10 rounded-xl border flex items-center justify-center',
                check.status === 'pass' ? 'border-green-500' :
                check.status === 'warning' ? 'border-[var(--gold)]' :
                'border-error'
              )}>
                {check.status === 'pass' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : check.status === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-[var(--gold)]" />
                ) : (
                  <XCircle className="h-5 w-5 text-error" />
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-body-md font-medium text-[var(--foreground)]">
                  {check.name}
                </h3>
                <p className="text-body-sm text-[var(--foreground-muted)]">
                  {check.description}
                </p>
              </div>

              <div className="text-right">
                <span className={cn(
                  'text-body-lg font-bold',
                  check.status === 'pass' ? 'text-green-500' :
                  check.status === 'warning' ? 'text-[var(--gold)]' :
                  'text-error'
                )}>
                  {check.count}
                </span>
                <p className="text-body-xs text-[var(--foreground-muted)]">
                  {check.status === 'pass' ? 'OK' : 'issues'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Duplicate wines section */}
      {duplicates.length > 0 && (
        <div className="border border-[var(--gold)] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileWarning className="h-5 w-5 text-[var(--gold)]" />
            <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
              Potential Duplicates
            </h2>
          </div>
          <p className="text-body-sm text-[var(--foreground-secondary)] mb-4">
            These wines have the same name and may be duplicates. Review and merge if appropriate.
          </p>
          <div className="space-y-2">
            {duplicates.slice(0, 10).map((dup, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-b-0"
              >
                <div>
                  <p className="text-body-sm font-medium text-[var(--foreground)] capitalize">
                    {dup.wine_name}
                  </p>
                  <p className="text-body-xs text-[var(--foreground-muted)]">
                    {dup.producer || 'No producer'}
                  </p>
                </div>
                <span className="px-2 py-1 rounded border border-[var(--gold)] text-body-xs text-[var(--gold)]">
                  {dup.count} entries
                </span>
              </div>
            ))}
            {duplicates.length > 10 && (
              <p className="text-body-sm text-[var(--foreground-muted)] text-center pt-2">
                And {duplicates.length - 10} more...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="border border-[var(--border)] rounded-xl p-6">
        <h2 className="text-body-lg font-semibold text-[var(--foreground)] mb-4">
          Maintenance Actions
        </h2>
        <p className="text-body-sm text-[var(--foreground-muted)] mb-4">
          These actions help maintain data quality. Use with caution.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl',
              'text-body-sm font-medium',
              'border border-[var(--border)] text-[var(--foreground-secondary)]',
              'hover:border-[var(--wine)] hover:text-[var(--wine)]',
              'transition-colors'
            )}
            onClick={() => addToast({ type: 'info', message: 'Coming soon' })}
          >
            <Database className="h-4 w-4" />
            Recalculate Usage Counts
          </button>
          <button
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl',
              'text-body-sm font-medium',
              'border border-[var(--border)] text-[var(--foreground-secondary)]',
              'hover:border-[var(--wine)] hover:text-[var(--wine)]',
              'transition-colors'
            )}
            onClick={() => addToast({ type: 'info', message: 'Coming soon' })}
          >
            <Trash2 className="h-4 w-4" />
            Clean Orphaned Records
          </button>
          <button
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl',
              'text-body-sm font-medium',
              'border border-[var(--border)] text-[var(--foreground-secondary)]',
              'hover:border-[var(--wine)] hover:text-[var(--wine)]',
              'transition-colors'
            )}
            onClick={() => addToast({ type: 'info', message: 'Coming soon' })}
          >
            <Users className="h-4 w-4" />
            Purge Old Temp Accounts
          </button>
        </div>
      </div>
    </div>
  )
}
