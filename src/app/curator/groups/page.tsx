'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { WineLoader, Modal, Button, Input, Textarea } from '@/components/ui'
import { ConfirmDialog } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Building,
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Crown,
  Shield,
  User,
  X,
  Calendar,
  Wine,
} from 'lucide-react'

interface Organization {
  id: string
  name: string
  description?: string
  created_at: string
  is_active: boolean
  member_count: number
  event_count: number
}

interface OrgMember {
  id: string
  profile_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  display_name: string
  email?: string
}

interface AdminUser {
  id: string
  display_name: string
  eventbrite_email?: string
  is_admin: boolean
}

export default function CuratorGroupsPage() {
  const { addToast } = useToast()
  
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null)
  const [orgMembers, setOrgMembers] = useState<Record<string, OrgMember[]>>({})
  
  // Modal states
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [showEditOrg, setShowEditOrg] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showDeleteOrg, setShowDeleteOrg] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  
  // Form states
  const [orgName, setOrgName] = useState('')
  const [orgDescription, setOrgDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Add member states
  const [availableAdmins, setAvailableAdmins] = useState<AdminUser[]>([])
  const [selectedAdminId, setSelectedAdminId] = useState('')
  const [memberRole, setMemberRole] = useState<'admin' | 'member'>('member')
  const [adminSearchQuery, setAdminSearchQuery] = useState('')

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist
          addToast({ type: 'error', message: 'Organizations table not found. Run the migration first.' })
          setOrganizations([])
          setIsLoading(false)
          return
        }
        throw error
      }

      // Get member counts and event counts
      const orgsWithCounts: Organization[] = []
      
      for (const org of orgs || []) {
        const { count: memberCount } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)

        const { count: eventCount } = await supabase
          .from('tasting_events')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('is_deleted', false)

        orgsWithCounts.push({
          ...org,
          member_count: memberCount || 0,
          event_count: eventCount || 0,
        })
      }

      setOrganizations(orgsWithCounts)
    } catch (err) {
      console.error('Error loading organizations:', err)
      addToast({ type: 'error', message: 'Failed to load organizations' })
    } finally {
      setIsLoading(false)
    }
  }

  const loadOrgMembers = async (orgId: string) => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          profile_id,
          role,
          joined_at,
          profiles (
            display_name,
            eventbrite_email
          )
        `)
        .eq('organization_id', orgId)
        .order('role', { ascending: true })

      if (error) throw error

      const members: OrgMember[] = (data || []).map((m: any) => ({
        id: m.id,
        profile_id: m.profile_id,
        role: m.role,
        joined_at: m.joined_at,
        display_name: m.profiles?.display_name || 'Unknown',
        email: m.profiles?.eventbrite_email,
      }))

      setOrgMembers(prev => ({ ...prev, [orgId]: members }))
    } catch (err) {
      console.error('Error loading members:', err)
    }
  }

  const loadAvailableAdmins = async (orgId: string) => {
    try {
      // Get all admins
      const { data: admins } = await supabase
        .from('profiles')
        .select('id, display_name, eventbrite_email, is_admin')
        .eq('is_admin', true)
        .order('display_name', { ascending: true })

      // Get current members of this org
      const { data: currentMembers } = await supabase
        .from('organization_members')
        .select('profile_id')
        .eq('organization_id', orgId)

      const currentMemberIds = new Set(currentMembers?.map(m => m.profile_id) || [])

      // Filter out admins already in this org
      const available = (admins || []).filter(a => !currentMemberIds.has(a.id))
      setAvailableAdmins(available)
    } catch (err) {
      console.error('Error loading available admins:', err)
    }
  }

  // Toggle expand
  const handleToggleExpand = (orgId: string) => {
    if (expandedOrgId === orgId) {
      setExpandedOrgId(null)
    } else {
      setExpandedOrgId(orgId)
      if (!orgMembers[orgId]) {
        loadOrgMembers(orgId)
      }
    }
  }

  // Create organization
  const handleCreateOrg = async () => {
    if (!orgName.trim()) {
      addToast({ type: 'error', message: 'Organization name is required' })
      return
    }

    setIsSubmitting(true)

    try {
      const curatorId = localStorage.getItem('palate-curator-user')

      const { data: newOrg, error } = await supabase
        .from('organizations')
        .insert({
          name: orgName.trim(),
          description: orgDescription.trim() || null,
          created_by: curatorId,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      addToast({ type: 'success', message: `Organization "${orgName}" created` })
      setOrgName('')
      setOrgDescription('')
      setShowCreateOrg(false)
      loadOrganizations()
    } catch (err) {
      console.error('Error creating organization:', err)
      addToast({ type: 'error', message: 'Failed to create organization' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update organization
  const handleUpdateOrg = async () => {
    if (!selectedOrg || !orgName.trim()) return

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: orgName.trim(),
          description: orgDescription.trim() || null,
        })
        .eq('id', selectedOrg.id)

      if (error) throw error

      addToast({ type: 'success', message: 'Organization updated' })
      setShowEditOrg(false)
      loadOrganizations()
    } catch (err) {
      console.error('Error updating organization:', err)
      addToast({ type: 'error', message: 'Failed to update organization' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete organization
  const handleDeleteOrg = async () => {
    if (!selectedOrg) return

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', selectedOrg.id)

      if (error) throw error

      addToast({ type: 'success', message: 'Organization deleted' })
      setShowDeleteOrg(false)
      setSelectedOrg(null)
      loadOrganizations()
    } catch (err) {
      console.error('Error deleting organization:', err)
      addToast({ type: 'error', message: 'Failed to delete organization' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add member
  const handleAddMember = async () => {
    if (!selectedOrg || !selectedAdminId) {
      addToast({ type: 'error', message: 'Please select an admin to add' })
      return
    }

    setIsSubmitting(true)

    try {
      const curatorId = localStorage.getItem('palate-curator-user')

      const { error } = await supabase
        .from('organization_members')
        .insert({
          organization_id: selectedOrg.id,
          profile_id: selectedAdminId,
          role: memberRole,
          invited_by: curatorId,
        })

      if (error) throw error

      addToast({ type: 'success', message: 'Member added to organization' })
      setShowAddMember(false)
      setSelectedAdminId('')
      setMemberRole('member')
      loadOrgMembers(selectedOrg.id)
      loadOrganizations()
    } catch (err) {
      console.error('Error adding member:', err)
      addToast({ type: 'error', message: 'Failed to add member' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Remove member
  const handleRemoveMember = async (memberId: string, orgId: string) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      addToast({ type: 'success', message: 'Member removed' })
      loadOrgMembers(orgId)
      loadOrganizations()
    } catch (err) {
      console.error('Error removing member:', err)
      addToast({ type: 'error', message: 'Failed to remove member' })
    }
  }

  // Update member role
  const handleUpdateRole = async (memberId: string, orgId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) throw error

      addToast({ type: 'success', message: 'Role updated' })
      loadOrgMembers(orgId)
    } catch (err) {
      console.error('Error updating role:', err)
      addToast({ type: 'error', message: 'Failed to update role' })
    }
  }

  // Open edit modal
  const openEditModal = (org: Organization) => {
    setSelectedOrg(org)
    setOrgName(org.name)
    setOrgDescription(org.description || '')
    setShowEditOrg(true)
  }

  // Open add member modal
  const openAddMemberModal = (org: Organization) => {
    setSelectedOrg(org)
    loadAvailableAdmins(org.id)
    setShowAddMember(true)
  }

  // Filter organizations
  const filteredOrgs = organizations.filter(org =>
    !searchQuery ||
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter available admins
  const filteredAdmins = availableAdmins.filter(admin =>
    !adminSearchQuery ||
    admin.display_name.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
    admin.eventbrite_email?.toLowerCase().includes(adminSearchQuery.toLowerCase())
  )

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
            Admin Groups
          </h1>
          <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
            Organize admins into groups for shared event management
          </p>
        </div>
        <button
          onClick={() => {
            setOrgName('')
            setOrgDescription('')
            setShowCreateOrg(true)
          }}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl',
            'text-body-sm font-medium',
            'border border-[var(--wine)] text-[var(--wine)]',
            'hover:bg-[var(--wine)]/10 transition-colors'
          )}
        >
          <Plus className="h-4 w-4" />
          Create Group
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--foreground-muted)]" />
        <input
          type="text"
          placeholder="Search groups..."
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

      {/* Organizations list */}
      {filteredOrgs.length === 0 ? (
        <div className="text-center py-12 border border-[var(--border)] rounded-xl">
          <Building className="h-12 w-12 text-[var(--foreground-muted)] mx-auto mb-4" />
          <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-2">
            No groups yet
          </h3>
          <p className="text-body-md text-[var(--foreground-secondary)] mb-4">
            Create groups to organize admins and share events
          </p>
          <button
            onClick={() => setShowCreateOrg(true)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl',
              'text-body-sm font-medium',
              'border border-[var(--wine)] text-[var(--wine)]',
              'hover:bg-[var(--wine)]/10 transition-colors'
            )}
          >
            <Plus className="h-4 w-4" />
            Create First Group
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrgs.map((org) => (
            <OrgCard
              key={org.id}
              org={org}
              isExpanded={expandedOrgId === org.id}
              members={orgMembers[org.id] || []}
              onToggle={() => handleToggleExpand(org.id)}
              onEdit={() => openEditModal(org)}
              onDelete={() => {
                setSelectedOrg(org)
                setShowDeleteOrg(true)
              }}
              onAddMember={() => openAddMemberModal(org)}
              onRemoveMember={(memberId) => handleRemoveMember(memberId, org.id)}
              onUpdateRole={(memberId, role) => handleUpdateRole(memberId, org.id, role)}
            />
          ))}
        </div>
      )}

      {/* Create Organization Modal */}
      <Modal
        isOpen={showCreateOrg}
        onClose={() => setShowCreateOrg(false)}
        title="Create Admin Group"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Group Name *"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g., Wine Bar Downtown"
          />
          <Textarea
            label="Description"
            value={orgDescription}
            onChange={(e) => setOrgDescription(e.target.value)}
            placeholder="Optional description..."
          />
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowCreateOrg(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreateOrg}
              isLoading={isSubmitting}
            >
              Create Group
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Organization Modal */}
      <Modal
        isOpen={showEditOrg}
        onClose={() => setShowEditOrg(false)}
        title="Edit Group"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Group Name *"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
          <Textarea
            label="Description"
            value={orgDescription}
            onChange={(e) => setOrgDescription(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowEditOrg(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleUpdateOrg}
              isLoading={isSubmitting}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        title={`Add Member to ${selectedOrg?.name || 'Group'}`}
        size="md"
      >
        <div className="space-y-4">
          {/* Search admins */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--foreground-muted)]" />
            <input
              type="text"
              placeholder="Search admins..."
              value={adminSearchQuery}
              onChange={(e) => setAdminSearchQuery(e.target.value)}
              className={cn(
                'w-full pl-12 pr-4 py-3 rounded-xl',
                'bg-[var(--surface)] border border-[var(--border)]',
                'text-body-md text-[var(--foreground)]',
                'placeholder:text-[var(--foreground-muted)]',
                'focus:outline-none focus:border-[var(--wine)]'
              )}
            />
          </div>

          {/* Admin selection */}
          <div className="max-h-48 overflow-y-auto border border-[var(--border)] rounded-xl">
            {filteredAdmins.length === 0 ? (
              <p className="p-4 text-center text-body-sm text-[var(--foreground-muted)]">
                No available admins to add
              </p>
            ) : (
              filteredAdmins.map((admin) => (
                <button
                  key={admin.id}
                  onClick={() => setSelectedAdminId(admin.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3',
                    'border-b border-[var(--border)] last:border-b-0',
                    'transition-colors text-left',
                    selectedAdminId === admin.id
                      ? 'bg-[var(--wine-muted)]'
                      : 'hover:bg-[var(--surface-hover)]'
                  )}
                >
                  <div className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center">
                    <span className="text-body-sm font-medium text-[var(--foreground)]">
                      {admin.display_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-body-sm font-medium text-[var(--foreground)]">
                      {admin.display_name}
                    </p>
                    <p className="text-body-xs text-[var(--foreground-muted)]">
                      {admin.eventbrite_email}
                    </p>
                  </div>
                  {selectedAdminId === admin.id && (
                    <div className="w-4 h-4 rounded-full bg-[var(--wine)] flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Role selection */}
          <div>
            <label className="text-label-md text-[var(--foreground)] block mb-2">
              Role
            </label>
            <select
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value as 'admin' | 'member')}
              className={cn(
                'w-full px-4 py-3 rounded-xl',
                'bg-[var(--surface)] border border-[var(--border)]',
                'text-body-md text-[var(--foreground)]',
                'focus:outline-none focus:border-[var(--wine)]'
              )}
            >
              <option value="member">Member - Can view group events</option>
              <option value="admin">Admin - Can manage group events</option>
              <option value="owner">Owner - Full control of group</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowAddMember(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleAddMember}
              isLoading={isSubmitting}
              disabled={!selectedAdminId}
            >
              Add Member
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteOrg}
        onClose={() => setShowDeleteOrg(false)}
        onConfirm={handleDeleteOrg}
        title="Delete Group"
        description={`Are you sure you want to delete "${selectedOrg?.name}"? This will remove all members from the group.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  )
}

