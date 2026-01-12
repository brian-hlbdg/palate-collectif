'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button, Modal, Input, Textarea } from '@/components/ui'
import { WineLoader, WineTypeBadge, RatingDisplay } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Wine,
  Search,
  Plus,
  Star,
  MapPin,
  Calendar,
  Heart,
  ShoppingBag,
  ChevronRight,
  Sparkles,
  X,
  Check,
} from 'lucide-react'

interface CollectionWine {
  id: string
  wine_master_id?: string
  wine_name: string
  producer?: string
  vintage?: number
  wine_type: string
  region?: string
  country?: string
  personal_rating?: number
  personal_notes?: string
  would_buy?: boolean
  added_date: string
  status: string
}

interface MasterWine {
  id: string
  wine_name: string
  producer?: string
  vintage?: number
  wine_type: string
  region?: string
  country?: string
  default_notes?: string
}

interface SearchResult extends MasterWine {
  usage_count?: number
}

export default function CollectionPage() {
  const { addToast } = useToast()
  
  const [collection, setCollection] = useState<CollectionWine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  
  // Add wine modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRateModal, setShowRateModal] = useState(false)
  const [selectedWine, setSelectedWine] = useState<CollectionWine | null>(null)
  
  // Search state
  const [masterSearchQuery, setMasterSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedMaster, setSelectedMaster] = useState<MasterWine | null>(null)
  
  // New wine form state
  const [newWineName, setNewWineName] = useState('')
  const [newWineProducer, setNewWineProducer] = useState('')
  const [newWineVintage, setNewWineVintage] = useState('')
  const [newWineType, setNewWineType] = useState('red')
  const [newWineRegion, setNewWineRegion] = useState('')
  const [newWineCountry, setNewWineCountry] = useState('')
  const [newWineNotes, setNewWineNotes] = useState('')
  const [newWineRating, setNewWineRating] = useState(0)
  const [newWineWouldBuy, setNewWineWouldBuy] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Get user ID
  const getUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) return session.user.id
    return localStorage.getItem('palate-temp-user')
  }

  // Load collection
  useEffect(() => {
    loadCollection()
  }, [])

  const loadCollection = async () => {
    const userId = await getUserId()
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from('user_wines')
        .select('*')
        .eq('user_id', userId)
        .order('added_date', { ascending: false })

      if (error) throw error
      setCollection(data || [])
    } catch (err) {
      console.error('Error loading collection:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Search master wines
  useEffect(() => {
    const searchMaster = async () => {
      if (masterSearchQuery.length < 2) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const { data } = await supabase
          .from('wines_master')
          .select('*')
          .or(`wine_name.ilike.%${masterSearchQuery}%,producer.ilike.%${masterSearchQuery}%`)
          .order('usage_count', { ascending: false, nullsFirst: false })
          .limit(10)

        setSearchResults(data || [])
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setIsSearching(false)
      }
    }

    const debounce = setTimeout(searchMaster, 300)
    return () => clearTimeout(debounce)
  }, [masterSearchQuery])

  // Select wine from master list
  const handleSelectMaster = (wine: MasterWine) => {
    setSelectedMaster(wine)
    setNewWineName(wine.wine_name)
    setNewWineProducer(wine.producer || '')
    setNewWineVintage(wine.vintage?.toString() || '')
    setNewWineType(wine.wine_type)
    setNewWineRegion(wine.region || '')
    setNewWineCountry(wine.country || '')
    setNewWineNotes(wine.default_notes || '')
    setMasterSearchQuery('')
    setSearchResults([])
  }

  // Save wine to collection
  const handleSaveWine = async () => {
    const userId = await getUserId()
    if (!userId || !newWineName.trim()) {
      addToast({ type: 'error', message: 'Wine name is required' })
      return
    }

    setIsSaving(true)

    try {
      // Check if already in collection
      if (selectedMaster) {
        const { data: existing } = await supabase
          .from('user_wines')
          .select('id')
          .eq('user_id', userId)
          .eq('wine_master_id', selectedMaster.id)
          .single()

        if (existing) {
          addToast({ type: 'error', message: 'This wine is already in your collection' })
          setIsSaving(false)
          return
        }
      }

      const wineData = {
        user_id: userId,
        wine_master_id: selectedMaster?.id || null,
        wine_name: newWineName.trim(),
        producer: newWineProducer.trim() || null,
        vintage: newWineVintage ? parseInt(newWineVintage) : null,
        wine_type: newWineType,
        region: newWineRegion.trim() || null,
        country: newWineCountry.trim() || null,
        personal_notes: newWineNotes.trim() || null,
        personal_rating: newWineRating || null,
        would_buy: newWineWouldBuy,
        status: selectedMaster ? 'verified' : 'pending', // pending = needs curator review
        added_date: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('user_wines')
        .insert(wineData)

      if (error) throw error

      addToast({ 
        type: 'success', 
        message: selectedMaster 
          ? 'Wine added to your collection' 
          : 'Wine added! It will be reviewed and added to our database.'
      })

      // Reset form
      resetForm()
      setShowAddModal(false)
      loadCollection()
    } catch (err) {
      console.error('Error saving wine:', err)
      addToast({ type: 'error', message: 'Failed to save wine' })
    } finally {
      setIsSaving(false)
    }
  }

  // Update wine rating
  const handleUpdateRating = async () => {
    if (!selectedWine) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('user_wines')
        .update({
          personal_rating: newWineRating,
          personal_notes: newWineNotes,
          would_buy: newWineWouldBuy,
        })
        .eq('id', selectedWine.id)

      if (error) throw error

      addToast({ type: 'success', message: 'Wine updated' })
      setShowRateModal(false)
      loadCollection()
    } catch (err) {
      console.error('Error updating wine:', err)
      addToast({ type: 'error', message: 'Failed to update wine' })
    } finally {
      setIsSaving(false)
    }
  }

  // Open rate modal
  const openRateModal = (wine: CollectionWine) => {
    setSelectedWine(wine)
    setNewWineRating(wine.personal_rating || 0)
    setNewWineNotes(wine.personal_notes || '')
    setNewWineWouldBuy(wine.would_buy || false)
    setShowRateModal(true)
  }

  // Reset form
  const resetForm = () => {
    setSelectedMaster(null)
    setMasterSearchQuery('')
    setNewWineName('')
    setNewWineProducer('')
    setNewWineVintage('')
    setNewWineType('red')
    setNewWineRegion('')
    setNewWineCountry('')
    setNewWineNotes('')
    setNewWineRating(0)
    setNewWineWouldBuy(false)
  }

  // Filter collection
  const filteredCollection = collection.filter(wine => {
    const matchesSearch = !searchQuery ||
      wine.wine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wine.producer?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = filterType === 'all' || wine.wine_type === filterType

    return matchesSearch && matchesType
  })

  // Wine types for filter
  const wineTypes = ['all', 'red', 'white', 'rosé', 'sparkling', 'dessert', 'fortified']

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <WineLoader />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-md font-bold text-[var(--foreground)]">
            My Collection
          </h1>
          <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
            {collection.length} wine{collection.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowAddModal(true)
          }}
          leftIcon={<Plus className="h-5 w-5" />}
        >
          Add Wine
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--foreground-muted)]" />
          <input
            type="text"
            placeholder="Search your collection..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full pl-12 pr-4 py-3 rounded-xl',
              'bg-[var(--surface)] border border-[var(--border)]',
              'text-body-md text-[var(--foreground)]',
              'placeholder:text-[var(--foreground-muted)]',
              'focus:outline-none focus:border-[var(--wine)]',
              'transition-colors duration-200'
            )}
          />
        </div>

        {/* Type filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {wineTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                'px-4 py-2 rounded-xl whitespace-nowrap',
                'text-body-sm font-medium',
                'border transition-all duration-200',
                filterType === type
                  ? 'border-[var(--wine)] bg-[var(--wine)] text-white'
                  : 'border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--wine)]'
              )}
            >
              {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Collection Grid */}
      {filteredCollection.length === 0 ? (
        <Card variant="default" className="text-center py-12">
          <Wine className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
          <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-2">
            {searchQuery || filterType !== 'all'
              ? 'No wines match your filters'
              : 'Start your collection'}
          </h3>
          <p className="text-body-md text-[var(--foreground-secondary)] mb-4">
            {searchQuery || filterType !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Add wines you\'ve tried or want to remember'}
          </p>
          {!searchQuery && filterType === 'all' && (
            <Button
              onClick={() => {
                resetForm()
                setShowAddModal(true)
              }}
              leftIcon={<Plus className="h-5 w-5" />}
            >
              Add Your First Wine
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCollection.map((wine) => (
            <WineCard
              key={wine.id}
              wine={wine}
              onRate={() => openRateModal(wine)}
            />
          ))}
        </div>
      )}

      {/* Add Wine Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Wine to Collection"
        size="lg"
      >
        <div className="space-y-4">
          {/* Search master list */}
          {!selectedMaster && (
            <div>
              <label className="text-label-md text-[var(--foreground)] block mb-2">
                Search our wine database
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--foreground-muted)]" />
                <input
                  type="text"
                  placeholder="Search by name or producer..."
                  value={masterSearchQuery}
                  onChange={(e) => setMasterSearchQuery(e.target.value)}
                  className={cn(
                    'w-full pl-12 pr-4 py-3 rounded-xl',
                    'bg-[var(--surface)] border border-[var(--border)]',
                    'text-body-md text-[var(--foreground)]',
                    'placeholder:text-[var(--foreground-muted)]',
                    'focus:outline-none focus:border-[var(--wine)]'
                  )}
                />
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="mt-2 border border-[var(--border)] rounded-xl overflow-hidden">
                  {searchResults.map((wine) => (
                    <button
                      key={wine.id}
                      onClick={() => handleSelectMaster(wine)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3',
                        'hover:bg-[var(--surface-hover)] transition-colors',
                        'border-b border-[var(--border)] last:border-b-0',
                        'text-left'
                      )}
                    >
                      <span className="text-xl">{getWineEmoji(wine.wine_type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium text-[var(--foreground)] truncate">
                          {wine.wine_name}
                        </p>
                        <p className="text-body-xs text-[var(--foreground-muted)]">
                          {[wine.producer, wine.vintage, wine.region].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[var(--foreground-muted)]" />
                    </button>
                  ))}
                </div>
              )}

              {masterSearchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                <p className="mt-2 text-body-sm text-[var(--foreground-muted)]">
                  No wines found. You can add it manually below.
                </p>
              )}

              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <p className="text-body-sm text-[var(--foreground-muted)] mb-2">
                  Or add a wine not in our database:
                </p>
              </div>
            </div>
          )}

          {/* Selected wine indicator */}
          {selectedMaster && (
            <div className="flex items-center justify-between p-3 bg-[var(--wine-muted)] rounded-xl">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-[var(--wine)]" />
                <span className="text-body-sm text-[var(--wine)]">
                  Selected from database
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedMaster(null)
                  resetForm()
                }}
                className="text-[var(--wine)] hover:text-[var(--wine-dark)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Wine form */}
          <Input
            label="Wine Name *"
            placeholder="e.g., Château Margaux"
            value={newWineName}
            onChange={(e) => setNewWineName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Producer"
              placeholder="e.g., Château Margaux"
              value={newWineProducer}
              onChange={(e) => setNewWineProducer(e.target.value)}
            />
            <Input
              label="Vintage"
              placeholder="e.g., 2018"
              value={newWineVintage}
              onChange={(e) => setNewWineVintage(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-label-md text-[var(--foreground)] block mb-2">
                Wine Type
              </label>
              <select
                value={newWineType}
                onChange={(e) => setNewWineType(e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-xl',
                  'bg-[var(--surface)] border border-[var(--border)]',
                  'text-body-md text-[var(--foreground)]',
                  'focus:outline-none focus:border-[var(--wine)]'
                )}
              >
                <option value="red">Red</option>
                <option value="white">White</option>
                <option value="rosé">Rosé</option>
                <option value="sparkling">Sparkling</option>
                <option value="dessert">Dessert</option>
                <option value="fortified">Fortified</option>
                <option value="orange">Orange</option>
              </select>
            </div>
            <Input
              label="Region"
              placeholder="e.g., Bordeaux"
              value={newWineRegion}
              onChange={(e) => setNewWineRegion(e.target.value)}
            />
          </div>

          <Input
            label="Country"
            placeholder="e.g., France"
            value={newWineCountry}
            onChange={(e) => setNewWineCountry(e.target.value)}
          />

          {/* Rating */}
          <div>
            <label className="text-label-md text-[var(--foreground)] block mb-2">
              Your Rating (optional)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setNewWineRating(star === newWineRating ? 0 : star)}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-colors',
                      star <= newWineRating
                        ? 'fill-[var(--wine)] text-[var(--wine)]'
                        : 'text-[var(--border)]'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Would buy */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={cn(
                'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors',
                newWineWouldBuy
                  ? 'border-[var(--wine)] bg-[var(--wine)]'
                  : 'border-[var(--border)]'
              )}
            >
              {newWineWouldBuy && <Check className="h-4 w-4 text-white" />}
            </div>
            <input
              type="checkbox"
              checked={newWineWouldBuy}
              onChange={(e) => setNewWineWouldBuy(e.target.checked)}
              className="sr-only"
            />
            <span className="text-body-md text-[var(--foreground)]">
              Would buy this wine
            </span>
          </label>

          <Textarea
            label="Personal Notes"
            placeholder="Where you tried it, what you paired it with, etc."
            value={newWineNotes}
            onChange={(e) => setNewWineNotes(e.target.value)}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveWine}
              isLoading={isSaving}
            >
              Add to Collection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rate Wine Modal */}
      <Modal
        isOpen={showRateModal}
        onClose={() => setShowRateModal(false)}
        title={selectedWine?.wine_name || 'Rate Wine'}
        size="md"
      >
        <div className="space-y-4">
          {/* Rating */}
          <div>
            <label className="text-label-md text-[var(--foreground)] block mb-2">
              Your Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setNewWineRating(star === newWineRating ? 0 : star)}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      'h-8 w-8 transition-colors',
                      star <= newWineRating
                        ? 'fill-[var(--wine)] text-[var(--wine)]'
                        : 'text-[var(--border)]'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Would buy */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={cn(
                'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors',
                newWineWouldBuy
                  ? 'border-[var(--wine)] bg-[var(--wine)]'
                  : 'border-[var(--border)]'
              )}
            >
              {newWineWouldBuy && <Check className="h-4 w-4 text-white" />}
            </div>
            <input
              type="checkbox"
              checked={newWineWouldBuy}
              onChange={(e) => setNewWineWouldBuy(e.target.checked)}
              className="sr-only"
            />
            <span className="text-body-md text-[var(--foreground)]">
              Would buy this wine
            </span>
          </label>

          <Textarea
            label="Personal Notes"
            placeholder="Your thoughts on this wine..."
            value={newWineNotes}
            onChange={(e) => setNewWineNotes(e.target.value)}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowRateModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleUpdateRating}
              isLoading={isSaving}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Wine card component
