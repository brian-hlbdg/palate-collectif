'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Modal, Button } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { Wine, Save, Grape, Utensils, Eye, FlaskConical, Award, Plus, X } from 'lucide-react'

interface WineFormData {
  id?: string
  wine_name: string
  producer: string
  vintage: string
  wine_type: string
  beverage_type: string
  region: string
  country: string
  price_point: string
  alcohol_content: string
  sommelier_notes: string
  image_url: string
  grape_varieties: { name: string; percentage?: number }[]
  wine_style: string[]
  food_pairings: { category: string; items: string[] }[]
  food_pairing_notes: string
  tasting_notes: { appearance?: string; aroma?: string; taste?: string; finish?: string }
  winemaker_notes: string
  technical_details: { ph?: string; residual_sugar?: string; total_acidity?: string; aging?: string; production?: string }
  awards: string[]
  location_name?: string
  tasting_order?: number
}

interface AdminWineFormProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  initialWine?: any
  onSave?: () => void
  locations?: { location_name: string }[]
  nextTastingOrder?: number
}

const WINE_TYPES = ['red', 'white', 'rosé', 'sparkling', 'dessert', 'fortified', 'orange']
const PRICE_POINTS = ['Budget', 'Mid-range', 'Premium', 'Luxury']
const WINE_STYLES = ['Light-bodied', 'Medium-bodied', 'Full-bodied', 'Very full-bodied', 'Crisp', 'Oaky', 'Fruity', 'Tannic', 'Dry', 'Sweet', 'Off-dry', 'Elegant', 'Bold', 'Complex', 'Smooth']
const FOOD_CATEGORIES = ['Red Meat', 'White Meat', 'Seafood', 'Poultry', 'Pasta', 'Cheese', 'Vegetarian', 'Spicy Food', 'Dessert', 'Appetizers']

const emptyWine: WineFormData = {
  wine_name: '', producer: '', vintage: '', wine_type: 'red', beverage_type: 'Wine',
  region: '', country: '', price_point: 'Mid-range', alcohol_content: '', sommelier_notes: '',
  image_url: '', grape_varieties: [], wine_style: [], food_pairings: [], food_pairing_notes: '',
  tasting_notes: { appearance: '', aroma: '', taste: '', finish: '' }, winemaker_notes: '',
  technical_details: { ph: '', residual_sugar: '', total_acidity: '', aging: '', production: '' }, awards: []
}

const tabs = [
  { id: 'basic', label: 'Basic Info', icon: Wine },
  { id: 'details', label: 'Grapes & Style', icon: Grape },
  { id: 'tasting', label: 'Tasting Notes', icon: Eye },
  { id: 'technical', label: 'Technical', icon: FlaskConical },
  { id: 'pairings', label: 'Food & Awards', icon: Utensils }
] as const

type TabId = typeof tabs[number]['id']