// Organization card component
function OrgCard({
  org,
  isExpanded,
  members,
  onToggle,
  onEdit,
  onDelete,
  onAddMember,
  onRemoveMember,
  onUpdateRole,
}: {
  org: Organization
  isExpanded: boolean
  members: OrgMember[]
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onAddMember: () => void
  onRemoveMember: (memberId: string) => void
  onUpdateRole: (memberId: string, role: string) => void
}) {
  const roleIcons = {
    owner: Crown,
    admin: Shield,
    member: User,
  }

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl border border-[var(--border)] flex items-center justify-center">
            <Building className="h-6 w-6 text-[var(--foreground-muted)]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-body-md font-semibold text-[var(--foreground)]">
              {org.name}
            </h3>
            {org.description && (
              <p className="text-body-sm text-[var(--foreground-muted)] truncate">
                {org.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 text-center">
            <div>
              <p className="text-body-sm font-medium text-[var(--foreground)]">
                {org.member_count}
              </p>
              <p className="text-body-xs text-[var(--foreground-muted)]">Members</p>
            </div>
            <div>
              <p className="text-body-sm font-medium text-[var(--foreground)]">
                {org.event_count}
              </p>
              <p className="text-body-xs text-[var(--foreground-muted)]">Events</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--wine)] hover:border-[var(--wine)] transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:text-error hover:border-error transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--foreground-muted)] transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded members section */}
      {isExpanded && (
        <div className="border-t border-[var(--border)] bg-[var(--surface)]/50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-body-sm font-semibold text-[var(--foreground)]">
                Members ({members.length})
              </h4>
              <button
                onClick={onAddMember}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg',
                  'text-body-xs font-medium',
                  'border border-[var(--wine)] text-[var(--wine)]',
                  'hover:bg-[var(--wine)]/10 transition-colors'
                )}
              >
                <UserPlus className="h-3 w-3" />
                Add
              </button>
            </div>

            {members.length === 0 ? (
              <p className="text-body-sm text-[var(--foreground-muted)] text-center py-4">
                No members yet. Add admins to this group.
              </p>
            ) : (
              <div className="space-y-2">
                {members.map((member) => {
                  const RoleIcon = roleIcons[member.role] || User

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-[var(--background)]"
                    >
                      <div className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center">
                        <span className="text-body-xs font-medium text-[var(--foreground)]">
                          {member.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium text-[var(--foreground)] truncate">
                          {member.display_name}
                        </p>
                        <p className="text-body-xs text-[var(--foreground-muted)] truncate">
                          {member.email}
                        </p>
                      </div>
                      <select
                        value={member.role}
                        onChange={(e) => onUpdateRole(member.id, e.target.value)}
                        className={cn(
                          'px-2 py-1 rounded text-body-xs',
                          'bg-transparent border border-[var(--border)]',
                          'text-[var(--foreground)]',
                          'focus:outline-none focus:border-[var(--wine)]'
                        )}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        <option value="owner">Owner</option>
                      </select>
                      <button
                        onClick={() => onRemoveMember(member.id)}
                        className="p-1 text-[var(--foreground-muted)] hover:text-error transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
