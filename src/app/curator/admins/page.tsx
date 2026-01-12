'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { WineLoader } from '@/components/ui'
import { Modal, ConfirmDialog } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Users,
  Search,
  Calendar,
  Wine,
  Star,
  Mail,
  Shield,
  ShieldOff,
  ChevronDown,
  ChevronUp,
  Activity,
  Plus,
  Trash2,
  UserPlus,
  Building,
} from 'lucide-react'

interface AdminUser {
  id: string
  display_name: string
  eventbrite_email?: string
  is_admin: boolean
  is_curator: boolean
  created_at?: string
  event_count: number
  total_wines: number
  total_ratings: number
  last_event_date?: string
}

interface AdminGroup {
  id: string
  name: string
  member_count: number
  created_at: string
}

export default function CuratorAdminsPage() {
  const { addToast } = useToast()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [groups, setGroups] = useState<AdminGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'admins' | 'groups'>('admins')

  // Modal states
  const [showCreateAdmin, setShowCreateAdmin] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null)

  // Form states
  const [newAdminName, setNewAdminName] = useState('')
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newGroupName, setNewGroupName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadAdmins()
    loadGroups()
  }, [])

  const loadAdmins = async () => {
    try {
      // Get all admin profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, eventbrite_email, is_admin, is_curator, created_at')
        .eq('is_admin', true)
        .order('display_name', { ascending: true })

      if (!profiles) {
        setAdmins([])
        setIsLoading(false)
        return
      }

      // Get stats for each admin
      const adminsWithStats: AdminUser[] = []

      for (const profile of profiles) {
        // Get event count
        const { count: eventCount } = await supabase
          .from('tasting_events')
          .select('*', { count: 'exact', head: true })
          .eq('admin_id', profile.id)
          .eq('is_deleted', false)

        // Get events to count wines and ratings
        const { data: events } = await supabase
          .from('tasting_events')
          .select('id, event_date')
          .eq('admin_id', profile.id)
          .eq('is_deleted', false)
          .order('event_date', { ascending: false })

        let totalWines = 0
        let totalRatings = 0
        let lastEventDate: string | undefined

        if (events && events.length > 0) {
          lastEventDate = events[0].event_date

          const eventIds = events.map(e => e.id)

          // Get wine count
          const { count: wineCount } = await supabase
            .from('event_wines')
            .select('*', { count: 'exact', head: true })
            .in('event_id', eventIds)

          totalWines = wineCount || 0

          // Get rating count
          const { data: eventWines } = await supabase
            .from('event_wines')
            .select('id')
            .in('event_id', eventIds)

          if (eventWines && eventWines.length > 0) {
            const wineIds = eventWines.map(w => w.id)
            const { count: ratingCount } = await supabase
              .from('user_wine_ratings')
              .select('*', { count: 'exact', head: true })
              .in('event_wine_id', wineIds)

            totalRatings = ratingCount || 0
          }
        }

        adminsWithStats.push({
          id: profile.id,
          display_name: profile.display_name || 'Unknown',
          eventbrite_email: profile.eventbrite_email,
          is_admin: profile.is_admin,
          is_curator: profile.is_curator || false,
          created_at: profile.created_at,
          event_count: eventCount || 0,
          total_wines: totalWines,
          total_ratings: totalRatings,
          last_event_date: lastEventDate,
        })
      }

      setAdmins(adminsWithStats)
    } catch (err) {
      console.error('Error loading admins:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadGroups = async () => {
    try {
      // Check if organizations table exists
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, created_at')
        .order('name', { ascending: true })

      if (error) {
        // Table doesn't exist yet - that's OK
        console.log('Organizations table not yet created')
        setGroups([])
        return
      }

      // Get member counts
      const groupsWithCounts: AdminGroup[] = []
      for (const org of data || []) {
        const { count } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)

        groupsWithCounts.push({
          id: org.id,
          name: org.name,
          member_count: count || 0,
          created_at: org.created_at,
        })
      }

      setGroups(groupsWithCounts)
    } catch (err) {
      console.log('Groups not available yet')
      setGroups([])
    }
  }

  // Create new admin
  const handleCreateAdmin = async () => {
    if (!newAdminName.trim() || !newAdminEmail.trim()) {
      addToast({ type: 'error', message: 'Please fill in all fields' })
      return
    }

    setIsSubmitting(true)

    try {
      // Check if profile already exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id, is_admin')
        .eq('eventbrite_email', newAdminEmail.trim().toLowerCase())
        .single()

      if (existing) {
        if (existing.is_admin) {
          addToast({ type: 'error', message: 'This user is already an admin' })
          setIsSubmitting(false)
          return
        }

        // Update existing profile to admin
        const { error } = await supabase
          .from('profiles')
          .update({ is_admin: true, display_name: newAdminName.trim() })
          .eq('id', existing.id)

        if (error) throw error

        addToast({ type: 'success', message: `${newAdminName} has been granted admin access` })
      } else {
        // Create new admin profile
        const newId = crypto.randomUUID()
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: newId,
            display_name: newAdminName.trim(),
            eventbrite_email: newAdminEmail.trim().toLowerCase(),
            is_admin: true,
            is_curator: false,
            is_temp_account: false,
          })

        if (error) throw error

        addToast({ type: 'success', message: `Admin account created for ${newAdminName}` })
      }

      setNewAdminName('')
      setNewAdminEmail('')
      setShowCreateAdmin(false)
      loadAdmins()
    } catch (err) {
      console.error('Error creating admin:', err)
      addToast({ type: 'error', message: 'Failed to create admin' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Remove admin access
  const handleRemoveAdmin = async () => {
    if (!selectedAdmin) return

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: false, is_curator: false })
        .eq('id', selectedAdmin.id)

      if (error) throw error

      addToast({ type: 'success', message: `Admin access removed from ${selectedAdmin.display_name}` })
      setShowDeleteConfirm(false)
      setSelectedAdmin(null)
      loadAdmins()
    } catch (err) {
      console.error('Error removing admin:', err)
      addToast({ type: 'error', message: 'Failed to remove admin' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle curator status
  const toggleCurator = async (admin: AdminUser) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_curator: !admin.is_curator })
        .eq('id', admin.id)

      if (error) throw error

      setAdmins(admins.map(a =>
        a.id === admin.id ? { ...a, is_curator: !a.is_curator } : a
      ))

      addToast({
        type: 'success',
        message: admin.is_curator
          ? `Removed curator access from ${admin.display_name}`
          : `Granted curator access to ${admin.display_name}`,
      })
    } catch (err) {
      console.error('Error toggling curator:', err)
      addToast({ type: 'error', message: 'Failed to update permissions' })
    }
  }

  // Create new group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      addToast({ type: 'error', message: 'Please enter a group name' })
      return
    }

    setIsSubmitting(true)

    try {
      const curatorId = localStorage.getItem('palate-curator-user')

      const { error } = await supabase
        .from('organizations')
        .insert({
          name: newGroupName.trim(),
          created_by: curatorId,
          is_active: true,
        })

      if (error) {
        if (error.code === '42P01') {
          addToast({ type: 'error', message: 'Admin groups not yet set up. Run the migration first.' })
        } else {
          throw error
        }
        setIsSubmitting(false)
        return
      }

      addToast({ type: 'success', message: `Group "${newGroupName}" created` })
      setNewGroupName('')
      setShowCreateGroup(false)
      loadGroups()
    } catch (err) {
      console.error('Error creating group:', err)
      addToast({ type: 'error', message: 'Failed to create group' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter admins
  const filteredAdmins = admins.filter(admin =>
    !searchQuery ||
    admin.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.eventbrite_email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Summary stats
  const totalEvents = admins.reduce((sum, a) => sum + a.event_count, 0)
  const totalWines = admins.reduce((sum, a) => sum + a.total_wines, 0)
  const curatorCount = admins.filter(a => a.is_curator).length

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-md font-bold text-[var(--foreground)]">
            Admin Management
          </h1>
          <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
            Manage administrators and groups
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateGroup(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl',
              'text-body-sm font-medium',
              'border border-[var(--border)] text-[var(--foreground-secondary)]',
              'hover:border-[var(--wine)] hover:text-[var(--wine)]',
              'transition-colors'
            )}
          >
            <Building className="h-4 w-4" />
            New Group
          </button>
          <button
            onClick={() => setShowCreateAdmin(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl',
              'text-body-sm font-medium',
              'border border-[var(--wine)] text-[var(--wine)]',
              'hover:bg-[var(--wine)]/10',
              'transition-colors'
            )}
          >
            <UserPlus className="h-4 w-4" />
            New Admin
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)] pb-4">
        <button
          onClick={() => setActiveTab('admins')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl',
            'text-body-sm font-medium',
            'border transition-all duration-200',
            activeTab === 'admins'
              ? 'border-[var(--wine)] text-[var(--wine)]'
              : 'border-transparent text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
          )}
        >
          <Users className="h-4 w-4" />
          Admins ({admins.length})
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl',
            'text-body-sm font-medium',
            'border transition-all duration-200',
            activeTab === 'groups'
              ? 'border-[var(--wine)] text-[var(--wine)]'
              : 'border-transparent text-[var(--foreground-secondary)] hover:text-[var(--foreground)]'
          )}
        >
          <Building className="h-4 w-4" />
          Groups ({groups.length})
        </button>
      </div>

      {activeTab === 'admins' ? (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Admins" value={admins.length} />
            <StatCard icon={Shield} label="Curators" value={curatorCount} />
            <StatCard icon={Calendar} label="Total Events" value={totalEvents} />
            <StatCard icon={Wine} label="Total Wines" value={totalWines} />
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--foreground-muted)]" />
            <input
              type="text"
              placeholder="Search admins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full pl-12 pr-4 py-3 rounded-xl',
                'bg-transparent border border-[var(--border)]',
                'text-body-md text-[var(--foreground)]',
                'placeholder:text-[var(--foreground-muted)]',
                'focus:outline-none focus:border-[var(--wine)]',
                'transition-colors duration-200'
              )}
            />
          </div>

          {/* Admin list */}
          <div className="space-y-3">
            {filteredAdmins.length === 0 ? (
              <div className="text-center py-12 border border-[var(--border)] rounded-xl">
                <Users className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
                <p className="text-body-md text-[var(--foreground-secondary)]">
                  {searchQuery ? 'No admins match your search' : 'No admins found'}
                </p>
              </div>
            ) : (
              filteredAdmins.map((admin) => (
                <AdminCard
                  key={admin.id}
                  admin={admin}
                  isExpanded={expandedId === admin.id}
                  onToggle={() => setExpandedId(expandedId === admin.id ? null : admin.id)}
                  onToggleCurator={() => toggleCurator(admin)}
                  onRemove={() => {
                    setSelectedAdmin(admin)
                    setShowDeleteConfirm(true)
                  }}
                />
              ))
            )}
          </div>
        </>
      ) : (
        /* Groups tab */
        <div className="space-y-3">
          {groups.length === 0 ? (
            <div className="text-center py-12 border border-[var(--border)] rounded-xl">
              <Building className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
              <p className="text-body-md text-[var(--foreground-secondary)] mb-2">
                No admin groups yet
              </p>
              <p className="text-body-sm text-[var(--foreground-muted)] mb-4">
                Groups allow admins to collaborate on events
              </p>
              <button
                onClick={() => setShowCreateGroup(true)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-xl',
                  'text-body-sm font-medium',
                  'border border-[var(--wine)] text-[var(--wine)]',
                  'hover:bg-[var(--wine)]/10',
                  'transition-colors'
                )}
              >
                <Plus className="h-4 w-4" />
                Create First Group
              </button>
            </div>
          ) : (
            groups.map((group) => (
              <div
                key={group.id}
                className="border border-[var(--border)] rounded-xl p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl border border-[var(--border)] flex items-center justify-center">
                    <Building className="h-6 w-6 text-[var(--foreground-muted)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-body-md font-semibold text-[var(--foreground)]">
                      {group.name}
                    </h3>
                    <p className="text-body-sm text-[var(--foreground-muted)]">
                      {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    className={cn(
                      'px-3 py-1.5 rounded-lg',
                      'text-body-sm font-medium',
                      'border border-[var(--border)] text-[var(--foreground-secondary)]',
                      'hover:border-[var(--wine)] hover:text-[var(--wine)]',
                      'transition-colors'
                    )}
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Admin Modal */}
      <Modal
        isOpen={showCreateAdmin}
        onClose={() => setShowCreateAdmin(false)}
        title="Create New Admin"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-label-md text-[var(--foreground)] block mb-2">
              Name
            </label>
            <input
              type="text"
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
              placeholder="Admin name"
              className={cn(
                'w-full px-4 py-3 rounded-xl',
                'bg-transparent border border-[var(--border)]',
                'text-body-md text-[var(--foreground)]',
                'placeholder:text-[var(--foreground-muted)]',
                'focus:outline-none focus:border-[var(--wine)]',
                'transition-colors duration-200'
              )}
            />
          </div>

          <div>
            <label className="text-label-md text-[var(--foreground)] block mb-2">
              Email
            </label>
            <input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="admin@example.com"
              className={cn(
                'w-full px-4 py-3 rounded-xl',
                'bg-transparent border border-[var(--border)]',
                'text-body-md text-[var(--foreground)]',
                'placeholder:text-[var(--foreground-muted)]',
                'focus:outline-none focus:border-[var(--wine)]',
                'transition-colors duration-200'
              )}
            />
          </div>

          <p className="text-body-sm text-[var(--foreground-muted)]">
            The admin will need to set their password via the login page's "Forgot Password" flow, 
            or you can create their auth account in Supabase.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowCreateAdmin(false)}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-xl',
                'text-body-sm font-medium',
                'border border-[var(--border)] text-[var(--foreground-secondary)]',
                'hover:border-[var(--foreground-muted)]',
                'transition-colors'
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAdmin}
              disabled={isSubmitting || !newAdminName || !newAdminEmail}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-xl',
                'text-body-sm font-medium',
                'border border-[var(--wine)] text-[var(--wine)]',
                'hover:bg-[var(--wine)]/10',
                'disabled:opacity-50',
                'transition-colors'
              )}
            >
              {isSubmitting ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Group Modal */}
      <Modal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        title="Create Admin Group"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-label-md text-[var(--foreground)] block mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g., Wine Bar Downtown"
              className={cn(
                'w-full px-4 py-3 rounded-xl',
                'bg-transparent border border-[var(--border)]',
                'text-body-md text-[var(--foreground)]',
                'placeholder:text-[var(--foreground-muted)]',
                'focus:outline-none focus:border-[var(--wine)]',
                'transition-colors duration-200'
              )}
            />
          </div>

          <p className="text-body-sm text-[var(--foreground-muted)]">
            Groups allow multiple admins to collaborate on events. 
            You can add members after creating the group.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowCreateGroup(false)}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-xl',
                'text-body-sm font-medium',
                'border border-[var(--border)] text-[var(--foreground-secondary)]',
                'hover:border-[var(--foreground-muted)]',
                'transition-colors'
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={isSubmitting || !newGroupName}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-xl',
                'text-body-sm font-medium',
                'border border-[var(--wine)] text-[var(--wine)]',
                'hover:bg-[var(--wine)]/10',
                'disabled:opacity-50',
                'transition-colors'
              )}
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setSelectedAdmin(null)
        }}
        onConfirm={handleRemoveAdmin}
        title="Remove Admin Access"
        description={`Are you sure you want to remove admin access from ${selectedAdmin?.display_name}? They will no longer be able to create or manage events.`}
        confirmText="Remove Access"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  )
}

