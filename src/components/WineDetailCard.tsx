'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui'
import {
  Wine,
  MapPin,
  Grape,
  Utensils,
  Eye,
  FlaskConical,
  Award,
  Clock,
  Thermometer,
  Droplets,
  FileText,
  Star,
} from 'lucide-react'

// Country flag emoji mapping
const countryFlags: Record<string, string> = {
  'France': '🇫🇷',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'United States': '🇺🇸',
  'USA': '🇺🇸',
  'Germany': '🇩🇪',
  'Portugal': '🇵🇹',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Australia': '🇦🇺',
  'New Zealand': '🇳🇿',
  'South Africa': '🇿🇦',
  'Austria': '🇦🇹',
  'Greece': '🇬🇷',
  'Hungary': '🇭🇺',
  'Lebanon': '🇱🇧',
  'Israel': '🇮🇱',
  'Canada': '🇨🇦',
  'Mexico': '🇲🇽',
  'Brazil': '🇧🇷',
  'Uruguay': '🇺🇾',
  'Japan': '🇯🇵',
  'China': '🇨🇳',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'UK': '🇬🇧',
}

// Wine type colors
const wineTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  red: { bg: 'bg-red-900/20', text: 'text-red-400', border: 'border-red-900/50' },
  white: { bg: 'bg-yellow-900/20', text: 'text-yellow-400', border: 'border-yellow-900/50' },
  rosé: { bg: 'bg-pink-900/20', text: 'text-pink-400', border: 'border-pink-900/50' },
  sparkling: { bg: 'bg-amber-900/20', text: 'text-amber-400', border: 'border-amber-900/50' },
  dessert: { bg: 'bg-orange-900/20', text: 'text-orange-400', border: 'border-orange-900/50' },
  fortified: { bg: 'bg-amber-900/20', text: 'text-amber-600', border: 'border-amber-900/50' },
  orange: { bg: 'bg-orange-900/20', text: 'text-orange-400', border: 'border-orange-900/50' },
}

interface GrapeVariety {
  name: string
  percentage?: number
}

interface TastingNotes {
  appearance?: string
  aroma?: string
  taste?: string
  finish?: string
}

interface TechnicalDetails {
  ph?: string
  residual_sugar?: string
  total_acidity?: string
  aging?: string
  production?: string
}

interface FoodPairing {
  category: string
  items: string[]
}

interface WineDetailProps {
  wine: {
    wine_name: string
    producer?: string
    vintage?: string | number
    wine_type: string
    region?: string
    country?: string
    price_point?: string
    alcohol_content?: string | number
    sommelier_notes?: string
    image_url?: string
    grape_varieties?: GrapeVariety[] | string
    wine_style?: string[] | string
    food_pairings?: FoodPairing[] | string
    food_pairing_notes?: string
    tasting_notes?: TastingNotes | string
    winemaker_notes?: string
    technical_details?: TechnicalDetails | string
    awards?: string[] | string
  }
  rating?: number
  showFullDetails?: boolean
  className?: string
}

