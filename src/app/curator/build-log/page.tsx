'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button, Input, Textarea } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Bug, Sparkles, TrendingUp, Plus, X, Check, ChevronDown,
  AlertCircle, Clock, CheckCircle2, Inbox, Megaphone,
  ArrowRight, Edit2, Trash2, Eye, EyeOff,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type IssueType = 'bug' | 'feature' | 'improvement'
type IssueStatus = 'open' | 'in_progress' | 'done'
type IssuePriority = 'low' | 'medium' | 'high' | 'critical'
type SuggestionStatus = 'pending' | 'accepted' | 'rejected'
type Tab = 'issues' | 'suggestions' | 'changelog'

interface BuildIssue {
  id: string
  title: string
  description?: string
  type: IssueType
  status: IssueStatus
  priority: IssuePriority
  curator_notes?: string
  created_at: string
  resolved_at?: string
}

interface AdminSuggestion {
  id: string
  admin_id?: string
  admin_name?: string
  title: string
  description?: string
  category: IssueType
  status: SuggestionStatus
  curator_notes?: string
  created_at: string
}

interface ChangelogChange {
  type: 'new' | 'fix' | 'improvement'
  text: string
}

interface ChangelogEntry {
  id: string
  version?: string
  title: string
  summary?: string
  changes: ChangelogChange[]
  is_published: boolean
  published_at?: string
  created_at: string
}