// Admin card component
function AdminCard({
  admin,
  isExpanded,
  onToggle,
  onToggleCurator,
  onRemove,
}: {
  admin: AdminUser
  isExpanded: boolean
  onToggle: () => void
  onToggleCurator: () => void
  onRemove: () => void
}) {
  return (
    <div className="border border-[var(--border)] rounded-xl">
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full border border-[var(--border)] flex items-center justify-center flex-shrink-0">
            <span className="text-body-lg font-semibold text-[var(--foreground)]">
              {admin.display_name.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-body-md font-semibold text-[var(--foreground)]">
                {admin.display_name}
              </h3>
              {admin.is_curator && (
                <span className="px-2 py-0.5 rounded text-body-xs border border-[var(--wine)] text-[var(--wine)]">
                  Curator
                </span>
              )}
            </div>
            <p className="text-body-sm text-[var(--foreground-muted)]">
              {admin.eventbrite_email || 'No email'}
            </p>
          </div>

          {/* Stats summary */}
          <div className="hidden sm:flex items-center gap-6">
            <div className="text-center">
              <p className="text-body-sm font-semibold text-[var(--foreground)]">
                {admin.event_count}
              </p>
              <p className="text-body-xs text-[var(--foreground-muted)]">Events</p>
            </div>
            <div className="text-center">
              <p className="text-body-sm font-semibold text-[var(--foreground)]">
                {admin.total_wines}
              </p>
              <p className="text-body-xs text-[var(--foreground-muted)]">Wines</p>
            </div>
            <div className="text-center">
              <p className="text-body-sm font-semibold text-[var(--foreground)]">
                {admin.total_ratings}
              </p>
              <p className="text-body-xs text-[var(--foreground-muted)]">Ratings</p>
            </div>
          </div>

          {/* Expand button */}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg border border-[var(--border)] hover:border-[var(--foreground-muted)] transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-[var(--foreground-muted)]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[var(--foreground-muted)]" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded section */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-[var(--border)]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-body-xs text-[var(--foreground-muted)]">Events</p>
              <p className="text-body-sm font-medium text-[var(--foreground)]">
                {admin.event_count}
              </p>
            </div>
            <div>
              <p className="text-body-xs text-[var(--foreground-muted)]">Wines</p>
              <p className="text-body-sm font-medium text-[var(--foreground)]">
                {admin.total_wines}
              </p>
            </div>
            <div>
              <p className="text-body-xs text-[var(--foreground-muted)]">Ratings</p>
              <p className="text-body-sm font-medium text-[var(--foreground)]">
                {admin.total_ratings}
              </p>
            </div>
            <div>
              <p className="text-body-xs text-[var(--foreground-muted)]">Last Event</p>
              <p className="text-body-sm font-medium text-[var(--foreground)]">
                {admin.last_event_date
                  ? new Date(admin.last_event_date).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onToggleCurator}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl',
                'text-body-sm font-medium',
                'border transition-colors',
                admin.is_curator
                  ? 'border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)]/10'
                  : 'border-[var(--wine)] text-[var(--wine)] hover:bg-[var(--wine)]/10'
              )}
            >
              {admin.is_curator ? (
                <>
                  <ShieldOff className="h-4 w-4" />
                  Remove Curator
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Make Curator
                </>
              )}
            </button>
            <button
              onClick={onRemove}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl',
                'text-body-sm font-medium',
                'border border-error text-error',
                'hover:bg-error/10',
                'transition-colors'
              )}
            >
              <Trash2 className="h-4 w-4" />
              Remove Admin
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Stat card component
function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users
  label: string
  value: number
}) {
  return (
    <div className="border border-[var(--border)] rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl border border-[var(--border)] flex items-center justify-center">
          <Icon className="h-5 w-5 text-[var(--foreground-muted)]" />
        </div>
        <div>
          <p className="text-display-sm font-bold text-[var(--foreground)]">
            {value.toLocaleString()}
          </p>
          <p className="text-body-xs text-[var(--foreground-muted)]">{label}</p>
        </div>
      </div>
    </div>
  )
}

