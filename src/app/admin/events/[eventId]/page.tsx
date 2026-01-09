'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button, Input, Textarea, Badge } from '@/components/ui'
import { WineLoader, StatusBadge } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import QRCodeGenerator from '@/components/QRCodeGenerator'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Type,
  Users,
  Wine,
  Copy,
  ExternalLink,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  Star,
  QrCode,
} from 'lucide-react'

interface EventDetails {
  id: string
  event_code: string
  event_name: string
  event_date: string
  location?: string
  description?: string
  max_participants?: number
  is_active: boolean
  is_booth_mode: boolean
  access_type?: string
  booth_welcome_message?: string
  booth_logo_url?: string
  booth_primary_color?: string
}

interface EventStats {
  wineCount: number
  ratingCount: number
  participantCount: number
}

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<EventDetails | null>(null)
  const [stats, setStats] = useState<EventStats>({ wineCount: 0, ratingCount: 0, participantCount: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('')
  const [boothWelcomeMessage, setBoothWelcomeMessage] = useState('')

  // Load event
  useEffect(() => {
    const loadEvent = async () => {
      try {
        const { data: eventData } = await supabase
          .from('tasting_events')
          .select('*')
          .eq('id', eventId)
          .single()

        if (eventData) {
          setEvent(eventData)
          setEventName(eventData.event_name)
          setEventDate(eventData.event_date)
          setLocation(eventData.location || '')
          setDescription(eventData.description || '')
          setMaxParticipants(eventData.max_participants?.toString() || '')
          setBoothWelcomeMessage(eventData.booth_welcome_message || '')

          // Load stats
          const { data: wines } = await supabase
            .from('event_wines')
            .select('id')
            .eq('event_id', eventId)

          const wineIds = wines?.map(w => w.id) || []

          const { data: ratings } = await supabase
            .from('user_wine_ratings')
            .select('id, user_id')
            .in('event_wine_id', wineIds)

          const uniqueUsers = new Set(ratings?.map(r => r.user_id) || [])

          setStats({
            wineCount: wines?.length || 0,
            ratingCount: ratings?.length || 0,
            participantCount: uniqueUsers.size,
          })
        }
      } catch (err) {
        console.error('Error loading event:', err)
        addToast({ type: 'error', message: 'Failed to load event' })
      } finally {
        setIsLoading(false)
      }
    }

    loadEvent()
  }, [eventId, addToast])

  // Save event
  const handleSave = async () => {
    if (!event) return
    setIsSaving(true)

    try {
      const updateData = {
        event_name: eventName.trim(),
        event_date: eventDate,
        location: location.trim() || null,
        description: description.trim() || null,
        max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        booth_welcome_message: event.is_booth_mode ? boothWelcomeMessage.trim() || null : null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('tasting_events')
        .update(updateData)
        .eq('id', eventId)

      if (error) throw error

      setEvent({ ...event, ...updateData })
      addToast({ type: 'success', message: 'Event updated successfully' })
    } catch (err) {
      console.error('Error saving event:', err)
      addToast({ type: 'error', message: 'Failed to save changes' })
    } finally {
      setIsSaving(false)
    }
  }

  // Toggle active status
  const toggleStatus = async () => {
    if (!event) return

    try {
      const { error } = await supabase
        .from('tasting_events')
        .update({ is_active: !event.is_active })
        .eq('id', eventId)

      if (error) throw error

      setEvent({ ...event, is_active: !event.is_active })
      addToast({
        type: 'success',
        message: `Event ${event.is_active ? 'deactivated' : 'activated'}`,
      })
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to update status' })
    }
  }

  // Copy helpers
  const copyEventCode = () => {
    if (!event) return
    navigator.clipboard.writeText(event.event_code)
    addToast({ type: 'success', message: 'Event code copied!' })
  }

  const copyBoothUrl = () => {
    if (!event) return
    const url = `${window.location.origin}/booth/${event.event_code}`
    navigator.clipboard.writeText(url)
    addToast({ type: 'success', message: 'Booth URL copied!' })
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
      <Card variant="outlined" padding="lg" className="text-center">
        <p className="text-body-lg text-[var(--foreground-secondary)]">
          Event not found
        </p>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => router.push('/admin/events')}
        >
          Back to Events
        </Button>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/admin/events')}
          className="flex items-center gap-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-body-sm">Back to Events</span>
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-display-md font-bold text-[var(--foreground)]">
                {event.event_name}
              </h1>
              {event.is_booth_mode && (
                <Badge variant="gold">Booth</Badge>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={copyEventCode}
                className="flex items-center gap-2 text-body-sm text-[var(--foreground-secondary)] hover:text-[var(--wine)] transition-colors"
              >
                <span className="font-mono font-bold">{event.event_code}</span>
                <Copy className="h-4 w-4" />
              </button>
              <StatusBadge status={event.is_active ? 'active' : 'inactive'} />
            </div>
          </div>
          
          <div className="flex gap-2">
            <QRCodeGenerator
              eventCode={event.event_code}
              eventName={event.event_name}
              isBoothMode={event.is_booth_mode}
            />
            <Button
              variant="secondary"
              onClick={toggleStatus}
              leftIcon={event.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            >
              {event.is_active ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              onClick={handleSave}
              isLoading={isSaving}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card variant="default" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--wine-muted)] flex items-center justify-center">
              <Wine className="h-5 w-5 text-[var(--wine)]" />
            </div>
            <div>
              <p className="text-display-sm font-bold text-[var(--foreground)]">
                {stats.wineCount}
              </p>
              <p className="text-body-xs text-[var(--foreground-muted)]">Wines</p>
            </div>
          </div>
        </Card>
        <Card variant="default" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--gold-muted)] flex items-center justify-center">
              <Star className="h-5 w-5 text-[var(--gold)]" />
            </div>
            <div>
              <p className="text-display-sm font-bold text-[var(--foreground)]">
                {stats.ratingCount}
              </p>
              <p className="text-body-xs text-[var(--foreground-muted)]">Ratings</p>
            </div>
          </div>
        </Card>
        <Card variant="default" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--wine-muted)] flex items-center justify-center">
              <Users className="h-5 w-5 text-[var(--wine)]" />
            </div>
            <div>
              <p className="text-display-sm font-bold text-[var(--foreground)]">
                {stats.participantCount}
              </p>
              <p className="text-body-xs text-[var(--foreground-muted)]">Participants</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link href={`/admin/events/${eventId}/wines`}>
          <Card variant="outlined" padding="md" interactive className="h-full">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--wine-muted)] flex items-center justify-center">
                <Wine className="h-6 w-6 text-[var(--wine)]" />
              </div>
              <div>
                <h3 className="text-body-md font-semibold text-[var(--foreground)]">
                  Manage Wines
                </h3>
                <p className="text-body-sm text-[var(--foreground-secondary)]">
                  Add, edit, or remove wines
                </p>
              </div>
            </div>
          </Card>
        </Link>

        {event.is_booth_mode && (
          <button onClick={copyBoothUrl} className="text-left">
            <Card variant="outlined" padding="md" interactive className="h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--gold-muted)] flex items-center justify-center">
                  <ExternalLink className="h-6 w-6 text-[var(--gold)]" />
                </div>
                <div>
                  <h3 className="text-body-md font-semibold text-[var(--foreground)]">
                    Copy Booth URL
                  </h3>
                  <p className="text-body-sm text-[var(--foreground-secondary)]">
                    Share with attendees
                  </p>
                </div>
              </div>
            </Card>
          </button>
        )}
      </div>

      {/* Event Details Form */}
      <Card variant="outlined" padding="lg" className="mb-6">
        <h2 className="text-body-lg font-semibold text-[var(--foreground)] mb-4">
          Event Details
        </h2>
        
        <div className="space-y-4">
          <Input
            label="Event Name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            leftIcon={<Type className="h-5 w-5" />}
          />

          <Input
            label="Event Date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            leftIcon={<Calendar className="h-5 w-5" />}
          />

          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            leftIcon={<MapPin className="h-5 w-5" />}
            placeholder="Optional"
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
          />

          <Input
            label="Max Participants"
            type="number"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
            leftIcon={<Users className="h-5 w-5" />}
            placeholder="Leave blank for unlimited"
          />
        </div>
      </Card>

      {/* Booth Settings */}
      {event.is_booth_mode && (
        <Card variant="outlined" padding="lg">
          <h2 className="text-body-lg font-semibold text-[var(--foreground)] mb-4">
            Booth Settings
          </h2>
          
          <div className="space-y-4">
            <Textarea
              label="Welcome Message"
              value={boothWelcomeMessage}
              onChange={(e) => setBoothWelcomeMessage(e.target.value)}
              placeholder="Welcome to our wine tasting experience!"
            />

            <div className="p-4 rounded-xl bg-[var(--gold-muted)] border border-[var(--gold)]/20">
              <p className="text-body-sm text-[var(--foreground)] mb-1">
                <strong>Booth URL</strong>
              </p>
              <p className="text-body-sm font-mono text-[var(--foreground-secondary)] break-all">
                {typeof window !== 'undefined' ? window.location.origin : ''}/booth/{event.event_code}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
