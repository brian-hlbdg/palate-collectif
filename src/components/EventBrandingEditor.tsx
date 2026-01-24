'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, Button, Input } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Palette,
  Image,
  Type,
  Layout,
  Eye,
  Save,
  RotateCcw,
  Smartphone,
  Monitor,
} from 'lucide-react'

export interface EventBranding {
  logo_url?: string
  banner_url?: string
  primary_color: string
  secondary_color: string
  background_style: 'gradient' | 'solid' | 'image'
  background_color: string
  background_image_url?: string
  font_style: 'modern' | 'classic' | 'playful'
  button_style: 'rounded' | 'square' | 'pill'
  show_powered_by: boolean
  custom_welcome_message?: string
  custom_thank_you_message?: string
}

export interface BoothSettings {
  require_email: boolean
  require_name: boolean
  show_wine_details: boolean
  auto_advance: boolean
  kiosk_mode: boolean
  idle_timeout_seconds: number
  show_leaderboard: boolean
  collect_phone: boolean
  marketing_opt_in: boolean
  qr_code_style: 'standard' | 'branded'
}

const defaultBranding: EventBranding = {
  primary_color: '#7C3AED',
  secondary_color: '#10B981',
  background_style: 'gradient',
  background_color: '#1a1a2e',
  font_style: 'modern',
  button_style: 'rounded',
  show_powered_by: true,
}

const defaultBoothSettings: BoothSettings = {
  require_email: true,
  require_name: false,
  show_wine_details: true,
  auto_advance: false,
  kiosk_mode: false,
  idle_timeout_seconds: 60,
  show_leaderboard: false,
  collect_phone: false,
  marketing_opt_in: true,
  qr_code_style: 'standard',
}

interface EventBrandingEditorProps {
  eventId: string
  initialBranding?: EventBranding
  initialBoothSettings?: BoothSettings
  eventType?: 'standard' | 'booth' | 'festival' | 'wine_crawl'
  onSave?: () => void
}

