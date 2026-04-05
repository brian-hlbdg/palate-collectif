'use client'

import { useEffect, useState } from 'react'
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
  Users,
  Package,
  Ticket,
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
  const [newChangelogCount, setNewChangelogCount] = useState(0)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name, eventbrite_email')
          .eq('id', session.user.id)
          .maybeSingle()

        if (profile) {
          setUser(profile)
          await loadChangelogBadge()
          setIsLoading(false)
          return
        }
      }

      const tempUserId = localStorage.getItem('palate-temp-user')
      if (tempUserId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name, eventbrite_email')
          .eq('id', tempUserId)
          .maybeSingle()

        if (profile) {
          setUser(profile)
          setIsLoading(false)
          return
        }
      }

      router.push('/login')
    }

    checkUser()
  }, [router])

  const loadChangelogBadge = async () => {
    const lastSeen = localStorage.getItem('palate-changelog-last-seen')
    const query = supabase
      .from('changelog_entries')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
    if (lastSeen) {
      query.gt('published_at', lastSeen)
    }
    const { count } = await query
    setNewChangelogCount(count || 0)
  }

  const handleLogout = async () => {
    localStorage.removeItem('palate-temp-user')
    localStorage.removeItem('palate-current-event')
    localStorage.removeItem('palate-user')
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleChangelogClick = () => {
    localStorage.setItem('palate-changelog-last-seen', new Date().toISOString())
    setNewChangelogCount(0)
  }

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/events', icon: Calendar, label: 'My Events' },
    { href: '/profile', icon: BarChart3, label: 'My Palate' },
    { href: '/buddies', icon: Users, label: 'Buddies' },
    { href: '/changelog', icon: Package, label: "What's New", badge: newChangelogCount > 0 ? newChangelogCount : undefined },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <WineLoader />
      </div>
    )
  }

  if (!user) return null

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
                My Account
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={item.href === '/changelog' ? handleChangelogClick : undefined}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl',
                    'text-body-md font-medium',
                    'transition-all duration-200',
                    isActive
                      ? 'bg-[var(--wine-muted)] text-[var(--wine)]'
                      : 'text-[var(--foreground-secondary)] hover:bg-[var(--hover-overlay)] hover:text-[var(--foreground)]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </div>
                  {'badge' in item && item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-body-xs font-semibold bg-[var(--wine)] text-white">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}

            {/* Join event action */}
            <div className="pt-4">
              <Link
                href="/join"
                className={cn(
                  'flex items-center justify-center gap-2',
                  'w-full px-4 py-3 rounded-xl',
                  'bg-[var(--wine)]',
                  'text-body-md font-medium',
                  'hover:opacity-90',
                  'transition-opacity duration-200'
                )}
                style={{ color: '#ffffff' }}
              >
                <Ticket className="h-5 w-5" />
                Join an Event
              </Link>
            </div>
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-[var(--border)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--wine-muted)] flex items-center justify-center">
                <span className="text-body-md font-semibold text-[var(--wine)]">
                  {user.display_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-[var(--foreground)] truncate">
                  {user.display_name}
                </p>
                <p className="text-body-xs text-[var(--foreground-muted)]">
                  Member
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
              Palate
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
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setMobileMenuOpen(false)
                      if (item.href === '/changelog') handleChangelogClick()
                    }}
                    className={cn(
                      'flex items-center justify-between px-4 py-3 rounded-xl',
                      'text-body-md font-medium',
                      isActive
                        ? 'bg-[var(--wine-muted)] text-[var(--wine)]'
                        : 'text-[var(--foreground-secondary)]'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </div>
                    {'badge' in item && item.badge && (
                      <span className="px-2 py-0.5 rounded-full text-body-xs font-semibold bg-[var(--wine)] text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
              <Link
                href="/join"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center justify-center gap-2',
                  'w-full px-4 py-3 rounded-xl mt-4',
                  'bg-[var(--wine)]',
                  'text-body-md font-medium'
                )}
                style={{ color: '#ffffff' }}
              >
                <Ticket className="h-5 w-5" />
                Join an Event
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
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  )
}
