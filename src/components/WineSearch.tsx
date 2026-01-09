'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  Search,
  Wine,
  Plus,
  Check,
  Loader2,
  MapPin,
  Calendar,
} from 'lucide-react'

interface WineMaster {
  id: string
  wine_name: string
  producer?: string
  vintage?: number
  wine_type: string
  region?: string
  country?: string
  price_point?: string
  alcohol_content?: number
  default_notes?: string
  usage_count?: number
}

interface WineSearchProps {
  onSelect: (wine: WineMaster | null) => void
  initialValue?: string
  placeholder?: string
  className?: string
}

export function WineSearch({
  onSelect,
  initialValue = '',
  placeholder = 'Search wines or enter new...',
  className,
}: WineSearchProps) {
  const [query, setQuery] = useState(initialValue)
  const [results, setResults] = useState<WineMaster[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [selectedWine, setSelectedWine] = useState<WineMaster | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced search
  const searchWines = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)

    try {
      // Search wines_master table with fuzzy matching
      const { data, error } = await supabase
        .from('wines_master')
        .select('*')
        .or(`wine_name.ilike.%${searchQuery}%,producer.ilike.%${searchQuery}%`)
        .order('usage_count', { ascending: false, nullsFirst: false })
        .limit(10)

      if (error) throw error

      setResults(data || [])
      setIsOpen(true)
      setSelectedIndex(-1)
    } catch (err) {
      console.error('Search error:', err)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setSelectedWine(null)
    onSelect(null)

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      searchWines(value)
    }, 300)
  }

  // Handle selection
  const handleSelect = (wine: WineMaster) => {
    setSelectedWine(wine)
    setQuery(wine.wine_name)
    setIsOpen(false)
    onSelect(wine)
  }

  // Handle "Create new" option
  const handleCreateNew = () => {
    setIsOpen(false)
    // Pass null to indicate new wine with the current query as name
    onSelect(null)
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < results.length ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex === results.length) {
          // "Create new" option selected
          handleCreateNew()
        } else if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        listRef.current &&
        !listRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return (
    <div className={cn('relative', className)}>
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--foreground-muted)]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            'w-full pl-10 pr-10 py-3 rounded-xl',
            'bg-[var(--surface)] border',
            'text-body-md text-[var(--foreground)]',
            'placeholder:text-[var(--foreground-muted)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--wine-muted)]',
            'transition-colors duration-200',
            selectedWine
              ? 'border-[var(--wine)] bg-[var(--wine-muted)]'
              : 'border-[var(--border)] focus:border-[var(--wine)]'
          )}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--foreground-muted)] animate-spin" />
        )}
        {selectedWine && !isLoading && (
          <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--wine)]" />
        )}
      </div>

      {/* Selected wine indicator */}
      {selectedWine && (
        <p className="mt-1 text-body-xs text-[var(--wine)]">
          ✓ Selected from database - details will auto-fill
        </p>
      )}

      {/* Results dropdown */}
      <AnimatePresence>
        {isOpen && (query.length >= 2) && (
          <motion.div
            ref={listRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 w-full mt-2',
              'bg-[var(--surface)] border border-[var(--border)]',
              'rounded-xl shadow-[var(--shadow-elevation-2)]',
              'max-h-80 overflow-y-auto'
            )}
          >
            {results.length > 0 ? (
              <>
                {/* Results */}
                {results.map((wine, index) => (
                  <button
                    key={wine.id}
                    onClick={() => handleSelect(wine)}
                    className={cn(
                      'w-full px-4 py-3 text-left',
                      'flex items-start gap-3',
                      'transition-colors duration-150',
                      'border-b border-[var(--border)] last:border-b-0',
                      selectedIndex === index
                        ? 'bg-[var(--wine-muted)]'
                        : 'hover:bg-[var(--hover-overlay)]'
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-[var(--background)] flex items-center justify-center text-lg flex-shrink-0">
                      {getWineEmoji(wine.wine_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-md font-medium text-[var(--foreground)] truncate">
                        {wine.wine_name}
                      </p>
                      <p className="text-body-sm text-[var(--foreground-secondary)] truncate">
                        {[wine.producer, wine.vintage].filter(Boolean).join(' · ')}
                      </p>
                      {(wine.region || wine.country) && (
                        <p className="text-body-xs text-[var(--foreground-muted)] flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {[wine.region, wine.country].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                    {wine.usage_count && wine.usage_count > 0 && (
                      <span className="text-body-xs text-[var(--foreground-muted)] flex-shrink-0">
                        Used {wine.usage_count}x
                      </span>
                    )}
                  </button>
                ))}

                {/* Create new option */}
                <button
                  onClick={handleCreateNew}
                  className={cn(
                    'w-full px-4 py-3 text-left',
                    'flex items-center gap-3',
                    'transition-colors duration-150',
                    'border-t border-[var(--border)]',
                    selectedIndex === results.length
                      ? 'bg-[var(--gold-muted)]'
                      : 'hover:bg-[var(--hover-overlay)]'
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--gold-muted)] flex items-center justify-center flex-shrink-0">
                    <Plus className="h-5 w-5 text-[var(--gold)]" />
                  </div>
                  <div>
                    <p className="text-body-md font-medium text-[var(--foreground)]">
                      Add "{query}" as new wine
                    </p>
                    <p className="text-body-sm text-[var(--foreground-muted)]">
                      Create new entry in database
                    </p>
                  </div>
                </button>
              </>
            ) : !isLoading ? (
              /* No results - show create option */
              <button
                onClick={handleCreateNew}
                className={cn(
                  'w-full px-4 py-4 text-left',
                  'flex items-center gap-3',
                  'hover:bg-[var(--hover-overlay)]',
                  'transition-colors duration-150'
                )}
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--gold-muted)] flex items-center justify-center flex-shrink-0">
                  <Plus className="h-5 w-5 text-[var(--gold)]" />
                </div>
                <div>
                  <p className="text-body-md font-medium text-[var(--foreground)]">
                    No matches found
                  </p>
                  <p className="text-body-sm text-[var(--foreground-muted)]">
                    Add "{query}" as a new wine
                  </p>
                </div>
              </button>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
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

export default WineSearch
