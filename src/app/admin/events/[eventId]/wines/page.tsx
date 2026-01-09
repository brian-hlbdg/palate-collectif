'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button, Input, Textarea } from '@/components/ui'
import { WineLoader, WineTypeBadge } from '@/components/ui'
import { Modal, ConfirmDialog } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  Plus,
  Search,
  Wine,
  Edit,
  Trash2,
  Save,
} from 'lucide-react'

interface EventWine {
  id: string
  wine_name: string
  producer?: string
  vintage?: string
  wine_type: string
  region?: string
  country?: string
  tasting_order: number
  sommelier_notes?: string
  alcohol_content?: string
  price_point?: string
}

interface EventInfo {
  id: string
  event_name: string
  event_code: string
}

const WINE_TYPES = [
  { value: 'red', label: 'Red', emoji: '🍷' },
  { value: 'white', label: 'White', emoji: '🥂' },
  { value: 'rosé', label: 'Rosé', emoji: '🌸' },
  { value: 'sparkling', label: 'Sparkling', emoji: '🍾' },
  { value: 'dessert', label: 'Dessert', emoji: '🍯' },
  { value: 'fortified', label: 'Fortified', emoji: '🥃' },
  { value: 'orange', label: 'Orange', emoji: '🍊' },
]

export default function ManageWinesPage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<EventInfo | null>(null)
  const [wines, setWines] = useState<EventWine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingWine, setEditingWine] = useState<EventWine | null>(null)
  const [deleteWine, setDeleteWine] = useState<EventWine | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load event and wines
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: eventData } = await supabase
          .from('tasting_events')
          .select('id, event_name, event_code')
          .eq('id', eventId)
          .single()

        if (eventData) {
          setEvent(eventData)
        }

        const { data: winesData } = await supabase
          .from('event_wines')
          .select('*')
          .eq('event_id', eventId)
          .order('tasting_order', { ascending: true })

        if (winesData) {
          setWines(winesData)
        }
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [eventId])

  // Filter wines
  const filteredWines = wines.filter(wine =>
    !searchQuery ||
    wine.wine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wine.producer?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Delete wine
  const handleDeleteWine = async () => {
    if (!deleteWine) return
    setIsDeleting(true)

    try {
      const { error } = await supabase
        .from('event_wines')
        .delete()
        .eq('id', deleteWine.id)

      if (error) throw error

      setWines(prev => prev.filter(w => w.id !== deleteWine.id))
      addToast({ type: 'success', message: 'Wine removed' })
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to remove wine' })
    } finally {
      setIsDeleting(false)
      setDeleteWine(null)
    }
  }

  // Handle wine saved (from modal)
  const handleWineSaved = (wine: EventWine, isNew: boolean) => {
    if (isNew) {
      setWines(prev => [...prev, wine])
    } else {
      setWines(prev => prev.map(w => w.id === wine.id ? wine : w))
    }
    setShowAddModal(false)
    setEditingWine(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <WineLoader />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push(`/admin/events/${eventId}`)}
          className="flex items-center gap-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-body-sm">Back to Event</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-display-md font-bold text-[var(--foreground)]">
              Manage Wines
            </h1>
            <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
              {event?.event_name} · {wines.length} wines
            </p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            leftIcon={<Plus className="h-5 w-5" />}
          >
            Add Wine
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--foreground-muted)]" />
          <input
            type="text"
            placeholder="Search wines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full pl-10 pr-4 py-2.5 rounded-xl',
              'bg-[var(--surface)] border border-[var(--border)]',
              'text-body-md text-[var(--foreground)]',
              'placeholder:text-[var(--foreground-muted)]',
              'focus:outline-none focus:border-[var(--wine)]'
            )}
          />
        </div>
      </div>

      {/* Wines list */}
      {filteredWines.length === 0 ? (
        <Card variant="outlined" padding="lg" className="text-center">
          <Wine className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
          <h3 className="text-body-lg font-medium text-[var(--foreground)] mb-2">
            {searchQuery ? 'No wines match your search' : 'No wines yet'}
          </h3>
          <p className="text-body-md text-[var(--foreground-secondary)] mb-4">
            {searchQuery ? 'Try a different search term' : 'Add wines for your guests to rate'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setShowAddModal(true)}
              leftIcon={<Plus className="h-5 w-5" />}
            >
              Add First Wine
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredWines.map((wine, index) => (
            <motion.div
              key={wine.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <WineRow
                wine={wine}
                onEdit={() => setEditingWine(wine)}
                onDelete={() => setDeleteWine(wine)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Wine Modal */}
      <WineModal
        isOpen={showAddModal || !!editingWine}
        onClose={() => {
          setShowAddModal(false)
          setEditingWine(null)
        }}
        eventId={eventId}
        wine={editingWine}
        nextOrder={wines.length + 1}
        onSaved={handleWineSaved}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteWine}
        onClose={() => setDeleteWine(null)}
        onConfirm={handleDeleteWine}
        title="Remove Wine"
        description={`Are you sure you want to remove "${deleteWine?.wine_name}"? This will also delete all ratings for this wine.`}
        confirmText="Remove"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}

// Wine row component
function WineRow({
  wine,
  onEdit,
  onDelete,
}: {
  wine: EventWine
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card variant="default" padding="none" className="overflow-visible">
      <div className="flex items-center p-4 gap-4">
        {/* Order number */}
        <div className="w-10 h-10 rounded-xl bg-[var(--wine-muted)] flex items-center justify-center flex-shrink-0">
          <span className="text-body-sm font-bold text-[var(--wine)]">
            #{wine.tasting_order}
          </span>
        </div>

        {/* Wine info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-body-md font-semibold text-[var(--foreground)] truncate">
              {wine.wine_name}
            </h3>
            <WineTypeBadge wineType={wine.wine_type} size="sm" />
          </div>
          <p className="text-body-sm text-[var(--foreground-secondary)] truncate">
            {[wine.producer, wine.vintage, wine.region].filter(Boolean).join(' · ')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-error hover:text-error"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

// Wine modal component
function WineModal({
  isOpen,
  onClose,
  eventId,
  wine,
  nextOrder,
  onSaved,
}: {
  isOpen: boolean
  onClose: () => void
  eventId: string
  wine: EventWine | null
  nextOrder: number
  onSaved: (wine: EventWine, isNew: boolean) => void
}) {
  const { addToast } = useToast()
  const isEditing = !!wine

  const [wineName, setWineName] = useState('')
  const [producer, setProducer] = useState('')
  const [vintage, setVintage] = useState('')
  const [wineType, setWineType] = useState('red')
  const [region, setRegion] = useState('')
  const [country, setCountry] = useState('')
  const [alcoholContent, setAlcoholContent] = useState('')
  const [pricePoint, setPricePoint] = useState('')
  const [sommelierNotes, setSommelierNotes] = useState('')
  const [tastingOrder, setTastingOrder] = useState(nextOrder)
  const [isSaving, setIsSaving] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (wine) {
        setWineName(wine.wine_name)
        setProducer(wine.producer || '')
        setVintage(wine.vintage || '')
        setWineType(wine.wine_type || 'red')
        setRegion(wine.region || '')
        setCountry(wine.country || '')
        setAlcoholContent(wine.alcohol_content || '')
        setPricePoint(wine.price_point || '')
        setSommelierNotes(wine.sommelier_notes || '')
        setTastingOrder(wine.tasting_order)
      } else {
        setWineName('')
        setProducer('')
        setVintage('')
        setWineType('red')
        setRegion('')
        setCountry('')
        setAlcoholContent('')
        setPricePoint('')
        setSommelierNotes('')
        setTastingOrder(nextOrder)
      }
    }
  }, [isOpen, wine, nextOrder])

  const handleSave = async () => {
    if (!wineName.trim()) {
      addToast({ type: 'error', message: 'Wine name is required' })
      return
    }

    setIsSaving(true)

    try {
      const wineData = {
        event_id: eventId,
        wine_name: wineName.trim(),
        producer: producer.trim() || null,
        vintage: vintage.trim() || null,
        wine_type: wineType,
        region: region.trim() || null,
        country: country.trim() || null,
        alcohol_content: alcoholContent.trim() || null,
        price_point: pricePoint || null,
        sommelier_notes: sommelierNotes.trim() || null,
        tasting_order: tastingOrder,
      }

      if (isEditing && wine) {
        const { data, error } = await supabase
          .from('event_wines')
          .update(wineData)
          .eq('id', wine.id)
          .select()
          .single()

        if (error) throw error
        onSaved(data, false)
        addToast({ type: 'success', message: 'Wine updated' })
      } else {
        const { data, error } = await supabase
          .from('event_wines')
          .insert(wineData)
          .select()
          .single()

        if (error) throw error
        onSaved(data, true)
        addToast({ type: 'success', message: 'Wine added' })
      }
    } catch (err) {
      console.error('Error saving wine:', err)
      addToast({ type: 'error', message: 'Failed to save wine' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Wine' : 'Add Wine'}
      size="lg"
    >
      <div className="space-y-4">
        <Input
          label="Wine Name *"
          placeholder="e.g., Château Margaux"
          value={wineName}
          onChange={(e) => setWineName(e.target.value)}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Producer"
            placeholder="e.g., Domaine de la Romanée-Conti"
            value={producer}
            onChange={(e) => setProducer(e.target.value)}
          />
          <Input
            label="Vintage"
            placeholder="e.g., 2019"
            value={vintage}
            onChange={(e) => setVintage(e.target.value)}
          />
        </div>

        <div>
          <label className="text-label-md text-[var(--foreground)] block mb-2">
            Wine Type
          </label>
          <div className="flex flex-wrap gap-2">
            {WINE_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setWineType(type.value)}
                className={cn(
                  'px-3 py-2 rounded-xl text-body-sm font-medium',
                  'transition-colors duration-200',
                  wineType === type.value
                    ? 'bg-[var(--wine)] text-white'
                    : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--border-secondary)]'
                )}
              >
                {type.emoji} {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Region"
            placeholder="e.g., Bordeaux"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
          <Input
            label="Country"
            placeholder="e.g., France"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Alcohol %"
            placeholder="e.g., 13.5"
            value={alcoholContent}
            onChange={(e) => setAlcoholContent(e.target.value)}
          />
          <div>
            <label className="text-label-md text-[var(--foreground)] block mb-2">
              Price Point
            </label>
            <select
              value={pricePoint}
              onChange={(e) => setPricePoint(e.target.value)}
              className={cn(
                'w-full px-4 py-3 rounded-xl',
                'bg-[var(--surface)] border border-[var(--border)]',
                'text-body-md text-[var(--foreground)]',
                'focus:outline-none focus:border-[var(--wine)]'
              )}
            >
              <option value="">Select...</option>
              <option value="Budget">Budget ($)</option>
              <option value="Mid-range">Mid-range ($$)</option>
              <option value="Premium">Premium ($$$)</option>
              <option value="Luxury">Luxury ($$$$)</option>
            </select>
          </div>
        </div>

        <Input
          label="Tasting Order"
          type="number"
          value={tastingOrder.toString()}
          onChange={(e) => setTastingOrder(parseInt(e.target.value) || 1)}
          min={1}
        />

        <Textarea
          label="Sommelier Notes"
          placeholder="Tasting notes, food pairings, or other details..."
          value={sommelierNotes}
          onChange={(e) => setSommelierNotes(e.target.value)}
        />
      </div>

      {/* Footer */}
      <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-[var(--border)]">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          isLoading={isSaving}
          leftIcon={<Save className="h-4 w-4" />}
        >
          {isEditing ? 'Save Changes' : 'Add Wine'}
        </Button>
      </div>
    </Modal>
  )
}