// ─── Config ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<IssueType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  bug: { label: 'Bug', icon: Bug, color: 'text-red-500', bg: 'bg-red-500/10' },
  feature: { label: 'Feature', icon: Sparkles, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  improvement: { label: 'Improvement', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
}

const STATUS_CONFIG: Record<IssueStatus, { label: string; icon: React.ElementType; color: string }> = {
  open: { label: 'Open', icon: AlertCircle, color: 'text-[var(--foreground-secondary)]' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-blue-500' },
  done: { label: 'Done', icon: CheckCircle2, color: 'text-green-500' },
}

const PRIORITY_CONFIG: Record<IssuePriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-[var(--foreground-muted)]' },
  medium: { label: 'Medium', color: 'text-amber-500' },
  high: { label: 'High', color: 'text-orange-500' },
  critical: { label: 'Critical', color: 'text-red-500' },
}

const CHANGE_TYPE_CONFIG = {
  new: { label: 'New', color: 'bg-blue-500/10 text-blue-600' },
  fix: { label: 'Fix', color: 'bg-red-500/10 text-red-600' },
  improvement: { label: 'Improvement', color: 'bg-amber-500/10 text-amber-600' },
}

// ─── Issue Form ───────────────────────────────────────────────────────────────

function IssueForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<BuildIssue>
  onSave: (data: Partial<BuildIssue>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [type, setType] = useState<IssueType>(initial?.type || 'bug')
  const [priority, setPriority] = useState<IssuePriority>(initial?.priority || 'medium')
  const [curatorNotes, setCuratorNotes] = useState(initial?.curator_notes || '')

  return (
    <div className="space-y-4">
      <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Short description of the issue" />
      <Textarea label="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} placeholder="More detail..." />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-label-md text-[var(--foreground)] block mb-2">Type</label>
          <div className="flex flex-col gap-2">
            {(['bug', 'feature', 'improvement'] as IssueType[]).map(t => {
              const cfg = TYPE_CONFIG[t]
              return (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border text-body-sm transition-colors',
                    type === t ? 'border-[var(--wine)] bg-[var(--wine-muted)]' : 'border-[var(--border)] hover:border-[var(--foreground-muted)]'
                  )}>
                  <cfg.icon className={cn('h-4 w-4', cfg.color)} />
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>
        <div>
          <label className="text-label-md text-[var(--foreground)] block mb-2">Priority</label>
          <div className="flex flex-col gap-2">
            {(['low', 'medium', 'high', 'critical'] as IssuePriority[]).map(p => (
              <button key={p} type="button" onClick={() => setPriority(p)}
                className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border text-body-sm transition-colors capitalize',
                  priority === p ? 'border-[var(--wine)] bg-[var(--wine-muted)]' : 'border-[var(--border)] hover:border-[var(--foreground-muted)]'
                )}>
                <span className={PRIORITY_CONFIG[p].color}>●</span>
                {PRIORITY_CONFIG[p].label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Textarea label="Curator Notes (optional)" value={curatorNotes} onChange={e => setCuratorNotes(e.target.value)} placeholder="Internal notes..." />
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ title, description, type, priority, curator_notes: curatorNotes })} disabled={!title.trim()}>
          {initial?.id ? 'Update' : 'Add Issue'}
        </Button>
      </div>
    </div>
  )
}

// ─── Changelog Form ───────────────────────────────────────────────────────────

function ChangelogForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<ChangelogEntry>
  onSave: (data: Partial<ChangelogEntry>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title || '')
  const [version, setVersion] = useState(initial?.version || '')
  const [summary, setSummary] = useState(initial?.summary || '')
  const [changes, setChanges] = useState<ChangelogChange[]>(initial?.changes || [])
  const [newChangeType, setNewChangeType] = useState<'new' | 'fix' | 'improvement'>('new')
  const [newChangeText, setNewChangeText] = useState('')

  const addChange = () => {
    if (!newChangeText.trim()) return
    setChanges(prev => [...prev, { type: newChangeType, text: newChangeText.trim() }])
    setNewChangeText('')
  }

  const removeChange = (index: number) => {
    setChanges(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. April Update" />
        <Input label="Version (optional)" value={version} onChange={e => setVersion(e.target.value)} placeholder="e.g. 1.2.0" />
      </div>
      <Textarea label="Summary (optional)" value={summary} onChange={e => setSummary(e.target.value)} placeholder="Brief overview of what changed..." />

      <div>
        <label className="text-label-md text-[var(--foreground)] block mb-2">Changes</label>
        <div className="space-y-2 mb-3">
          {changes.map((c, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
              <span className={cn('px-2 py-0.5 rounded text-[10px] font-semibold flex-shrink-0', CHANGE_TYPE_CONFIG[c.type].color)}>
                {CHANGE_TYPE_CONFIG[c.type].label}
              </span>
              <span className="text-body-sm text-[var(--foreground)] flex-1">{c.text}</span>
              <button onClick={() => removeChange(i)} className="text-[var(--foreground-muted)] hover:text-red-500 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {changes.length === 0 && (
            <p className="text-body-sm text-[var(--foreground-muted)] text-center py-3">No changes added yet</p>
          )}
        </div>

        <div className="flex gap-2">
          <div className="flex gap-1">
            {(['new', 'fix', 'improvement'] as const).map(t => (
              <button key={t} onClick={() => setNewChangeType(t)}
                className={cn('px-2 py-1.5 rounded text-[10px] font-semibold transition-colors', CHANGE_TYPE_CONFIG[t].color,
                  newChangeType === t ? 'ring-2 ring-offset-1 ring-[var(--wine)]' : 'opacity-60 hover:opacity-100'
                )}>
                {CHANGE_TYPE_CONFIG[t].label}
              </button>
            ))}
          </div>
          <input
            value={newChangeText}
            onChange={e => setNewChangeText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addChange()}
            placeholder="Describe the change..."
            className={cn('flex-1 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)]',
              'text-body-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]',
              'focus:outline-none focus:border-[var(--wine)]'
            )}
          />
          <button onClick={addChange} className="p-1.5 rounded-lg bg-[var(--wine)] text-white hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave({ title, version, summary, changes })} disabled={!title.trim()}>
          {initial?.id ? 'Update' : 'Create Entry'}
        </Button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BuildLogPage() {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<Tab>('issues')

  // Issues state
  const [issues, setIssues] = useState<BuildIssue[]>([])
  const [issueTypeFilter, setIssueTypeFilter] = useState<IssueType | 'all'>('all')
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [editingIssue, setEditingIssue] = useState<BuildIssue | null>(null)

  // Suggestions state
  const [suggestions, setSuggestions] = useState<AdminSuggestion[]>([])
  const [suggestionFilter, setSuggestionFilter] = useState<SuggestionStatus | 'all'>('all')

  // Changelog state
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
  const [showChangelogForm, setShowChangelogForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ChangelogEntry | null>(null)

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setIsLoading(true)
    const [issuesRes, suggestionsRes, changelogRes] = await Promise.all([
      supabase.from('build_issues').select('*').order('created_at', { ascending: false }),
      supabase.from('admin_suggestions').select('*').order('created_at', { ascending: false }),
      supabase.from('changelog_entries').select('*').order('created_at', { ascending: false }),
    ])
    setIssues(issuesRes.data || [])
    setSuggestions(suggestionsRes.data || [])
    setChangelog((changelogRes.data || []).map(e => ({ ...e, changes: e.changes || [] })))
    setIsLoading(false)
  }

  // ── Issue actions ──────────────────────────────────────────────────────────

  const saveIssue = async (data: Partial<BuildIssue>) => {
    if (editingIssue) {
      const { error } = await supabase.from('build_issues').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editingIssue.id)
      if (error) { addToast({ type: 'error', message: 'Failed to update issue' }); return }
      addToast({ type: 'success', message: 'Issue updated' })
    } else {
      const { error } = await supabase.from('build_issues').insert(data)
      if (error) { addToast({ type: 'error', message: 'Failed to add issue' }); return }
      addToast({ type: 'success', message: 'Issue added' })
    }
    setShowIssueForm(false)
    setEditingIssue(null)
    loadAll()
  }

  const updateIssueStatus = async (id: string, status: IssueStatus) => {
    const update: any = { status, updated_at: new Date().toISOString() }
    if (status === 'done') update.resolved_at = new Date().toISOString()
    await supabase.from('build_issues').update(update).eq('id', id)
    setIssues(prev => prev.map(i => i.id === id ? { ...i, status, ...update } : i))
  }

  const deleteIssue = async (id: string) => {
    await supabase.from('build_issues').delete().eq('id', id)
    setIssues(prev => prev.filter(i => i.id !== id))
    addToast({ type: 'success', message: 'Issue deleted' })
  }

  // ── Suggestion actions ─────────────────────────────────────────────────────

  const updateSuggestion = async (id: string, status: SuggestionStatus, curatorNotes?: string) => {
    await supabase.from('admin_suggestions').update({ status, curator_notes: curatorNotes }).eq('id', id)
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status, curator_notes: curatorNotes } : s))
    if (status === 'accepted') addToast({ type: 'success', message: 'Suggestion accepted' })
    if (status === 'rejected') addToast({ type: 'success', message: 'Suggestion rejected' })
  }

  const promoteToIssue = async (suggestion: AdminSuggestion) => {
    const { error } = await supabase.from('build_issues').insert({
      title: suggestion.title,
      description: suggestion.description,
      type: suggestion.category,
      status: 'open',
      priority: 'medium',
      curator_notes: `Promoted from admin suggestion by ${suggestion.admin_name || 'unknown admin'}`,
    })
    if (error) { addToast({ type: 'error', message: 'Failed to promote suggestion' }); return }
    await updateSuggestion(suggestion.id, 'accepted')
    addToast({ type: 'success', message: 'Added to issue board' })
    loadAll()
  }

  // ── Changelog actions ──────────────────────────────────────────────────────

  const saveChangelog = async (data: Partial<ChangelogEntry>) => {
    if (editingEntry) {
      const { error } = await supabase.from('changelog_entries').update({ ...data, updated_at: new Date().toISOString() }).eq('id', editingEntry.id)
      if (error) { addToast({ type: 'error', message: 'Failed to update entry' }); return }
      addToast({ type: 'success', message: 'Entry updated' })
    } else {
      const { error } = await supabase.from('changelog_entries').insert(data)
      if (error) { addToast({ type: 'error', message: 'Failed to create entry' }); return }
      addToast({ type: 'success', message: 'Entry created' })
    }
    setShowChangelogForm(false)
    setEditingEntry(null)
    loadAll()
  }

  const togglePublish = async (entry: ChangelogEntry) => {
    const isPublishing = !entry.is_published
    const published_at = isPublishing ? new Date().toISOString() : null
    await supabase
      .from('changelog_entries')
      .update({ is_published: isPublishing, published_at })
      .eq('id', entry.id)
    setChangelog(prev => prev.map(e =>
      e.id === entry.id
        ? { ...e, is_published: isPublishing, published_at: published_at ?? undefined }
        : e
    ))
    addToast({ type: 'success', message: isPublishing ? 'Published to users' : 'Unpublished' })
  }

  const deleteChangelog = async (id: string) => {
    await supabase.from('changelog_entries').delete().eq('id', id)
    setChangelog(prev => prev.filter(e => e.id !== id))
    addToast({ type: 'success', message: 'Entry deleted' })
  }

  // ── Derived data ───────────────────────────────────────────────────────────

  const filteredIssues = issues.filter(i => issueTypeFilter === 'all' || i.type === issueTypeFilter)
  const openIssues = filteredIssues.filter(i => i.status === 'open')
  const inProgressIssues = filteredIssues.filter(i => i.status === 'in_progress')
  const doneIssues = filteredIssues.filter(i => i.status === 'done')
  const filteredSuggestions = suggestions.filter(s => suggestionFilter === 'all' || s.status === suggestionFilter)
  const pendingSuggestionsCount = suggestions.filter(s => s.status === 'pending').length

  const tabs = [
    { id: 'issues' as Tab, label: 'Issues Board', badge: issues.filter(i => i.status !== 'done').length },
    { id: 'suggestions' as Tab, label: 'Suggestions', badge: pendingSuggestionsCount },
    { id: 'changelog' as Tab, label: 'Changelog', badge: 0 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm font-bold text-[var(--foreground)]">Build Log</h1>
          <p className="text-body-sm text-[var(--foreground-secondary)] mt-1">
            Track issues, manage suggestions, and publish changelogs
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
            )}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--wine)] text-white">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[var(--foreground-muted)]">Loading...</div>
      ) : (
        <AnimatePresence mode="wait">
          {/* ── Issues Tab ─────────────────────────────────────────── */}
          {activeTab === 'issues' && (
            <motion.div key="issues" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                {/* Type filter */}
                <div className="flex gap-2">
                  {(['all', 'bug', 'feature', 'improvement'] as const).map(t => (
                    <button key={t} onClick={() => setIssueTypeFilter(t)}
                      className={cn('px-3 py-1.5 rounded-full text-body-xs font-medium capitalize transition-colors border',
                        issueTypeFilter === t
                          ? 'bg-[var(--wine)] text-white border-[var(--wine)]'
                          : 'border-[var(--border)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                      )}>
                      {t === 'all' ? 'All' : TYPE_CONFIG[t].label}
                    </button>
                  ))}
                </div>
                <Button onClick={() => { setEditingIssue(null); setShowIssueForm(true) }} leftIcon={<Plus className="h-4 w-4" />}>
                  Add Issue
                </Button>
              </div>

              {showIssueForm && !editingIssue && (
                <Card variant="outlined" padding="lg">
                  <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-4">New Issue</h3>
                  <IssueForm onSave={saveIssue} onCancel={() => setShowIssueForm(false)} />
                </Card>
              )}

              {/* Three columns */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {([
                  { status: 'open' as IssueStatus, items: openIssues },
                  { status: 'in_progress' as IssueStatus, items: inProgressIssues },
                  { status: 'done' as IssueStatus, items: doneIssues },
                ]).map(({ status, items }) => {
                  const cfg = STATUS_CONFIG[status]
                  return (
                    <div key={status}>
                      <div className="flex items-center gap-2 mb-3">
                        <cfg.icon className={cn('h-4 w-4', cfg.color)} />
                        <h3 className="text-body-sm font-semibold text-[var(--foreground)]">{cfg.label}</h3>
                        <span className="ml-auto text-body-xs text-[var(--foreground-muted)]">{items.length}</span>
                      </div>
                      <div className="space-y-3">
                        {items.map(issue => {
                          const typeCfg = TYPE_CONFIG[issue.type]
                          const priCfg = PRIORITY_CONFIG[issue.priority]
                          return (
                            <Card key={issue.id} variant="outlined" padding="md" className="group">
                              {editingIssue?.id === issue.id ? (
                                <IssueForm initial={issue} onSave={saveIssue} onCancel={() => setEditingIssue(null)} />
                              ) : (
                                <>
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className={cn('p-1.5 rounded-lg flex-shrink-0', typeCfg.bg)}>
                                      <typeCfg.icon className={cn('h-3.5 w-3.5', typeCfg.color)} />
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => setEditingIssue(issue)} className="p-1 rounded text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </button>
                                      <button onClick={() => deleteIssue(issue.id)} className="p-1 rounded text-[var(--foreground-muted)] hover:text-red-500">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-body-sm font-medium text-[var(--foreground)] mb-1">{issue.title}</p>
                                  {issue.description && (
                                    <p className="text-body-xs text-[var(--foreground-secondary)] mb-2 line-clamp-2">{issue.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className={cn('text-[10px] font-semibold', priCfg.color)}>● {priCfg.label}</span>
                                  </div>
                                  {/* Status buttons */}
                                  <div className="flex gap-1 flex-wrap">
                                    {(['open', 'in_progress', 'done'] as IssueStatus[]).filter(s => s !== issue.status).map(s => (
                                      <button key={s} onClick={() => updateIssueStatus(issue.id, s)}
                                        className="px-2 py-1 rounded text-[10px] font-medium border border-[var(--border)] text-[var(--foreground-secondary)] hover:border-[var(--wine)] hover:text-[var(--wine)] transition-colors">
                                        → {STATUS_CONFIG[s].label}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </Card>
                          )
                        })}
                        {items.length === 0 && (
                          <div className="text-center py-6 text-body-xs text-[var(--foreground-muted)] border border-dashed border-[var(--border)] rounded-xl">
                            No {cfg.label.toLowerCase()} issues
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ── Suggestions Tab ────────────────────────────────────── */}
          {activeTab === 'suggestions' && (
            <motion.div key="suggestions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex gap-2">
                {(['all', 'pending', 'accepted', 'rejected'] as const).map(s => (
                  <button key={s} onClick={() => setSuggestionFilter(s)}
                    className={cn('px-3 py-1.5 rounded-full text-body-xs font-medium capitalize transition-colors border',
                      suggestionFilter === s
                        ? 'bg-[var(--wine)] text-white border-[var(--wine)]'
                        : 'border-[var(--border)] text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
                    )}>
                    {s === 'all' ? 'All' : s}
                    {s === 'pending' && pendingSuggestionsCount > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-[var(--wine)] text-white">{pendingSuggestionsCount}</span>
                    )}
                  </button>
                ))}
              </div>

              {filteredSuggestions.length === 0 ? (
                <Card variant="outlined" padding="lg" className="text-center">
                  <Inbox className="h-10 w-10 text-[var(--foreground-muted)] mx-auto mb-3" />
                  <p className="text-body-md text-[var(--foreground-secondary)]">No suggestions yet</p>
                  <p className="text-body-sm text-[var(--foreground-muted)] mt-1">Admins can submit suggestions from their dashboard</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredSuggestions.map(suggestion => {
                    const typeCfg = TYPE_CONFIG[suggestion.category]
                    return (
                      <Card key={suggestion.id} variant="outlined" padding="lg">
                        <div className="flex items-start gap-4">
                          <div className={cn('p-2 rounded-xl flex-shrink-0', typeCfg.bg)}>
                            <typeCfg.icon className={cn('h-4 w-4', typeCfg.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-body-md font-semibold text-[var(--foreground)]">{suggestion.title}</p>
                                <p className="text-body-xs text-[var(--foreground-muted)] mt-0.5">
                                  {suggestion.admin_name || 'Unknown admin'} · {new Date(suggestion.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize flex-shrink-0',
                                suggestion.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                                suggestion.status === 'accepted' ? 'bg-green-500/10 text-green-600' :
                                'bg-red-500/10 text-red-600'
                              )}>
                                {suggestion.status}
                              </span>
                            </div>
                            {suggestion.description && (
                              <p className="text-body-sm text-[var(--foreground-secondary)] mt-2">{suggestion.description}</p>
                            )}
                            {suggestion.status === 'pending' && (
                              <div className="flex gap-2 mt-3">
                                <Button size="sm" onClick={() => promoteToIssue(suggestion)} leftIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                                  Add to Board
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => updateSuggestion(suggestion.id, 'rejected')}>
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Changelog Tab ──────────────────────────────────────── */}
          {activeTab === 'changelog' && (
            <motion.div key="changelog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-body-sm text-[var(--foreground-secondary)]">
                  Published entries are visible to all users at <span className="font-mono text-[var(--foreground)]">/changelog</span>
                </p>
                <Button onClick={() => { setEditingEntry(null); setShowChangelogForm(true) }} leftIcon={<Plus className="h-4 w-4" />}>
                  New Entry
                </Button>
              </div>

              {showChangelogForm && !editingEntry && (
                <Card variant="outlined" padding="lg">
                  <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-4">New Changelog Entry</h3>
                  <ChangelogForm onSave={saveChangelog} onCancel={() => setShowChangelogForm(false)} />
                </Card>
              )}

              <div className="space-y-4">
                {changelog.map(entry => (
                  <Card key={entry.id} variant="outlined" padding="lg">
                    {editingEntry?.id === entry.id ? (
                      <>
                        <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-4">Edit Entry</h3>
                        <ChangelogForm initial={entry} onSave={saveChangelog} onCancel={() => setEditingEntry(null)} />
                      </>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-body-lg font-semibold text-[var(--foreground)]">{entry.title}</h3>
                              {entry.version && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-secondary)]">
                                  v{entry.version}
                                </span>
                              )}
                              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold',
                                entry.is_published ? 'bg-green-500/10 text-green-600' : 'bg-[var(--surface)] text-[var(--foreground-muted)]'
                              )}>
                                {entry.is_published ? 'Published' : 'Draft'}
                              </span>
                            </div>
                            <p className="text-body-xs text-[var(--foreground-muted)] mt-0.5">
                              {entry.is_published && entry.published_at
                                ? `Published ${new Date(entry.published_at).toLocaleDateString()}`
                                : `Created ${new Date(entry.created_at).toLocaleDateString()}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => togglePublish(entry)}
                              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-xs font-medium border transition-colors',
                                entry.is_published
                                  ? 'border-[var(--border)] text-[var(--foreground-secondary)] hover:border-red-500 hover:text-red-500'
                                  : 'border-green-500/30 text-green-600 hover:bg-green-500/10'
                              )}>
                              {entry.is_published ? <><EyeOff className="h-3.5 w-3.5" />Unpublish</> : <><Eye className="h-3.5 w-3.5" />Publish</>}
                            </button>
                            <button onClick={() => setEditingEntry(entry)} className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => deleteChangelog(entry.id)} className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-red-500 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {entry.summary && (
                          <p className="text-body-sm text-[var(--foreground-secondary)] mb-3">{entry.summary}</p>
                        )}
                        {entry.changes.length > 0 && (
                          <div className="space-y-1.5">
                            {entry.changes.map((c, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 mt-0.5', CHANGE_TYPE_CONFIG[c.type].color)}>
                                  {CHANGE_TYPE_CONFIG[c.type].label}
                                </span>
                                <p className="text-body-sm text-[var(--foreground)]">{c.text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </Card>
                ))}
                {changelog.length === 0 && (
                  <Card variant="outlined" padding="lg" className="text-center">
                    <Megaphone className="h-10 w-10 text-[var(--foreground-muted)] mx-auto mb-3" />
                    <p className="text-body-md text-[var(--foreground-secondary)]">No changelog entries yet</p>
                    <p className="text-body-sm text-[var(--foreground-muted)] mt-1">Create your first entry to start communicating updates to users</p>
                  </Card>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}