function WineCard({
  wine,
  onRate,
}: {
  wine: CollectionWine
  onRate: () => void
}) {
  return (
    <Card variant="default" padding="none" className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--wine-muted)] flex items-center justify-center text-xl flex-shrink-0">
            {getWineEmoji(wine.wine_type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-body-md font-semibold text-[var(--foreground)] line-clamp-2">
                {wine.wine_name}
              </h3>
              {wine.status === 'pending' && (
                <span className="px-2 py-0.5 rounded text-body-xs bg-[var(--gold)]/20 text-[var(--gold)] flex-shrink-0">
                  Pending
                </span>
              )}
            </div>
            <p className="text-body-sm text-[var(--foreground-secondary)] mt-1">
              {[wine.producer, wine.vintage].filter(Boolean).join(' · ')}
            </p>
            {wine.region && (
              <p className="text-body-xs text-[var(--foreground-muted)] mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {[wine.region, wine.country].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Rating and would buy */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-4">
            {wine.personal_rating ? (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-[var(--wine)] text-[var(--wine)]" />
                <span className="text-body-sm font-medium text-[var(--foreground)]">
                  {wine.personal_rating}
                </span>
              </div>
            ) : (
              <span className="text-body-sm text-[var(--foreground-muted)]">
                Not rated
              </span>
            )}
            {wine.would_buy && (
              <div className="flex items-center gap-1 text-[var(--wine)]">
                <ShoppingBag className="h-4 w-4" />
                <span className="text-body-xs">Would buy</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onRate}>
            Rate
          </Button>
        </div>
      </div>
    </Card>
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
