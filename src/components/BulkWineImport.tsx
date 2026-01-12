'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Upload,
  Download,
  FileSpreadsheet,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Wine,
  CheckCircle,
  XCircle,
} from 'lucide-react'

interface WineRow {
  wine_name: string
  producer?: string
  vintage?: string
  wine_type: string
  region?: string
  country?: string
  price_point?: string
  alcohol_content?: string
  sommelier_notes?: string
  location_name?: string
  tasting_order?: string
}

interface ParsedWine extends WineRow {
  rowNumber: number
  isValid: boolean
  errors: string[]
  isDuplicate: boolean
  duplicateOf?: string
}

interface BulkWineImportProps {
  isOpen: boolean
  onClose: () => void
  eventId?: string // If provided, import to event. If not, import to master list
  eventName?: string
  onComplete?: (count: number) => void
}

const WINE_TYPES = ['red', 'white', 'rosé', 'sparkling', 'dessert', 'fortified', 'orange']

const CSV_TEMPLATE = `wine_name,producer,vintage,wine_type,region,country,price_point,alcohol_content,sommelier_notes,location_name,tasting_order
Château Margaux,Château Margaux,2018,red,Bordeaux,France,Premium,13.5,Elegant with notes of blackcurrant and violet,Main Hall,1
Cloudy Bay Sauvignon Blanc,Cloudy Bay,2022,white,Marlborough,New Zealand,Mid-range,13.0,Crisp and refreshing with citrus notes,Tasting Room,2
Veuve Clicquot Yellow Label,Veuve Clicquot,NV,sparkling,Champagne,France,Premium,12.0,Classic champagne with fine bubbles,VIP Area,3`