export function WineDetailCard({
  wine,
  rating,
  showFullDetails = false,
  className,
}: WineDetailProps) {
  // Parse JSON fields if they're strings
  const grapeVarieties = parseJSON<GrapeVariety[]>(wine.grape_varieties) || []
  const wineStyle = parseJSON<string[]>(wine.wine_style) || []
  const foodPairings = parseJSON<FoodPairing[]>(wine.food_pairings) || []
  const tastingNotes = parseJSON<TastingNotes>(wine.tasting_notes) || {}
  const technicalDetails = parseJSON<TechnicalDetails>(wine.technical_details) || {}
  const awards = parseJSON<string[]>(wine.awards) || []

  const typeColors = wineTypeColors[wine.wine_type?.toLowerCase()] || wineTypeColors.red
  const countryFlag = wine.country ? countryFlags[wine.country] || '🍷' : null

  return (
    <Card variant="default" padding="none" className={cn('overflow-hidden', className)}>
      {/* Header with image */}
      <div className="relative">
        {/* Wine image or placeholder */}
        <div className={cn(
          'h-48 flex items-center justify-center',
          typeColors.bg
        )}>
          {wine.image_url ? (
            <img
              src={wine.image_url}
              alt={wine.wine_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-center">
              <span className="text-6xl">{getWineEmoji(wine.wine_type)}</span>
              <p className={cn('text-body-sm mt-2', typeColors.text)}>
                {wine.wine_type?.charAt(0).toUpperCase() + wine.wine_type?.slice(1)}
              </p>
            </div>
          )}
        </div>

        {/* Rating badge */}
        {rating !== undefined && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
            <Star className="h-4 w-4 fill-[var(--wine)] text-[var(--wine)]" />
            <span className="text-body-sm font-bold text-white">{rating}</span>
          </div>
        )}

        {/* Country flag */}
        {countryFlag && (
          <div className="absolute top-3 left-3 text-2xl">
            {countryFlag}
          </div>
        )}
      </div>

      {/* Main info */}
      <div className="p-4">
        <h3 className="text-body-lg font-bold text-[var(--foreground)] mb-1">
          {wine.wine_name}
        </h3>
        
        <div className="flex items-center flex-wrap gap-2 text-body-sm text-[var(--foreground-secondary)]">
          {wine.producer && <span>{wine.producer}</span>}
          {wine.vintage && (
            <>
              <span className="text-[var(--foreground-muted)]">·</span>
              <span>{wine.vintage}</span>
            </>
          )}
        </div>

        {/* Location */}
        {(wine.region || wine.country) && (
          <div className="flex items-center gap-1 mt-2 text-body-sm text-[var(--foreground-muted)]">
            <MapPin className="h-4 w-4" />
            <span>{[wine.region, wine.country].filter(Boolean).join(', ')}</span>
          </div>
        )}

        {/* Quick stats row */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)]">
          {wine.alcohol_content && (
            <div className="flex items-center gap-1 text-body-xs text-[var(--foreground-muted)]">
              <Droplets className="h-3 w-3" />
              <span>{wine.alcohol_content}% ABV</span>
            </div>
          )}
          {wine.price_point && (
            <div className="text-body-xs text-[var(--foreground-muted)]">
              {wine.price_point}
            </div>
          )}
        </div>

        {/* Wine styles */}
        {wineStyle.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {wineStyle.map((style, idx) => (
              <span
                key={idx}
                className={cn(
                  'px-2 py-0.5 rounded-full text-body-xs',
                  typeColors.bg, typeColors.text, typeColors.border, 'border'
                )}
              >
                {style}
              </span>
            ))}
          </div>
        )}

        {/* Sommelier notes */}
        {wine.sommelier_notes && (
          <p className="mt-3 text-body-sm text-[var(--foreground-secondary)] italic">
            "{wine.sommelier_notes}"
          </p>
        )}
      </div>

      {/* Extended details */}
      {showFullDetails && (
        <div className="px-4 pb-4 space-y-4">
          {/* Grape varieties */}
          {grapeVarieties.length > 0 && (
            <DetailSection icon={Grape} title="Grape Varieties">
              <div className="flex flex-wrap gap-2">
                {grapeVarieties.map((grape, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded-lg bg-[var(--surface)] text-body-sm text-[var(--foreground)]"
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
            </DetailSection>
          )}

          {/* Tasting notes */}
          {(tastingNotes.appearance || tastingNotes.aroma || tastingNotes.taste || tastingNotes.finish) && (
            <DetailSection icon={Eye} title="Tasting Notes">
              <div className="grid grid-cols-2 gap-3">
                {tastingNotes.appearance && (
                  <div>
                    <p className="text-body-xs text-[var(--foreground-muted)]">Appearance</p>
                    <p className="text-body-sm text-[var(--foreground)]">{tastingNotes.appearance}</p>
                  </div>
                )}
                {tastingNotes.aroma && (
                  <div>
                    <p className="text-body-xs text-[var(--foreground-muted)]">Aroma</p>
                    <p className="text-body-sm text-[var(--foreground)]">{tastingNotes.aroma}</p>
                  </div>
                )}
                {tastingNotes.taste && (
                  <div>
                    <p className="text-body-xs text-[var(--foreground-muted)]">Taste</p>
                    <p className="text-body-sm text-[var(--foreground)]">{tastingNotes.taste}</p>
                  </div>
                )}
                {tastingNotes.finish && (
                  <div>
                    <p className="text-body-xs text-[var(--foreground-muted)]">Finish</p>
                    <p className="text-body-sm text-[var(--foreground)]">{tastingNotes.finish}</p>
                  </div>
                )}
              </div>
            </DetailSection>
          )}

          {/* Food pairings */}
          {(foodPairings.length > 0 || wine.food_pairing_notes) && (
            <DetailSection icon={Utensils} title="Food Pairings">
              {foodPairings.map((pairing, idx) => (
                <div key={idx} className="mb-2">
                  <p className="text-body-xs text-[var(--foreground-muted)]">{pairing.category}</p>
                  <p className="text-body-sm text-[var(--foreground)]">
                    {pairing.items.join(', ')}
                  </p>
                </div>
              ))}
              {wine.food_pairing_notes && (
                <p className="text-body-sm text-[var(--foreground-secondary)] italic">
                  {wine.food_pairing_notes}
                </p>
              )}
            </DetailSection>
          )}

          {/* Technical details */}
          {(technicalDetails.ph || technicalDetails.total_acidity || technicalDetails.residual_sugar || technicalDetails.aging) && (
            <DetailSection icon={FlaskConical} title="Technical Details">
              <div className="grid grid-cols-2 gap-3">
                {technicalDetails.ph && (
                  <div>
                    <p className="text-body-xs text-[var(--foreground-muted)]">pH</p>
                    <p className="text-body-sm text-[var(--foreground)]">{technicalDetails.ph}</p>
                  </div>
                )}
                {technicalDetails.total_acidity && (
                  <div>
                    <p className="text-body-xs text-[var(--foreground-muted)]">Total Acidity</p>
                    <p className="text-body-sm text-[var(--foreground)]">{technicalDetails.total_acidity}</p>
                  </div>
                )}
                {technicalDetails.residual_sugar && (
                  <div>
                    <p className="text-body-xs text-[var(--foreground-muted)]">Residual Sugar</p>
                    <p className="text-body-sm text-[var(--foreground)]">{technicalDetails.residual_sugar}</p>
                  </div>
                )}
                {technicalDetails.aging && (
                  <div>
                    <p className="text-body-xs text-[var(--foreground-muted)]">Aging</p>
                    <p className="text-body-sm text-[var(--foreground)]">{technicalDetails.aging}</p>
                  </div>
                )}
              </div>
            </DetailSection>
          )}

          {/* Winemaker notes */}
          {wine.winemaker_notes && (
            <DetailSection icon={FileText} title="Winemaker Notes">
              <p className="text-body-sm text-[var(--foreground-secondary)]">
                {wine.winemaker_notes}
              </p>
            </DetailSection>
          )}

          {/* Awards */}
          {awards.length > 0 && (
            <DetailSection icon={Award} title="Awards">
              <div className="space-y-1">
                {awards.map((award, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-[var(--gold)]">🏆</span>
                    <span className="text-body-sm text-[var(--foreground)]">{award}</span>
                  </div>
                ))}
              </div>
            </DetailSection>
          )}
        </div>
      )}
    </Card>
  )
}

// Detail section component
function DetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Wine
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="pt-3 border-t border-[var(--border)]">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-[var(--wine)]" />
        <h4 className="text-body-sm font-semibold text-[var(--foreground)]">{title}</h4>
      </div>
      {children}
    </div>
  )
}

// Helper to parse JSON fields
function parseJSON<T>(value: T | string | undefined): T | null {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }
  return value as T
}

// Helper function
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

export default WineDetailCard
