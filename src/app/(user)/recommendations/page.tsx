'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'
import { WineLoader } from '@/components/ui'
import { WineRecommendations } from '@/components/WineRecommendations'
import { buildTasteProfile, type UserTasteProfile } from '@/lib/recommendations'
import {
  ArrowLeft,
  Sparkles,
  Wine,
  TrendingUp,
  Heart,
  Star,
  ShoppingBag,
  BarChart3,
} from 'lucide-react'

export default function RecommendationsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserTasteProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUserId = localStorage.getItem('palate-temp-user')
    if (!storedUserId) {
      router.push('/join')
      return
    }
    setUserId(storedUserId)
    loadProfile(storedUserId)
  }, [router])

  const loadProfile = async (id: string) => {
    try {
      const userProfile = await buildTasteProfile(id)
      setProfile(userProfile)
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <WineLoader />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--wine)]" />
            <h1 className="text-body-lg font-semibold text-[var(--foreground)]">
              For You
            </h1>
          </div>
        </div>
      </header>

      <main className="p-4 pb-24 max-w-lg mx-auto">
        {/* Stats Cards */}
        {profile && profile.totalRatings > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            <Card variant="outlined" padding="md" className="text-center">
              <Star className="h-5 w-5 text-[var(--gold)] mx-auto mb-1" />
              <p className="text-display-sm font-bold text-[var(--foreground)]">
                {profile.averageRating.toFixed(1)}
              </p>
              <p className="text-body-xs text-[var(--foreground-muted)]">Avg Rating</p>
            </Card>
            
            <Card variant="outlined" padding="md" className="text-center">
              <Wine className="h-5 w-5 text-[var(--wine)] mx-auto mb-1" />
              <p className="text-display-sm font-bold text-[var(--foreground)]">
                {profile.totalRatings}
              </p>
              <p className="text-body-xs text-[var(--foreground-muted)]">Wines Rated</p>
            </Card>
            
            <Card variant="outlined" padding="md" className="text-center">
              <ShoppingBag className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-display-sm font-bold text-[var(--foreground)]">
                {Math.round(profile.wouldBuyRate * 100)}%
              </p>
              <p className="text-body-xs text-[var(--foreground-muted)]">Would Buy</p>
            </Card>
          </motion.div>
        )}

        {/* Recommendations */}
        <WineRecommendations
          userId={userId}
          showProfile={true}
          maxRecommendations={10}
          onWineSelect={(wine) => {
            // Could navigate to wine detail or show modal
            console.log('Selected wine:', wine)
          }}
        />

        {/* Flavor Profile Deep Dive */}
        {profile && profile.flavorProfile.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-[var(--wine)]" />
              <h3 className="text-body-lg font-semibold text-[var(--foreground)]">
                Your Flavor Profile
              </h3>
            </div>
            
            <Card variant="outlined" padding="lg">
              <div className="space-y-3">
                {profile.flavorProfile.slice(0, 8).map((flavor, i) => {
                  const maxCount = profile.flavorProfile[0]?.count || 1
                  const width = (flavor.count / maxCount) * 100
                  
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-body-sm text-[var(--foreground)]">
                          {flavor.descriptor}
                        </span>
                        <span className="text-body-xs text-[var(--foreground-muted)]">
                          {flavor.count}x
                        </span>
                      </div>
                      <div className="h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${width}%` }}
                          transition={{ duration: 0.5, delay: i * 0.05 }}
                          className="h-full bg-gradient-to-r from-[var(--wine)] to-[var(--wine-dark)] rounded-full"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Grape Preferences */}
        {profile && profile.preferredGrapes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <h3 className="text-body-md font-semibold text-[var(--foreground)] mb-3">
              🍇 Grape Preferences
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.preferredGrapes.slice(0, 6).map((grape, i) => (
                <span
                  key={i}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-body-sm',
                    i === 0 
                      ? 'bg-[var(--wine-muted)] text-[var(--wine)] font-medium' 
                      : 'bg-[var(--surface)] text-[var(--foreground-secondary)]'
                  )}
                >
                  {grape.grape}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
