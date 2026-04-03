'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui'
import { ThemeToggle } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Sparkles,
  Bug,
  TrendingUp,
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  Package,
} from 'lucide-react'

interface ChangelogChange {
  type: 'new' | 'fix' | 'improvement'
  text: string
}

interface ChangelogEntry {
  id: string
  version: string
  title: string
  summary: string | null
  changes: ChangelogChange[]
  published_at: string
  created_at: string
}

const changeTypeConfig = {
  new: {
    icon: Sparkles,
    label: 'New',
    bg: 'bg-[var(--wine-muted)]',
    text: 'text-[var(--wine)]',
    border: 'border-[var(--wine)]',
  },
  fix: {
    icon: Bug,
    label: 'Fix',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-400',
  },
  improvement: {
    icon: TrendingUp,
    label: 'Improvement',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-400',
  },
}

export default function ChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadChangelog = async () => {
      const { data, error } = await supabase
        .from('changelog_entries')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })

      if (!error && data) {
        setEntries(data)
        // Expand the first (most recent) entry by default
        if (data.length > 0) {
          setExpandedIds(new Set([data[0].id]))
        }
      }
      setIsLoading(false)
    }

    loadChangelog()
  }, [])

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-body-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-[var(--wine)]" />
            <span className="text-body-md font-semibold text-[var(--foreground)]">
              Changelog
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-display-lg font-bold text-[var(--foreground)] mb-3">
            What&apos;s New in Palate
          </h1>
          <p className="text-body-lg text-[var(--foreground-secondary)]">
            Updates, improvements, and fixes — tracked here as we build.
          </p>
        </div>

        {/* Change type legend */}
        <div className="flex items-center justify-center gap-4 mb-10 flex-wrap">
          {(Object.entries(changeTypeConfig) as [keyof typeof changeTypeConfig, typeof changeTypeConfig[keyof typeof changeTypeConfig]][]).map(([type, config]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className={cn(
                'w-2 h-2 rounded-full',
                type === 'new' ? 'bg-[var(--wine)]' : type === 'fix' ? 'bg-amber-500' : 'bg-blue-500'
              )} />
              <span className="text-body-sm text-[var(--foreground-secondary)]">{config.label}</span>
            </div>
          ))}
        </div>

        {/* Entries */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-[var(--surface)] animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <Card variant="outlined" padding="lg" className="text-center">
            <Package className="h-10 w-10 text-[var(--foreground-muted)] mx-auto mb-3" />
            <p className="text-body-md text-[var(--foreground-secondary)]">
              No updates published yet. Check back soon.
            </p>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-[var(--border)]" />

            <div className="space-y-6">
              {entries.map((entry, index) => {
                const isExpanded = expandedIds.has(entry.id)
                const newCount = entry.changes.filter(c => c.type === 'new').length
                const fixCount = entry.changes.filter(c => c.type === 'fix').length
                const improvCount = entry.changes.filter(c => c.type === 'improvement').length

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative pl-8"
                  >
                    {/* Timeline dot */}
                    <div className={cn(
                      'absolute left-0 top-4 w-6 h-6 rounded-full border-2 flex items-center justify-center',
                      index === 0
                        ? 'border-[var(--wine)] bg-[var(--wine-muted)]'
                        : 'border-[var(--border)] bg-[var(--background)]'
                    )}>
                      {index === 0 && (
                        <div className="w-2 h-2 rounded-full bg-[var(--wine)]" />
                      )}
                    </div>

                    <button
                      onClick={() => toggleExpanded(entry.id)}
                      className="w-full text-left"
                    >
                      <Card
                        variant={index === 0 ? 'wine' : 'default'}
                        padding="md"
                        className={cn(
                          'transition-all duration-200',
                          'hover:border-[var(--wine)]'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Version + date */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                'text-body-xs font-mono font-bold px-2 py-0.5 rounded-full',
                                index === 0
                                  ? 'bg-[var(--wine)] text-white'
                                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-secondary)]'
                              )}>
                                v{entry.version}
                              </span>
                              <span className="flex items-center gap-1 text-body-xs text-[var(--foreground-muted)]">
                                <Calendar className="h-3 w-3" />
                                {formatDate(entry.published_at)}
                              </span>
                            </div>

                            <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
                              {entry.title}
                            </h2>

                            {entry.summary && !isExpanded && (
                              <p className="text-body-sm text-[var(--foreground-secondary)] mt-1 line-clamp-2">
                                {entry.summary}
                              </p>
                            )}

                            {/* Change counts */}
                            {!isExpanded && (
                              <div className="flex items-center gap-3 mt-2">
                                {newCount > 0 && (
                                  <span className="text-body-xs text-[var(--wine)]">
                                    {newCount} new
                                  </span>
                                )}
                                {fixCount > 0 && (
                                  <span className="text-body-xs text-amber-500">
                                    {fixCount} fix{fixCount !== 1 ? 'es' : ''}
                                  </span>
                                )}
                                {improvCount > 0 && (
                                  <span className="text-body-xs text-blue-500">
                                    {improvCount} improvement{improvCount !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex-shrink-0 text-[var(--foreground-muted)] mt-1">
                            {isExpanded
                              ? <ChevronUp className="h-5 w-5" />
                              : <ChevronDown className="h-5 w-5" />
                            }
                          </div>
                        </div>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-[var(--border)]">
                            {entry.summary && (
                              <p className="text-body-sm text-[var(--foreground-secondary)] mb-4">
                                {entry.summary}
                              </p>
                            )}
                            <div className="space-y-2">
                              {entry.changes.map((change, i) => {
                                const config = changeTypeConfig[change.type]
                                const Icon = config.icon
                                return (
                                  <div key={i} className="flex items-start gap-3">
                                    <span className={cn(
                                      'flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-body-xs font-medium mt-0.5',
                                      config.bg, config.text
                                    )}>
                                      <Icon className="h-3 w-3" />
                                      {config.label}
                                    </span>
                                    <p className="text-body-sm text-[var(--foreground)]">
                                      {change.text}
                                    </p>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </Card>
                    </button>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-body-sm text-[var(--foreground-muted)]">
            Built by Collectif &mdash; feedback welcome
          </p>
        </div>
      </main>
    </div>
  )
}