export function AdminWineForm({ isOpen, onClose, eventId, initialWine, onSave, locations = [], nextTastingOrder = 1 }: AdminWineFormProps) {
  const { addToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('basic')
  const [wine, setWine] = useState<WineFormData>(emptyWine)
  const [newGrapeName, setNewGrapeName] = useState('')
  const [newGrapePercent, setNewGrapePercent] = useState('')
  const [newStyle, setNewStyle] = useState('')
  const [newAward, setNewAward] = useState('')
  const [newFoodCategory, setNewFoodCategory] = useState('')
  const [newFoodItems, setNewFoodItems] = useState('')
  
  // Track direction for animation
  const [direction, setDirection] = useState(0)
  const tabIndex = tabs.findIndex(t => t.id === activeTab)

  useEffect(() => {
    if (initialWine) {
      setWine({
        ...emptyWine, ...initialWine,
        grape_varieties: initialWine.grape_varieties || [],
        wine_style: initialWine.wine_style || [],
        food_pairings: initialWine.food_pairings || [],
        tasting_notes: initialWine.tasting_notes || { appearance: '', aroma: '', taste: '', finish: '' },
        technical_details: initialWine.technical_details || { ph: '', residual_sugar: '', total_acidity: '', aging: '', production: '' },
        awards: initialWine.awards || []
      })
    } else { 
      setWine(emptyWine) 
    }
    setActiveTab('basic')
  }, [initialWine, isOpen])

  const handleTabChange = (newTab: TabId) => {
    const newIndex = tabs.findIndex(t => t.id === newTab)
    setDirection(newIndex > tabIndex ? 1 : -1)
    setActiveTab(newTab)
  }

  const handleSave = async () => {
    if (!wine.wine_name.trim()) { 
      addToast({ type: 'error', message: 'Wine name is required' })
      setActiveTab('basic')
      return 
    }
    setIsSaving(true)
    try {
      const wineData = {
        event_id: eventId, 
        wine_name: wine.wine_name.trim(),
        producer: wine.producer.trim() || null, 
        vintage: wine.vintage ? parseInt(wine.vintage) : null,
        wine_type: wine.wine_type, 
        beverage_type: wine.beverage_type || 'Wine',
        region: wine.region.trim() || null, 
        country: wine.country.trim() || null,
        price_point: wine.price_point || null, 
        alcohol_content: wine.alcohol_content ? parseFloat(wine.alcohol_content) : null,
        sommelier_notes: wine.sommelier_notes.trim() || null, 
        image_url: wine.image_url.trim() || null,
        grape_varieties: wine.grape_varieties.length > 0 ? wine.grape_varieties : null,
        wine_style: wine.wine_style.length > 0 ? wine.wine_style : null,
        food_pairings: wine.food_pairings.length > 0 ? wine.food_pairings : null,
        food_pairing_notes: wine.food_pairing_notes.trim() || null,
        tasting_notes: (wine.tasting_notes.appearance || wine.tasting_notes.aroma || wine.tasting_notes.taste || wine.tasting_notes.finish) ? wine.tasting_notes : null,
        winemaker_notes: wine.winemaker_notes.trim() || null,
        technical_details: (wine.technical_details.ph || wine.technical_details.residual_sugar || wine.technical_details.total_acidity || wine.technical_details.aging || wine.technical_details.production) ? wine.technical_details : null,
        awards: wine.awards.length > 0 ? wine.awards : null,
        location_name: wine.location_name || null, 
        tasting_order: wine.tasting_order || nextTastingOrder
      }
      
      if (initialWine?.id) {
        const { error } = await supabase.from('event_wines').update(wineData).eq('id', initialWine.id)
        if (error) throw error
        addToast({ type: 'success', message: 'Wine updated' })
      } else {
        const { error } = await supabase.from('event_wines').insert(wineData)
        if (error) throw error
        addToast({ type: 'success', message: 'Wine added' })
      }
      onSave?.()
      onClose()
    } catch (err) { 
      console.error('Error saving wine:', err)
      addToast({ type: 'error', message: 'Failed to save wine' }) 
    } finally { 
      setIsSaving(false) 
    }
  }

  const addGrapeVariety = () => { 
    if (newGrapeName.trim()) { 
      setWine(prev => ({ 
        ...prev, 
        grape_varieties: [...prev.grape_varieties, { name: newGrapeName.trim(), percentage: newGrapePercent ? parseInt(newGrapePercent) : undefined }] 
      }))
      setNewGrapeName('')
      setNewGrapePercent('') 
    } 
  }
  
  const addWineStyle = (style: string) => { 
    if (style && !wine.wine_style.includes(style)) { 
      setWine(prev => ({ ...prev, wine_style: [...prev.wine_style, style] })) 
    }
    setNewStyle('') 
  }
  
  const addAward = () => { 
    if (newAward.trim() && !wine.awards.includes(newAward.trim())) { 
      setWine(prev => ({ ...prev, awards: [...prev.awards, newAward.trim()] }))
      setNewAward('') 
    } 
  }
  
  const addFoodPairing = () => { 
    if (newFoodCategory && newFoodItems.trim()) { 
      const items = newFoodItems.split(',').map(i => i.trim()).filter(Boolean)
      if (items.length > 0) { 
        setWine(prev => ({ ...prev, food_pairings: [...prev.food_pairings, { category: newFoodCategory, items }] }))
        setNewFoodCategory('')
        setNewFoodItems('') 
      } 
    } 
  }

  const inputClass = cn(
    'w-full px-4 py-3 rounded-xl',
    'bg-[var(--surface)] border border-[var(--border)]',
    'text-body-md text-[var(--foreground)]',
    'placeholder:text-[var(--foreground-muted)]',
    'focus:outline-none focus:border-[var(--wine)] focus:ring-1 focus:ring-[var(--wine)]',
    'transition-colors'
  )
  const labelClass = 'text-label-md text-[var(--foreground)] block mb-2'

  // Animation variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 20 : -20,
      opacity: 0
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialWine ? 'Edit Wine' : 'Add Wine'} size="lg">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 border-b border-[var(--border)] scrollbar-hide">
          {tabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-body-sm font-medium whitespace-nowrap transition-all',
                activeTab === tab.id 
                  ? 'bg-[var(--wine-muted)] text-[var(--wine)]' 
                  : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]'
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content with fixed height and smooth transitions */}
        <div className="min-h-[420px] relative overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={activeTab}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.15 }
              }}
              className="w-full"
            >
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Wine Name *</label>
                    <input 
                      value={wine.wine_name} 
                      onChange={(e) => setWine(prev => ({ ...prev, wine_name: e.target.value }))} 
                      placeholder="e.g., Château Margaux" 
                      className={inputClass} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Producer</label>
                      <input 
                        value={wine.producer} 
                        onChange={(e) => setWine(prev => ({ ...prev, producer: e.target.value }))} 
                        placeholder="Winery name" 
                        className={inputClass} 
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Vintage</label>
                      <input 
                        type="number" 
                        value={wine.vintage} 
                        onChange={(e) => setWine(prev => ({ ...prev, vintage: e.target.value }))} 
                        placeholder="2018" 
                        className={inputClass} 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Wine Type</label>
                      <select 
                        value={wine.wine_type} 
                        onChange={(e) => setWine(prev => ({ ...prev, wine_type: e.target.value }))} 
                        className={inputClass}
                      >
                        {WINE_TYPES.map(t => (
                          <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>ABV %</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        value={wine.alcohol_content} 
                        onChange={(e) => setWine(prev => ({ ...prev, alcohol_content: e.target.value }))} 
                        placeholder="13.5" 
                        className={inputClass} 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Region</label>
                      <input 
                        value={wine.region} 
                        onChange={(e) => setWine(prev => ({ ...prev, region: e.target.value }))} 
                        placeholder="Bordeaux" 
                        className={inputClass} 
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Country</label>
                      <input 
                        value={wine.country} 
                        onChange={(e) => setWine(prev => ({ ...prev, country: e.target.value }))} 
                        placeholder="France" 
                        className={inputClass} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Price Point</label>
                    <select 
                      value={wine.price_point} 
                      onChange={(e) => setWine(prev => ({ ...prev, price_point: e.target.value }))} 
                      className={inputClass}
                    >
                      {PRICE_POINTS.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Image URL</label>
                    <input 
                      value={wine.image_url} 
                      onChange={(e) => setWine(prev => ({ ...prev, image_url: e.target.value }))} 
                      placeholder="https://..." 
                      className={inputClass} 
                    />
                    {wine.image_url && (
                      <div className="mt-2 flex items-center gap-3">
                        <img 
                          src={wine.image_url} 
                          alt="Preview" 
                          className="h-16 w-16 object-cover rounded-lg border border-[var(--border)]" 
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} 
                        />
                        <span className="text-body-xs text-[var(--foreground-muted)]">Preview</span>
                      </div>
                    )}
                  </div>
                  {locations.length > 0 && (
                    <div>
                      <label className={labelClass}>Location</label>
                      <select 
                        value={wine.location_name || ''} 
                        onChange={(e) => setWine(prev => ({ ...prev, location_name: e.target.value }))} 
                        className={inputClass}
                      >
                        <option value="">No location</option>
                        {locations.map(l => (
                          <option key={l.location_name} value={l.location_name}>{l.location_name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className={labelClass}>Sommelier Notes</label>
                    <textarea 
                      value={wine.sommelier_notes} 
                      onChange={(e) => setWine(prev => ({ ...prev, sommelier_notes: e.target.value }))} 
                      placeholder="Brief description for tasters..." 
                      rows={3} 
                      className={inputClass} 
                    />
                  </div>
                </div>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>Grape Varieties</label>
                    {wine.grape_varieties.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {wine.grape_varieties.map((g, i) => (
                          <span 
                            key={i} 
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--wine-muted)] text-[var(--wine)] text-body-sm"
                          >
                            {g.name}
                            {g.percentage && <span className="opacity-70">({g.percentage}%)</span>}
                            <button 
                              onClick={() => setWine(prev => ({ ...prev, grape_varieties: prev.grape_varieties.filter((_, idx) => idx !== i) }))} 
                              className="hover:text-[var(--wine-dark)]"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input 
                        value={newGrapeName} 
                        onChange={(e) => setNewGrapeName(e.target.value)} 
                        placeholder="Grape name" 
                        className={cn(inputClass, 'flex-1')} 
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGrapeVariety())}
                      />
                      <input 
                        type="number" 
                        value={newGrapePercent} 
                        onChange={(e) => setNewGrapePercent(e.target.value)} 
                        placeholder="%" 
                        className={cn(inputClass, 'w-20')} 
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGrapeVariety())}
                      />
                      <Button variant="secondary" size="sm" onClick={addGrapeVariety}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className={labelClass}>Wine Style</label>
                    {wine.wine_style.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {wine.wine_style.map((s, i) => (
                          <span 
                            key={i} 
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-body-sm"
                          >
                            {s}
                            <button 
                              onClick={() => setWine(prev => ({ ...prev, wine_style: prev.wine_style.filter((_, idx) => idx !== i) }))} 
                              className="text-[var(--foreground-muted)] hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-body-xs text-[var(--foreground-muted)] mb-2">Click to add:</p>
                    <div className="flex flex-wrap gap-2">
                      {WINE_STYLES.filter(s => !wine.wine_style.includes(s)).map(s => (
                        <button 
                          key={s} 
                          onClick={() => addWineStyle(s)} 
                          className="px-3 py-1 rounded-full text-body-xs border border-dashed border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--wine)] hover:text-[var(--wine)] transition-colors"
                        >
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tasting Tab */}
              {activeTab === 'tasting' && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Appearance</label>
                    <textarea 
                      value={wine.tasting_notes.appearance || ''} 
                      onChange={(e) => setWine(prev => ({ ...prev, tasting_notes: { ...prev.tasting_notes, appearance: e.target.value } }))} 
                      placeholder="Color, clarity, viscosity..." 
                      rows={2} 
                      className={inputClass} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Aroma</label>
                    <textarea 
                      value={wine.tasting_notes.aroma || ''} 
                      onChange={(e) => setWine(prev => ({ ...prev, tasting_notes: { ...prev.tasting_notes, aroma: e.target.value } }))} 
                      placeholder="Primary, secondary aromas..." 
                      rows={2} 
                      className={inputClass} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Taste</label>
                    <textarea 
                      value={wine.tasting_notes.taste || ''} 
                      onChange={(e) => setWine(prev => ({ ...prev, tasting_notes: { ...prev.tasting_notes, taste: e.target.value } }))} 
                      placeholder="Flavors, structure, body..." 
                      rows={2} 
                      className={inputClass} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Finish</label>
                    <textarea 
                      value={wine.tasting_notes.finish || ''} 
                      onChange={(e) => setWine(prev => ({ ...prev, tasting_notes: { ...prev.tasting_notes, finish: e.target.value } }))} 
                      placeholder="Length, aftertaste..." 
                      rows={2} 
                      className={inputClass} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Winemaker Notes</label>
                    <textarea 
                      value={wine.winemaker_notes} 
                      onChange={(e) => setWine(prev => ({ ...prev, winemaker_notes: e.target.value }))} 
                      placeholder="Notes from the winemaker..." 
                      rows={3} 
                      className={inputClass} 
                    />
                  </div>
                </div>
              )}

              {/* Technical Tab */}
              {activeTab === 'technical' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>pH Level</label>
                      <input 
                        value={wine.technical_details.ph || ''} 
                        onChange={(e) => setWine(prev => ({ ...prev, technical_details: { ...prev.technical_details, ph: e.target.value } }))} 
                        placeholder="3.5" 
                        className={inputClass} 
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Total Acidity</label>
                      <input 
                        value={wine.technical_details.total_acidity || ''} 
                        onChange={(e) => setWine(prev => ({ ...prev, technical_details: { ...prev.technical_details, total_acidity: e.target.value } }))} 
                        placeholder="5.8 g/L" 
                        className={inputClass} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Residual Sugar</label>
                    <input 
                      value={wine.technical_details.residual_sugar || ''} 
                      onChange={(e) => setWine(prev => ({ ...prev, technical_details: { ...prev.technical_details, residual_sugar: e.target.value } }))} 
                      placeholder="2 g/L" 
                      className={inputClass} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Aging Process</label>
                    <textarea 
                      value={wine.technical_details.aging || ''} 
                      onChange={(e) => setWine(prev => ({ ...prev, technical_details: { ...prev.technical_details, aging: e.target.value } }))} 
                      placeholder="18 months in French oak barrels" 
                      rows={2} 
                      className={inputClass} 
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Production Methods</label>
                    <textarea 
                      value={wine.technical_details.production || ''} 
                      onChange={(e) => setWine(prev => ({ ...prev, technical_details: { ...prev.technical_details, production: e.target.value } }))} 
                      placeholder="Harvest, fermentation, blending..." 
                      rows={2} 
                      className={inputClass} 
                    />
                  </div>
                </div>
              )}

              {/* Pairings Tab */}
              {activeTab === 'pairings' && (
                <div className="space-y-6">
                  <div>
                    <label className={labelClass}>Food Pairings</label>
                    {wine.food_pairings.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {wine.food_pairings.map((p, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface)]">
                            <div>
                              <p className="text-body-sm font-medium text-[var(--foreground)]">{p.category}</p>
                              <p className="text-body-xs text-[var(--foreground-muted)]">{p.items.join(', ')}</p>
                            </div>
                            <button 
                              onClick={() => setWine(prev => ({ ...prev, food_pairings: prev.food_pairings.filter((_, idx) => idx !== i) }))} 
                              className="text-[var(--foreground-muted)] hover:text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="space-y-2">
                      <select 
                        value={newFoodCategory} 
                        onChange={(e) => setNewFoodCategory(e.target.value)} 
                        className={inputClass}
                      >
                        <option value="">Select category...</option>
                        {FOOD_CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <input 
                          value={newFoodItems} 
                          onChange={(e) => setNewFoodItems(e.target.value)} 
                          placeholder="Items (comma-separated)" 
                          className={cn(inputClass, 'flex-1')} 
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFoodPairing())}
                        />
                        <Button variant="secondary" size="sm" onClick={addFoodPairing}>Add</Button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className={labelClass}>Awards & Recognition</label>
                    {wine.awards.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {wine.awards.map((a, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface)]">
                            <span className="text-body-sm text-[var(--foreground)]">🏆 {a}</span>
                            <button 
                              onClick={() => setWine(prev => ({ ...prev, awards: prev.awards.filter((_, idx) => idx !== i) }))} 
                              className="text-[var(--foreground-muted)] hover:text-red-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input 
                        value={newAward} 
                        onChange={(e) => setNewAward(e.target.value)} 
                        placeholder="95 points Wine Spectator 2023" 
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAward())} 
                        className={cn(inputClass, 'flex-1')} 
                      />
                      <Button variant="secondary" size="sm" onClick={addAward}>Add</Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

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
            {initialWine ? 'Update Wine' : 'Add Wine'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default AdminWineForm