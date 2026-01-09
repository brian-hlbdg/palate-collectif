'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { WineLoader } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Wine,
  Search,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Merge,
  Plus,
  Filter,
  Database,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
} from 'lucide-react'

interface UserWine {
  id: string
  wine_name: string
  producer?: string
  vintage?: number
  wine_type?: string
  region?: string
  country?: string
  price_point?: string
  alcohol_content?: number
  personal_notes?: string
  status: string
  added_date: string
  user_id?: string
  user_name?: string
  wine_master_id?: string
}

interface MasterWine {
  id: string
  wine_name: string
  producer?: string
  vintage?: number
  wine_type: string
  region?: string
  country?: string
  usage_count?: number
}

interface PotentialDuplicate {
  wine: MasterWine
  similarity: number
}

type TabType = 'pending' | 'merged' | 'rejected' | 'master'

export default function CuratorWinesPage() {
  const searchParams = useSearchParams()
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get('tab') as TabType) || 'pending'
  )
  const [userWines, setUserWines] = useState<UserWine[]>([])
  const [masterWines, setMasterWines] = useState<MasterWine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [duplicates, setDuplicates] = useState<Record<string, PotentialDuplicate[]>>({})

  // Load data based on active tab
  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setIsLoading(true)

    try {
      if (activeTab === 'master') {
        // Load master wines
        const { data } = await supabase
          .from('wines_master')
          .select('*')
          .order('wine_name', { ascending: true })
          .limit(100)

        setMasterWines(data || [])
      } else {
        // Load user wines with status filter
        const { data } = await supabase
          .from('user_wines')
          .select('*')
          .eq('status', activeTab)
          .order('added_date', { ascending: false })

        if (data) {
          // Get user names
          const userIds = [...new Set(data.map(w => w.user_id).filter(Boolean))]
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', userIds)

          const winesWithUsers = data.map(wine => ({
            ...wine,
            user_name: profiles?.find(p => p.id === wine.user_id)?.display_name,
          }))

          setUserWines(winesWithUsers)

          // Find potential duplicates for pending wines
          if (activeTab === 'pending') {
            await findDuplicates(winesWithUsers)
          }
        }
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Find potential duplicates in master list
  const findDuplicates = async (wines: UserWine[]) => {
    const duplicateMap: Record<string, PotentialDuplicate[]> = {}

    for (const wine of wines) {
      // Search for similar wines in master
      const searchTerms = [
        wine.wine_name,
        wine.producer,
      ].filter(Boolean).join(' ')

      const { data: matches } = await supabase
        .from('wines_master')
        .select('*')
        .or(`wine_name.ilike.%${wine.wine_name}%,producer.ilike.%${wine.producer || ''}%`)
        .limit(5)

      if (matches && matches.length > 0) {
        duplicateMap[wine.id] = matches.map(match => ({
          wine: match,
          similarity: calculateSimilarity(wine, match),
        })).filter(d => d.similarity > 0.3)
          .sort((a, b) => b.similarity - a.similarity)
      }
    }

    setDuplicates(duplicateMap)
  }

  // Simple similarity calculation
  const calculateSimilarity = (userWine: UserWine, masterWine: MasterWine): number => {
    let score = 0
    let total = 0

    // Wine name similarity (weighted heavily)
    if (userWine.wine_name && masterWine.wine_name) {
      const nameMatch = userWine.wine_name.toLowerCase().includes(masterWine.wine_name.toLowerCase()) ||
                       masterWine.wine_name.toLowerCase().includes(userWine.wine_name.toLowerCase())
      score += nameMatch ? 0.5 : 0
      total += 0.5
    }

    // Producer match
    if (userWine.producer && masterWine.producer) {
      const producerMatch = userWine.producer.toLowerCase() === masterWine.producer.toLowerCase()
      score += producerMatch ? 0.3 : 0
      total += 0.3
    }

    // Vintage match
    if (userWine.vintage && masterWine.vintage) {
      score += userWine.vintage === masterWine.vintage ? 0.1 : 0
      total += 0.1
    }

    // Region match
    if (userWine.region && masterWine.region) {
      score += userWine.region.toLowerCase() === masterWine.region.toLowerCase() ? 0.1 : 0
      total += 0.1
    }

    return total > 0 ? score / total : 0
  }

  // Approve and add to master
  const handleApprove = async (wine: UserWine) => {
    try {
      // Create master wine entry
      const { data: newMaster, error: masterError } = await supabase
        .from('wines_master')
        .insert({
          wine_name: wine.wine_name,
          producer: wine.producer || null,
          vintage: wine.vintage || null,
          wine_type: wine.wine_type || 'red',
          region: wine.region || null,
          country: wine.country || null,
          price_point: wine.price_point || null,
          alcohol_content: wine.alcohol_content || null,
          default_notes: wine.personal_notes || null,
          usage_count: 1,
        })
        .select('id')
        .single()

      if (masterError) throw masterError

      // Update user wine status and link to master
      const { error: updateError } = await supabase
        .from('user_wines')
        .update({
          status: 'merged',
          wine_master_id: newMaster.id,
        })
        .eq('id', wine.id)

      if (updateError) throw updateError

      addToast({ type: 'success', message: `"${wine.wine_name}" added to master list` })
      loadData()
    } catch (err) {
      console.error('Error approving wine:', err)
      addToast({ type: 'error', message: 'Failed to approve wine' })
    }
  }

  // Merge with existing master wine
  const handleMerge = async (userWine: UserWine, masterWine: MasterWine) => {
    try {
      // Update user wine to point to existing master
      const { error } = await supabase
        .from('user_wines')
        .update({
          status: 'merged',
          wine_master_id: masterWine.id,
        })
        .eq('id', userWine.id)

      if (error) throw error

      // Increment usage count on master
      await supabase
        .from('wines_master')
        .update({ usage_count: (masterWine.usage_count || 0) + 1 })
        .eq('id', masterWine.id)

      addToast({ type: 'success', message: `Merged with "${masterWine.wine_name}"` })
      loadData()
    } catch (err) {
      console.error('Error merging wine:', err)
      addToast({ type: 'error', message: 'Failed to merge wine' })
    }
  }

  // Reject wine
  const handleReject = async (wine: UserWine, reason?: string) => {
    try {
      const { error } = await supabase
        .from('user_wines')
        .update({
          status: 'rejected',
          // rejection_reason: reason, // Add this column if needed
        })
        .eq('id', wine.id)

      if (error) throw error

      addToast({ type: 'success', message: 'Wine rejected' })
      loadData()
    } catch (err) {
      console.error('Error rejecting wine:', err)
      addToast({ type: 'error', message: 'Failed to reject wine' })
    }
  }

  // Filter wines by search
  const filteredUserWines = userWines.filter(wine =>
    !searchQuery ||
    wine.wine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wine.producer?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredMasterWines = masterWines.filter(wine =>
    !searchQuery ||
    wine.wine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wine.producer?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabs: { id: TabType; label: string; icon: typeof Wine; count?: number }[] = [
    { id: 'pending', label: 'Pending', icon: Clock, count: userWines.length },
    { id: 'merged', label: 'Merged', icon: CheckCircle },
    { id: 'rejected', label: 'Rejected', icon: XCircle },
    { id: 'master', label: 'Master List', icon: Database },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-display-md font-bold text-[var(--foreground)]">
          Wine Review
        </h1>
        <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
          Review user submissions and manage the master wine database
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)] pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl',
              'text-body-sm font-medium',
              'border transition-all duration-200',
              activeTab === tab.id
                ? 'border-[var(--wine)] text-[var(--wine)]'
                : 'border-transparent text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.id === 'pending' && userWines.length > 0 && activeTab !== 'pending' && (
              <span className="px-1.5 py-0.5 rounded text-body-xs border border-[var(--wine)] text-[var(--wine)]">
                {userWines.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--foreground-muted)]" />
        <input
          type="text"
          placeholder="Search wines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            'w-full pl-12 pr-4 py-3 rounded-xl',
            'bg-transparent border border-[var(--border)]',
            'text-body-md text-[var(--foreground)]',
            'placeholder:text-[var(--foreground-muted)]',
            'focus:outline-none focus:border-[var(--wine)]',
            'transition-colors duration-200'
          )}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <WineLoader />
        </div>
      ) : activeTab === 'master' ? (
        /* Master wine list */
        <div className="space-y-3">
          {filteredMasterWines.length === 0 ? (
            <EmptyState message="No wines in master list" />
          ) : (
            filteredMasterWines.map((wine) => (
              <MasterWineCard key={wine.id} wine={wine} />
            ))
          )}
        </div>
      ) : (
        /* User wine list */
        <div className="space-y-3">
          {filteredUserWines.length === 0 ? (
            <EmptyState
              message={
                activeTab === 'pending'
                  ? 'No wines pending review'
                  : activeTab === 'merged'
                  ? 'No merged wines'
                  : 'No rejected wines'
              }
            />
          ) : (
            filteredUserWines.map((wine) => (
              <UserWineCard
                key={wine.id}
                wine={wine}
                isExpanded={expandedId === wine.id}
                onToggle={() => setExpandedId(expandedId === wine.id ? null : wine.id)}
                duplicates={duplicates[wine.id] || []}
                onApprove={() => handleApprove(wine)}
                onMerge={(masterWine) => handleMerge(wine, masterWine)}
                onReject={() => handleReject(wine)}
                showActions={activeTab === 'pending'}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// User wine card component
function UserWineCard({
  wine,
  isExpanded,
  onToggle,
  duplicates,
  onApprove,
  onMerge,
  onReject,
  showActions,
}: {
  wine: UserWine
  isExpanded: boolean
  onToggle: () => void
  duplicates: PotentialDuplicate[]
  onApprove: () => void
  onMerge: (masterWine: MasterWine) => void
  onReject: () => void
  showActions: boolean
}) {
  return (
    <div className={cn(
      'border rounded-xl',
      duplicates.length > 0 ? 'border-[var(--gold)]' : 'border-[var(--border)]'
    )}>
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Wine icon */}
          <div className="w-12 h-12 rounded-xl border border-[var(--border)] flex items-center justify-center text-xl flex-shrink-0">
            {getWineEmoji(wine.wine_type || 'red')}
          </div>

          {/* Wine info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-body-md font-semibold text-[var(--foreground)] truncate">
                {wine.wine_name}
              </h3>
              {duplicates.length > 0 && (
                <span className="px-2 py-0.5 rounded text-body-xs border border-[var(--gold)] text-[var(--gold)]">
                  {duplicates.length} possible match{duplicates.length !== 1 ? 'es' : ''}
                </span>
              )}
            </div>
            <p className="text-body-sm text-[var(--foreground-secondary)]">
              {[wine.producer, wine.vintage, wine.region].filter(Boolean).join(' · ')}
            </p>
            <p className="text-body-xs text-[var(--foreground-muted)] mt-1">
              Submitted by {wine.user_name || 'Unknown'} · {formatTimeAgo(wine.added_date)}
            </p>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-2">
              <button
                onClick={onApprove}
                className={cn(
                  'p-2 rounded-lg border border-green-500 text-green-500',
                  'hover:bg-green-500/10 transition-colors'
                )}
                title="Approve as new"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={onReject}
                className={cn(
                  'p-2 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)]',
                  'hover:border-error hover:text-error transition-colors'
                )}
                title="Reject"
              >
                <X className="h-4 w-4" />
              </button>
              {duplicates.length > 0 && (
                <button
                  onClick={onToggle}
                  className={cn(
                    'p-2 rounded-lg border border-[var(--gold)] text-[var(--gold)]',
                    'hover:bg-[var(--gold)]/10 transition-colors'
                  )}
                  title="View matches"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded duplicates section */}
      <AnimatePresence>
        {isExpanded && duplicates.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-[var(--border)]">
              <p className="text-body-xs text-[var(--foreground-muted)] mb-3">
                Possible matches in master list:
              </p>
              <div className="space-y-2">
                {duplicates.map((dup) => (
                  <div
                    key={dup.wine.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)]"
                  >
                    <div>
                      <p className="text-body-sm font-medium text-[var(--foreground)]">
                        {dup.wine.wine_name}
                      </p>
                      <p className="text-body-xs text-[var(--foreground-muted)]">
                        {[dup.wine.producer, dup.wine.vintage, dup.wine.region].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-body-xs text-[var(--foreground-muted)]">
                        {Math.round(dup.similarity * 100)}% match
                      </span>
                      <button
                        onClick={() => onMerge(dup.wine)}
                        className={cn(
                          'flex items-center gap-1 px-3 py-1.5 rounded-lg',
                          'text-body-xs font-medium',
                          'border border-[var(--wine)] text-[var(--wine)]',
                          'hover:bg-[var(--wine)]/10 transition-colors'
                        )}
                      >
                        <Merge className="h-3 w-3" />
                        Merge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Master wine card component
function MasterWineCard({ wine }: { wine: MasterWine }) {
  return (
    <div className="border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl border border-[var(--border)] flex items-center justify-center text-xl flex-shrink-0">
          {getWineEmoji(wine.wine_type)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-body-md font-semibold text-[var(--foreground)] truncate">
            {wine.wine_name}
          </h3>
          <p className="text-body-sm text-[var(--foreground-secondary)]">
            {[wine.producer, wine.vintage, wine.region, wine.country].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-body-sm font-medium text-[var(--foreground)]">
            {wine.usage_count || 0}
          </p>
          <p className="text-body-xs text-[var(--foreground-muted)]">uses</p>
        </div>
      </div>
    </div>
  )
}

// Empty state component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 border border-[var(--border)] rounded-xl">
      <CheckCircle className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
      <p className="text-body-md text-[var(--foreground-secondary)]">{message}</p>
    </div>
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
