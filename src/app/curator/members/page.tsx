'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { WineLoader } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Users,
  UserCheck,
  TrendingUp,
  Search,
  Printer,
  Calendar,
  Wine,
  Star,
  ArrowUpDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MemberRow {
  id: string
  display_name: string
  email: string | null
  eventbrite_email: string | null
  converted_at: string | null
  created_at: string
  rating_count: number
  event_count: number
  avg_rating: number
}

type SortKey = 'display_name' | 'converted_at' | 'rating_count' | 'event_count'
type SortDir = 'asc' | 'desc'

export default function CuratorMembersPage() {
  const [members, setMembers] = useState<MemberRow[]>([])
  const [filtered, setFiltered] = useState<MemberRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('converted_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [totalPerm, setTotalPerm] = useState(0)
  const [conversionsThisMonth, setConversionsThisMonth] = useState(0)
  const [conversionsAllTime, setConversionsAllTime] = useState(0)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    const result = members.filter(m =>
      m.display_name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.eventbrite_email?.toLowerCase().includes(q)
    )
    setFiltered(sortMembers(result, sortKey, sortDir))
  }, [search, members, sortKey, sortDir])

  const sortMembers = (list: MemberRow[], key: SortKey, dir: SortDir) =>
    [...list].sort((a, b) => {
      let av: string | number = a[key] ?? ''
      let bv: string | number = b[key] ?? ''
      if (key === 'display_name') {
        av = (av as string).toLowerCase()
        bv = (bv as string).toLowerCase()
      }
      if (av < bv) return dir === 'asc' ? -1 : 1
      if (av > bv) return dir === 'asc' ? 1 : -1
      return 0
    })

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const load = async () => {
    try {
      // All permanent, non-admin, non-curator accounts
      const { data: profiles, count: permCount } = await supabase
        .from('profiles')
        .select('id, display_name, email, eventbrite_email, converted_at, created_at', { count: 'exact' })
        .eq('is_temp_account', false)
        .eq('is_admin', false)
        .order('converted_at', { ascending: false })

      setTotalPerm(permCount || 0)

      // Conversions this month
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      const thisMonthProfiles = (profiles || []).filter(p =>
        p.converted_at && new Date(p.converted_at) >= monthStart
      )
      setConversionsThisMonth(thisMonthProfiles.length)
      setConversionsAllTime((profiles || []).filter(p => p.converted_at).length)

      if (!profiles || profiles.length === 0) {
        setMembers([])
        setFiltered([])
        setIsLoading(false)
        return
      }

      // Get rating stats per user
      const ids = profiles.map(p => p.id)
      const { data: ratings } = await supabase
        .from('user_wine_ratings')
        .select('user_id, rating, event_wine_id')
        .in('user_id', ids)

      // Get event counts via event_wines
      const wineIds = [...new Set((ratings || []).map(r => r.event_wine_id))]
      const { data: eventWines } = wineIds.length > 0
        ? await supabase
            .from('event_wines')
            .select('id, event_id')
            .in('id', wineIds)
        : { data: [] }

      const rows: MemberRow[] = profiles.map(p => {
        const userRatings = (ratings || []).filter(r => r.user_id === p.id)
        const ratedWineIds = userRatings.map(r => r.event_wine_id)
        const eventIds = new Set(
          (eventWines || [])
            .filter(w => ratedWineIds.includes(w.id))
            .map(w => w.event_id)
        )
        const avg = userRatings.length
          ? userRatings.reduce((s, r) => s + r.rating, 0) / userRatings.length
          : 0

        return {
          ...p,
          rating_count: userRatings.length,
          event_count: eventIds.size,
          avg_rating: Math.round(avg * 10) / 10,
        }
      })

      setMembers(rows)
      setFiltered(sortMembers(rows, 'converted_at', 'desc'))
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
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
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-display-sm font-bold text-[var(--foreground)]">Members</h1>
          <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
            Permanent user accounts and conversion activity
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] text-body-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:border-[var(--border-secondary)] transition-colors"
        >
          <Printer className="h-4 w-4" />
          Print Report
        </button>
      </div>

      {/* Print header (only visible when printing) */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">Palate — Member Report</h1>
        <p className="text-sm text-gray-500">Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Total Members"
          value={totalPerm}
          color="wine"
        />
        <StatCard
          icon={UserCheck}
          label="Conversions This Month"
          value={conversionsThisMonth}
          color="gold"
        />
        <StatCard
          icon={TrendingUp}
          label="All-Time Conversions"
          value={conversionsAllTime}
          color="wine"
        />
      </div>

      {/* Search */}
      <div className="relative print:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)]" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-body-md text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--wine)]"
        />
      </div>

      {/* Table */}
      <div ref={printRef} className="rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-3" />
            <p className="text-body-md text-[var(--foreground-secondary)]">
              {search ? 'No members match that search' : 'No permanent accounts yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                  <Th label="Name" sortKey="display_name" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-body-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
                    Email
                  </th>
                  <Th label="Member Since" sortKey="converted_at" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <Th label="Events" sortKey="event_count" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <Th label="Wines Rated" sortKey="rating_count" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-body-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
                    Avg Rating
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((member, i) => (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-[var(--hover-overlay)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--wine-muted)] flex items-center justify-center flex-shrink-0">
                          <span className="text-body-xs font-semibold text-[var(--wine)]">
                            {member.display_name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <span className="text-body-sm font-medium text-[var(--foreground)]">
                          {member.display_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-[var(--foreground-secondary)]">
                      {member.email || member.eventbrite_email || '—'}
                    </td>
                    <td className="px-4 py-3 text-body-sm text-[var(--foreground-secondary)]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[var(--foreground-muted)]" />
                        {member.converted_at
                          ? formatDate(member.converted_at)
                          : <span className="text-[var(--foreground-muted)]">—</span>
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[var(--foreground-muted)]" />
                        <span className="text-body-sm text-[var(--foreground)]">{member.event_count}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Wine className="h-3.5 w-3.5 text-[var(--foreground-muted)]" />
                        <span className="text-body-sm text-[var(--foreground)]">{member.rating_count}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {member.avg_rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 text-[var(--gold)] fill-[var(--gold)]" />
                          <span className="text-body-sm text-[var(--foreground)]">{member.avg_rating}</span>
                        </div>
                      ) : (
                        <span className="text-body-sm text-[var(--foreground-muted)]">—</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-body-xs text-[var(--foreground-muted)] print:hidden">
          Showing {filtered.length} of {members.length} members
        </p>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Users
  label: string
  value: number
  color: 'wine' | 'gold'
}) {
  return (
    <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-4 flex items-center gap-4">
      <div className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
        color === 'wine' ? 'bg-[var(--wine-muted)]' : 'bg-[var(--gold-muted)]'
      )}>
        <Icon className={cn('h-6 w-6', color === 'wine' ? 'text-[var(--wine)]' : 'text-[var(--gold)]')} />
      </div>
      <div>
        <p className="text-display-sm font-bold text-[var(--foreground)]">{value.toLocaleString()}</p>
        <p className="text-body-xs text-[var(--foreground-muted)]">{label}</p>
      </div>
    </div>
  )
}

function Th({
  label,
  sortKey: key,
  current,
  dir,
  onSort,
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onSort: (k: SortKey) => void
}) {
  const active = current === key
  return (
    <th className="px-4 py-3">
      <button
        onClick={() => onSort(key)}
        className={cn(
          'flex items-center gap-1 text-body-xs font-semibold uppercase tracking-wide transition-colors',
          active ? 'text-[var(--wine)]' : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
        )}
      >
        {label}
        <ArrowUpDown className={cn('h-3 w-3', active ? 'opacity-100' : 'opacity-40')} />
      </button>
    </th>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
