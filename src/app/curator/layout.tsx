'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ThemeToggle, WineLoader } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import {
  Wine,
  Database,
  BarChart3,
  Users,
  Activity,
  LogOut,
  Menu,
  X,
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react'

interface CuratorUser {
  id: string
  display_name: string
  is_curator?: boolean
}

export default function CuratorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<CuratorUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  // Check curator auth
  useEffect(() => {
    const checkCurator = async () => {
      const storedUserId = localStorage.getItem('palate-curator-user')
      
      if (storedUserId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name, is_curator')
          .eq('id', storedUserId)
          .single()

        if (profile?.is_curator) {
          setUser(profile)
          
          // Get pending wines count
          const { count } = await supabase
            .from('user_wines')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')
          
          setPendingCount(count || 0)
          
          setIsLoading(false)
          return
        }
      }

      // Not a curator, redirect
      router.push('/login')
    }

    checkCurator()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('palate-curator-user')
    supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { 
      href: '/curator', 
      icon: Database, 
      label: 'Dashboard',
      exact: true,
    },
    { 
      href: '/curator/wines', 
      icon: Wine, 
      label: 'Wine Review',
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { 
      href: '/curator/analytics', 
      icon: BarChart3, 
      label: 'Analytics',
    },
    { 
      href: '/curator/admins', 
      icon: Users, 
      label: 'Admins',
    },
    { 
      href: '/curator/health', 
      icon: Activity, 
      label: 'Data Health',
    },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <WineLoader />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-1 border-r border-[var(--border)]">
          {/* Logo */}
          <div className="flex items-center gap-3 h-20 px-6 border-b border-[var(--border)]">
            <div className="w-10 h-10 rounded-xl border-2 border-[var(--wine)] flex items-center justify-center">
              <Shield className="h-5 w-5 text-[var(--wine)]" />
            </div>
            <div>
              <span className="text-body-lg font-semibold text-[var(--foreground)]">
                Palate
              </span>
              <span className="text-body-xs text-[var(--wine)] font-medium block -mt-0.5 tracking-wider uppercase">
                Curator
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact 
                ? pathname === item.href
                : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl',
                    'text-body-md font-medium',
                    'border transition-all duration-200',
                    isActive
                      ? 'border-[var(--wine)] text-[var(--wine)]'
                      : 'border-transparent text-[var(--foreground-secondary)] hover:border-[var(--border)] hover:text-[var(--foreground)]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-body-xs font-semibold border border-[var(--wine)] text-[var(--wine)]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center">
                  <span className="text-body-sm font-medium text-[var(--foreground)]">
                    {user.display_name?.charAt(0).toUpperCase() || 'C'}
                  </span>
                </div>
                <div>
                  <p className="text-body-sm font-medium text-[var(--foreground)]">
                    {user.display_name}
                  </p>
                  <p className="text-body-xs text-[var(--foreground-muted)]">
                    Curator
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </div>
            <button
              onClick={handleLogout}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl',
                'text-body-sm font-medium',
                'border border-[var(--border)] text-[var(--foreground-secondary)]',
                'hover:border-[var(--foreground-muted)] hover:text-[var(--foreground)]',
                'transition-all duration-200'
              )}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 lg:hidden border-b border-[var(--border)] bg-[var(--background)]">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border-2 border-[var(--wine)] flex items-center justify-center">
              <Shield className="h-4 w-4 text-[var(--wine)]" />
            </div>
            <span className="text-body-md font-semibold text-[var(--foreground)]">
              Curator
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-[var(--border)] hover:border-[var(--foreground-muted)] transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-[var(--foreground)]" />
              ) : (
                <Menu className="h-5 w-5 text-[var(--foreground)]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <nav className="border-t border-[var(--border)] p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact 
                ? pathname === item.href
                : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl',
                    'text-body-md font-medium',
                    'border transition-all duration-200',
                    isActive
                      ? 'border-[var(--wine)] text-[var(--wine)]'
                      : 'border-transparent text-[var(--foreground-secondary)]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-body-xs font-semibold border border-[var(--wine)] text-[var(--wine)]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
            <button
              onClick={handleLogout}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
                'text-body-md text-[var(--foreground-secondary)]',
                'border border-transparent'
              )}
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="lg:pl-72">
        <div className="max-w-6xl mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
