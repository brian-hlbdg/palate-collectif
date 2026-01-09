'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button, Input, Textarea } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { generateEventCode } from '@/lib/utils'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Type,
  FileText,
  Users,
  Sparkles,
  Check,
  RefreshCw,
} from 'lucide-react'

type EventType = 'regular' | 'booth'

export default function NewEventPage() {
  const router = useRouter()
  const { addToast } = useToast()

  const [eventType, setEventType] = useState<EventType>('regular')
  const [eventName, setEventName] = useState('')
  const [eventCode, setEventCode] = useState(generateEventCode())
  const [eventDate, setEventDate] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [maxParticipants, setMaxParticipants] = useState('')
  
  // Booth-specific settings
  const [boothWelcomeMessage, setBoothWelcomeMessage] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const adminId = typeof window !== 'undefined'
    ? localStorage.getItem('palate-admin-user')
    : null

  const regenerateCode = () => {
    setEventCode(generateEventCode())
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!eventName.trim()) {
      newErrors.eventName = 'Event name is required'
    }
    if (!eventDate) {
      newErrors.eventDate = 'Event date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    if (!adminId) {
      addToast({ type: 'error', message: 'Not authenticated' })
      return
    }

    setIsSubmitting(true)

    try {
      const eventData = {
        admin_id: adminId,
        event_name: eventName.trim(),
        event_code: eventCode.toUpperCase(),
        event_date: eventDate,
        location: location.trim() || null,
        description: description.trim() || null,
        max_participants: maxParticipants ? parseInt(maxParticipants) : null,
        is_active: true,
        is_deleted: false,
        is_booth_mode: eventType === 'booth',
        access_type: eventType === 'booth' ? 'email_only' : 'event_code',
        booth_welcome_message: eventType === 'booth' ? boothWelcomeMessage.trim() || null : null,
      }

      const { data, error } = await supabase
        .from('tasting_events')
        .insert(eventData)
        .select('id')
        .single()

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation (duplicate event code)
          setErrors({ eventCode: 'This event code is already in use' })
          return
        }
        throw error
      }

      addToast({
        type: 'success',
        message: 'Event created successfully!',
      })

      // Navigate to event edit page to add wines
      router.push(`/admin/events/${data.id}`)
    } catch (err) {
      console.error('Error creating event:', err)
      addToast({
        type: 'error',
        message: 'Failed to create event. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
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
        <h1 className="text-display-md font-bold text-[var(--foreground)]">
          Create New Event
        </h1>
        <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
          Set up a new wine tasting event
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Type Selection */}
        <Card variant="outlined" padding="md">
          <label className="text-label-md text-[var(--foreground)] block mb-3">
            Event Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setEventType('regular')}
              className={cn(
                'p-4 rounded-xl border-2 text-left',
                'transition-all duration-200',
                eventType === 'regular'
                  ? 'border-[var(--wine)] bg-[var(--wine-muted)]'
                  : 'border-[var(--border)] hover:border-[var(--border-secondary)]'
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <Users className={cn(
                  'h-5 w-5',
                  eventType === 'regular' ? 'text-[var(--wine)]' : 'text-[var(--foreground-muted)]'
                )} />
                <span className={cn(
                  'text-body-md font-semibold',
                  eventType === 'regular' ? 'text-[var(--wine)]' : 'text-[var(--foreground)]'
                )}>
                  Wine Crawl
                </span>
                {eventType === 'regular' && (
                  <Check className="h-5 w-5 text-[var(--wine)] ml-auto" />
                )}
              </div>
              <p className="text-body-sm text-[var(--foreground-secondary)]">
                Guests join with an event code
              </p>
            </button>

            <button
              type="button"
              onClick={() => setEventType('booth')}
              className={cn(
                'p-4 rounded-xl border-2 text-left',
                'transition-all duration-200',
                eventType === 'booth'
                  ? 'border-[var(--gold)] bg-[var(--gold-muted)]'
                  : 'border-[var(--border)] hover:border-[var(--border-secondary)]'
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className={cn(
                  'h-5 w-5',
                  eventType === 'booth' ? 'text-[var(--gold)]' : 'text-[var(--foreground-muted)]'
                )} />
                <span className={cn(
                  'text-body-md font-semibold',
                  eventType === 'booth' ? 'text-[var(--gold)]' : 'text-[var(--foreground)]'
                )}>
                  Booth Mode
                </span>
                {eventType === 'booth' && (
                  <Check className="h-5 w-5 text-[var(--gold)] ml-auto" />
                )}
              </div>
              <p className="text-body-sm text-[var(--foreground-secondary)]">
                Walk-up guests enter email only
              </p>
            </button>
          </div>
        </Card>

        {/* Basic Info */}
        <Card variant="outlined" padding="lg">
          <h2 className="text-body-lg font-semibold text-[var(--foreground)] mb-4">
            Event Details
          </h2>
          
          <div className="space-y-4">
            <Input
              label="Event Name"
              placeholder="e.g., Summer Wine Tasting 2024"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              leftIcon={<Type className="h-5 w-5" />}
              error={errors.eventName}
            />

            <div>
              <label className="text-label-md text-[var(--foreground)] block mb-2">
                Event Code
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={eventCode}
                    onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    className={cn(
                      'w-full px-4 py-3 rounded-xl',
                      'bg-[var(--surface)] border',
                      'text-body-md font-mono tracking-wider text-center uppercase',
                      'text-[var(--foreground)]',
                      errors.eventCode
                        ? 'border-error'
                        : 'border-[var(--border)] focus:border-[var(--wine)]',
                      'focus:outline-none focus:ring-2 focus:ring-[var(--wine-muted)]',
                      'transition-colors duration-200'
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={regenerateCode}
                  className="flex-shrink-0"
                >
                  <RefreshCw className="h-5 w-5" />
                </Button>
              </div>
              {errors.eventCode && (
                <p className="text-body-sm text-error mt-2">{errors.eventCode}</p>
              )}
              <p className="text-body-xs text-[var(--foreground-muted)] mt-2">
                Guests will use this code to join your event
              </p>
            </div>

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
        {eventType === 'booth' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card variant="outlined" padding="lg">
              <h2 className="text-body-lg font-semibold text-[var(--foreground)] mb-4">
                Booth Settings
              </h2>
              
              <div className="space-y-4">
                <Textarea
                  label="Welcome Message (Optional)"
                  placeholder="Welcome to our wine tasting experience!"
                  value={boothWelcomeMessage}
                  onChange={(e) => setBoothWelcomeMessage(e.target.value)}
                  hint="This message appears on the booth entry screen"
                />

                <div className="p-4 rounded-xl bg-[var(--gold-muted)] border border-[var(--gold)]/20">
                  <p className="text-body-sm text-[var(--foreground)]">
                    <strong>Booth URL:</strong>{' '}
                    <span className="font-mono">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/booth/{eventCode}
                    </span>
                  </p>
                  <p className="text-body-xs text-[var(--foreground-secondary)] mt-1">
                    Share this URL or display as a QR code at your booth
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Submit buttons */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
          >
            Create Event
          </Button>
        </div>
      </form>
    </div>
  )
}
