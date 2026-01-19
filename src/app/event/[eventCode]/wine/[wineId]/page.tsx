'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button, Card, Textarea } from '@/components/ui'
import { StarRating, WineLoader } from '@/components/ui'
// WineTypeBadge removed - using inline badge instead
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Wine,
  MapPin,
  Grape,
  ShoppingBag,
  Info,
  ChevronDown,
  ChevronUp,
  Award,
  Utensils,
  FlaskConical,
  Eye,
  Droplets,
  FileText,
} from 'lucide-react'

// Country flags mapping
const countryFlags: Record<string, string> = {
  'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸', 'United States': '🇺🇸', 'USA': '🇺🇸',
  'Germany': '🇩🇪', 'Portugal': '🇵🇹', 'Argentina': '🇦🇷', 'Chile': '🇨🇱', 'Australia': '🇦🇺',
  'New Zealand': '🇳🇿', 'South Africa': '🇿🇦', 'Austria': '🇦🇹', 'Greece': '🇬🇷',
  'Hungary': '🇭🇺', 'Lebanon': '🇱🇧', 'Israel': '🇮🇱', 'Canada': '🇨🇦', 'Mexico': '🇲🇽',
  'Brazil': '🇧🇷', 'Uruguay': '🇺🇾', 'Japan': '🇯🇵', 'China': '🇨🇳', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'UK': '🇬🇧',
}

// Wine type colors
const wineTypeColors: Record<string, { bg: string; text: string }> = {
  red: { bg: 'bg-red-900/30', text: 'text-red-400' },
  white: { bg: 'bg-yellow-900/30', text: 'text-yellow-400' },
  rosé: { bg: 'bg-pink-900/30', text: 'text-pink-400' },
  sparkling: { bg: 'bg-amber-900/30', text: 'text-amber-400' },
  dessert: { bg: 'bg-orange-900/30', text: 'text-orange-400' },
  fortified: { bg: 'bg-amber-900/30', text: 'text-amber-600' },
  orange: { bg: 'bg-orange-900/30', text: 'text-orange-400' },
}

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
  image_url?: string
  grape_varieties?: { name: string; percentage?: number }[]
  wine_style?: string[]
  food_pairings?: { category: string; items: string[] }[]
  food_pairing_notes?: string
  tasting_notes?: {
    appearance?: string
    aroma?: string
    taste?: string
    finish?: string
  }
  technical_details?: {
    ph?: string
    residual_sugar?: string
    total_acidity?: string
    aging?: string
    production?: string
  }
  awards?: string[]
  winemaker_notes?: string
  tasting_order: number
  location_name?: string
}