export function BulkWineImport({
  isOpen,
  onClose,
  eventId,
  eventName,
  onComplete,
}: BulkWineImportProps) {
  const { addToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload')
  const [parsedWines, setParsedWines] = useState<ParsedWine[]>([])
  const [importResults, setImportResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 })
  const [isProcessing, setIsProcessing] = useState(false)

  // Download CSV template
  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wine-import-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Parse CSV file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        addToast({ type: 'error', message: 'CSV file is empty or has no data rows' })
        setIsProcessing(false)
        return
      }

      // Parse header
      const header = parseCSVLine(lines[0])
      const headerMap = new Map<string, number>()
      header.forEach((col, idx) => headerMap.set(col.toLowerCase().trim(), idx))

      // Required columns
      if (!headerMap.has('wine_name') || !headerMap.has('wine_type')) {
        addToast({ type: 'error', message: 'CSV must have wine_name and wine_type columns' })
        setIsProcessing(false)
        return
      }

      // Parse data rows
      const wines: ParsedWine[] = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        if (values.length === 0 || !values[0]) continue

        const wine: WineRow = {
          wine_name: values[headerMap.get('wine_name') ?? 0] || '',
          producer: values[headerMap.get('producer') ?? -1] || undefined,
          vintage: values[headerMap.get('vintage') ?? -1] || undefined,
          wine_type: values[headerMap.get('wine_type') ?? -1] || 'red',
          region: values[headerMap.get('region') ?? -1] || undefined,
          country: values[headerMap.get('country') ?? -1] || undefined,
          price_point: values[headerMap.get('price_point') ?? -1] || undefined,
          alcohol_content: values[headerMap.get('alcohol_content') ?? -1] || undefined,
          sommelier_notes: values[headerMap.get('sommelier_notes') ?? -1] || undefined,
          location_name: values[headerMap.get('location_name') ?? -1] || undefined,
          tasting_order: values[headerMap.get('tasting_order') ?? -1] || undefined,
        }

        // Validate
        const errors: string[] = []
        if (!wine.wine_name.trim()) {
          errors.push('Wine name is required')
        }
        if (!WINE_TYPES.includes(wine.wine_type.toLowerCase())) {
          errors.push(`Invalid wine type: ${wine.wine_type}`)
        }

        wines.push({
          ...wine,
          wine_type: wine.wine_type.toLowerCase(),
          rowNumber: i + 1,
          isValid: errors.length === 0,
          errors,
          isDuplicate: false,
        })
      }

      // Check for duplicates against master list
      await checkDuplicates(wines)

      setParsedWines(wines)
      setStep('preview')
    } catch (err) {
      console.error('Parse error:', err)
      addToast({ type: 'error', message: 'Failed to parse CSV file' })
    } finally {
      setIsProcessing(false)
    }
  }

  // Parse a single CSV line (handling quoted values)
  const parseCSVLine = (line: string): string[] => {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    return values
  }

  // Check for duplicates in master list
  const checkDuplicates = async (wines: ParsedWine[]) => {
    for (const wine of wines) {
      const { data } = await supabase
        .from('wines_master')
        .select('wine_name, producer')
        .ilike('wine_name', wine.wine_name)
        .limit(1)

      if (data && data.length > 0) {
        wine.isDuplicate = true
        wine.duplicateOf = data[0].wine_name
      }
    }
  }

  // Import wines
  const handleImport = async () => {
    const validWines = parsedWines.filter(w => w.isValid)
    if (validWines.length === 0) {
      addToast({ type: 'error', message: 'No valid wines to import' })
      return
    }

    setStep('importing')
    setIsProcessing(true)

    let successCount = 0
    let failCount = 0

    try {
      for (const wine of validWines) {
        try {
          if (eventId) {
            // Import to event_wines
            const { error } = await supabase
              .from('event_wines')
              .insert({
                event_id: eventId,
                wine_name: wine.wine_name.trim(),
                producer: wine.producer?.trim() || null,
                vintage: wine.vintage?.trim() || null,
                wine_type: wine.wine_type,
                region: wine.region?.trim() || null,
                country: wine.country?.trim() || null,
                price_point: wine.price_point?.trim() || null,
                alcohol_content: wine.alcohol_content ? parseFloat(wine.alcohol_content) : null,
                sommelier_notes: wine.sommelier_notes?.trim() || null,
                location_name: wine.location_name?.trim() || null,
                tasting_order: wine.tasting_order ? parseInt(wine.tasting_order) : null,
              })

            if (error) throw error
          } else {
            // Import to wines_master (curator only)
            const { error } = await supabase
              .from('wines_master')
              .insert({
                wine_name: wine.wine_name.trim(),
                producer: wine.producer?.trim() || null,
                vintage: wine.vintage ? parseInt(wine.vintage) : null,
                wine_type: wine.wine_type,
                region: wine.region?.trim() || null,
                country: wine.country?.trim() || null,
                price_point: wine.price_point?.trim() || null,
                alcohol_content: wine.alcohol_content ? parseFloat(wine.alcohol_content) : null,
                default_notes: wine.sommelier_notes?.trim() || null,
                usage_count: 0,
              })

            if (error) throw error
          }

          successCount++
        } catch (err) {
          console.error('Import error for wine:', wine.wine_name, err)
          failCount++
        }
      }

      setImportResults({ success: successCount, failed: failCount })
      setStep('complete')
      onComplete?.(successCount)
    } catch (err) {
      console.error('Import failed:', err)
      addToast({ type: 'error', message: 'Import failed' })
    } finally {
      setIsProcessing(false)
    }
  }

  // Reset and close
  const handleClose = () => {
    setStep('upload')
    setParsedWines([])
    setImportResults({ success: 0, failed: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  // Stats
  const validCount = parsedWines.filter(w => w.isValid).length
  const invalidCount = parsedWines.filter(w => !w.isValid).length
  const duplicateCount = parsedWines.filter(w => w.isDuplicate).length

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={eventId ? `Import Wines to ${eventName || 'Event'}` : 'Import to Master List'}
      size="lg"
    >
      <div className="space-y-6">
        {/* Step: Upload */}
        {step === 'upload' && (
          <>
            {/* Download template */}
            <div className="border border-[var(--border)] rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-[var(--foreground-muted)]" />
                  <div>
                    <p className="text-body-md font-medium text-[var(--foreground)]">
                      CSV Template
                    </p>
                    <p className="text-body-sm text-[var(--foreground-muted)]">
                      Download and fill in your wines
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl',
                    'text-body-sm font-medium',
                    'border border-[var(--wine)] text-[var(--wine)]',
                    'hover:bg-[var(--wine)]/10 transition-colors'
                  )}
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>

            {/* Upload area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed border-[var(--border)] rounded-xl p-8',
                'flex flex-col items-center justify-center gap-4',
                'cursor-pointer hover:border-[var(--wine)] transition-colors'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              {isProcessing ? (
                <Loader2 className="h-12 w-12 text-[var(--wine)] animate-spin" />
              ) : (
                <>
                  <Upload className="h-12 w-12 text-[var(--foreground-muted)]" />
                  <div className="text-center">
                    <p className="text-body-md font-medium text-[var(--foreground)]">
                      Click to upload CSV
                    </p>
                    <p className="text-body-sm text-[var(--foreground-muted)]">
                      or drag and drop
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Instructions */}
            <div className="text-body-sm text-[var(--foreground-muted)] space-y-1">
              <p><strong>Required columns:</strong> wine_name, wine_type</p>
              <p><strong>Optional columns:</strong> producer, vintage, region, country, price_point, alcohol_content, sommelier_notes, location_name, tasting_order</p>
              <p><strong>Wine types:</strong> red, white, rosé, sparkling, dessert, fortified, orange</p>
            </div>
          </>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="border border-[var(--border)] rounded-xl p-3 text-center">
                <p className="text-display-sm font-bold text-[var(--foreground)]">{parsedWines.length}</p>
                <p className="text-body-xs text-[var(--foreground-muted)]">Total Rows</p>
              </div>
              <div className={cn(
                'border rounded-xl p-3 text-center',
                validCount > 0 ? 'border-green-500' : 'border-[var(--border)]'
              )}>
                <p className="text-display-sm font-bold text-green-500">{validCount}</p>
                <p className="text-body-xs text-[var(--foreground-muted)]">Valid</p>
              </div>
              <div className={cn(
                'border rounded-xl p-3 text-center',
                invalidCount > 0 ? 'border-error' : 'border-[var(--border)]'
              )}>
                <p className={cn('text-display-sm font-bold', invalidCount > 0 ? 'text-error' : 'text-[var(--foreground)]')}>
                  {invalidCount}
                </p>
                <p className="text-body-xs text-[var(--foreground-muted)]">Invalid</p>
              </div>
            </div>

            {/* Duplicate warning */}
            {duplicateCount > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--gold)]">
                <AlertTriangle className="h-5 w-5 text-[var(--gold)]" />
                <p className="text-body-sm text-[var(--foreground)]">
                  {duplicateCount} wine{duplicateCount !== 1 ? 's' : ''} may already exist in the master list
                </p>
              </div>
            )}

            {/* Wine list preview */}
            <div className="max-h-64 overflow-y-auto border border-[var(--border)] rounded-xl">
              {parsedWines.map((wine, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-3 p-3 border-b border-[var(--border)] last:border-b-0',
                    !wine.isValid && 'bg-error/5'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0',
                    wine.isValid ? 'border-green-500' : 'border-error'
                  )}>
                    {wine.isValid ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-error" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-body-sm font-medium text-[var(--foreground)] truncate">
                        {wine.wine_name || '(empty)'}
                      </p>
                      {wine.isDuplicate && (
                        <span className="px-1.5 py-0.5 rounded text-body-xs border border-[var(--gold)] text-[var(--gold)]">
                          Duplicate?
                        </span>
                      )}
                    </div>
                    {wine.errors.length > 0 ? (
                      <p className="text-body-xs text-error">{wine.errors.join(', ')}</p>
                    ) : (
                      <p className="text-body-xs text-[var(--foreground-muted)]">
                        {[wine.producer, wine.vintage, wine.wine_type].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="text-body-xs text-[var(--foreground-muted)]">
                    Row {wine.rowNumber}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('upload')
                  setParsedWines([])
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-xl',
                  'text-body-sm font-medium',
                  'border border-[var(--border)] text-[var(--foreground-secondary)]',
                  'hover:border-[var(--foreground-muted)] transition-colors'
                )}
              >
                Upload Different File
              </button>
              <button
                onClick={handleImport}
                disabled={validCount === 0}
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-xl',
                  'text-body-sm font-medium',
                  'border border-[var(--wine)] text-[var(--wine)]',
                  'hover:bg-[var(--wine)]/10 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                Import {validCount} Wine{validCount !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 text-[var(--wine)] animate-spin mx-auto mb-4" />
            <p className="text-body-md text-[var(--foreground)]">
              Importing wines...
            </p>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="text-center py-8">
            <div className={cn(
              'w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center',
              importResults.failed === 0 ? 'border-2 border-green-500' : 'border-2 border-[var(--gold)]'
            )}>
              {importResults.failed === 0 ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-[var(--gold)]" />
              )}
            </div>
            <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-2">
              Import Complete
            </h3>
            <p className="text-body-md text-[var(--foreground-secondary)] mb-6">
              {importResults.success} wine{importResults.success !== 1 ? 's' : ''} imported successfully
              {importResults.failed > 0 && `, ${importResults.failed} failed`}
            </p>
            <button
              onClick={handleClose}
              className={cn(
                'px-6 py-2.5 rounded-xl',
                'text-body-sm font-medium',
                'border border-[var(--wine)] text-[var(--wine)]',
                'hover:bg-[var(--wine)]/10 transition-colors'
              )}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default BulkWineImport
