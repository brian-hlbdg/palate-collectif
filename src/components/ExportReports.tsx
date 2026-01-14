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
  Loader2,
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
  {
    id: 'by_wine',
    label: 'By Wine',
    description: 'One row per wine with aggregated ratings',
    icon: Wine,
  },
  {
    id: 'by_user',
    label: 'By User',
    description: 'One row per participant with their stats',
    icon: Users,
  },
  {
    id: 'summary',
    label: 'Event Summary',
    description: 'Overall event statistics and highlights',
    icon: Calendar,
  },
  {
    id: 'detailed',
    label: 'Detailed (All Ratings)',
    description: 'Every rating as individual row',
    icon: FileSpreadsheet,
  },
]

export function ExportReports({
  isOpen,
  onClose,
  eventId,
  eventName,
}: ExportReportsProps) {
  const { addToast } = useToast()
  const [selectedType, setSelectedType] = useState<ReportType>('by_wine')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)

    try {
      // Get all ratings for this event
      const { data: wines } = await supabase
        .from('event_wines')
        .select('*')
        .eq('event_id', eventId)
        .order('tasting_order', { ascending: true })

      if (!wines || wines.length === 0) {
        addToast({ type: 'error', message: 'No wines found for this event' })
        setIsExporting(false)
        return
      }

      const wineIds = wines.map(w => w.id)

      const { data: ratings } = await supabase
        .from('user_wine_ratings')
        .select('*')
        .in('event_wine_id', wineIds)

      // Get user names
      const userIds = [...new Set(ratings?.map(r => r.user_id) || [])]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, eventbrite_email')
        .in('id', userIds)

      const userMap = new Map(profiles?.map(p => [p.id, p]) || [])

      let csvContent = ''
      let filename = ''

      switch (selectedType) {
        case 'by_wine':
          csvContent = generateByWineReport(wines, ratings || [], userMap)
          filename = `${eventName}-wines-report.csv`
          break

        case 'by_user':
          csvContent = generateByUserReport(wines, ratings || [], userMap)
          filename = `${eventName}-users-report.csv`
          break

        case 'summary':
          csvContent = generateSummaryReport(wines, ratings || [], userMap, eventName)
          filename = `${eventName}-summary.csv`
          break

        case 'detailed':
          csvContent = generateDetailedReport(wines, ratings || [], userMap)
          filename = `${eventName}-detailed-ratings.csv`
          break
      }

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename.replace(/[^a-z0-9]/gi, '-').toLowerCase()
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      addToast({ type: 'success', message: 'Report downloaded' })
      onClose()
    } catch (err) {
      console.error('Export error:', err)
      addToast({ type: 'error', message: 'Failed to export report' })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Report"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-body-sm text-[var(--foreground-secondary)]">
          Choose a report format for "{eventName}"
        </p>

        {/* Report type selection */}
        <div className="space-y-2">
          {reportOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedType(option.id)}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all',
                selectedType === option.id
                  ? 'border-[var(--wine)] bg-[var(--wine-muted)]'
                  : 'border-[var(--border)] hover:border-[var(--foreground-muted)]'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                selectedType === option.id
                  ? 'bg-[var(--wine)] text-white'
                  : 'bg-[var(--surface)] text-[var(--foreground-muted)]'
              )}>
                <option.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className={cn(
                  'text-body-md font-medium',
                  selectedType === option.id
                    ? 'text-[var(--wine)]'
                    : 'text-[var(--foreground)]'
                )}>
                  {option.label}
                </p>
                <p className="text-body-sm text-[var(--foreground-muted)]">
                  {option.description}
                </p>
              </div>
              {selectedType === option.id && (
                <Check className="h-5 w-5 text-[var(--wine)]" />
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleExport}
            isLoading={isExporting}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Download CSV
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Generate report: One row per wine with aggregated stats
function generateByWineReport(
  wines: any[],
  ratings: any[],
  userMap: Map<string, any>
): string {
  const headers = [
    'Tasting Order',
    'Wine Name',
    'Producer',
    'Vintage',
    'Type',
    'Region',
    'Country',
    'Total Ratings',
    'Avg Rating',
    'Would Buy Count',
    'Would Buy %',
    'Highest Rating',
    'Lowest Rating',
    'User Comments',
  ]

  const rows = wines.map(wine => {
    const wineRatings = ratings.filter(r => r.event_wine_id === wine.id)
    const totalRatings = wineRatings.length
    const avgRating = totalRatings > 0
      ? (wineRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
      : 'N/A'
    const wouldBuyCount = wineRatings.filter(r => r.would_buy).length
    const wouldBuyPercent = totalRatings > 0
      ? Math.round((wouldBuyCount / totalRatings) * 100)
      : 0
    const highestRating = totalRatings > 0
      ? Math.max(...wineRatings.map(r => r.rating))
      : 'N/A'
    const lowestRating = totalRatings > 0
      ? Math.min(...wineRatings.map(r => r.rating))
      : 'N/A'
    
    // Combine all comments
    const comments = wineRatings
      .filter(r => r.personal_notes)
      .map(r => {
        const user = userMap.get(r.user_id)
        return `[${user?.display_name || 'Anonymous'}]: ${r.personal_notes}`
      })
      .join(' | ')

    return [
      wine.tasting_order,
      wine.wine_name,
      wine.producer || '',
      wine.vintage || '',
      wine.wine_type,
      wine.region || '',
      wine.country || '',
      totalRatings,
      avgRating,
      wouldBuyCount,
      `${wouldBuyPercent}%`,
      highestRating,
      lowestRating,
      comments,
    ]
  })

  return [headers, ...rows].map(row => row.map(escapeCSV).join(',')).join('\n')
}

// Generate report: One row per user with their stats
function generateByUserReport(
  wines: any[],
  ratings: any[],
  userMap: Map<string, any>
): string {
  const headers = [
    'User Name',
    'Email',
    'Wines Rated',
    'Avg Rating Given',
    'Would Buy Count',
    'Top Rated Wine',
    'Top Rating',
    'Rating Range',
  ]

  // Group by user
  const userRatings = new Map<string, any[]>()
  ratings.forEach(r => {
    const existing = userRatings.get(r.user_id) || []
    existing.push(r)
    userRatings.set(r.user_id, existing)
  })

  const rows = Array.from(userRatings.entries()).map(([userId, userRates]) => {
    const user = userMap.get(userId)
    const totalRatings = userRates.length
    const avgRating = (userRates.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1)
    const wouldBuyCount = userRates.filter(r => r.would_buy).length
    
    // Find top rated wine
    const topRating = userRates.sort((a, b) => b.rating - a.rating)[0]
    const topWine = wines.find(w => w.id === topRating?.event_wine_id)
    
    const ratings = userRates.map(r => r.rating)
    const ratingRange = `${Math.min(...ratings)} - ${Math.max(...ratings)}`

    return [
      user?.display_name || 'Anonymous',
      user?.eventbrite_email || '',
      totalRatings,
      avgRating,
      wouldBuyCount,
      topWine?.wine_name || 'N/A',
      topRating?.rating || 'N/A',
      ratingRange,
    ]
  })

  return [headers, ...rows].map(row => row.map(escapeCSV).join(',')).join('\n')
}

// Generate summary report
function generateSummaryReport(
  wines: any[],
  ratings: any[],
  userMap: Map<string, any>,
  eventName: string
): string {
  const totalWines = wines.length
  const totalRatings = ratings.length
  const totalParticipants = new Set(ratings.map(r => r.user_id)).size
  const avgRating = totalRatings > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(2)
    : 0
  const wouldBuyCount = ratings.filter(r => r.would_buy).length
  const wouldBuyPercent = totalRatings > 0
    ? Math.round((wouldBuyCount / totalRatings) * 100)
    : 0

  // Find top wine
  const wineAvgRatings = wines.map(wine => {
    const wineRatings = ratings.filter(r => r.event_wine_id === wine.id)
    return {
      wine,
      avgRating: wineRatings.length > 0
        ? wineRatings.reduce((sum, r) => sum + r.rating, 0) / wineRatings.length
        : 0,
      count: wineRatings.length,
    }
  }).sort((a, b) => b.avgRating - a.avgRating)

  const topWine = wineAvgRatings[0]

  // Rating distribution
  const distribution = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: ratings.filter(r => r.rating === rating).length,
  }))

  const lines = [
    ['Event Summary Report'],
    [''],
    ['Event Name', eventName],
    ['Total Wines', totalWines],
    ['Total Participants', totalParticipants],
    ['Total Ratings', totalRatings],
    ['Average Rating', avgRating],
    ['Would Buy %', `${wouldBuyPercent}%`],
    [''],
    ['Top Rated Wine', topWine?.wine.wine_name || 'N/A'],
    ['Top Wine Avg Rating', topWine?.avgRating.toFixed(2) || 'N/A'],
    ['Top Wine # Ratings', topWine?.count || 0],
    [''],
    ['Rating Distribution'],
    ['5 Stars', distribution[4].count],
    ['4 Stars', distribution[3].count],
    ['3 Stars', distribution[2].count],
    ['2 Stars', distribution[1].count],
    ['1 Star', distribution[0].count],
  ]

  return lines.map(row => row.map(escapeCSV).join(',')).join('\n')
}

// Generate detailed report (original format)
function generateDetailedReport(
  wines: any[],
  ratings: any[],
  userMap: Map<string, any>
): string {
  const headers = [
    'Wine Name',
    'Producer',
    'Vintage',
    'Type',
    'Region',
    'User',
    'Rating',
    'Would Buy',
    'Notes',
    'Rated At',
  ]

  const rows = ratings.map(rating => {
    const wine = wines.find(w => w.id === rating.event_wine_id)
    const user = userMap.get(rating.user_id)

    return [
      wine?.wine_name || 'Unknown',
      wine?.producer || '',
      wine?.vintage || '',
      wine?.wine_type || '',
      wine?.region || '',
      user?.display_name || 'Anonymous',
      rating.rating,
      rating.would_buy ? 'Yes' : 'No',
      rating.personal_notes || '',
      new Date(rating.created_at).toLocaleString(),
    ]
  })

  return [headers, ...rows].map(row => row.map(escapeCSV).join(',')).join('\n')
}

// Helper to escape CSV values
function escapeCSV(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export default ExportReports
