'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Modal, Button } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Download,
  FileSpreadsheet,
  Wine,
  Users,
  Calendar,
  Check,
} from 'lucide-react'

interface ExportReportsProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  eventName: string
}

type ReportType = 'by_wine' | 'by_user' | 'detailed' | 'summary'

interface ReportOption {
  id: ReportType
  label: string
  description: string
  icon: typeof Wine
}

const reportOptions: ReportOption[] = [
  { id: 'by_wine', label: 'By Wine', description: 'One row per wine with aggregated ratings', icon: Wine },
  { id: 'by_user', label: 'By User', description: 'One row per participant with their stats', icon: Users },
  { id: 'summary', label: 'Event Summary', description: 'Overall event statistics and highlights', icon: Calendar },
  { id: 'detailed', label: 'Detailed (All Ratings)', description: 'Every rating as individual row', icon: FileSpreadsheet },
]

export function ExportReports({ isOpen, onClose, eventId, eventName }: ExportReportsProps) {
  const { addToast } = useToast()
  const [selectedType, setSelectedType] = useState<ReportType>('by_wine')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const { data: wines } = await supabase.from('event_wines').select('*').eq('event_id', eventId).order('tasting_order', { ascending: true })
      if (!wines || wines.length === 0) { addToast({ type: 'error', message: 'No wines found' }); setIsExporting(false); return }
      const wineIds = wines.map(w => w.id)
      const { data: ratings } = await supabase.from('user_wine_ratings').select('*').in('event_wine_id', wineIds)
      const userIds = [...new Set(ratings?.map(r => r.user_id) || [])]
      const { data: profiles } = await supabase.from('profiles').select('id, display_name, eventbrite_email').in('id', userIds)
      const userMap = new Map(profiles?.map(p => [p.id, p]) || [])
      
      let csvContent = '', filename = ''
      switch (selectedType) {
        case 'by_wine': csvContent = generateByWineReport(wines, ratings || [], userMap); filename = `${eventName}-wines.csv`; break
        case 'by_user': csvContent = generateByUserReport(wines, ratings || [], userMap); filename = `${eventName}-users.csv`; break
        case 'summary': csvContent = generateSummaryReport(wines, ratings || [], userMap, eventName); filename = `${eventName}-summary.csv`; break
        case 'detailed': csvContent = generateDetailedReport(wines, ratings || [], userMap); filename = `${eventName}-detailed.csv`; break
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url; link.download = filename.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url)
      addToast({ type: 'success', message: 'Report downloaded' }); onClose()
    } catch (err) { console.error('Export error:', err); addToast({ type: 'error', message: 'Failed to export' }) }
    finally { setIsExporting(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Report" size="md">
      <div className="space-y-4">
        <p className="text-body-sm text-[var(--foreground-secondary)]">Choose format for "{eventName}"</p>
        <div className="space-y-2">
          {reportOptions.map((opt) => (
            <button key={opt.id} onClick={() => setSelectedType(opt.id)}
              className={cn('w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all',
                selectedType === opt.id ? 'border-[var(--wine)] bg-[var(--wine-muted)]' : 'border-[var(--border)] hover:border-[var(--foreground-muted)]')}>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center',
                selectedType === opt.id ? 'bg-[var(--wine)] text-white' : 'bg-[var(--surface)] text-[var(--foreground-muted)]')}>
                <opt.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className={cn('text-body-md font-medium', selectedType === opt.id ? 'text-[var(--wine)]' : 'text-[var(--foreground)]')}>{opt.label}</p>
                <p className="text-body-sm text-[var(--foreground-muted)]">{opt.description}</p>
              </div>
              {selectedType === opt.id && <Check className="h-5 w-5 text-[var(--wine)]" />}
            </button>
          ))}
        </div>
        <div className="flex gap-3 pt-4">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleExport} isLoading={isExporting} leftIcon={<Download className="h-4 w-4" />}>Download CSV</Button>
        </div>
      </div>
    </Modal>
  )
}

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  return (str.includes(',') || str.includes('"') || str.includes('\n')) ? `"${str.replace(/"/g, '""')}"` : str
}

