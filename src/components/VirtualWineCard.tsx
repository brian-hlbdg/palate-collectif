'use client'

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'
import {
  Wine,
  MapPin,
  Grape,
  Award,
  Share2,
  Download,
  QrCode,
  Copy,
  Check,
  Star,
  Utensils,
  X,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

// Country flags
const countryFlags: Record<string, string> = {
  'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸', 'United States': '🇺🇸', 'USA': '🇺🇸',
  'Germany': '🇩🇪', 'Portugal': '🇵🇹', 'Argentina': '🇦🇷', 'Chile': '🇨🇱', 'Australia': '🇦🇺',
  'New Zealand': '🇳🇿', 'South Africa': '🇿🇦', 'Austria': '🇦🇹', 'Greece': '🇬🇷',
}

// Wine type styles
const wineTypeStyles: Record<string, { bg: string; gradient: string; emoji: string }> = {
  red: { bg: 'from-red-900 to-red-800', gradient: 'from-red-600 to-rose-600', emoji: '🍷' },
  white: { bg: 'from-yellow-900 to-amber-800', gradient: 'from-yellow-500 to-amber-500', emoji: '🥂' },
  rosé: { bg: 'from-pink-900 to-rose-800', gradient: 'from-pink-500 to-rose-500', emoji: '🌸' },
  sparkling: { bg: 'from-amber-900 to-yellow-800', gradient: 'from-amber-400 to-yellow-400', emoji: '🍾' },
  dessert: { bg: 'from-orange-900 to-amber-800', gradient: 'from-orange-500 to-amber-500', emoji: '🍯' },
  fortified: { bg: 'from-amber-900 to-brown-800', gradient: 'from-amber-600 to-yellow-600', emoji: '🥃' },
  orange: { bg: 'from-orange-900 to-amber-800', gradient: 'from-orange-500 to-amber-500', emoji: '🍊' },
}

interface WineData {
  id: string
  wine_name: string
  producer?: string
  vintage?: number
  wine_type: string
  region?: string
  country?: string
  price_point?: string
  alcohol_content?: number
  grape_varieties?: { name: string; percentage?: number }[]
  wine_style?: string[]
  sommelier_notes?: string
  tasting_notes?: {
    appearance?: string
    aroma?: string
    taste?: string
    finish?: string
  }
  food_pairings?: { category: string; items: string[] }[]
  awards?: string[]
  image_url?: string
}

interface VirtualWineCardProps {
  wine: WineData
  eventCode?: string
  eventName?: string
  userRating?: number
  showQR?: boolean
  shareUrl?: string
  branding?: {
    logo_url?: string
    primary_color?: string
  }
  onClose?: () => void
}

export function VirtualWineCard({
  wine,
  eventCode,
  eventName,
  userRating,
  showQR = true,
  shareUrl,
  branding,
  onClose
}: VirtualWineCardProps) {
  const [copied, setCopied] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const wineStyle = wineTypeStyles[wine.wine_type?.toLowerCase() || 'red'] || wineTypeStyles.red
  const flag = wine.country ? countryFlags[wine.country] : null
  const primaryColor = branding?.primary_color || '#7C3AED'
  
  const wineUrl = shareUrl || (typeof window !== 'undefined' 
    ? `${window.location.origin}/wine/${wine.id}` 
    : '')

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(wineUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${wine.wine_name} - ${wine.producer || ''}`,
          text: `Check out this wine: ${wine.wine_name}`,
          url: wineUrl,
        })
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setShowShareMenu(true)
        }
      }
    } else {
      setShowShareMenu(true)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        ref={cardRef}
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Card Header with gradient */}
        <div className={cn(
          'relative p-6 pb-20 bg-gradient-to-br',
          wineStyle.bg
        )}>
          {/* Event/Brand Logo */}
          {branding?.logo_url && (
            <div className="absolute top-4 left-4">
              <img
                src={branding.logo_url}
                alt="Event logo"
                className="h-8 object-contain"
              />
            </div>
          )}

          {/* Wine Type Badge */}
          <div className="flex justify-end mb-4">
            <span className="px-3 py-1 rounded-full text-white/90 text-sm font-medium bg-white/20 backdrop-blur capitalize">
              {wine.wine_type}
            </span>
          </div>

          {/* Wine Image or Emoji */}
          <div className="flex justify-center mb-4">
            {wine.image_url ? (
              <div className="w-32 h-40 rounded-2xl overflow-hidden shadow-lg ring-4 ring-white/20">
                <img
                  src={wine.image_url}
                  alt={wine.wine_name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-40 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-6xl shadow-lg ring-4 ring-white/20">
                {wineStyle.emoji}
              </div>
            )}
          </div>

          {/* Wine Name */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-1">
              {wine.wine_name}
            </h1>
            {wine.producer && (
              <p className="text-white/80 text-lg">
                {wine.producer}
                {wine.vintage && ` · ${wine.vintage}`}
              </p>
            )}
          </div>

          {/* User Rating */}
          {userRating && (
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-1 px-4 py-2 rounded-full bg-white/20 backdrop-blur">
                <span className="text-white font-medium mr-1">Your Rating:</span>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-5 w-5',
                      i < userRating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-white/40'
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="bg-white dark:bg-gray-900 p-6 -mt-12 rounded-t-3xl relative">
          {/* Quick Info */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {wine.region && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm">
                {flag && <span>{flag}</span>}
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{wine.region}</span>
              </div>
            )}
            {wine.alcohol_content && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm">
                <Wine className="h-4 w-4 text-gray-500" />
                <span>{wine.alcohol_content}% ABV</span>
              </div>
            )}
            {wine.price_point && (
              <div className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm">
                {wine.price_point}
              </div>
            )}
          </div>

          {/* Wine Styles */}
          {wine.wine_style && wine.wine_style.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {wine.wine_style.map((style, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-sm border"
                  style={{ 
                    borderColor: primaryColor,
                    color: primaryColor
                  }}
                >
                  {style}
                </span>
              ))}
            </div>
          )}

          {/* Sommelier Notes */}
          {wine.sommelier_notes && (
            <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p className="text-gray-700 dark:text-gray-300 italic text-center">
                "{wine.sommelier_notes}"
              </p>
            </div>
          )}

          {/* Grape Varieties */}
          {wine.grape_varieties && wine.grape_varieties.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Grape className="h-4 w-4" />
                Grape Varieties
              </h3>
              <div className="flex flex-wrap gap-2">
                {wine.grape_varieties.map((grape, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm"
                  >
                    {grape.name}
                    {grape.percentage && (
                      <span className="text-purple-400 ml-1">({grape.percentage}%)</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tasting Notes */}
          {wine.tasting_notes && (wine.tasting_notes.aroma || wine.tasting_notes.taste || wine.tasting_notes.finish) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Tasting Notes
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {wine.tasting_notes.aroma && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <p className="text-xs text-gray-500 uppercase mb-1">Aroma</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{wine.tasting_notes.aroma}</p>
                  </div>
                )}
                {wine.tasting_notes.taste && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <p className="text-xs text-gray-500 uppercase mb-1">Taste</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{wine.tasting_notes.taste}</p>
                  </div>
                )}
                {wine.tasting_notes.finish && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <p className="text-xs text-gray-500 uppercase mb-1">Finish</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{wine.tasting_notes.finish}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Food Pairings */}
          {wine.food_pairings && wine.food_pairings.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Utensils className="h-4 w-4" />
                Food Pairings
              </h3>
              <div className="space-y-2">
                {wine.food_pairings.map((pairing, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{pairing.category}:</span>{' '}
                    <span className="text-gray-500">{pairing.items?.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Awards */}
          {wine.awards && wine.awards.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Awards
              </h3>
              <div className="space-y-2">
                {wine.awards.map((award, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-yellow-500">🏆</span>
                    <span className="text-gray-700 dark:text-gray-300">{award}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QR Code */}
          {showQR && wineUrl && (
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white rounded-xl shadow-md">
                <QRCodeSVG
                  value={wineUrl}
                  size={120}
                  fgColor={primaryColor}
                  level="M"
                />
                <p className="text-xs text-gray-400 text-center mt-2">
                  Scan to view online
                </p>
              </div>
            </div>
          )}

          {/* Share Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleCopyLink}
              leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button
              className="flex-1"
              onClick={handleShare}
              leftIcon={<Share2 className="h-4 w-4" />}
              style={{ backgroundColor: primaryColor }}
            >
              Share
            </Button>
          </div>

          {/* Event Footer */}
          {eventName && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-400">
                Tasted at {eventName}
                {eventCode && ` · Event Code: ${eventCode}`}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default VirtualWineCard
