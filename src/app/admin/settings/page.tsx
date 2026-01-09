'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button, Input, Textarea } from '@/components/ui'
import { WineLoader } from '@/components/ui'
import { ConfirmDialog } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  User,
  Mail,
  Save,
  Shield,
  Key,
  Building,
  Globe,
  Palette,
  UserPlus,
  Lock,
  AlertTriangle,
} from 'lucide-react'

interface AdminProfile {
  id: string
  display_name: string
  eventbrite_email?: string
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const { addToast } = useToast()

  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form state - Profile
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')

  // Form state - Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Form state - New Admin
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminName, setNewAdminName] = useState('')
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false)

  const adminId = typeof window !== 'undefined'
    ? localStorage.getItem('palate-admin-user')
    : null

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!adminId) {
        router.push('/admin/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, eventbrite_email')
        .eq('id', adminId)
        .single()

      if (data) {
        setProfile(data)
        setDisplayName(data.display_name || '')
        setEmail(data.eventbrite_email || '')
      }

      setIsLoading(false)
    }

    loadProfile()
  }, [adminId, router])

  // Save profile
  const handleSaveProfile = async () => {
    if (!profile) return
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          eventbrite_email: email.trim() || null,
        })
        .eq('id', profile.id)

      if (error) throw error

      setProfile({
        ...profile,
        display_name: displayName.trim(),
        eventbrite_email: email.trim() || null,
      })

      addToast({
        type: 'success',
        message: 'Profile updated!',
      })
    } catch (err) {
      console.error('Error saving profile:', err)
      addToast({
        type: 'error',
        message: 'Failed to save changes',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Change password
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      addToast({ type: 'error', message: 'Passwords do not match' })
      return
    }

    if (newPassword.length < 8) {
      addToast({ type: 'error', message: 'Password must be at least 8 characters' })
      return
    }

    setIsChangingPassword(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      addToast({
        type: 'success',
        message: 'Password changed successfully!',
      })

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error('Error changing password:', err)
      addToast({
        type: 'error',
        message: 'Failed to change password',
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Create new admin
  const handleCreateAdmin = async () => {
    if (!newAdminEmail.trim() || !newAdminName.trim()) {
      addToast({ type: 'error', message: 'Please fill in all fields' })
      return
    }

    setIsCreatingAdmin(true)

    try {
      // Check if profile already exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('eventbrite_email', newAdminEmail.trim().toLowerCase())
        .single()

      if (existing) {
        // Update existing profile to admin
        const { error } = await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', existing.id)

        if (error) throw error

        addToast({
          type: 'success',
          message: `${newAdminName} has been granted admin access!`,
        })
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
            is_temp_account: false,
          })

        if (error) throw error

        addToast({
          type: 'success',
          message: `Admin account created for ${newAdminName}!`,
        })
      }

      setNewAdminEmail('')
      setNewAdminName('')
    } catch (err) {
      console.error('Error creating admin:', err)
      addToast({
        type: 'error',
        message: 'Failed to create admin',
      })
    } finally {
      setIsCreatingAdmin(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <WineLoader />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-display-md font-bold text-[var(--foreground)]">
          Settings
        </h1>
        <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
          Manage your admin account
        </p>
      </div>

      {/* Profile section */}
      <Card variant="outlined" padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-[var(--wine)]" />
          <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
            Profile
          </h2>
        </div>

        <div className="space-y-4">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            leftIcon={<User className="h-5 w-5" />}
            placeholder="Your name"
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-5 w-5" />}
            placeholder="admin@example.com"
          />

          <div className="pt-2">
            <Button
              onClick={handleSaveProfile}
              isLoading={isSaving}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Card>

      {/* Password section */}
      <Card variant="outlined" padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Key className="h-5 w-5 text-[var(--wine)]" />
          <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
            Change Password
          </h2>
        </div>

        <div className="space-y-4">
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={<Lock className="h-5 w-5" />}
            placeholder="••••••••"
            showPasswordToggle
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="h-5 w-5" />}
            placeholder="••••••••"
            showPasswordToggle
          />

          <div className="pt-2">
            <Button
              onClick={handleChangePassword}
              isLoading={isChangingPassword}
              disabled={!newPassword || !confirmPassword}
              leftIcon={<Key className="h-4 w-4" />}
            >
              Change Password
            </Button>
          </div>
        </div>
      </Card>

      {/* Add admin section */}
      <Card variant="outlined" padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="h-5 w-5 text-[var(--wine)]" />
          <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
            Add Administrator
          </h2>
        </div>

        <p className="text-body-sm text-[var(--foreground-secondary)] mb-4">
          Grant admin access to another user. They will be able to create and manage their own events.
        </p>

        <div className="space-y-4">
          <Input
            label="Name"
            value={newAdminName}
            onChange={(e) => setNewAdminName(e.target.value)}
            leftIcon={<User className="h-5 w-5" />}
            placeholder="Admin name"
          />

          <Input
            label="Email"
            type="email"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            leftIcon={<Mail className="h-5 w-5" />}
            placeholder="admin@example.com"
          />

          <div className="pt-2">
            <Button
              onClick={handleCreateAdmin}
              isLoading={isCreatingAdmin}
              disabled={!newAdminEmail || !newAdminName}
              leftIcon={<UserPlus className="h-4 w-4" />}
            >
              Add Admin
            </Button>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-[var(--gold-muted)] border border-[var(--gold)]/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-[var(--gold)] flex-shrink-0 mt-0.5" />
            <p className="text-body-sm text-[var(--foreground-secondary)]">
              <strong>Note:</strong> Each admin can only see and manage their own events. 
              Organization-based access is planned for a future update.
            </p>
          </div>
        </div>
      </Card>

      {/* App info */}
      <Card variant="outlined" padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-[var(--wine)]" />
          <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
            About
          </h2>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-[var(--border)]">
            <span className="text-body-sm text-[var(--foreground-secondary)]">Version</span>
            <span className="text-body-sm text-[var(--foreground)]">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[var(--border)]">
            <span className="text-body-sm text-[var(--foreground-secondary)]">Platform</span>
            <span className="text-body-sm text-[var(--foreground)]">Palate Collectif</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-body-sm text-[var(--foreground-secondary)]">Support</span>
            <a 
              href="mailto:support@palatecollectif.com" 
              className="text-body-sm text-[var(--wine)] hover:underline"
            >
              support@palatecollectif.com
            </a>
          </div>
        </div>
      </Card>
    </div>
  )
}
