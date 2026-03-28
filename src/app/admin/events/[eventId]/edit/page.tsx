'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button, Input, Textarea } from '@/components/ui'
import { WineLoader } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Type,
  Users,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  const eventId = params.eventId as string

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isBoothMode, setIsBoothMode] = useState(false)
  const [boothWelcomeMessage, setBoothWelcomeMessage] = useState('')

  useEffect(() => {
    const loadEvent = async () => {
      const { data, error } = await supabase
        .from('tasting_events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (error || !data) {
        addToast({ type: 'error', message: 'Event not found' })
        router.push('/admin/events')
        return
      }

      setEventName(data.event_name || '')
      setEventDate(data.event_date || '')
      setLocation(data.location || '')
      setDescription(data.description || '')
      setMaxParticipants(data.max_participants ? String(data.max_participants) : '')
      setIsActive(data.is_active ?? true)
      setIsBoothMode(data.is_booth_mode ?? false)
      setBoothWelcomeMessage(data.booth_welcome_message || '')
      setIsLoading(false)
    }

    loadEvent()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!eventName.trim()) newErrors.eventName = 'Event name is required'
    if (!eventDate) newErrors.eventDate = 'Event date is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('tasting_events')
        .update({
          event_name: eventName.trim(),
          event_date: eventDate,
          location: location.trim() || null,
          description: description.trim() || null,
          max_participants: maxParticipants ? parseInt(maxParticipants) : null,
          is_active: isActive,
          booth_welcome_message: isBoothMode ? boothWelcomeMessage.trim() || null : null,
        })
        .eq('id', eventId)

      if (error) throw error

      addToast({ type: 'success', message: 'Event updated' })
      router.push(`/admin/events/${eventId}`)
    } catch (err) {
      console.error('Error updating event:', err)
      addToast({ type: 'error', message: 'Failed to update event' })
    } finally {
      setIsSubmitting(false)
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
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-body-sm">Back</span>
        </button>
        <h1 className="text-display-md font-bold text-[var(--foreground)]">Edit Event</h1>
        <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
          Update event details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Active toggle */}
        <Card variant="outlined" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-md font-semibold text-[var(--foreground)]">Event Active</p>
              <p className="text-body-sm text-[var(--foreground-secondary)]">
                {isActive ? 'Guests can join and rate wines' : 'Event is closed to new participants'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(prev => !prev)}
              className="text-[var(--wine)]"
            >
              {isActive
                ? <ToggleRight className="h-8 w-8" />
                : <ToggleLeft className="h-8 w-8 text-[var(--foreground-muted)]" />
              }
            </button>
          </div>
        </Card>

        {/* Event Details */}
        <Card variant="outlined" padding="lg">
          <h2 className="text-body-lg font-semibold text-[var(--foreground)] mb-4">Event Details</h2>
          <div className="space-y-4">
            <Input
              label="Event Name"
              placeholder="e.g., Summer Wine Tasting 2024"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              leftIcon={<Type className="h-5 w-5" />}
              error={errors.eventName}
            />

            <Input
              label="Event Date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              leftIcon={<Calendar className="h-5 w-5" />}
              error={errors.eventDate}
            />

            <Input
              label="Location (Optional)"
              placeholder="e.g., 123 Vineyard Lane, Napa Valley"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              leftIcon={<MapPin className="h-5 w-5" />}
            />

            <Textarea
              label="Description (Optional)"
              placeholder="Tell guests what to expect..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Input
              label="Max Participants (Optional)"
              type="number"
              placeholder="Leave blank for unlimited"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              leftIcon={<Users className="h-5 w-5" />}
            />
          </div>
        </Card>

        {/* Booth Settings */}
        {isBoothMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <Card variant="outlined" padding="lg">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-[var(--gold)]" />
                <h2 className="text-body-lg font-semibold text-[var(--foreground)]">Booth Settings</h2>
              </div>
              <Textarea
                label="Welcome Message (Optional)"
                placeholder="Welcome to our wine tasting experience!"
                value={boothWelcomeMessage}
                onChange={(e) => setBoothWelcomeMessage(e.target.value)}
                hint="This message appears on the booth entry screen"
              />
            </Card>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
