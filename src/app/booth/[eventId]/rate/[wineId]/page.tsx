'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button, Card, Textarea } from '@/components/ui'
import { StarRating, WineLoader } from '@/components/ui'
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
  X,
  SkipForward,
  RotateCcw,
} from 'lucide-react'
import Image from 'next/image'

const countryFlags: Record<string, string> = {
  'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸', 'United States': '🇺🇸', 'USA': '🇺🇸',
  'Germany': '🇩🇪', 'Portugal': '🇵🇹', 'Argentina': '🇦🇷', 'Chile': '🇨🇱', 'Australia': '🇦🇺',
  'New Zealand': '🇳🇿', 'South Africa': '🇿🇦', 'Austria': '🇦🇹', 'Greece': '🇬🇷',
  'Hungary': '🇭🇺', 'Lebanon': '🇱🇧', 'Israel': '🇮🇱', 'Canada': '🇨🇦', 'Mexico': '🇲🇽',
  'Brazil': '🇧🇷', 'Uruguay': '🇺🇾', 'Japan': '🇯🇵', 'China': '🇨🇳', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'UK': '🇬🇧',
}

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
  vintage?: number
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
  tasting_notes?: { appearance?: string; aroma?: string; taste?: string; finish?: string }
  technical_details?: { ph?: string; residual_sugar?: string; total_acidity?: string; aging?: string; production?: string }
  awards?: string[]
  winemaker_notes?: string
  tasting_order: number
  location_name?: string
  beverage_type?: string
}

interface UserRating {
  rating: number
  personal_notes?: string
  would_buy?: boolean
  is_skipped?: boolean
  skip_reason?: string
}

const SKIP_REASONS = [
  "Ran out of time",
  "Wasn't available / ran out",
  "Not my style",
  "Already familiar with it",
]

