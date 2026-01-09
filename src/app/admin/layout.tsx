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
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
} from 'lucide-react'

interface AdminUser {
  id: string
  display_name: string
  is_admin: boolean
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Check admin auth
  useEffect(() => {
    const checkAdmin = async () => {
      // Skip auth check on login page
      if (pathname === '/admin/login') {
        setIsLoading(false)
        return
      }

      // First check localStorage for admin user
      const storedUserId = localStorage.getItem('palate-admin-user')
      
      if (storedUserId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name, is_admin')
          .eq('id', storedUserId)
          .single()

        if (profile?.is_admin) {
          setUser(profile)
          setIsLoading(false)
          return
        }
      }

      // Check Supabase auth session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name, is_admin')
          .eq('id', session.user.id)
          .single()

        if (profile?.is_admin) {
          setUser(profile)
          localStorage.setItem('palate-admin-user', profile.id)
          setIsLoading(false)
          return
        }
      }

      // Not an admin, redirect to login
      router.push('/admin/login')
    }

    checkAdmin()
  }, [router, pathname])

  const handleLogout = () => {
    localStorage.removeItem('palate-admin-user')
    supabase.auth.signOut()
    router.push('/admin/login')
  }

  const navItems = [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/events', icon: Calendar, label: 'Events' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <WineLoader />
      </div>
    )
  }

  // Render login page without sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-[var(--surface)] border-r border-[var(--border)]">
          {/* Logo */}
          <div className="flex items-center gap-3 h-16 px-6 border-b border-[var(--border)]">
            <Wine className="h-8 w-8 text-[var(--wine)]" />
            <div>
              <span className="text-body-lg font-semibold text-[var(--foreground)]">
                Palate
              </span>
              <span className="text-body-xs text-[var(--foreground-muted)] block -mt-1">
                Admin
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl',
                    'text-body-md font-medium',
                    'transition-all duration-200',
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

            {/* Quick action */}
            <div className="pt-4">
              <Link
                href="/admin/events/new"
                className={cn(
                  'flex items-center justify-center gap-2',
                  'w-full px-4 py-3 rounded-xl',
                  'bg-[var(--wine)] text-white',
                  'text-body-md font-medium',
                  'hover:bg-[var(--wine-hover)]',
                  'transition-colors duration-200'
                )}
              >
                <Plus className="h-5 w-5" />
                New Event
              </Link>
            </div>
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--wine-muted)] flex items-center justify-center">
                <span className="text-body-md font-semibold text-[var(--wine)]">
                  {user.display_name?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-[var(--foreground)] truncate">
                  {user.display_name}
                </p>
                <p className="text-body-xs text-[var(--foreground-muted)]">
                  Admin
                </p>
              </div>
              <ThemeToggle />
            </div>
            <button
              onClick={handleLogout}
              className={cn(
                'flex items-center gap-2 w-full px-4 py-2 rounded-lg',
                'text-body-sm text-[var(--foreground-secondary)]',
                'hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)]',
                'transition-colors duration-200'
              )}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Wine className="h-7 w-7 text-[var(--wine)]" />
            <span className="text-body-lg font-semibold text-[var(--foreground)]">
              Palate Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl hover:bg-[var(--hover-overlay)] transition-colors"
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
            className="border-t border-[var(--border)] bg-[var(--surface)]"
          >
            <div className="p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href))

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
              <Link
                href="/admin/events/new"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-center gap-2',
                  'w-full px-4 py-3 rounded-xl mt-4',
                  'bg-[var(--wine)] text-white',
                  'text-body-md font-medium'
                )}
              >
                <Plus className="h-5 w-5" />
                New Event
              </Link>
              <button
                onClick={handleLogout}
                className={cn(
                  'flex items-center gap-2 w-full px-4 py-3 rounded-xl',
                  'text-body-md text-[var(--foreground-secondary)]'
                )}
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            </div>
          </motion.nav>
        )}
      </header>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}