'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { X, Search, ChevronRight, CheckCircle, Wine, Loader2 } from 'lucide-react'

interface WineMaster {
  id: string
  wine_name: string
  producer?: string
  vintage?: number
  wine_type?: string
  region?: string
}

interface SubmitWineFlowProps {
  isOpen: boolean
  onClose: () => void
  initialWineName?: string
  userId: string | null
  onSubmitted?: () => void
}

const WINE_TYPES = ['red', 'white', 'rosé', 'sparkling', 'dessert', 'fortified', 'orange']

const EMPTY_FORM = {
  wine_name: '',
  producer: '',
  vintage: '',
  wine_type: 'red',
  region: '',
  country: '',
  personal_notes: '',
}

export function SubmitWineFlow({ isOpen, onClose, initialWineName = '', userId, onSubmitted }: SubmitWineFlowProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [similarWines, setSimilarWines] = useState<WineMaster[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const searchDebounce = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setStep(1)
    setSimilarWines([])
    setSubmitError(null)
    setForm({ ...EMPTY_FORM, wine_name: initialWineName })

    if (initialWineName && initialWineName.length >= 2) {
      searchCatalog(initialWineName)
    } else {
      setStep(2)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialWineName])

  const searchCatalog = async (name: string) => {
    if (name.length < 2) { setSimilarWines([]); return }
    setIsSearching(true)
    try {
      const { data } = await supabase
        .from('wines_master')
        .select('id, wine_name, producer, vintage, wine_type, region')
        .or(`wine_name.ilike.%${name}%,producer.ilike.%${name}%`)
        .limit(5)
      setSimilarWines(data || [])
      if (!data || data.length === 0) setStep(2)
    } finally {
      setIsSearching(false)
    }
  }

  const handleWineNameChange = (value: string) => {
    setForm(f => ({ ...f, wine_name: value }))
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    searchDebounce.current = setTimeout(() => searchCatalog(value), 300)
  }

  const handleSubmit = async () => {
    if (!form.wine_name.trim()) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const { error } = await supabase.from('user_wines').insert({
        wine_name: form.wine_name.trim(),
        producer: form.producer || null,
        vintage: form.vintage ? parseInt(form.vintage) : null,
        wine_type: form.wine_type || null,
        region: form.region || null,
        country: form.country || null,
        personal_notes: form.personal_notes || null,
        user_id: userId || null,
        status: 'pending',
      })
      if (error) throw error
      setStep(3)
      onSubmitted?.()
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full sm:max-w-lg bg-[var(--background)] rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Handle (mobile) */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
              {step === 1 && 'Is this your wine?'}
              {step === 2 && 'Submit a Wine'}
              {step === 3 && 'Submitted!'}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-5 py-4">

            {/* Step 1: Show catalog matches */}
            {step === 1 && (
              <div className="space-y-4">
                {isSearching ? (
                  <div className="py-8 flex flex-col items-center gap-3 text-[var(--foreground-muted)]">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--wine)]" />
                    <p className="text-body-sm">Checking wine catalog…</p>
                  </div>
                ) : (
                  <>
                    <p className="text-body-sm text-[var(--foreground-secondary)]">
                      We found similar wines in our catalog. Is one of these what you&apos;re looking for?
                    </p>
                    <div className="space-y-2">
                      {similarWines.map(wine => (
                        <button
                          key={wine.id}
                          onClick={onClose}
                          className={cn(
                            'w-full text-left p-3.5 rounded-xl border',
                            'border-[var(--border)] hover:border-[var(--wine)] hover:bg-[var(--wine-muted)]',
                            'flex items-center gap-3 transition-colors'
                          )}
                        >
                          <div className="w-9 h-9 rounded-lg bg-[var(--surface)] flex items-center justify-center text-lg flex-shrink-0">
                            {getWineEmoji(wine.wine_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-body-md font-medium text-[var(--foreground)] truncate">
                              {wine.wine_name}
                            </p>
                            <p className="text-body-sm text-[var(--foreground-secondary)] truncate">
                              {[wine.producer, wine.vintage, wine.region].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-[var(--foreground-muted)] flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-[var(--border)]">
                      <button
                        onClick={() => setStep(2)}
                        className="w-full py-2.5 text-body-sm font-medium text-[var(--wine)] hover:underline"
                      >
                        None of these — submit my wine →
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Entry form */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-body-sm text-[var(--foreground-secondary)]">
                  Fill in what you know. Only the wine name is required.
                </p>

                {/* Wine name with inline search */}
                <div>
                  <label className="block text-body-sm font-medium text-[var(--foreground)] mb-1.5">
                    Wine Name <span className="text-[var(--wine)]">*</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)]" />
                    <input
                      type="text"
                      value={form.wine_name}
                      onChange={e => handleWineNameChange(e.target.value)}
                      placeholder="e.g. Château Margaux"
                      className={cn(
                        'w-full pl-9 pr-3 py-2.5 rounded-xl border',
                        'bg-[var(--surface)] border-[var(--border)]',
                        'text-body-md text-[var(--foreground)]',
                        'placeholder:text-[var(--foreground-muted)]',
                        'focus:outline-none focus:border-[var(--wine)]'
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-body-sm font-medium text-[var(--foreground)] mb-1.5">Producer</label>
                    <input
                      type="text"
                      value={form.producer}
                      onChange={e => setForm(f => ({ ...f, producer: e.target.value }))}
                      placeholder="Winery or maker"
                      className={cn(
                        'w-full px-3 py-2.5 rounded-xl border',
                        'bg-[var(--surface)] border-[var(--border)]',
                        'text-body-md text-[var(--foreground)]',
                        'placeholder:text-[var(--foreground-muted)]',
                        'focus:outline-none focus:border-[var(--wine)]'
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-[var(--foreground)] mb-1.5">Vintage</label>
                    <input
                      type="number"
                      value={form.vintage}
                      onChange={e => setForm(f => ({ ...f, vintage: e.target.value }))}
                      placeholder="e.g. 2019"
                      min={1900}
                      max={new Date().getFullYear()}
                      className={cn(
                        'w-full px-3 py-2.5 rounded-xl border',
                        'bg-[var(--surface)] border-[var(--border)]',
                        'text-body-md text-[var(--foreground)]',
                        'placeholder:text-[var(--foreground-muted)]',
                        'focus:outline-none focus:border-[var(--wine)]'
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-[var(--foreground)] mb-1.5">Wine Type</label>
                  <div className="flex flex-wrap gap-2">
                    {WINE_TYPES.map(type => (
                      <button
                        key={type}
                        onClick={() => setForm(f => ({ ...f, wine_type: type }))}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-body-sm capitalize transition-colors',
                          form.wine_type === type
                            ? 'bg-[var(--wine)] text-white'
                            : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--wine)]'
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-body-sm font-medium text-[var(--foreground)] mb-1.5">Region</label>
                    <input
                      type="text"
                      value={form.region}
                      onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                      placeholder="e.g. Bordeaux"
                      className={cn(
                        'w-full px-3 py-2.5 rounded-xl border',
                        'bg-[var(--surface)] border-[var(--border)]',
                        'text-body-md text-[var(--foreground)]',
                        'placeholder:text-[var(--foreground-muted)]',
                        'focus:outline-none focus:border-[var(--wine)]'
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-[var(--foreground)] mb-1.5">Country</label>
                    <input
                      type="text"
                      value={form.country}
                      onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                      placeholder="e.g. France"
                      className={cn(
                        'w-full px-3 py-2.5 rounded-xl border',
                        'bg-[var(--surface)] border-[var(--border)]',
                        'text-body-md text-[var(--foreground)]',
                        'placeholder:text-[var(--foreground-muted)]',
                        'focus:outline-none focus:border-[var(--wine)]'
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-[var(--foreground)] mb-1.5">Notes (optional)</label>
                  <textarea
                    value={form.personal_notes}
                    onChange={e => setForm(f => ({ ...f, personal_notes: e.target.value }))}
                    placeholder="Anything you'd like to add about this wine…"
                    rows={3}
                    className={cn(
                      'w-full px-3 py-2.5 rounded-xl border resize-none',
                      'bg-[var(--surface)] border-[var(--border)]',
                      'text-body-md text-[var(--foreground)]',
                      'placeholder:text-[var(--foreground-muted)]',
                      'focus:outline-none focus:border-[var(--wine)]'
                    )}
                  />
                </div>

                {submitError && (
                  <p className="text-body-sm text-red-400">{submitError}</p>
                )}
              </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <div className="py-10 flex flex-col items-center text-center gap-4">
                <CheckCircle className="h-14 w-14 text-green-400" />
                <div>
                  <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-1">Wine Submitted!</h3>
                  <p className="text-body-sm text-[var(--foreground-secondary)]">
                    Our curators will review it. Thanks for contributing!
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="mt-2 px-6 py-2.5 bg-[var(--wine)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Footer — submit on step 2 */}
          {step === 2 && (
            <div className="px-5 py-4 border-t border-[var(--border)]">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !form.wine_name.trim()}
                className={cn(
                  'w-full py-3 rounded-xl font-medium text-white transition-opacity',
                  'bg-[var(--wine)]',
                  (isSubmitting || !form.wine_name.trim()) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                  </span>
                ) : 'Submit Wine'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function getWineEmoji(wineType?: string): string {
  const map: Record<string, string> = {
    red: '🍷', white: '🥂', rosé: '🌸', sparkling: '🍾',
    dessert: '🍯', fortified: '🥃', orange: '🍊',
  }
  return map[wineType?.toLowerCase() || ''] || '🍷'
}

export default SubmitWineFlow
