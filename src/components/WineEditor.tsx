'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Modal, Button, Input, Textarea } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Wine,
  Save,
  Grape,
  Utensils,
  Eye,
  FlaskConical,
  Award,
  Image,
  Plus,
  X,
  Trash2,
} from 'lucide-react'

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

interface MasterWine {
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
  image_url?: string
  grape_varieties?: GrapeVariety[]
  wine_style?: string[]
  tasting_notes?: TastingNotes
  technical_details?: TechnicalDetails
  awards?: string[]
  usage_count?: number
}

interface WineEditorProps {
  isOpen: boolean
  onClose: () => void
  wine: MasterWine | null
  onSave?: () => void
}

const WINE_TYPES = ['red', 'white', 'rosé', 'sparkling', 'dessert', 'fortified', 'orange']
const PRICE_POINTS = ['Budget', 'Mid-range', 'Premium', 'Luxury']

export function WineEditor({ isOpen, onClose, wine, onSave }: WineEditorProps) {
  const { addToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'tasting' | 'technical'>('basic')

  // Basic info
  const [wineName, setWineName] = useState('')
  const [producer, setProducer] = useState('')
  const [vintage, setVintage] = useState('')
  const [wineType, setWineType] = useState('red')
  const [region, setRegion] = useState('')
  const [country, setCountry] = useState('')
  const [pricePoint, setPricePoint] = useState('')
  const [alcoholContent, setAlcoholContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [defaultNotes, setDefaultNotes] = useState('')

  // Details
  const [grapeVarieties, setGrapeVarieties] = useState<GrapeVariety[]>([])
  const [wineStyles, setWineStyles] = useState<string[]>([])
  const [awards, setAwards] = useState<string[]>([])
  const [newStyle, setNewStyle] = useState('')
  const [newAward, setNewAward] = useState('')

  // Tasting notes
  const [appearance, setAppearance] = useState('')
  const [aroma, setAroma] = useState('')
  const [taste, setTaste] = useState('')
  const [finish, setFinish] = useState('')

  // Technical
  const [ph, setPh] = useState('')
  const [residualSugar, setResidualSugar] = useState('')
  const [totalAcidity, setTotalAcidity] = useState('')
  const [aging, setAging] = useState('')

  // Load wine data when modal opens
  useEffect(() => {
    if (wine) {
      setWineName(wine.wine_name || '')
      setProducer(wine.producer || '')
      setVintage(wine.vintage?.toString() || '')
      setWineType(wine.wine_type || 'red')
      setRegion(wine.region || '')
      setCountry(wine.country || '')
      setPricePoint(wine.price_point || '')
      setAlcoholContent(wine.alcohol_content?.toString() || '')
      setImageUrl(wine.image_url || '')
      setDefaultNotes(wine.default_notes || '')

      // Parse JSON fields
      setGrapeVarieties(parseJSON(wine.grape_varieties) || [])
      setWineStyles(parseJSON(wine.wine_style) || [])
      setAwards(parseJSON(wine.awards) || [])

      const tastingNotes = parseJSON<TastingNotes>(wine.tasting_notes) || {}
      setAppearance(tastingNotes.appearance || '')
      setAroma(tastingNotes.aroma || '')
      setTaste(tastingNotes.taste || '')
      setFinish(tastingNotes.finish || '')

      const techDetails = parseJSON<TechnicalDetails>(wine.technical_details) || {}
      setPh(techDetails.ph || '')
      setResidualSugar(techDetails.residual_sugar || '')
      setTotalAcidity(techDetails.total_acidity || '')
      setAging(techDetails.aging || '')
    }
  }, [wine])

  // Save wine
  const handleSave = async () => {
    if (!wine || !wineName.trim()) {
      addToast({ type: 'error', message: 'Wine name is required' })
      return
    }

    setIsSaving(true)

    try {
      const updateData = {
        wine_name: wineName.trim(),
        producer: producer.trim() || null,
        vintage: vintage ? parseInt(vintage) : null,
        wine_type: wineType,
        region: region.trim() || null,
        country: country.trim() || null,
        price_point: pricePoint || null,
        alcohol_content: alcoholContent ? parseFloat(alcoholContent) : null,
        image_url: imageUrl.trim() || null,
        default_notes: defaultNotes.trim() || null,
        grape_varieties: grapeVarieties.length > 0 ? grapeVarieties : null,
        wine_style: wineStyles.length > 0 ? wineStyles : null,
        awards: awards.length > 0 ? awards : null,
        tasting_notes: (appearance || aroma || taste || finish)
          ? { appearance, aroma, taste, finish }
          : null,
        technical_details: (ph || residualSugar || totalAcidity || aging)
          ? { ph, residual_sugar: residualSugar, total_acidity: totalAcidity, aging }
          : null,
      }

      const { error } = await supabase
        .from('wines_master')
        .update(updateData)
        .eq('id', wine.id)

      if (error) throw error

      addToast({ type: 'success', message: 'Wine updated successfully' })
      onSave?.()
      onClose()
    } catch (err) {
      console.error('Error saving wine:', err)
      addToast({ type: 'error', message: 'Failed to save wine' })
    } finally {
      setIsSaving(false)
    }
  }

  // Add grape variety
  const addGrapeVariety = () => {
    setGrapeVarieties([...grapeVarieties, { name: '', percentage: undefined }])
  }

  const updateGrapeVariety = (index: number, field: 'name' | 'percentage', value: string) => {
    const updated = [...grapeVarieties]
    if (field === 'name') {
      updated[index].name = value
    } else {
      updated[index].percentage = value ? parseInt(value) : undefined
    }
    setGrapeVarieties(updated)
  }

  const removeGrapeVariety = (index: number) => {
    setGrapeVarieties(grapeVarieties.filter((_, i) => i !== index))
  }

  // Add style
  const addStyle = () => {
    if (newStyle.trim() && !wineStyles.includes(newStyle.trim())) {
      setWineStyles([...wineStyles, newStyle.trim()])
      setNewStyle('')
    }
  }

  // Add award
  const addAward = () => {
    if (newAward.trim() && !awards.includes(newAward.trim())) {
      setAwards([...awards, newAward.trim()])
      setNewAward('')
    }
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Wine },
    { id: 'details', label: 'Details', icon: Grape },
    { id: 'tasting', label: 'Tasting Notes', icon: Eye },
    { id: 'technical', label: 'Technical', icon: FlaskConical },
  ] as const

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit: ${wine?.wine_name || 'Wine'}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-[var(--border)] pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-body-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-[var(--wine-muted)] text-[var(--wine)]'
                  : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <Input
              label="Wine Name *"
              value={wineName}
              onChange={(e) => setWineName(e.target.value)}
              placeholder="e.g., Château Margaux"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Producer"
                value={producer}
                onChange={(e) => setProducer(e.target.value)}
              />
              <Input
                label="Vintage"
                value={vintage}
                onChange={(e) => setVintage(e.target.value)}
                type="number"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-label-md text-[var(--foreground)] block mb-2">
                  Wine Type
                </label>
                <select
                  value={wineType}
                  onChange={(e) => setWineType(e.target.value)}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl',
                    'bg-[var(--surface)] border border-[var(--border)]',
                    'text-body-md text-[var(--foreground)]',
                    'focus:outline-none focus:border-[var(--wine)]'
                  )}
                >
                  {WINE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
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
                  {PRICE_POINTS.map((price) => (
                    <option key={price} value={price}>{price}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g., Bordeaux"
              />
              <Input
                label="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g., France"
              />
            </div>

            <Input
              label="Alcohol Content (%)"
              value={alcoholContent}
              onChange={(e) => setAlcoholContent(e.target.value)}
              type="number"
              step="0.1"
            />

            <Input
              label="Image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />

            <Textarea
              label="Default Notes"
              value={defaultNotes}
              onChange={(e) => setDefaultNotes(e.target.value)}
              placeholder="General tasting notes or description..."
            />
          </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* Grape Varieties */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-label-md text-[var(--foreground)]">
                  Grape Varieties
                </label>
                <button
                  onClick={addGrapeVariety}
                  className="flex items-center gap-1 text-body-sm text-[var(--wine)] hover:underline"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {grapeVarieties.map((grape, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={grape.name}
                      onChange={(e) => updateGrapeVariety(index, 'name', e.target.value)}
                      placeholder="Grape name"
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg',
                        'bg-[var(--surface)] border border-[var(--border)]',
                        'text-body-sm text-[var(--foreground)]',
                        'focus:outline-none focus:border-[var(--wine)]'
                      )}
                    />
                    <input
                      type="number"
                      value={grape.percentage || ''}
                      onChange={(e) => updateGrapeVariety(index, 'percentage', e.target.value)}
                      placeholder="%"
                      className={cn(
                        'w-20 px-3 py-2 rounded-lg',
                        'bg-[var(--surface)] border border-[var(--border)]',
                        'text-body-sm text-[var(--foreground)]',
                        'focus:outline-none focus:border-[var(--wine)]'
                      )}
                    />
                    <button
                      onClick={() => removeGrapeVariety(index)}
                      className="p-2 text-[var(--foreground-muted)] hover:text-error"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Wine Styles */}
            <div>
              <label className="text-label-md text-[var(--foreground)] block mb-2">
                Wine Styles
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {wineStyles.map((style, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--wine-muted)] text-[var(--wine)] text-body-sm"
                  >
                    {style}
                    <button onClick={() => setWineStyles(wineStyles.filter((_, i) => i !== index))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStyle}
                  onChange={(e) => setNewStyle(e.target.value)}
                  placeholder="Add style (e.g., Full-bodied)"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStyle())}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg',
                    'bg-[var(--surface)] border border-[var(--border)]',
                    'text-body-sm text-[var(--foreground)]',
                    'focus:outline-none focus:border-[var(--wine)]'
                  )}
                />
                <Button variant="secondary" size="sm" onClick={addStyle}>
                  Add
                </Button>
              </div>
            </div>

            {/* Awards */}
            <div>
              <label className="text-label-md text-[var(--foreground)] block mb-2">
                Awards
              </label>
              <div className="space-y-2 mb-2">
                {awards.map((award, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface)]"
                  >
                    <span className="text-body-sm text-[var(--foreground)]">🏆 {award}</span>
                    <button
                      onClick={() => setAwards(awards.filter((_, i) => i !== index))}
                      className="text-[var(--foreground-muted)] hover:text-error"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAward}
                  onChange={(e) => setNewAward(e.target.value)}
                  placeholder="Add award (e.g., 95pts Wine Spectator)"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAward())}
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg',
                    'bg-[var(--surface)] border border-[var(--border)]',
                    'text-body-sm text-[var(--foreground)]',
                    'focus:outline-none focus:border-[var(--wine)]'
                  )}
                />
                <Button variant="secondary" size="sm" onClick={addAward}>
                  Add
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tasting Notes Tab */}
        {activeTab === 'tasting' && (
          <div className="space-y-4">
            <Textarea
              label="Appearance"
              value={appearance}
              onChange={(e) => setAppearance(e.target.value)}
              placeholder="Color, clarity, viscosity..."
            />
            <Textarea
              label="Aroma"
              value={aroma}
              onChange={(e) => setAroma(e.target.value)}
              placeholder="Primary, secondary, tertiary aromas..."
            />
            <Textarea
              label="Taste"
              value={taste}
              onChange={(e) => setTaste(e.target.value)}
              placeholder="Flavors, structure, body..."
            />
            <Textarea
              label="Finish"
              value={finish}
              onChange={(e) => setFinish(e.target.value)}
              placeholder="Length, aftertaste..."
            />
          </div>
        )}

        {/* Technical Tab */}
        {activeTab === 'technical' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="pH"
                value={ph}
                onChange={(e) => setPh(e.target.value)}
                placeholder="e.g., 3.5"
              />
              <Input
                label="Total Acidity"
                value={totalAcidity}
                onChange={(e) => setTotalAcidity(e.target.value)}
                placeholder="e.g., 5.8 g/L"
              />
            </div>
            <Input
              label="Residual Sugar"
              value={residualSugar}
              onChange={(e) => setResidualSugar(e.target.value)}
              placeholder="e.g., 2 g/L"
            />
            <Textarea
              label="Aging"
              value={aging}
              onChange={(e) => setAging(e.target.value)}
              placeholder="e.g., 18 months in French oak barrels"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Helper to parse JSON
function parseJSON<T>(value: T | string | undefined | null): T | null {
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

export default WineEditor