export default function BoothRatePage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToast()

  const eventCode = params.eventId as string
  const wineId = params.wineId as string

  const [event, setEvent] = useState<{ id: string; event_code: string } | null>(null)
  const [wine, setWine] = useState<WineDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [wouldBuy, setWouldBuy] = useState(false)
  const [hasExistingRating, setHasExistingRating] = useState(false)
  const [isSkipped, setIsSkipped] = useState(false)
  const [skipReason, setSkipReason] = useState<string | null>(null)
  const [showSkipModal, setShowSkipModal] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)

  const [allWineIds, setAllWineIds] = useState<string[]>([])
  const [showDetails, setShowDetails] = useState(false)

  const userId = typeof window !== 'undefined'
    ? localStorage.getItem('palate-temp-user')
    : null

  useEffect(() => {
    const loadData = async () => {
      if (!userId) {
        router.push(`/booth/${eventCode}`)
        return
      }

      try {
        const { data: eventData } = await supabase
          .from('tasting_events')
          .select('id, event_code')
          .eq('event_code', eventCode.toUpperCase())
          .single()

        if (!eventData) { router.push(`/booth/${eventCode}`); return }
        setEvent(eventData)

        const { data: wineData } = await supabase
          .from('event_wines')
          .select('*')
          .eq('id', wineId)
          .single()

        if (wineData) setWine(wineData)

        const { data: allWines } = await supabase
          .from('event_wines')
          .select('id')
          .eq('event_id', eventData.id)
          .order('tasting_order', { ascending: true })

        if (allWines) setAllWineIds(allWines.map(w => w.id))

        const { data: existingRating } = await supabase
          .from('user_wine_ratings')
          .select('rating, personal_notes, would_buy, is_skipped, skip_reason')
          .eq('user_id', userId)
          .eq('event_wine_id', wineId)
          .single()

        if (existingRating) {
          setHasExistingRating(true)
          if (existingRating.is_skipped) {
            setIsSkipped(true)
            setSkipReason(existingRating.skip_reason || null)
          } else {
            setRating(existingRating.rating)
            setNotes(existingRating.personal_notes || '')
            setWouldBuy(existingRating.would_buy || false)
          }
        }
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [eventCode, wineId, userId, router])

  const currentIndex = allWineIds.indexOf(wineId)
  const prevWineId = currentIndex > 0 ? allWineIds[currentIndex - 1] : null
  const nextWineId = currentIndex < allWineIds.length - 1 ? allWineIds[currentIndex + 1] : null

  const handleSave = async () => {
    if (!userId || rating === 0) return
    setIsSaving(true)
    try {
      const ratingData = { user_id: userId, event_wine_id: wineId, rating, personal_notes: notes.trim() || null, would_buy: wouldBuy }
      if (hasExistingRating) {
        const { error } = await supabase.from('user_wine_ratings').update(ratingData).eq('user_id', userId).eq('event_wine_id', wineId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('user_wine_ratings').insert(ratingData)
        if (error) throw error
      }
      addToast({ type: 'success', message: hasExistingRating ? 'Rating updated!' : 'Rating saved!' })
      if (nextWineId) {
        router.push(`/booth/${eventCode}/rate/${nextWineId}`)
      } else {
        router.push(`/booth/${eventCode}/wines`)
      }
    } catch (err) {
      console.error('Error saving rating:', err)
      addToast({ type: 'error', message: 'Failed to save rating. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkip = async (reason: string) => {
    if (!userId) return
    setIsSkipping(true)
    try {
      const skipData = { user_id: userId, event_wine_id: wineId, rating: 0, is_skipped: true, skip_reason: reason, personal_notes: null, would_buy: false }
      if (hasExistingRating) {
        await supabase.from('user_wine_ratings').update(skipData).eq('user_id', userId).eq('event_wine_id', wineId)
      } else {
        await supabase.from('user_wine_ratings').insert(skipData)
      }
      setIsSkipped(true)
      setSkipReason(reason)
      setHasExistingRating(true)
      setShowSkipModal(false)
      addToast({ type: 'success', message: 'Marked as skipped' })
      if (nextWineId) {
        router.push(`/booth/${eventCode}/rate/${nextWineId}`)
      } else {
        router.push(`/booth/${eventCode}/wines`)
      }
    } catch (err) {
      console.error('Error skipping wine:', err)
      addToast({ type: 'error', message: 'Failed to save. Please try again.' })
    } finally {
      setIsSkipping(false)
    }
  }

  const handleUndoSkip = async () => {
    if (!userId) return
    await supabase.from('user_wine_ratings').delete().eq('user_id', userId).eq('event_wine_id', wineId)
    setIsSkipped(false)
    setSkipReason(null)
    setHasExistingRating(false)
    setRating(0)
  }

  const getWineEmoji = (type: string | null | undefined) => {
    const map: Record<string, string> = { red: '🍷', white: '🥂', rosé: '🌸', sparkling: '🍾', dessert: '🍯', fortified: '🥃', orange: '🍊' }
    return map[type?.toLowerCase() || 'red'] || '🍷'
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--background)]"><WineLoader /></div>
  }

  if (!wine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
        <Card variant="outlined" padding="lg" className="text-center">
          <p className="text-body-lg text-[var(--foreground-secondary)]">Wine not found</p>
          <Button variant="secondary" className="mt-4" onClick={() => router.push(`/booth/${eventCode}/wines`)}>Back to wines</Button>
        </Card>
      </div>
    )
  }

  const typeColors = wineTypeColors[wine.wine_type?.toLowerCase() || 'red'] || wineTypeColors.red
  const countryFlag = wine.country ? countryFlags[wine.country] : null

  const hasDetailedData = (
    wine.sommelier_notes ||
    wine.tasting_notes?.appearance || wine.tasting_notes?.aroma ||
    wine.tasting_notes?.taste || wine.tasting_notes?.finish ||
    (wine.grape_varieties && wine.grape_varieties.length > 0) ||
    (wine.wine_style && wine.wine_style.length > 0) ||
    (wine.food_pairings && wine.food_pairings.length > 0) ||
    wine.technical_details?.ph || wine.technical_details?.aging ||
    (wine.awards && wine.awards.length > 0) ||
    wine.winemaker_notes
  )

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
            className={cn('p-2 rounded-xl transition-all duration-200', wouldBuy ? 'text-[var(--gold)] bg-[var(--gold-muted)]' : 'text-[var(--foreground-muted)] hover:text-[var(--gold)]')}
            title="Would buy this wine"
          >
            <ShoppingBag className={cn('h-5 w-5', wouldBuy && 'fill-current')} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 pb-28 space-y-4">
        {/* Wine Image or Emoji Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
          {wine.image_url ? (
            <div className="relative h-64 rounded-2xl overflow-hidden">
              <Image src={wine.image_url} alt={wine.wine_name} className="w-full h-full object-cover" width={256} height={256} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              {countryFlag && <div className="absolute top-4 left-4 text-3xl">{countryFlag}</div>}
              <div className="absolute top-4 right-4">
                <span className={cn('px-3 py-1 rounded-full text-body-sm font-medium capitalize', typeColors.bg, 'text-[var(--foreground)]')}>
                  {wine.wine_type || 'Wine'}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-body-xs text-white/80">#{wine.tasting_order}</span>
                </div>
                <h1 className="text-display-sm font-bold text-white">{wine.wine_name}</h1>
                {wine.producer && (
                  <p className="text-body-md text-white/90">{wine.producer}{wine.vintage && ` · ${wine.vintage}`}</p>
                )}
              </div>
            </div>
          ) : (
            <Card variant="wine" padding="lg" className="text-center">
              <div className={cn('w-24 h-24 mx-auto rounded-2xl flex items-center justify-center text-5xl mb-4', typeColors.bg)}>
                {getWineEmoji(wine.wine_type)}
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                {countryFlag && <span className="text-2xl">{countryFlag}</span>}
                <span className="text-body-xs text-[var(--foreground-muted)]">#{wine.tasting_order}</span>
              </div>
              <h1 className="text-display-sm font-bold text-[var(--foreground)] mb-1">{wine.wine_name}</h1>
              {wine.producer && (
                <p className="text-body-lg text-[var(--foreground-secondary)]">
                  {wine.producer}{wine.vintage && ` · ${wine.vintage}`}
                </p>
              )}
            </Card>
          )}
        </motion.div>

        {/* Quick Info Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex flex-wrap gap-3">
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
              <span className={cn('px-3 py-1 rounded-full text-body-sm font-medium capitalize', typeColors.bg, 'text-[var(--foreground)]')}>
                {wine.wine_type || 'Wine'}
              </span>
            </div>
          )}
        </motion.div>

        {/* Wine Style Tags */}
        {wine.wine_style && wine.wine_style.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="flex flex-wrap gap-2">
            {wine.wine_style.map((style, i) => (
              <span key={i} className={cn('px-3 py-1 rounded-full text-body-sm border', typeColors.bg, 'text-[var(--foreground)]', 'border-[var(--border)]')}>
                {style}
              </span>
            ))}
          </motion.div>
        )}

        {/* Expandable Details */}
        {hasDetailedData && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 w-full p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-body-md text-[var(--foreground)] hover:border-[var(--wine)] transition-colors"
            >
              <Info className="h-5 w-5 text-[var(--wine)]" />
              <span className="flex-1 text-left font-medium">
                {showDetails ? 'Hide wine details' : 'Show wine details'}
              </span>
              {showDetails ? <ChevronUp className="h-5 w-5 text-[var(--foreground-muted)]" /> : <ChevronDown className="h-5 w-5 text-[var(--foreground-muted)]" />}
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
                    {wine.sommelier_notes && (
                      <Card variant="outlined" padding="md">
                        <p className="text-body-md text-[var(--foreground)] italic">"{wine.sommelier_notes}"</p>
                      </Card>
                    )}

                    {wine.grape_varieties && wine.grape_varieties.length > 0 && (
                      <Card variant="outlined" padding="md">
                        <div className="flex items-center gap-2 mb-3">
                          <Grape className="h-4 w-4 text-[var(--wine)]" />
                          <h4 className="text-body-sm font-semibold text-[var(--foreground)]">Grape Varieties</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {wine.grape_varieties.map((grape, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-lg bg-[var(--background)] text-body-sm text-[var(--foreground)]">
                              {grape.name}
                              {grape.percentage && <span className="text-[var(--foreground-muted)] ml-1">{grape.percentage}%</span>}
                            </span>
                          ))}
                        </div>
                      </Card>
                    )}

                    {(wine.tasting_notes?.appearance || wine.tasting_notes?.aroma || wine.tasting_notes?.taste || wine.tasting_notes?.finish) && (
                      <Card variant="outlined" padding="md">
                        <div className="flex items-center gap-2 mb-3">
                          <Eye className="h-4 w-4 text-[var(--wine)]" />
                          <h4 className="text-body-sm font-semibold text-[var(--foreground)]">Tasting Notes</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {wine.tasting_notes?.appearance && (
                            <div>
                              <p className="text-body-xs text-[var(--foreground-muted)] uppercase tracking-wide mb-1">Appearance</p>
                              <p className="text-body-sm text-[var(--foreground)]">{wine.tasting_notes.appearance}</p>
                            </div>
                          )}
                          {wine.tasting_notes?.aroma && (
                            <div>
                              <p className="text-body-xs text-[var(--foreground-muted)] uppercase tracking-wide mb-1">Aroma</p>
                              <p className="text-body-sm text-[var(--foreground)]">{wine.tasting_notes.aroma}</p>
                            </div>
                          )}
                          {wine.tasting_notes?.taste && (
                            <div>
                              <p className="text-body-xs text-[var(--foreground-muted)] uppercase tracking-wide mb-1">Taste</p>
                              <p className="text-body-sm text-[var(--foreground)]">{wine.tasting_notes.taste}</p>
                            </div>
                          )}
                          {wine.tasting_notes?.finish && (
                            <div>
                              <p className="text-body-xs text-[var(--foreground-muted)] uppercase tracking-wide mb-1">Finish</p>
                              <p className="text-body-sm text-[var(--foreground)]">{wine.tasting_notes.finish}</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    )}

                    {wine.food_pairings && wine.food_pairings.length > 0 && (
                      <Card variant="outlined" padding="md">
                        <div className="flex items-center gap-2 mb-3">
                          <Utensils className="h-4 w-4 text-[var(--wine)]" />
                          <h4 className="text-body-sm font-semibold text-[var(--foreground)]">Food Pairings</h4>
                        </div>
                        <div className="space-y-2">
                          {wine.food_pairings.map((pairing, i) => (
                            <div key={i}>
                              <p className="text-body-xs text-[var(--foreground-muted)] uppercase tracking-wide">{pairing.category}</p>
                              <p className="text-body-sm text-[var(--foreground)]">{pairing.items?.join(', ')}</p>
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

                    {(wine.technical_details?.ph || wine.technical_details?.total_acidity || wine.technical_details?.residual_sugar || wine.technical_details?.aging || wine.technical_details?.production) && (
                      <Card variant="outlined" padding="md">
                        <div className="flex items-center gap-2 mb-3">
                          <FlaskConical className="h-4 w-4 text-[var(--wine)]" />
                          <h4 className="text-body-sm font-semibold text-[var(--foreground)]">Technical Details</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {wine.technical_details?.ph && (
                            <div>
                              <p className="text-body-xs text-[var(--foreground-muted)]">pH</p>
                              <p className="text-body-sm text-[var(--foreground)]">{wine.technical_details.ph}</p>
                            </div>
                          )}
                          {wine.technical_details?.total_acidity && (
                            <div>
                              <p className="text-body-xs text-[var(--foreground-muted)]">Total Acidity</p>
                              <p className="text-body-sm text-[var(--foreground)]">{wine.technical_details.total_acidity}</p>
                            </div>
                          )}
                          {wine.technical_details?.residual_sugar && (
                            <div>
                              <p className="text-body-xs text-[var(--foreground-muted)]">Residual Sugar</p>
                              <p className="text-body-sm text-[var(--foreground)]">{wine.technical_details.residual_sugar}</p>
                            </div>
                          )}
                          {wine.technical_details?.aging && (
                            <div className="col-span-2">
                              <p className="text-body-xs text-[var(--foreground-muted)]">Aging</p>
                              <p className="text-body-sm text-[var(--foreground)]">{wine.technical_details.aging}</p>
                            </div>
                          )}
                          {wine.technical_details?.production && (
                            <div className="col-span-2">
                              <p className="text-body-xs text-[var(--foreground-muted)]">Production</p>
                              <p className="text-body-sm text-[var(--foreground)]">{wine.technical_details.production}</p>
                            </div>
                          )}
                        </div>
                      </Card>
                    )}

                    {wine.winemaker_notes && (
                      <Card variant="outlined" padding="md">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="h-4 w-4 text-[var(--wine)]" />
                          <h4 className="text-body-sm font-semibold text-[var(--foreground)]">Winemaker Notes</h4>
                        </div>
                        <p className="text-body-sm text-[var(--foreground-secondary)]">{wine.winemaker_notes}</p>
                      </Card>
                    )}

                    {wine.awards && wine.awards.length > 0 && (
                      <Card variant="outlined" padding="md">
                        <div className="flex items-center gap-2 mb-3">
                          <Award className="h-4 w-4 text-[var(--gold)]" />
                          <h4 className="text-body-sm font-semibold text-[var(--foreground)]">Awards & Recognition</h4>
                        </div>
                        <div className="space-y-1.5">
                          {wine.awards.map((award, i) => (
                            <p key={i} className="text-body-sm text-[var(--foreground)]">· {award}</p>
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

        {/* Rating Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          {isSkipped ? (
            <Card variant="outlined" padding="lg" className="text-center border-[var(--border)]">
              <div className="w-12 h-12 rounded-full bg-[var(--surface)] flex items-center justify-center mx-auto mb-3">
                <SkipForward className="h-6 w-6 text-[var(--foreground-muted)]" />
              </div>
              <p className="text-body-md font-medium text-[var(--foreground)] mb-1">Marked as skipped</p>
              {skipReason && (
                <p className="text-body-sm text-[var(--foreground-muted)] mb-4">"{skipReason}"</p>
              )}
              <button
                onClick={handleUndoSkip}
                className="flex items-center gap-2 mx-auto text-body-sm text-[var(--wine)] hover:underline"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Undo — rate this wine instead
              </button>
            </Card>
          ) : (
            <Card variant="elevated" padding="lg">
              <div className="text-center mb-6">
                <h2 className="text-body-lg font-semibold text-[var(--foreground)] mb-2">
                  How would you rate this wine?
                </h2>
                <StarRating value={rating} onChange={setRating} size="lg" showValue />
              </div>
              <Textarea
                label="Personal Notes (optional)"
                placeholder="What stood out to you? Any flavors you noticed?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />
              <button
                onClick={() => setShowSkipModal(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 text-body-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors py-2"
              >
                <SkipForward className="h-4 w-4" />
                Didn&apos;t taste this wine
              </button>
            </Card>
          )}
        </motion.div>
      </main>

      {/* Skip Reason Modal */}
      <AnimatePresence>
        {showSkipModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
            onClick={() => setShowSkipModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full bg-[var(--background)] rounded-t-3xl p-6 pb-10"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-body-lg font-semibold text-[var(--foreground)]">Why didn&apos;t you taste this?</h3>
                <button onClick={() => setShowSkipModal(false)} className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2">
                {SKIP_REASONS.map(reason => (
                  <button
                    key={reason}
                    onClick={() => handleSkip(reason)}
                    disabled={isSkipping}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-xl border text-body-md',
                      'border-[var(--border)] text-[var(--foreground)]',
                      'hover:border-[var(--wine)] hover:bg-[var(--wine-muted)]',
                      'transition-all duration-150'
                    )}
                  >
                    {reason}
                  </button>
                ))}
                <OtherReasonInput onSubmit={handleSkip} isSkipping={isSkipping} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--surface)] border-t border-[var(--border)]">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => prevWineId && router.push(`/booth/${eventCode}/rate/${prevWineId}`)}
            disabled={!prevWineId}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {isSkipped ? (
            <Button
              fullWidth
              size="lg"
              variant="secondary"
              onClick={() => nextWineId ? router.push(`/booth/${eventCode}/rate/${nextWineId}`) : router.push(`/booth/${eventCode}/wines`)}
              rightIcon={nextWineId ? <ArrowRight className="h-5 w-5" /> : <Check className="h-5 w-5" />}
            >
              {nextWineId ? 'Next Wine' : 'Finish'}
            </Button>
          ) : (
            <Button
              fullWidth
              size="lg"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={rating === 0}
              rightIcon={nextWineId ? <ArrowRight className="h-5 w-5" /> : <Check className="h-5 w-5" />}
            >
              {rating === 0 ? 'Select a rating' : nextWineId ? 'Save & Next' : 'Save & Finish'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Reusable "Other" free-text input for skip reasons
function OtherReasonInput({ onSubmit, isSkipping }: { onSubmit: (r: string) => void; isSkipping: boolean }) {
  const [show, setShow] = useState(false)
  const [value, setValue] = useState('')
  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className={cn(
          'w-full text-left px-4 py-3 rounded-xl border text-body-md',
          'border-[var(--border)] text-[var(--foreground-secondary)]',
          'hover:border-[var(--wine)] hover:bg-[var(--wine-muted)]',
          'transition-all duration-150'
        )}
      >
        Other reason…
      </button>
    )
  }
  return (
    <div className="space-y-2">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Describe why..."
        className={cn(
          'w-full px-4 py-3 rounded-xl border bg-[var(--surface)]',
          'border-[var(--border)] text-[var(--foreground)]',
          'placeholder:text-[var(--foreground-muted)]',
          'focus:outline-none focus:border-[var(--wine)]',
          'text-body-md'
        )}
      />
      <Button
        fullWidth
        onClick={() => value.trim() && onSubmit(value.trim())}
        disabled={!value.trim() || isSkipping}
        isLoading={isSkipping}
      >
        Skip Wine
      </Button>
    </div>
  )
}