export function EventBrandingEditor({
  eventId,
  initialBranding,
  initialBoothSettings,
  eventType = 'standard',
  onSave
}: EventBrandingEditorProps) {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<'branding' | 'booth' | 'preview'>('branding')
  const [isSaving, setIsSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile')
  
  const [branding, setBranding] = useState<EventBranding>({
    ...defaultBranding,
    ...initialBranding
  })
  
  const [boothSettings, setBoothSettings] = useState<BoothSettings>({
    ...defaultBoothSettings,
    ...initialBoothSettings
  })

  const colorPresets = [
    { name: 'Wine', primary: '#7C3AED', secondary: '#10B981' },
    { name: 'Ocean', primary: '#0EA5E9', secondary: '#14B8A6' },
    { name: 'Sunset', primary: '#F97316', secondary: '#EAB308' },
    { name: 'Forest', primary: '#22C55E', secondary: '#84CC16' },
    { name: 'Berry', primary: '#EC4899', secondary: '#8B5CF6' },
    { name: 'Midnight', primary: '#6366F1', secondary: '#3B82F6' },
  ]

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('tasting_events')
        .update({
          branding,
          booth_settings: boothSettings,
          event_type: eventType,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId)

      if (error) throw error

      addToast({ type: 'success', message: 'Branding saved!' })
      onSave?.()
    } catch (err) {
      console.error('Error saving branding:', err)
      addToast({ type: 'error', message: 'Failed to save branding' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setBranding(defaultBranding)
    setBoothSettings(defaultBoothSettings)
  }

  const tabs = [
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'booth', label: 'Booth Settings', icon: Layout },
    { id: 'preview', label: 'Preview', icon: Eye },
  ] as const

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)] pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-[var(--wine-muted)] text-[var(--wine)]'
                : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          {/* Logo & Banner */}
          <Card variant="outlined" padding="lg">
            <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Image className="h-5 w-5" />
              Logo & Images
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-label-md text-[var(--foreground)] block mb-2">
                  Logo URL
                </label>
                <Input
                  placeholder="https://..."
                  value={branding.logo_url || ''}
                  onChange={(e) => setBranding(prev => ({ ...prev, logo_url: e.target.value }))}
                />
                {branding.logo_url && (
                  <div className="mt-2 p-2 bg-[var(--surface)] rounded-lg inline-block">
                    <img
                      src={branding.logo_url}
                      alt="Logo preview"
                      className="h-12 object-contain"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label className="text-label-md text-[var(--foreground)] block mb-2">
                  Banner Image URL
                </label>
                <Input
                  placeholder="https://..."
                  value={branding.banner_url || ''}
                  onChange={(e) => setBranding(prev => ({ ...prev, banner_url: e.target.value }))}
                />
                {branding.banner_url && (
                  <div className="mt-2 rounded-lg overflow-hidden">
                    <img
                      src={branding.banner_url}
                      alt="Banner preview"
                      className="h-20 w-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Colors */}
          <Card variant="outlined" padding="lg">
            <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Colors
            </h3>

            {/* Presets */}
            <div className="mb-4">
              <p className="text-body-xs text-[var(--foreground-muted)] mb-2">Quick presets:</p>
              <div className="flex flex-wrap gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setBranding(prev => ({
                      ...prev,
                      primary_color: preset.primary,
                      secondary_color: preset.secondary
                    }))}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--foreground-muted)] transition-colors"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }}
                    />
                    <span className="text-body-xs">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-label-md text-[var(--foreground)] block mb-2">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={branding.primary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="w-12 h-12 rounded-lg cursor-pointer border border-[var(--border)]"
                  />
                  <Input
                    value={branding.primary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-label-md text-[var(--foreground)] block mb-2">
                  Secondary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={branding.secondary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                    className="w-12 h-12 rounded-lg cursor-pointer border border-[var(--border)]"
                  />
                  <Input
                    value={branding.secondary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Background */}
            <div className="mt-4">
              <label className="text-label-md text-[var(--foreground)] block mb-2">
                Background Style
              </label>
              <div className="flex gap-2">
                {(['gradient', 'solid', 'image'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => setBranding(prev => ({ ...prev, background_style: style }))}
                    className={cn(
                      'px-4 py-2 rounded-lg text-body-sm capitalize transition-colors',
                      branding.background_style === style
                        ? 'bg-[var(--wine)] text-white'
                        : 'bg-[var(--surface)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                    )}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {branding.background_style === 'solid' && (
              <div className="mt-4">
                <label className="text-label-md text-[var(--foreground)] block mb-2">
                  Background Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={branding.background_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, background_color: e.target.value }))}
                    className="w-12 h-12 rounded-lg cursor-pointer border border-[var(--border)]"
                  />
                  <Input
                    value={branding.background_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, background_color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
            )}

            {branding.background_style === 'image' && (
              <div className="mt-4">
                <label className="text-label-md text-[var(--foreground)] block mb-2">
                  Background Image URL
                </label>
                <Input
                  placeholder="https://..."
                  value={branding.background_image_url || ''}
                  onChange={(e) => setBranding(prev => ({ ...prev, background_image_url: e.target.value }))}
                />
              </div>
            )}
          </Card>

          {/* Typography & Style */}
          <Card variant="outlined" padding="lg">
            <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Type className="h-5 w-5" />
              Typography & Style
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-label-md text-[var(--foreground)] block mb-2">
                  Font Style
                </label>
                <div className="flex gap-2">
                  {(['modern', 'classic', 'playful'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setBranding(prev => ({ ...prev, font_style: style }))}
                      className={cn(
                        'flex-1 px-3 py-2 rounded-lg text-body-sm capitalize transition-colors',
                        branding.font_style === style
                          ? 'bg-[var(--wine)] text-white'
                          : 'bg-[var(--surface)] text-[var(--foreground-secondary)]'
                      )}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-label-md text-[var(--foreground)] block mb-2">
                  Button Style
                </label>
                <div className="flex gap-2">
                  {(['rounded', 'square', 'pill'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setBranding(prev => ({ ...prev, button_style: style }))}
                      className={cn(
                        'flex-1 px-3 py-2 text-body-sm capitalize transition-colors',
                        style === 'rounded' && 'rounded-lg',
                        style === 'square' && 'rounded-none',
                        style === 'pill' && 'rounded-full',
                        branding.button_style === style
                          ? 'bg-[var(--wine)] text-white'
                          : 'bg-[var(--surface)] text-[var(--foreground-secondary)]'
                      )}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Custom Messages */}
          <Card variant="outlined" padding="lg">
            <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-4">
              Custom Messages
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-label-md text-[var(--foreground)] block mb-2">
                  Welcome Message
                </label>
                <Input
                  placeholder="Welcome to our wine tasting!"
                  value={branding.custom_welcome_message || ''}
                  onChange={(e) => setBranding(prev => ({ ...prev, custom_welcome_message: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-label-md text-[var(--foreground)] block mb-2">
                  Thank You Message
                </label>
                <Input
                  placeholder="Thanks for joining us!"
                  value={branding.custom_thank_you_message || ''}
                  onChange={(e) => setBranding(prev => ({ ...prev, custom_thank_you_message: e.target.value }))}
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={branding.show_powered_by}
                  onChange={(e) => setBranding(prev => ({ ...prev, show_powered_by: e.target.checked }))}
                  className="w-5 h-5 rounded border-[var(--border)] text-[var(--wine)]"
                />
                <span className="text-body-md text-[var(--foreground)]">
                  Show "Powered by Palate Collectif" badge
                </span>
              </label>
            </div>
          </Card>
        </div>
      )}

      {/* Booth Settings Tab */}
      {activeTab === 'booth' && (
        <div className="space-y-6">
          <Card variant="outlined" padding="lg">
            <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-4">
              Registration Options
            </h3>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg bg-[var(--surface)]">
                <span className="text-body-md text-[var(--foreground)]">
                  Require email address
                </span>
                <input
                  type="checkbox"
                  checked={boothSettings.require_email}
                  onChange={(e) => setBoothSettings(prev => ({ ...prev, require_email: e.target.checked }))}
                  className="w-5 h-5 rounded border-[var(--border)] text-[var(--wine)]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg bg-[var(--surface)]">
                <span className="text-body-md text-[var(--foreground)]">
                  Require name
                </span>
                <input
                  type="checkbox"
                  checked={boothSettings.require_name}
                  onChange={(e) => setBoothSettings(prev => ({ ...prev, require_name: e.target.checked }))}
                  className="w-5 h-5 rounded border-[var(--border)] text-[var(--wine)]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg bg-[var(--surface)]">
                <span className="text-body-md text-[var(--foreground)]">
                  Collect phone number
                </span>
                <input
                  type="checkbox"
                  checked={boothSettings.collect_phone}
                  onChange={(e) => setBoothSettings(prev => ({ ...prev, collect_phone: e.target.checked }))}
                  className="w-5 h-5 rounded border-[var(--border)] text-[var(--wine)]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg bg-[var(--surface)]">
                <span className="text-body-md text-[var(--foreground)]">
                  Marketing opt-in checkbox
                </span>
                <input
                  type="checkbox"
                  checked={boothSettings.marketing_opt_in}
                  onChange={(e) => setBoothSettings(prev => ({ ...prev, marketing_opt_in: e.target.checked }))}
                  className="w-5 h-5 rounded border-[var(--border)] text-[var(--wine)]"
                />
              </label>
            </div>
          </Card>

          <Card variant="outlined" padding="lg">
            <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-4">
              Display Options
            </h3>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg bg-[var(--surface)]">
                <span className="text-body-md text-[var(--foreground)]">
                  Show detailed wine information
                </span>
                <input
                  type="checkbox"
                  checked={boothSettings.show_wine_details}
                  onChange={(e) => setBoothSettings(prev => ({ ...prev, show_wine_details: e.target.checked }))}
                  className="w-5 h-5 rounded border-[var(--border)] text-[var(--wine)]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg bg-[var(--surface)]">
                <span className="text-body-md text-[var(--foreground)]">
                  Auto-advance after rating
                </span>
                <input
                  type="checkbox"
                  checked={boothSettings.auto_advance}
                  onChange={(e) => setBoothSettings(prev => ({ ...prev, auto_advance: e.target.checked }))}
                  className="w-5 h-5 rounded border-[var(--border)] text-[var(--wine)]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg bg-[var(--surface)]">
                <span className="text-body-md text-[var(--foreground)]">
                  Show leaderboard/popular wines
                </span>
                <input
                  type="checkbox"
                  checked={boothSettings.show_leaderboard}
                  onChange={(e) => setBoothSettings(prev => ({ ...prev, show_leaderboard: e.target.checked }))}
                  className="w-5 h-5 rounded border-[var(--border)] text-[var(--wine)]"
                />
              </label>
            </div>
          </Card>

          <Card variant="outlined" padding="lg">
            <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-4">
              Kiosk Mode
            </h3>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg bg-[var(--surface)]">
                <div>
                  <span className="text-body-md text-[var(--foreground)] block">
                    Enable kiosk mode
                  </span>
                  <span className="text-body-xs text-[var(--foreground-muted)]">
                    Full-screen, locked to this app
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={boothSettings.kiosk_mode}
                  onChange={(e) => setBoothSettings(prev => ({ ...prev, kiosk_mode: e.target.checked }))}
                  className="w-5 h-5 rounded border-[var(--border)] text-[var(--wine)]"
                />
              </label>

              {boothSettings.kiosk_mode && (
                <div>
                  <label className="text-label-md text-[var(--foreground)] block mb-2">
                    Idle timeout (seconds)
                  </label>
                  <Input
                    type="number"
                    min={30}
                    max={300}
                    value={boothSettings.idle_timeout_seconds}
                    onChange={(e) => setBoothSettings(prev => ({ ...prev, idle_timeout_seconds: parseInt(e.target.value) || 60 }))}
                  />
                  <p className="text-body-xs text-[var(--foreground-muted)] mt-1">
                    Reset to welcome screen after inactivity
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          {/* Preview Controls */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPreviewMode('mobile')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                previewMode === 'mobile'
                  ? 'bg-[var(--wine)] text-white'
                  : 'bg-[var(--surface)] text-[var(--foreground-secondary)]'
              )}
            >
              <Smartphone className="h-4 w-4" />
              Mobile
            </button>
            <button
              onClick={() => setPreviewMode('desktop')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                previewMode === 'desktop'
                  ? 'bg-[var(--wine)] text-white'
                  : 'bg-[var(--surface)] text-[var(--foreground-secondary)]'
              )}
            >
              <Monitor className="h-4 w-4" />
              Desktop
            </button>
          </div>

          {/* Preview Frame */}
          <div className="flex justify-center">
            <div
              className={cn(
                'border-4 border-gray-800 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300',
                previewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-4xl'
              )}
              style={{
                background: branding.background_style === 'gradient'
                  ? `linear-gradient(135deg, ${branding.primary_color}22, ${branding.secondary_color}22)`
                  : branding.background_style === 'solid'
                  ? branding.background_color
                  : branding.background_style === 'image' && branding.background_image_url
                  ? `url(${branding.background_image_url})`
                  : '#1a1a2e',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Preview Content */}
              <div className="min-h-[600px] p-6">
                {/* Header with logo */}
                {branding.logo_url && (
                  <div className="flex justify-center mb-6">
                    <img
                      src={branding.logo_url}
                      alt="Event logo"
                      className="h-16 object-contain"
                    />
                  </div>
                )}

                {/* Banner */}
                {branding.banner_url && (
                  <div className="rounded-xl overflow-hidden mb-6">
                    <img
                      src={branding.banner_url}
                      alt="Event banner"
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}

                {/* Welcome message */}
                <div className="text-center mb-8">
                  <h1
                    className={cn(
                      'text-2xl font-bold mb-2',
                      branding.font_style === 'modern' && 'font-sans',
                      branding.font_style === 'classic' && 'font-serif',
                      branding.font_style === 'playful' && 'font-rounded'
                    )}
                    style={{ color: branding.primary_color }}
                  >
                    {branding.custom_welcome_message || 'Welcome to Our Tasting'}
                  </h1>
                  <p className="text-gray-400">
                    Rate wines and discover your favorites
                  </p>
                </div>

                {/* Sample wine card */}
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl"
                      style={{ backgroundColor: `${branding.primary_color}33` }}
                    >
                      🍷
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">Château Example 2020</h3>
                      <p className="text-gray-400 text-sm">Bordeaux, France</p>
                    </div>
                  </div>
                </div>

                {/* Sample button */}
                <button
                  className={cn(
                    'w-full py-3 font-semibold text-white transition-colors',
                    branding.button_style === 'rounded' && 'rounded-xl',
                    branding.button_style === 'square' && 'rounded-none',
                    branding.button_style === 'pill' && 'rounded-full'
                  )}
                  style={{ backgroundColor: branding.primary_color }}
                >
                  Rate This Wine
                </button>

                {/* Powered by badge */}
                {branding.show_powered_by && (
                  <p className="text-center text-gray-500 text-xs mt-8">
                    Powered by Palate Collectif
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
        <Button
          variant="secondary"
          onClick={handleReset}
          leftIcon={<RotateCcw className="h-4 w-4" />}
        >
          Reset
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
  )
}

export default EventBrandingEditor
