'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, AuthState } from '@/types'
import type { Session } from '@supabase/supabase-js'

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>
  createTempUser: (displayName: string, email?: string) => Promise<{ user: User | null; error: Error | null }>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data as User
  }

  // Handle session changes
  const handleSession = async (session: Session | null) => {
    if (session?.user) {
      const profile = await fetchUserProfile(session.user.id)
      setUser(profile)
    } else {
      setUser(null)
    }
    setIsLoading(false)
  }

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error: error ? new Error(error.message) : null }
  }

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return { error: new Error(error.message) }
    }

    // Create profile
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        display_name: displayName,
        is_temp_account: false,
        is_admin: false,
      })

      if (profileError) {
        return { error: new Error(profileError.message) }
      }
    }

    return { error: null }
  }

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // Magic link sign in
  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error: error ? new Error(error.message) : null }
  }

  // Create temporary user for booth mode
  const createTempUser = async (displayName: string, email?: string) => {
    // Generate a unique ID for the temp user
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Calculate expiration (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: tempId,
        display_name: displayName,
        eventbrite_email: email || null,
        is_temp_account: true,
        account_expires_at: expiresAt.toISOString(),
        is_admin: false,
      })
      .select()
      .single()

    if (error) {
      return { user: null, error: new Error(error.message) }
    }

    const tempUser = data as User
    setUser(tempUser)
    
    // Store temp user ID in localStorage
    localStorage.setItem('palate-temp-user', tempId)

    return { user: tempUser, error: null }
  }

  // Refresh user data
  const refreshUser = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id)
      setUser(profile)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        signInWithEmail,
        createTempUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Convenience hook for checking admin status
export function useIsAdmin(): boolean {
  const { user } = useAuth()
  return user?.is_admin ?? false
}
