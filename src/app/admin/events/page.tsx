'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button, Badge, Input } from '@/components/ui'
import { StatusBadge, ListSkeleton } from '@/components/ui'
import { ConfirmDialog } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Wine,
  Star,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react'

interface Event {
  id: string
  event_code: string
  event_name: string
  event_date: string
  location?: string
  is_active: boolean
  is_booth_mode: boolean
  access_type?: string
  wine_count: number
  rating_count: number
}

type FilterType = 'all' | 'active' | 'inactive' | 'booth'

export default function AdminEventsPage() {
  const { addToast } = useToast()
  
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const adminId = typeof window !== 'undefined'
    ? localStorage.getItem('palate-admin-user')
    : null

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      if (!adminId) return

      try {
        const { data: eventsData } = await supabase
          .from('tasting_events')
          .select('id, event_code, event_name, event_date, location, is_active, is_booth_mode, access_type, is_deleted')
          .eq('admin_id', adminId)
          .eq('is_deleted', false)
          .order('event_date', { ascending: false })

        if (eventsData) {
          // Get wine and rating counts
          const eventIds = eventsData.map(e => e.id)
          
          const { data: wines } = await supabase
            .from('event_wines')
            .select('id, event_id')
            .in('event_id', eventIds)

          const { data: ratings } = await supabase
            .from('user_wine_ratings')
            .select('id, event_wine_id')

          const wineIds = wines?.map(w => w.id) || []

          const eventsWithCounts = eventsData.map(event => ({
            ...event,
            wine_count: wines?.filter(w => w.event_id === event.id).length || 0,
            rating_count: ratings?.filter(r => {
              const wine = wines?.find(w => w.id === r.event_wine_id)
              return wine?.event_id === event.id
            }).length || 0,
          }))

          setEvents(eventsWithCounts)
        }
      } catch (err) {
        console.error('Error loading events:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [adminId])

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchQuery ||
      event.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.event_code.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'active' && event.is_active) ||
      (filterType === 'inactive' && !event.is_active) ||
      (filterType === 'booth' && event.is_booth_mode)

    return matchesSearch && matchesFilter
  })

  // Toggle event active status
  const toggleEventStatus = async (event: Event) => {
    try {
      const { error } = await supabase
        .from('tasting_events')
        .update({ is_active: !event.is_active })
        .eq('id', event.id)

      if (error) throw error

      setEvents(prev =>
        prev.map(e =>
          e.id === event.id ? { ...e, is_active: !e.is_active } : e
        )
      )

      addToast({
        type: 'success',
        message: `Event ${event.is_active ? 'deactivated' : 'activated'}`,
      })
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Failed to update event status',
      })
    }
  }

  // Delete event (soft delete)
  const handleDeleteEvent = async () => {
    if (!deleteEvent) return
    setIsDeleting(true)

    try {
      const { error } = await supabase
        .from('tasting_events')
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq('id', deleteEvent.id)

      if (error) throw error

      setEvents(prev => prev.filter(e => e.id !== deleteEvent.id))
      addToast({
        type: 'success',
        message: 'Event deleted',
      })
    } catch (err) {
      addToast({
        type: 'error',
        message: 'Failed to delete event',
      })
    } finally {
      setIsDeleting(false)
      setDeleteEvent(null)
    }
  }

  // Copy event code
  const copyEventCode = (code: string) => {
    navigator.clipboard.writeText(code)
    addToast({
      type: 'success',
      message: 'Event code copied!',
    })
  }

  // Copy booth URL
  const copyBoothUrl = (code: string) => {
    const url = `${window.location.origin}/booth/${code}`
    navigator.clipboard.writeText(url)
    addToast({
      type: 'success',
      message: 'Booth URL copied!',
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-32 bg-[var(--border)] rounded animate-pulse" />
          <div className="h-10 w-32 bg-[var(--border)] rounded animate-pulse" />
        </div>
        <ListSkeleton count={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-md font-bold text-[var(--foreground)]">
            Events
          </h1>
          <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
            Manage your wine tasting events
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button leftIcon={<Plus className="h-5 w-5" />}>
            New Event
          </Button>
        </Link>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--foreground-muted)]" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full pl-10 pr-4 py-2.5 rounded-xl',
                'bg-[var(--surface)] border border-[var(--border)]',
                'text-body-md text-[var(--foreground)]',
                'placeholder:text-[var(--foreground-muted)]',
                'focus:outline-none focus:border-[var(--wine)]',
                'transition-colors duration-200'
              )}
            />
          </div>
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive', 'booth'] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                'px-4 py-2.5 rounded-xl text-body-sm font-medium',
                'transition-colors duration-200',
                filterType === type
                  ? 'bg-[var(--wine)] text-white'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--border-secondary)]'
              )}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Events list */}
      {filteredEvents.length === 0 ? (
        <Card variant="outlined" padding="lg" className="text-center">
          <Calendar className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
          <h3 className="text-body-lg font-medium text-[var(--foreground)] mb-2">
            {searchQuery || filterType !== 'all'
              ? 'No events match your search'
              : 'No events yet'}
          </h3>
          <p className="text-body-md text-[var(--foreground-secondary)] mb-4">
            {searchQuery || filterType !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first wine tasting event'}
          </p>
          {!searchQuery && filterType === 'all' && (
            <Link href="/admin/events/new">
              <Button leftIcon={<Plus className="h-5 w-5" />}>
                Create Event
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <EventRow
                event={event}
                onToggleStatus={() => toggleEventStatus(event)}
                onDelete={() => setDeleteEvent(event)}
                onCopyCode={() => copyEventCode(event.event_code)}
                onCopyBoothUrl={() => copyBoothUrl(event.event_code)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteEvent}
        onClose={() => setDeleteEvent(null)}
        onConfirm={handleDeleteEvent}
        title="Delete Event"
        description={`Are you sure you want to delete "${deleteEvent?.event_name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}

// Event row component
function EventRow({
  event,
  onToggleStatus,
  onDelete,
  onCopyCode,
  onCopyBoothUrl,
}: {
  event: Event
  onToggleStatus: () => void
  onDelete: () => void
  onCopyCode: () => void
  onCopyBoothUrl: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Card variant="default" padding="none" className="overflow-visible">
      <div className="flex items-center p-4 gap-4">
        {/* Event code */}
        <button
          onClick={onCopyCode}
          className={cn(
            'w-16 h-16 rounded-xl flex-shrink-0',
            'bg-[var(--wine-muted)] hover:bg-[var(--wine)]/20',
            'flex items-center justify-center',
            'transition-colors duration-200'
          )}
          title="Click to copy event code"
        >
          <span className="text-body-sm font-mono font-bold text-[var(--wine)]">
            {event.event_code}
          </span>
        </button>

        {/* Event info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/admin/events/${event.id}`}
              className="text-body-md font-semibold text-[var(--foreground)] hover:text-[var(--wine)] transition-colors truncate"
            >
              {event.event_name}
            </Link>
            {event.is_booth_mode && (
              <Badge variant="gold" size="sm">Booth</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-body-sm text-[var(--foreground-secondary)]">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(event.event_date)}
            </span>
            {event.location && (
              <span className="truncate hidden sm:inline">
                {event.location}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-body-xs text-[var(--foreground-muted)] flex items-center gap-1">
              <Wine className="h-3.5 w-3.5" />
              {event.wine_count} wines
            </span>
            <span className="text-body-xs text-[var(--foreground-muted)] flex items-center gap-1">
              <Star className="h-3.5 w-3.5" />
              {event.rating_count} ratings
            </span>
          </div>
        </div>

        {/* Status */}
        <StatusBadge
          status={event.is_active ? 'active' : 'inactive'}
          size="sm"
        />

        {/* Actions menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={cn(
              'p-2 rounded-xl',
              'text-[var(--foreground-muted)]',
              'hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)]',
              'transition-colors duration-200'
            )}
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                {/* Menu */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    'absolute right-0 top-full mt-2 z-20',
                    'w-48 py-2 rounded-xl',
                    'bg-[var(--surface)]',
                    'border border-[var(--border)]',
                    'shadow-[var(--shadow-elevation-2)]'
                  )}
                >
                  <Link
                    href={`/admin/events/${event.id}`}
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-4 py-2 text-body-sm text-[var(--foreground)] hover:bg-[var(--hover-overlay)]"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Event
                  </Link>
                  <Link
                    href={`/admin/events/${event.id}/wines`}
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-4 py-2 text-body-sm text-[var(--foreground)] hover:bg-[var(--hover-overlay)]"
                  >
                    <Wine className="h-4 w-4" />
                    Manage Wines
                  </Link>
                  <button
                    onClick={() => {
                      onCopyCode()
                      setShowMenu(false)
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-body-sm text-[var(--foreground)] hover:bg-[var(--hover-overlay)]"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Code
                  </button>
                  {event.is_booth_mode && (
                    <button
                      onClick={() => {
                        onCopyBoothUrl()
                        setShowMenu(false)
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-body-sm text-[var(--foreground)] hover:bg-[var(--hover-overlay)]"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Copy Booth URL
                    </button>
                  )}
                  <div className="h-px bg-[var(--border)] my-2" />
                  <button
                    onClick={() => {
                      onToggleStatus()
                      setShowMenu(false)
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-body-sm text-[var(--foreground)] hover:bg-[var(--hover-overlay)]"
                  >
                    {event.is_active ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        Activate
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      onDelete()
                      setShowMenu(false)
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-body-sm text-error hover:bg-[var(--hover-overlay)]"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  )
}
