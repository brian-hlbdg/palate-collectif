'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button, Card, Textarea } from '@/components/ui'
import { StarRating, WineLoader } from '@/components/ui'
import { WineTypeBadge } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Wine,
  MapPin,
  Calendar,
  Grape,
  ShoppingBag,
  X,
} from 'lucide-react'

interface WineDetails {
  id: string
  wine_name: string
  producer?: string
  vintage?: string
  wine_type: string
  region?: string
  country?: string
  sommelier_notes?: string
  alcohol_content?: string
  price_point?: string
  grape_varieties?: { name: string; percentage?: number }[]
  tasting_notes?: {
    appearance?: string
    aroma?: string
    taste?: string
    finish?: string
  }
  tasting_order: number
  location_name?: string
  image_url?: string
  beverage_type?: string
  wine_style?: string[]
  winemaker_notes?: string
}

interface UserRating {
  rating: number
  personal_notes?: string
  would_buy?: boolean
}

export default function BoothRatePage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  
  const eventCode = params.eventId as string // This is actually the event_code
  const wineId = params.wineId as string

  const [event, setEvent] = useState<{ id: string; event_code: string } | null>(null)
  const [wine, setWine] = useState<WineDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // Rating state
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [wouldBuy, setWouldBuy] = useState(false)
  const [hasExistingRating, setHasExistingRating] = useState(false)
  
  // Navigation
  const [allWineIds, setAllWineIds] = useState<string[]>([])
  const [showDetails, setShowDetails] = useState(false)

  const userId = typeof window !== 'undefined'
    ? localStorage.getItem('palate-booth-user')
    : null

  // Load wine and existing rating
  useEffect(() => {
    const loadData = async () => {
      if (!userId) {
        router.push(`/booth/${eventCode}`)
        return
      }

      try {
        // First get the event by event_code
        const { data: eventData } = await supabase
          .from('tasting_events')
          .select('id, event_code')
          .eq('event_code', eventCode.toUpperCase())
          .single()

        if (!eventData) {
          router.push(`/booth/${eventCode}`)
          return
        }

        setEvent(eventData)

        // Load wine details
        const { data: wineData } = await supabase
          .from('event_wines')
          .select('*')
          .eq('id', wineId)
          .single()

        if (wineData) {
          setWine(wineData)
        }

        // Load all wine IDs for navigation
        const { data: allWines } = await supabase
          .from('event_wines')
          .select('id')
          .eq('event_id', eventData.id)
          .order('location_order', { ascending: true, nullsFirst: false })
          .order('tasting_order', { ascending: true })

        if (allWines) {
          setAllWineIds(allWines.map((w) => w.id))
        }

        // Load existing rating
        const { data: existingRating } = await supabase
          .from('user_wine_ratings')
          .select('rating, personal_notes, would_buy')
          .eq('user_id', userId)
          .eq('event_wine_id', wineId)
          .single()

        if (existingRating) {
          setRating(existingRating.rating)
          setNotes(existingRating.personal_notes || '')
          setWouldBuy(existingRating.would_buy || false)
          setHasExistingRating(true)
        }
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [eventCode, wineId, userId, router])

  // Navigation helpers
  const currentIndex = allWineIds.indexOf(wineId)
  const prevWineId = currentIndex > 0 ? allWineIds[currentIndex - 1] : null
  const nextWineId = currentIndex < allWineIds.length - 1 ? allWineIds[currentIndex + 1] : null

  // Save rating
  const handleSave = async () => {
    if (!userId || rating === 0) return

    setIsSaving(true)

    try {
      const ratingData = {
        user_id: userId,
        event_wine_id: wineId,
        rating,
        personal_notes: notes.trim() || null,
        would_buy: wouldBuy,
      }

      if (hasExistingRating) {
        // Update existing rating
        const { error } = await supabase
          .from('user_wine_ratings')
          .update(ratingData)
          .eq('user_id', userId)
          .eq('event_wine_id', wineId)

        if (error) throw error
      } else {
        // Insert new rating
        const { error } = await supabase
          .from('user_wine_ratings')
          .insert(ratingData)

        if (error) throw error
      }

      addToast({
        type: 'success',
        message: hasExistingRating ? 'Rating updated!' : 'Rating saved!',
      })

      // Navigate to next wine or back to list
      if (nextWineId) {
        router.push(`/booth/${eventCode}/rate/${nextWineId}`)
      } else {
        router.push(`/booth/${eventCode}/wines`)
      }
    } catch (err) {
      console.error('Error saving rating:', err)
      addToast({
        type: 'error',
        message: 'Failed to save rating. Please try again.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <WineLoader />
      </div>
    )
  }

  if (!wine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
        <Card variant="outlined" padding="lg" className="text-center">
          <p className="text-body-lg text-[var(--foreground-secondary)]">
            Wine not found
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => router.push(`/booth/${eventCode}/wines`)}
          >
            Back to wines
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push(`/booth/${eventCode}/wines`)}
            className="flex items-center gap-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-body-sm">Wines</span>
          </button>

          <span className="text-body-sm text-[var(--foreground-muted)]">
            {currentIndex + 1} of {allWineIds.length}
          </span>

          <button
            onClick={() => setWouldBuy(!wouldBuy)}
            className={cn(
              'p-2 rounded-xl transition-all duration-200',
              wouldBuy
                ? 'text-[var(--gold)] bg-[var(--gold-muted)]'
                : 'text-[var(--foreground-muted)] hover:text-[var(--gold)]'
            )}
            title="Would buy this wine"
          >
            <ShoppingBag
              className={cn('h-5 w-5', wouldBuy && 'fill-current')}
            />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 pb-32">
        {/* Wine info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-body-sm text-[var(--foreground-muted)]">
              #{wine.tasting_order}
            </span>
            <WineTypeBadge wineType={wine.wine_type} size="sm" />
          </div>

          <h1 className="text-display-sm font-bold text-[var(--foreground)] mb-1">
            {wine.wine_name}
          </h1>

          {wine.producer && (
            <p className="text-body-lg text-[var(--foreground-secondary)]">
              {wine.producer}
              {wine.vintage && ` · ${wine.vintage}`}
            </p>
          )}

          {/* Quick info */}
          <div className="flex flex-wrap gap-3 mt-4">
            {wine.region && (
              <div className="flex items-center gap-1.5 text-body-sm text-[var(--foreground-muted)]">
                <MapPin className="h-4 w-4" />
                {wine.region}{wine.country && `, ${wine.country}`}
              </div>
            )}
            {wine.alcohol_content && (
              <div className="flex items-center gap-1.5 text-body-sm text-[var(--foreground-muted)]">
                <Wine className="h-4 w-4" />
                {wine.alcohol_content}% ABV
              </div>
            )}
          </div>

          {/* Expandable details */}
          {(wine.sommelier_notes || wine.tasting_notes) && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-4 text-body-sm text-[var(--wine)] hover:underline"
            >
              {showDetails ? 'Hide details' : 'Show tasting notes'}
            </button>
          )}

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <Card variant="outlined" padding="md" className="mt-4">
                  {wine.sommelier_notes && (
                    <div className="mb-4">
                      <h4 className="text-label-sm text-[var(--foreground-muted)] uppercase tracking-wide mb-1">
                        Sommelier Notes
                      </h4>
                      <p className="text-body-md text-[var(--foreground)]">
                        {wine.sommelier_notes}
                      </p>
                    </div>
                  )}

                  {wine.tasting_notes && (
                    <div className="space-y-3">
                      {wine.tasting_notes.aroma && (
                        <div>
                          <h4 className="text-label-sm text-[var(--foreground-muted)] uppercase tracking-wide mb-1">
                            Aroma
                          </h4>
                          <p className="text-body-sm text-[var(--foreground)]">
                            {wine.tasting_notes.aroma}
                          </p>
                        </div>
                      )}
                      {wine.tasting_notes.taste && (
                        <div>
                          <h4 className="text-label-sm text-[var(--foreground-muted)] uppercase tracking-wide mb-1">
                            Taste
                          </h4>
                          <p className="text-body-sm text-[var(--foreground)]">
                            {wine.tasting_notes.taste}
                          </p>
                        </div>
                      )}
                      {wine.tasting_notes.finish && (
                        <div>
                          <h4 className="text-label-sm text-[var(--foreground-muted)] uppercase tracking-wide mb-1">
                            Finish
                          </h4>
                          <p className="text-body-sm text-[var(--foreground)]">
                            {wine.tasting_notes.finish}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {wine.grape_varieties && wine.grape_varieties.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)]">
                      <h4 className="text-label-sm text-[var(--foreground-muted)] uppercase tracking-wide mb-2">
                        Grape Varieties
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {wine.grape_varieties.map((grape, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded-lg bg-[var(--background)] text-body-sm text-[var(--foreground-secondary)]"
                          >
                            {grape.name}
                            {grape.percentage && ` (${grape.percentage}%)`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Rating section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="elevated" padding="lg">
            <div className="text-center mb-6">
              <h2 className="text-body-lg font-semibold text-[var(--foreground)] mb-2">
                How would you rate this wine?
              </h2>
              <StarRating
                value={rating}
                onChange={setRating}
                size="lg"
                showValue
              />
            </div>

            <Textarea
              label="Personal Notes (optional)"
              placeholder="What stood out to you? Any flavors you noticed?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </Card>
        </motion.div>
      </main>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--surface)] border-t border-[var(--border)]">
        <div className="flex gap-3">
          {/* Previous button */}
          <Button
            variant="secondary"
            onClick={() => prevWineId && router.push(`/booth/${eventCode}/rate/${prevWineId}`)}
            disabled={!prevWineId}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Save button */}
          <Button
            fullWidth
            size="lg"
            onClick={handleSave}
            isLoading={isSaving}
            disabled={rating === 0}
            rightIcon={nextWineId ? <ArrowRight className="h-5 w-5" /> : <Check className="h-5 w-5" />}
          >
            {rating === 0
              ? 'Select a rating'
              : nextWineId
              ? 'Save & Next'
              : 'Save & Finish'}
          </Button>
        </div>
      </div>
    </div>
  )
}
