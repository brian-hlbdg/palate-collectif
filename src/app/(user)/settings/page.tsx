'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button, Input } from '@/components/ui'
import { WineLoader } from '@/components/ui'
import { ConfirmDialog } from '@/components/ui'
import { useToast } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  User,
  Mail,
  Save,
  Trash2,
  Shield,
  Bell,
  Moon,
  LogOut,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'

interface UserProfile {
  id: string
  display_name: string
  eventbrite_email?: string
  is_temp_account: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const { addToast } = useToast()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')

  // Dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Get user ID
  const getUserId = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) return session.user.id
    return localStorage.getItem('palate-temp-user')
  }

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      const userId = await getUserId()
      if (!userId) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, eventbrite_email, is_temp_account')
        .eq('id', userId)
        .single()

      if (data) {
        setProfile(data)
        setDisplayName(data.display_name || '')
        setEmail(data.eventbrite_email || '')
      }

      setIsLoading(false)
    }

    loadProfile()
  }, [router])

  // Save profile
  const handleSave = async () => {
    if (!profile) return
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || 'Guest',
          eventbrite_email: email.trim() || null,
        })
        .eq('id', profile.id)

      if (error) throw error

      setProfile({
        ...profile,
        display_name: displayName.trim() || 'Guest',
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

  // Delete account
  const handleDeleteAccount = async () => {
    if (!profile) return
    setIsDeleting(true)

    try {
      // Delete ratings first
      await supabase
        .from('user_wine_ratings')
        .delete()
        .eq('user_id', profile.id)

      // Delete profile
      await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id)

      // Sign out if using Supabase auth
      await supabase.auth.signOut()

      // Clear local storage
      localStorage.removeItem('palate-temp-user')
      localStorage.removeItem('palate-current-event')

      addToast({
        type: 'success',
        message: 'Account deleted',
      })

      router.push('/')
    } catch (err) {
      console.error('Error deleting account:', err)
      addToast({
        type: 'error',
        message: 'Failed to delete account',
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // Sign out
  const handleSignOut = async () => {
    localStorage.removeItem('palate-temp-user')
    localStorage.removeItem('palate-current-event')
    await supabase.auth.signOut()
    router.push('/login')
  }

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
      <div>
        <h1 className="text-display-md font-bold text-[var(--foreground)]">
          Settings
        </h1>
        <p className="text-body-md text-[var(--foreground-secondary)] mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Temp account notice */}
      {profile?.is_temp_account && (
        <Card variant="outlined" padding="md" className="border-[var(--gold)]/50 bg-[var(--gold-muted)]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--gold)] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-body-md font-semibold text-[var(--foreground)]">
                Temporary Account
              </h3>
              <p className="text-body-sm text-[var(--foreground-secondary)] mt-1">
                Your account was created when you joined an event. Create a permanent account to save your wine journey forever.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => router.push('/register')}
              >
                Create Permanent Account
              </Button>
            </div>
          </div>
        </Card>
      )}

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
            placeholder="your@email.com"
            hint="Used to identify you across events"
          />

          <div className="pt-2">
            <Button
              onClick={handleSave}
              isLoading={isSaving}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Card>

      {/* Preferences section */}
      <Card variant="outlined" padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-[var(--wine)]" />
          <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
            Preferences
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-md text-[var(--foreground)]">Dark Mode</p>
              <p className="text-body-sm text-[var(--foreground-muted)]">
                Toggle dark/light theme
              </p>
            </div>
            <p className="text-body-sm text-[var(--foreground-muted)]">
              Use the toggle in the header
            </p>
          </div>
        </div>
      </Card>

      {/* Account section */}
      <Card variant="outlined" padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-[var(--wine)]" />
          <h2 className="text-body-lg font-semibold text-[var(--foreground)]">
            Account
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
            <div>
              <p className="text-body-md text-[var(--foreground)]">Account Type</p>
              <p className="text-body-sm text-[var(--foreground-muted)]">
                {profile?.is_temp_account ? 'Temporary' : 'Permanent'}
              </p>
            </div>
            {profile?.is_temp_account ? (
              <AlertTriangle className="h-5 w-5 text-[var(--gold)]" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>

          <Button
            variant="secondary"
            fullWidth
            onClick={handleSignOut}
            leftIcon={<LogOut className="h-4 w-4" />}
          >
            Sign Out
          </Button>
        </div>
      </Card>

      {/* Danger zone */}
      <Card variant="outlined" padding="lg" className="border-error/30">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="h-5 w-5 text-error" />
          <h2 className="text-body-lg font-semibold text-error">
            Danger Zone
          </h2>
        </div>

        <p className="text-body-sm text-[var(--foreground-secondary)] mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        <Button
          variant="ghost"
          onClick={() => setShowDeleteDialog(true)}
          leftIcon={<Trash2 className="h-4 w-4" />}
          className="text-error hover:bg-error/10"
        >
          Delete Account
        </Button>
      </Card>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description="Are you sure you want to delete your account? All your ratings and data will be permanently removed. This action cannot be undone."
        confirmText="Delete Account"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}
