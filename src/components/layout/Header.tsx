'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui'
import { useAuth } from '@/components/providers'
import { Wine, Menu, X, User, LogOut, Settings } from 'lucide-react'

interface HeaderProps {
  variant?: 'default' | 'admin' | 'minimal'
  showNav?: boolean
  className?: string
}

export function Header({ variant = 'default', showNav = true, className }: HeaderProps) {
  const { user, isAuthenticated, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <header
      className={cn(
        'sticky top-0 z-40',
        'bg-[var(--surface)]/80 backdrop-blur-xl',
        'border-b border-[var(--border)]',
        className
      )}
    >
      <div className={cn(
        variant === 'admin' ? 'container-admin' : 'container-app',
        'flex items-center justify-between h-16'
      )}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
            className="text-[var(--wine)]"
          >
            <Wine className="h-7 w-7" />
          </motion.div>
          <span className="text-body-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--wine)] transition-colors">
            Palate
            <span className="text-[var(--wine)]">.</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        {showNav && (
          <nav className="hidden md:flex items-center gap-1">
            {isAuthenticated && user?.is_admin && (
              <>
                <NavLink href="/admin">Dashboard</NavLink>
                <NavLink href="/admin/events">Events</NavLink>
                <NavLink href="/admin/analytics">Analytics</NavLink>
              </>
            )}
          </nav>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl',
                  'text-body-sm font-medium',
                  'bg-[var(--surface)]',
                  'border border-[var(--border)]',
                  'hover:bg-[var(--hover-overlay)]',
                  'transition-colors duration-200'
                )}
              >
                <div className="h-6 w-6 rounded-full bg-[var(--wine-muted)] flex items-center justify-center">
                  <User className="h-4 w-4 text-[var(--wine)]" />
                </div>
                <span className="hidden sm:inline text-[var(--foreground)]">
                  {user?.display_name || 'User'}
                </span>
              </button>

              {/* Dropdown menu */}
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className={cn(
                    'absolute right-0 top-full mt-2',
                    'w-48 p-2 rounded-xl',
                    'bg-[var(--surface)]',
                    'border border-[var(--border)]',
                    'shadow-[var(--shadow-elevation-2)]'
                  )}
                >
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--hover-overlay)] transition-colors"
                  >
                    <User className="h-4 w-4 text-[var(--foreground-muted)]" />
                    <span className="text-body-sm text-[var(--foreground)]">Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--hover-overlay)] transition-colors"
                  >
                    <Settings className="h-4 w-4 text-[var(--foreground-muted)]" />
                    <span className="text-body-sm text-[var(--foreground)]">Settings</span>
                  </Link>
                  <div className="h-px bg-[var(--border)] my-2" />
                  <button
                    onClick={() => {
                      signOut()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[var(--hover-overlay)] transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4 text-[var(--foreground-muted)]" />
                    <span className="text-body-sm text-[var(--foreground)]">Sign out</span>
                  </button>
                </motion.div>
              )}
            </div>
          ) : (
            <Link
              href="/join"
              className={cn(
                'px-4 py-2 rounded-xl',
                'text-body-sm font-medium',
                'bg-[var(--wine)] text-white',
                'hover:bg-[var(--wine-hover)]',
                'transition-colors duration-200'
              )}
            >
              Join Event
            </Link>
          )}

          {/* Mobile menu button */}
          {showNav && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-[var(--hover-overlay)] transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-[var(--foreground)]" />
              ) : (
                <Menu className="h-5 w-5 text-[var(--foreground)]" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && showNav && (
        <motion.nav
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="md:hidden border-t border-[var(--border)] bg-[var(--surface)]"
        >
          <div className="container-app py-4 space-y-1">
            {isAuthenticated && user?.is_admin && (
              <>
                <MobileNavLink href="/admin" onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </MobileNavLink>
                <MobileNavLink href="/admin/events" onClick={() => setMobileMenuOpen(false)}>
                  Events
                </MobileNavLink>
                <MobileNavLink href="/admin/analytics" onClick={() => setMobileMenuOpen(false)}>
                  Analytics
                </MobileNavLink>
              </>
            )}
          </div>
        </motion.nav>
      )}
    </header>
  )
}

// Navigation link component
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        'px-4 py-2 rounded-lg',
        'text-body-sm font-medium',
        'text-[var(--foreground-secondary)]',
        'hover:text-[var(--foreground)]',
        'hover:bg-[var(--hover-overlay)]',
        'transition-colors duration-200'
      )}
    >
      {children}
    </Link>
  )
}

// Mobile navigation link
function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'block px-4 py-3 rounded-xl',
        'text-body-md font-medium',
        'text-[var(--foreground)]',
        'hover:bg-[var(--hover-overlay)]',
        'transition-colors duration-200'
      )}
    >
      {children}
    </Link>
  )
}
