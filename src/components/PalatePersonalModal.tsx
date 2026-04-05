'use client'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Wine, BookOpen, Sparkles, Heart, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui'

interface PalatePersonalModalProps {
  isOpen: boolean
  onClose: () => void
  stats?: {
    totalRated?: number
    wouldBuyCount?: number
    favoriteType?: string | null
  }
}

export function PalatePersonalModal({ isOpen, onClose, stats }: PalatePersonalModalProps) {
  const router = useRouter()

  const handleGetStarted = () => {
    onClose()
    router.push('/signup')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative bg-[var(--surface)] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md p-6 space-y-5"
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="text-center pt-2">
              <div className="w-16 h-16 rounded-full bg-[var(--wine-muted)] flex items-center justify-center mx-auto mb-4">
                <Wine className="h-8 w-8 text-[var(--wine)]" />
              </div>
              <h2 className="text-display-sm font-bold text-[var(--foreground)]">
                Keep your wine journey
              </h2>
              <p className="mt-2 text-body-md text-[var(--foreground-secondary)]">
                Free account. Your ratings stay with you — forever.
              </p>
            </div>

            {/* Narrative */}
            <p className="text-body-md text-[var(--foreground-secondary)] leading-relaxed">
              Your ratings are only kept for a few days after the event ends — then
              they're gone. Save them now and your wine preferences stay with you. As
              your history grows, you'll get recommendations on wines available near you
              that match what you actually like.
            </p>

            {/* Stats from this tasting */}
            {stats && (stats.totalRated ?? 0) > 0 && (
              <div className="rounded-2xl bg-[var(--wine-muted)] p-4">
                <p className="text-body-xs font-semibold text-[var(--wine)] mb-3 uppercase tracking-wide">
                  From this tasting
                </p>
                <div className="flex gap-5">
                  {(stats.totalRated ?? 0) > 0 && (
                    <div>
                      <p className="text-display-sm font-bold text-[var(--foreground)]">{stats.totalRated}</p>
                      <p className="text-body-xs text-[var(--foreground-muted)]">wines rated</p>
                    </div>
                  )}
                  {(stats.wouldBuyCount ?? 0) > 0 && (
                    <div>
                      <p className="text-display-sm font-bold text-[var(--foreground)]">{stats.wouldBuyCount}</p>
                      <p className="text-body-xs text-[var(--foreground-muted)]">would buy</p>
                    </div>
                  )}
                  {stats.favoriteType && (
                    <div>
                      <p className="text-display-sm font-bold text-[var(--foreground)] capitalize">{stats.favoriteType}</p>
                      <p className="text-body-xs text-[var(--foreground-muted)]">top type</p>
                    </div>
                  )}
                </div>
                <p className="text-body-xs text-[var(--foreground-muted)] mt-3">
                  Without an account, this disappears in 7 days.
                </p>
              </div>
            )}

            {/* Benefits */}
            <div className="space-y-3">
              {[
                { icon: BookOpen, text: 'Your tasting history saved — every wine, every note, every event' },
                { icon: Sparkles, text: 'Discover patterns in what you like as your history grows' },
                { icon: Heart, text: 'The foundation for understanding your own palate over time' },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--wine-muted)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-[var(--wine)]" />
                  </div>
                  <p className="text-body-sm text-[var(--foreground-secondary)] leading-snug">{text}</p>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="space-y-3 pb-2">
              <Button
                fullWidth
                size="lg"
                onClick={handleGetStarted}
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Save my tastings
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={onClose}
              >
                Maybe later
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PalatePersonalModal