export default function WineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToast()

  const eventCode = params.eventCode as string
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
    ? localStorage.getItem('palate-temp-user')
    : null

  // Helper to parse JSONB fields
  const parseJSON = <T,>(value: T | string | undefined): T | null => {
    if (!value) return null
    if (typeof value === 'string') {
      try { return JSON.parse(value) } catch { return null }
    }
    return value as T
  }

  // Load wine and existing rating
  useEffect(() => {
    const loadData = async () => {
      if (!userId) {
        router.push(`/join`)
        return
      }

      try {
        // Get event by event_code
        const { data: eventData } = await supabase
          .from('tasting_events')
          .select('id, event_code')
          .eq('event_code', eventCode.toUpperCase())
          .single()

        if (!eventData) {
          router.push(`/join`)
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
          // Parse JSONB fields
          setWine({
            ...wineData,
            grape_varieties: parseJSON(wineData.grape_varieties) || [],
            wine_style: parseJSON(wineData.wine_style) || [],
            food_pairings: parseJSON(wineData.food_pairings) || [],
            tasting_notes: parseJSON(wineData.tasting_notes) || {},
            technical_details: parseJSON(wineData.technical_details) || {},
            awards: parseJSON(wineData.awards) || [],
          })
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
        const { error } = await supabase
          .from('user_wine_ratings')
          .update(ratingData)
          .eq('user_id', userId)
          .eq('event_wine_id', wineId)

        if (error) throw error
      } else {
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
        router.push(`/event/${eventCode}/wine/${nextWineId}`)
      } else {
        router.push(`/event/${eventCode}`)
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

  // Get wine emoji
  const getWineEmoji = (type: string | null | undefined) => {
    const map: Record<string, string> = {
      red: '🍷', white: '🥂', rosé: '🌸', sparkling: '🍾',
      dessert: '🍯', fortified: '🥃', orange: '🍊'
    }
    return map[type?.toLowerCase() || 'red'] || '🍷'
  }

  // Check if wine has detailed data
  const hasDetailedData = wine && (
    wine.sommelier_notes ||
    wine.tasting_notes?.appearance ||
    wine.tasting_notes?.aroma ||
    wine.tasting_notes?.taste ||
    wine.tasting_notes?.finish ||
    (wine.grape_varieties && wine.grape_varieties.length > 0) ||
    (wine.wine_style && wine.wine_style.length > 0) ||
    (wine.food_pairings && wine.food_pairings.length > 0) ||
    wine.technical_details?.ph ||
    wine.technical_details?.aging ||
    (wine.awards && wine.awards.length > 0) ||
    wine.winemaker_notes
  )

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
            onClick={() => router.push(`/event/${eventCode}`)}
          >
            Back to wines
          </Button>
        </Card>
      </div>
    )
  }

  const typeColors = wineTypeColors[wine.wine_type?.toLowerCase() || 'red'] || wineTypeColors.red
  const countryFlag = wine.country ? countryFlags[wine.country] : null

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push(`/event/${eventCode}`)}
            className="flex items-center gap-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-body-md">Back</span>
          </button>
          <span className="text-body-sm text-[var(--foreground-muted)]">
            {currentIndex + 1} of {allWineIds.length}
          </span>
        </div>
      </header>

      <main className="flex-1 p-4 pb-28 space-y-4">
        {/* Wine Image or Emoji Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {wine.image_url ? (
            <div className="relative h-64 rounded-2xl overflow-hidden">
              <img
                src={wine.image_url}
                alt={wine.wine_name}
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              {/* Country flag */}
              {countryFlag && (
                <div className="absolute top-4 left-4 text-3xl">
                  {countryFlag}
                </div>
              )}
              {/* Wine type badge */}
              <div className="absolute top-4 right-4">
                <span className={cn(
                  'px-3 py-1 rounded-full text-body-sm font-medium capitalize',
                  typeColors.bg, typeColors.text
                )}>
                  {wine.wine_type || 'Wine'}
                </span>
              </div>
              {/* Wine info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-body-xs text-white/80">
                    #{wine.tasting_order}
                  </span>
                  {wine.location_name && (
                    <span className="text-body-xs text-white/80 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {wine.location_name}
                    </span>
                  )}
                </div>
                <h1 className="text-display-sm font-bold text-white">
                  {wine.wine_name}
                </h1>
                {wine.producer && (
                  <p className="text-body-md text-white/90">
                    {wine.producer}
                    {wine.vintage && ` · ${wine.vintage}`}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* No image - show emoji card */
            <Card variant="wine" padding="lg" className="text-center">
              <div className={cn(
                'w-24 h-24 mx-auto rounded-2xl flex items-center justify-center text-5xl mb-4',
                typeColors.bg
              )}>
                {getWineEmoji(wine.wine_type)}
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                {countryFlag && <span className="text-2xl">{countryFlag}</span>}
                <span className="text-body-xs text-[var(--foreground-muted)]">
                  #{wine.tasting_order}
                </span>
                {wine.location_name && (
                  <span className="text-body-xs text-[var(--foreground-muted)] flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {wine.location_name}
                  </span>
                )}
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
            </Card>
          )}
        </motion.div>

        {/* Quick Info Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-wrap gap-3"
        >
          {wine.region && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] text-body-sm text-[var(--foreground-secondary)]">
              <MapPin className="h-4 w-4" />
              {wine.region}{wine.country && `, ${wine.country}`}
            </div>
          )}
          {wine.alcohol_content && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] text-body-sm text-[var(--foreground-secondary)]">
              <Droplets className="h-4 w-4" />
              {wine.alcohol_content}% ABV
            </div>
          )}
          {wine.price_point && (
            <div className="px-3 py-1.5 rounded-full bg-[var(--surface)] text-body-sm text-[var(--foreground-secondary)]">
              {wine.price_point}
            </div>
          )}
          {!wine.image_url && (
            <div className="ml-auto">
              <span className={cn(
                'px-3 py-1 rounded-full text-body-sm font-medium capitalize',
                typeColors.bg, typeColors.text
              )}>
                {wine.wine_type || 'Wine'}
              </span>
            </div>
          )}
        </motion.div>

        {/* Wine Style Tags */}
        {wine.wine_style && wine.wine_style.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 }}
            className="flex flex-wrap gap-2"
          >
            {wine.wine_style.map((style, i) => (
              <span
                key={i}
                className={cn(
                  'px-3 py-1 rounded-full text-body-sm border',
                  typeColors.bg, typeColors.text, 'border-current/30'
                )}
              >
                {style}
              </span>
            ))}
          </motion.div>
        )}

        {/* Expandable Details Section */}
        {hasDetailedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 w-full p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-body-md text-[var(--foreground)] hover:border-[var(--wine)] transition-colors"
            >
              <Info className="h-5 w-5 text-[var(--wine)]" />
              <span className="flex-1 text-left font-medium">
                {showDetails ? 'Hide wine details' : 'Show wine details'}
              </span>
              {showDetails ? (
                <ChevronUp className="h-5 w-5 text-[var(--foreground-muted)]" />
              ) : (
                <ChevronDown className="h-5 w-5 text-[var(--foreground-muted)]" />
              )}
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-4">
                    {/* Sommelier Notes */}
                    {wine.sommelier_notes && (
                      <Card variant="outlined" padding="md">
                        <p className="text-body-md text-[var(--foreground)] italic">
                          "{wine.sommelier_notes}"
                        </p>
                      </Card>
                    )}

                    {/* Grape Varieties */}
                    {wine.grape_varieties && wine.grape_varieties.length > 0 && (
                      <Card variant="outlined" padding="md">
                        <div className="flex items-center gap-2 mb-3">
                          <Grape className="h-4 w-4 text-[var(--wine)]" />
                          <h4 className="text-body-sm font-semibold text-[var(--foreground)]">
                            Grape Varieties
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {wine.grape_varieties.map((grape, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 rounded-lg bg-[var(--background)] text-body-sm text-[var(--foreground)]"
                            >
                              {grape.name}
                              {grape.percentage && (
                                <span className="text-[var(--foreground-muted)] ml-1">
                                  {grape.percentage}%
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Tasting Notes */}
                    {(wine.tasting_notes?.appearance || wine.tasting_notes?.aroma || 
                      wine.tasting_notes?.taste || wine.tasting_notes?.finish) && (
                      <Card variant="outlined" padding="md">
                        <div className="flex items-center gap-2 mb-3">
                          <Eye className="h-4 w-4 text-[var(--wine)]" />
                          <h4 className="text-body-sm font-semibold text-[var(--foreground)]">
                            Tasting Notes
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {wine.tasting_notes.appearance && (
                            <div>
                              <p className="text-body-xs text-[var(--foreground-muted)] uppercase tracking-wide mb-1">
                                Appearance
                              </p>
                              <p className="text-body-sm text-[var(--foreground)]">
                                {wine.tasting_notes.appearance}
                              </p>
                            </div>
                          )}
                          {wine.tasting_notes.aroma && (
                            <div>
                              <p className="text-body-xs text-[var(--foreground-muted)] uppercase tracking-wide mb-1">
                                Aroma
                              </p>
                              <p className="text-body-sm text-[var(--foreground)]">
                                {wine.tasting_notes.aroma}
                              </p>
                            </div>
                          )}
                          {wine.tasting_notes.taste && (
                            <div>
                              <p className="text-body-xs text-[var(--foreground-muted)] uppercase tracking-wide mb-1">
                                Taste
                              </p>
                              <p className="text-body-sm text-[var(--foreground)]">
                                {wine.tasting_notes.taste}
                              </p>
                            </div>
                          )}
                          {wine.tasting_notes.finish && (
                            <div>
                              <p className="text-body-xs text-[var(--foreground-muted)] uppercase tracking-wide mb-1">
                                Finish
                              </p>
                              <p className="text-body-sm text-[var(--foreground)]">
                                {wine.tasting_notes.finish}
                              </p>
                            </div>
                          )}
                        </div>
                      </Card>
                    )}

                    {/* Food Pairings */}
                    {wine.food_pairings && wine.food_pairings.length > 0 && (
                      <Card variant="outlined" padding="md">
                        <div className="flex items-center gap-2 mb-3">
                          <Utensils className="h-4 w-4 text-[var(--wine)]" />
                          <h4 className="text-body-sm font-semibold text-[var(--foreground)]">
                            Food Pairings
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {wine.food_pairings.map((pairing, i) => (
                            <div key={i}>
                              <p className="text-body-xs text-[var(--foreground-muted)] uppercase tracking-wide">
                                {pairing.category}
                              </p>
                              <p className="text-body-sm text-[var(--foreground)]">
                                {pairing.items?.join(', ')}
                              </p>
                            </div>
                          ))}
                        </div>
                        {wine.food_pairing_notes && (
                          <p className="mt-3 pt-3 border-t border-[var(--border)] text-body-sm text-[var(--foreground-secondary)] italic">
                            {wine.food_pairing_notes}
                          </p>
                        )}
                      </Card>
                    )}

                    {/* Technical Details */}
                    {(wine.technical_details?.ph || wine.technical_details?.total_acidity ||
                      wine.technical_details?.residual_sugar || wine.technical_details?.aging ||
                      wine.technical_details?.production) && (
                      <Card variant="outlined" padding="md">
                        <div className="flex items-center gap-2 mb-3">
                          <FlaskConical className="h-4 w-4 text-[var(--wine)]" />
                          <h4 className="text-body-sm font-semibold text-[var(--foreground)]">
                            Technical Details
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {wine.technical_details.ph && (
                            <div>
                              <p className="text-body-xs text-[var(--foreground-muted)]">pH</p>
                              <p className="text-body-sm text-[var(--foreground)]">{wine.technical_details.ph}</p>
                            </div>
                          )}
                          {wine.technical_details.total_acidity && (
                            <div>
                              <p className="text-body-xs text-[var(--foreground-muted)]">Total Acidity</p>
                              <p className="text-body-sm text-[var(--foreground)]">{wine.technical_details.total_acidity}</p>
                            </div>
                          )}
                          {wine.technical_details.residual_sugar && (
                            <div>
                              <p className="text-body-xs text-[var(--foreground-muted)]">Residual Sugar</p>
                              <p className="text-body-sm text-[var(--foreground)]">{wine.technical_details.residual_sugar}</p>
                            </div>
                          )}
                          {wine.technical_details.aging && (
                            <div className="col-span-2">
                              <p className="text-body-xs text-[var(--foreground-muted)]">Aging</p>
                              <p className="text-body-sm text-[var(--foreground)]">{wine.technical_details.aging}</p>
                            </div>
                          )}
                          {wine.technical_details.production && (
                            <div className="col-span-2">
                              <p className="text-body-xs text-[var(--foreground-muted)]">Production</p>
                              <p className="text-body-sm text-[var(--foreground)]">{wine.technical_details.production}</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    )}

                    {/* Winemaker Notes */}
                    {wine.winemaker_notes && (
                      <Card variant="outlined" padding="md">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-4 w-4 text-[var(--wine)]" />
                          <h4 className="text-body-sm font-semibold text-[var(--foreground)]">
                            Winemaker Notes
                          </h4>
                        </div>
                        <p className="text-body-sm text-[var(--foreground-secondary)]">
                          {wine.winemaker_notes}
                        </p>
                      </Card>
                    )}

                    {/* Awards */}
                    {wine.awards && wine.awards.length > 0 && (
                      <Card variant="outlined" padding="md">
                        <div className="flex items-center gap-2 mb-3">
                          <Award className="h-4 w-4 text-[var(--gold)]" />
                          <h4 className="text-body-sm font-semibold text-[var(--foreground)]">
                            Awards & Recognition
                          </h4>
                        </div>
                        <div className="space-y-2">
                          {wine.awards.map((award, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-[var(--gold)]">🏆</span>
                              <span className="text-body-sm text-[var(--foreground)]">{award}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Rating section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card variant="elevated" padding="lg">
            <div className="text-center mb-6">
              <h2 className="text-body-lg font-semibold text-[var(--foreground)] mb-4">
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

            {/* Would buy toggle */}
            <button
              onClick={() => setWouldBuy(!wouldBuy)}
              className={cn(
                'w-full mt-4 p-4 rounded-xl border',
                'flex items-center justify-between',
                'transition-all duration-200',
                wouldBuy
                  ? 'border-[var(--gold)] bg-[var(--gold-muted)]'
                  : 'border-[var(--border)] hover:border-[var(--border-secondary)]'
              )}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag
                  className={cn(
                    'h-5 w-5',
                    wouldBuy ? 'text-[var(--gold)]' : 'text-[var(--foreground-muted)]'
                  )}
                />
                <span className={cn(
                  'text-body-md',
                  wouldBuy ? 'text-[var(--gold)] font-medium' : 'text-[var(--foreground-secondary)]'
                )}>
                  I would buy this wine
                </span>
              </div>
              <div
                className={cn(
                  'w-6 h-6 rounded-full border-2',
                  'flex items-center justify-center',
                  'transition-all duration-200',
                  wouldBuy
                    ? 'border-[var(--gold)] bg-[var(--gold)]'
                    : 'border-[var(--border)]'
                )}
              >
                {wouldBuy && <Check className="h-4 w-4 text-white" />}
              </div>
            </button>
          </Card>
        </motion.div>
      </main>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--surface)] border-t border-[var(--border)]">
        <div className="flex gap-3">
          {/* Previous button */}
          <Button
            variant="secondary"
            onClick={() => prevWineId && router.push(`/event/${eventCode}/wine/${prevWineId}`)}
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