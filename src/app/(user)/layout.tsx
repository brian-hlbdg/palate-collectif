'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ThemeToggle, WineLoader } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Wine,
  LayoutDashboard,
  Heart,
  Settings,
  LogOut,
  Menu,
  X,
  User,
} from 'lucide-react'

interface UserProfile {
  id: string
  display_name: string
  eventbrite_email?: string
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Check user auth
  useEffect(() => {
    const checkUser = async () => {
      // Check Supabase auth session
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name, eventbrite_email')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUser(profile)
          setIsLoading(false)
          return
        }
      }

      // Check for temp user
      const tempUserId = localStorage.getItem('palate-temp-user')
      if (tempUserId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name, eventbrite_email')
          .eq('id', tempUserId)
          .single()

        if (profile) {
          setUser(profile)
          setIsLoading(false)
          return
        }
      }

      // Not logged in, redirect to login
      router.push('/login')
    }

    checkUser()
  }, [router])

  const handleLogout = async () => {
    localStorage.removeItem('palate-temp-user')
    localStorage.removeItem('palate-current-event')
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/favorites', icon: Heart, label: 'Favorites' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <WineLoader />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Mobile header */}
      <header className="sticky top-0 z-40 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="flex items-center justify-between h-16 px-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--wine-muted)] flex items-center justify-center">
              <Wine className="h-5 w-5 text-[var(--wine)]" />
            </div>
            <span className="text-body-lg font-semibold text-[var(--foreground)]">
              Palate
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl hover:bg-[var(--hover-overlay)] transition-colors lg:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-[var(--foreground)]" />
              ) : (
                <Menu className="h-6 w-6 text-[var(--foreground)]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[var(--border)] bg-[var(--surface)] lg:hidden"
          >
            <div className="p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl',
                      'text-body-md font-medium',
                      isActive
                        ? 'bg-[var(--wine-muted)] text-[var(--wine)]'
                        : 'text-[var(--foreground-secondary)]'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
              <button
                onClick={handleLogout}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-3 rounded-xl',
                  'text-body-md text-[var(--foreground-secondary)]'
                )}
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            </div>
          </motion.nav>
        )}

        {/* Desktop navigation */}
        <nav className="hidden lg:flex items-center justify-center gap-1 pb-3 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl',
                  'text-body-md font-medium',
                  'transition-colors duration-200',
                  isActive
                    ? 'bg-[var(--wine-muted)] text-[var(--wine)]'
                    : 'text-[var(--foreground-secondary)] hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)]'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Desktop user dropdown in corner */}
      <div className="hidden lg:block fixed bottom-4 right-4">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl',
            'bg-[var(--surface)] border border-[var(--border)]',
            'text-body-sm text-[var(--foreground-secondary)]',
            'hover:border-[var(--border-secondary)] hover:text-[var(--foreground)]',
            'shadow-[var(--shadow-elevation-1)]',
            'transition-all duration-200'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-[var(--wine-muted)] flex items-center justify-center">
            <span className="text-body-sm font-semibold text-[var(--wine)]">
              {user.display_name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <span className="max-w-[120px] truncate">{user.display_name}</span>
          <LogOut className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  )
}
