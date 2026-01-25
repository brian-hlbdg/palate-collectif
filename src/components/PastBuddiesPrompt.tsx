'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'
import { WineLoader } from '@/components/ui'
import {
  Users,
  Check,
  Wine,
  Calendar,
} from 'lucide-react'
import {
  getPastBuddiesForEvent,
  setEventBuddyInclusion,
  type Buddy,
} from '@/lib/buddies'

interface PastBuddiesPromptProps {
  userId: string
  eventId: string
  eventName: string
  onComplete: () => void
  onSkip: () => void
}

export function PastBuddiesPrompt({
  userId,
  eventId,
  eventName,
  onComplete,
  onSkip
}: PastBuddiesPromptProps) {
  const [pastBuddies, setPastBuddies] = useState<{ buddy: Buddy; wasIncludedBefore: boolean }[]>([])
  const [selectedBuddies, setSelectedBuddies] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadPastBuddies()
  }, [userId, eventId])

  const loadPastBuddies = async () => {
    setIsLoading(true)
    const buddies = await getPastBuddiesForEvent(userId, eventId)
    setPastBuddies(buddies)
    
    // Pre-select permanent buddies and previously included ones
    const preSelected = new Set(
      buddies
        .filter(b => b.wasIncludedBefore || b.buddy.is_permanent)
        .map(b => b.buddy.buddy_id)
    )
    setSelectedBuddies(preSelected)
    
    setIsLoading(false)
  }

  const toggleBuddy = (buddyId: string) => {
    setSelectedBuddies(prev => {
      const next = new Set(prev)
      if (next.has(buddyId)) {
        next.delete(buddyId)
      } else {
        next.add(buddyId)
      }
      return next
    })
  }

  const handleConfirm = async () => {
    setIsSaving(true)
    
    // Save inclusion preferences for each buddy
    await Promise.all(
      pastBuddies.map(({ buddy }) =>
        setEventBuddyInclusion(
          eventId,
          userId,
          buddy.buddy_id,
          selectedBuddies.has(buddy.buddy_id)
        )
      )
    )
    
    setIsSaving(false)
    onComplete()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <WineLoader />
      </div>
    )
  }

  // If no past buddies, skip this step
  if (pastBuddies.length === 0) {
    onSkip()
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--wine-muted)] flex items-center justify-center mx-auto mb-4">
          <Users className="h-8 w-8 text-[var(--wine)]" />
        </div>
        <h2 className="text-display-sm font-bold text-[var(--foreground)]">
          Welcome to {eventName}!
        </h2>
        <p className="text-body-md text-[var(--foreground-secondary)] mt-2">
          You have tasting buddies from past events
        </p>
      </div>

      {/* Buddy Selection */}
      <Card variant="outlined" padding="lg">
        <p className="text-body-sm text-[var(--foreground-muted)] mb-4">
          Include them at this event to compare results later?
        </p>
        
        <div className="space-y-3">
          {pastBuddies.map(({ buddy }) => (
            <button
              key={buddy.buddy_id}
              onClick={() => toggleBuddy(buddy.buddy_id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                selectedBuddies.has(buddy.buddy_id)
                  ? 'border-[var(--wine)] bg-[var(--wine-muted)]'
                  : 'border-[var(--border)] hover:border-[var(--foreground-muted)]'
              )}
            >
              {/* Checkbox */}
              <div className={cn(
                'w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors',
                selectedBuddies.has(buddy.buddy_id)
                  ? 'bg-[var(--wine)] border-[var(--wine)]'
                  : 'border-[var(--border)]'
              )}>
                {selectedBuddies.has(buddy.buddy_id) && (
                  <Check className="h-4 w-4 text-white" />
                )}
              </div>

              {/* Buddy Avatar */}
              <div className="w-10 h-10 rounded-full bg-[var(--wine)] text-white flex items-center justify-center font-bold">
                {buddy.buddy_name?.charAt(0).toUpperCase() || '?'}
              </div>

              {/* Buddy Info */}
              <div className="flex-1 text-left">
                <p className="text-body-md font-medium text-[var(--foreground)]">
                  {buddy.buddy_name}
                </p>
                {buddy.connected_at_event_name && (
                  <p className="text-body-xs text-[var(--foreground-muted)] flex items-center gap-1">
                    <Wine className="h-3 w-3" />
                    Met at {buddy.connected_at_event_name}
                  </p>
                )}
              </div>

              {/* Permanent badge */}
              {buddy.is_permanent && (
                <span className="px-2 py-0.5 text-body-xs bg-[var(--wine-muted)] text-[var(--wine)] rounded-full">
                  Permanent
                </span>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Info */}
      <Card variant="wine" padding="md">
        <p className="text-body-sm text-[var(--foreground-secondary)]">
          💡 Your ratings stay private during the event. After it ends, you'll be able to compare tastes with your included buddies.
        </p>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          fullWidth
          size="lg"
          onClick={handleConfirm}
          isLoading={isSaving}
        >
          {selectedBuddies.size > 0 
            ? `Include ${selectedBuddies.size} Buddy${selectedBuddies.size > 1 ? 'ies' : ''}`
            : 'Continue Without Buddies'
          }
        </Button>
        
        <Button
          variant="ghost"
          fullWidth
          onClick={onSkip}
        >
          Start Fresh (No Buddies)
        </Button>
      </div>
    </motion.div>
  )
}

export default PastBuddiesPrompt