function generateByWineReport(wines: any[], ratings: any[], userMap: Map<string, any>): string {
  const headers = ['Tasting Order','Wine Name','Producer','Vintage','Type','Region','Country','Total Ratings','Avg Rating','Would Buy Count','Would Buy %','Highest','Lowest','Comments']
  const rows = wines.map(wine => {
    const wr = ratings.filter(r => r.event_wine_id === wine.id)
    const total = wr.length, avg = total > 0 ? (wr.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : 'N/A'
    const wbc = wr.filter(r => r.would_buy).length, wbp = total > 0 ? Math.round((wbc / total) * 100) : 0
    const comments = wr.filter(r => r.personal_notes).map(r => `[${userMap.get(r.user_id)?.display_name || 'Anon'}]: ${r.personal_notes}`).join(' | ')
    return [wine.tasting_order, wine.wine_name, wine.producer || '', wine.vintage || '', wine.wine_type, wine.region || '', wine.country || '', total, avg, wbc, `${wbp}%`, total > 0 ? Math.max(...wr.map(r => r.rating)) : 'N/A', total > 0 ? Math.min(...wr.map(r => r.rating)) : 'N/A', comments]
  })
  return [headers, ...rows].map(row => row.map(escapeCSV).join(',')).join('\n')
}

function generateByUserReport(wines: any[], ratings: any[], userMap: Map<string, any>): string {
  const headers = ['User Name','Email','Wines Rated','Avg Rating','Would Buy Count','Top Rated Wine','Top Rating','Range']
  const userRatings = new Map<string, any[]>()
  ratings.forEach(r => { const ex = userRatings.get(r.user_id) || []; ex.push(r); userRatings.set(r.user_id, ex) })
  const rows = Array.from(userRatings.entries()).map(([userId, urs]) => {
    const user = userMap.get(userId), total = urs.length, avg = (urs.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)
    const wbc = urs.filter(r => r.would_buy).length, topR = urs.sort((a, b) => b.rating - a.rating)[0]
    const topWine = wines.find(w => w.id === topR?.event_wine_id), allR = urs.map(r => r.rating)
    return [user?.display_name || 'Anon', user?.eventbrite_email || '', total, avg, wbc, topWine?.wine_name || 'N/A', topR?.rating || 'N/A', `${Math.min(...allR)} - ${Math.max(...allR)}`]
  })
  return [headers, ...rows].map(row => row.map(escapeCSV).join(',')).join('\n')
}

function generateSummaryReport(wines: any[], ratings: any[], userMap: Map<string, any>, eventName: string): string {
  const tw = wines.length, tr = ratings.length, tp = new Set(ratings.map(r => r.user_id)).size
  const avg = tr > 0 ? (ratings.reduce((s, r) => s + r.rating, 0) / tr).toFixed(2) : 0
  const wbc = ratings.filter(r => r.would_buy).length, wbp = tr > 0 ? Math.round((wbc / tr) * 100) : 0
  const wineAvg = wines.map(w => { const wr = ratings.filter(r => r.event_wine_id === w.id); return { wine: w, avg: wr.length > 0 ? wr.reduce((s, r) => s + r.rating, 0) / wr.length : 0, count: wr.length } }).sort((a, b) => b.avg - a.avg)
  const top = wineAvg[0], dist = [1,2,3,4,5].map(r => ({ r, c: ratings.filter(x => x.rating === r).length }))
  return [['Event Summary'],[''],['Event Name',eventName],['Total Wines',tw],['Participants',tp],['Total Ratings',tr],['Avg Rating',avg],['Would Buy %',`${wbp}%`],[''],['Top Wine',top?.wine.wine_name||'N/A'],['Top Avg',top?.avg.toFixed(2)||'N/A'],[''],['Distribution'],...dist.map(d => [`${d.r} Stars`,d.c])].map(row => row.map(escapeCSV).join(',')).join('\n')
}

function generateDetailedReport(wines: any[], ratings: any[], userMap: Map<string, any>): string {
  const headers = ['Wine','Producer','Vintage','Type','Region','User','Rating','Would Buy','Notes','Rated At']
  const rows = ratings.map(r => {
    const wine = wines.find(w => w.id === r.event_wine_id), user = userMap.get(r.user_id)
    return [wine?.wine_name||'Unknown', wine?.producer||'', wine?.vintage||'', wine?.wine_type||'', wine?.region||'', user?.display_name||'Anon', r.rating, r.would_buy?'Yes':'No', r.personal_notes||'', new Date(r.created_at).toLocaleString()]
  })
  return [headers, ...rows].map(row => row.map(escapeCSV).join(',')).join('\n')
}

export default ExportReports
