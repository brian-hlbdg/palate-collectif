'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'
import { WineLoader } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import AdminWineForm from '@/components/AdminWineForm'
import WineDetailCard from '@/components/WineDetailCard'
import {
  ArrowLeft,
  Wine,
  Plus,
  Edit,
  Trash2,
  BarChart3,
  Calendar,
  MapPin,
  Users,
  Copy,
  Check,
  QrCode,
  Star,
  GripVertical,
} from 'lucide-react'

interface EventData {
  id: string
  event_code: string
  event_name: string
  event_date: string
  location?: string
  description?: string
  is_active: boolean
}

interface WineData {
  id: string
  wine_name: string
  producer?: string
  vintage?: number
  wine_type: string
  region?: string
  country?: string
  tasting_order?: number
  location_name?: string
  image_url?: string
  grape_varieties?: any
  wine_style?: any
  tasting_notes?: any
  technical_details?: any
  awards?: any
  alcohol_content?: number
  price_point?: string
  sommelier_notes?: string
}

interface LocationData {
  id: string
  location_name: string
  location_order: number
}

export default function AdminEventPage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<EventData | null>(null)
  const [wines, setWines] = useState<WineData[]>([])
  const [locations, setLocations] = useState<LocationData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState(false)

  // Wine form state
  const [showWineForm, setShowWineForm] = useState(false)
  const [editingWine, setEditingWine] = useState<WineData | null>(null)

  // Stats
  const [stats, setStats] = useState({ participants: 0, ratings: 0, avgRating: 0 })

  useEffect(() => {
    if (eventId) {
      loadData()
    }
  }, [eventId])

  const loadData = async () => {
    try {
      // Load event
      const { data: eventData, error: eventError } = await supabase
        .from('tasting_events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)

      // Load wines
      const { data: wineData } = await supabase
        .from('event_wines')
        .select('*')
        .eq('event_id', eventId)
        .order('tasting_order', { ascending: true })

      setWines(wineData || [])

      // Load locations
      const { data: locationData } = await supabase
        .from('event_locations')
        .select('*')
        .eq('event_id', eventId)
        .order('location_order', { ascending: true })

      setLocations(locationData || [])

      // Load stats
      if (wineData && wineData.length > 0) {
        const wineIds = wineData.map(w => w.id)
        const { data: ratings } = await supabase
          .from('user_wine_ratings')
          .select('user_id, rating')
          .in('event_wine_id', wineIds)

        if (ratings) {
          const uniqueUsers = new Set(ratings.map(r => r.user_id))
          const avgRating = ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0

          setStats({
            participants: uniqueUsers.size,
            ratings: ratings.length,
            avgRating: Math.round(avgRating * 10) / 10,
          })
        }
      }
    } catch (err) {
      console.error('Error loading event:', err)
      addToast({ type: 'error', message: 'Failed to load event' })
    } finally {
      setIsLoading(false)
    }
  }

  const copyEventCode = () => {
    if (event?.event_code) {
      navigator.clipboard.writeText(event.event_code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const deleteWine = async (wineId: string) => {
    if (!confirm('Are you sure you want to delete this wine?')) return

    try {
      const { error } = await supabase
        .from('event_wines')
        .delete()
        .eq('id', wineId)

      if (error) throw error
      addToast({ type: 'success', message: 'Wine deleted' })
      loadData()
    } catch (err) {
      console.error('Error deleting wine:', err)
      addToast({ type: 'error', message: 'Failed to delete wine' })
    }
  }

  const handleEditWine = (wine: WineData) => {
    setEditingWine(wine)
    setShowWineForm(true)
  }

  const handleAddWine = () => {
    setEditingWine(null)
    setShowWineForm(true)
  }

  const handleWineSaved = () => {
    setShowWineForm(false)
    setEditingWine(null)
    loadData()
  }

  // Group wines by location
  const groupedWines = () => {
    if (locations.length === 0) {
      return [{ location: null, wines }]
    }

    const groups: { location: LocationData | null; wines: WineData[] }[] = []
    
    locations.forEach(loc => {
      groups.push({
        location: loc,
        wines: wines.filter(w => w.location_name === loc.location_name)
      })
    })

    const unassigned = wines.filter(w => !w.location_name)
    if (unassigned.length > 0) {
      groups.push({ location: null, wines: unassigned })
    }

    return groups
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <WineLoader />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-body-md text-[var(--foreground-secondary)]">Event not found</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/admin/events')}>
          Back to Events
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/events')}
            className="p-2 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-display-md font-bold text-[var(--foreground)]">
              {event.event_name}
            </h1>
            <div className="flex items-center gap-4 mt-1 text-body-sm text-[var(--foreground-secondary)]">
              {event.event_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(event.event_date).toLocaleDateString()}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Event Code & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={copyEventCode}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-body-md',
              'bg-[var(--surface)] border border-[var(--border)]',
              'hover:border-[var(--foreground-muted)] transition-colors'
            )}
          >
            {copiedCode ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            <span>{event.event_code}</span>
          </button>

          <Button
            variant="secondary"
            leftIcon={<BarChart3 className="h-4 w-4" />}
            onClick={() => router.push(`/admin/events/${eventId}/analytics`)}
          >
            Analytics
          </Button>

          <Button
            variant="secondary"
            leftIcon={<Edit className="h-4 w-4" />}
            onClick={() => router.push(`/admin/events/${eventId}/edit`)}
          >
            Edit Event
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card variant="default" className="text-center py-4">
          <Wine className="h-6 w-6 mx-auto mb-2 text-[var(--wine)]" />
          <p className="text-display-sm font-bold text-[var(--foreground)]">{wines.length}</p>
          <p className="text-body-xs text-[var(--foreground-muted)]">Wines</p>
        </Card>
        <Card variant="default" className="text-center py-4">
          <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
          <p className="text-display-sm font-bold text-[var(--foreground)]">{stats.participants}</p>
          <p className="text-body-xs text-[var(--foreground-muted)]">Participants</p>
        </Card>
        <Card variant="default" className="text-center py-4">
          <Star className="h-6 w-6 mx-auto mb-2 text-[var(--gold)]" />
          <p className="text-display-sm font-bold text-[var(--foreground)]">{stats.avgRating || '-'}</p>
          <p className="text-body-xs text-[var(--foreground-muted)]">Avg Rating</p>
        </Card>
      </div>

      {/* Wines Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
            Event Wines
          </h2>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleAddWine}>
            Add Wine
          </Button>
        </div>

        {wines.length === 0 ? (
          <Card variant="default" className="text-center py-12">
            <Wine className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
            <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-2">
              No wines yet
            </h3>
            <p className="text-body-md text-[var(--foreground-secondary)] mb-4">
              Add wines for participants to taste and rate
            </p>
            <Button onClick={handleAddWine}>Add First Wine</Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedWines().map((group, groupIdx) => (
              <div key={group.location?.id || 'unassigned'}>
                {/* Location header */}
                {(locations.length > 0 || group.location) && (
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-[var(--wine)]" />
                    <h3 className="text-body-md font-semibold text-[var(--foreground)]">
                      {group.location?.location_name || 'Unassigned'}
                    </h3>
                    <span className="text-body-xs text-[var(--foreground-muted)]">
                      ({group.wines.length} wine{group.wines.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}

                {/* Wines in this group */}
                <div className="space-y-3">
                  {group.wines.map((wine, idx) => (
                    <div
                      key={wine.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--background)]"
                    >
                      {/* Order indicator */}
                      <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
                        <GripVertical className="h-4 w-4" />
                        <span className="text-body-sm font-mono w-6">#{wine.tasting_order || idx + 1}</span>
                      </div>

                      {/* Wine image/emoji */}
                      <div className={cn(
                        'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 text-xl',
                        getWineTypeBg(wine.wine_type)
                      )}>
                        {wine.image_url ? (
                          <img src={wine.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          getWineEmoji(wine.wine_type)
                        )}
                      </div>

                      {/* Wine info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-body-md font-medium text-[var(--foreground)] truncate">
                          {wine.wine_name}
                        </p>
                        <p className="text-body-sm text-[var(--foreground-muted)] truncate">
                          {[wine.producer, wine.vintage, wine.region].filter(Boolean).join(' · ')}
                        </p>
                      </div>

                      {/* Wine type badge */}
                      <span className={cn(
                        'px-2 py-1 rounded-full text-body-xs capitalize',
                        getWineTypeBadge(wine.wine_type)
                      )}>
                        {wine.wine_type}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditWine(wine)}
                          className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteWine(wine.id)}
                          className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wine Form Modal */}
      <AdminWineForm
        isOpen={showWineForm}
        onClose={() => { setShowWineForm(false); setEditingWine(null) }}
        eventId={eventId}
        initialWine={editingWine}
        onSave={handleWineSaved}
        locations={locations.map(l => ({ location_name: l.location_name }))}
        nextTastingOrder={wines.length + 1}
      />
    </div>
  )
}

// Helper functions
function getWineEmoji(wineType: string): string {
  const map: Record<string, string> = {
    red: '🍷', white: '🥂', rosé: '🌸', sparkling: '🍾',
    dessert: '🍯', fortified: '🥃', orange: '🍊'
  }
  return map[wineType?.toLowerCase()] || '🍷'
}

function getWineTypeBg(wineType: string): string {
  const map: Record<string, string> = {
    red: 'bg-red-900/20', white: 'bg-yellow-900/20', rosé: 'bg-pink-900/20',
    sparkling: 'bg-amber-900/20', dessert: 'bg-orange-900/20',
    fortified: 'bg-amber-900/20', orange: 'bg-orange-900/20'
  }
  return map[wineType?.toLowerCase()] || 'bg-red-900/20'
}

function getWineTypeBadge(wineType: string): string {
  const map: Record<string, string> = {
    red: 'bg-red-100 text-red-700', white: 'bg-yellow-100 text-yellow-700',
    rosé: 'bg-pink-100 text-pink-700', sparkling: 'bg-amber-100 text-amber-700',
    dessert: 'bg-orange-100 text-orange-700', fortified: 'bg-amber-100 text-amber-700',
    orange: 'bg-orange-100 text-orange-700'
  }
  return map[wineType?.toLowerCase()] || 'bg-gray-100 text-gray-700'
}
