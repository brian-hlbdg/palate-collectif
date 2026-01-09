'use client'

import React from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui'
import { Wine } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      {/* Minimal header */}
      <header className="p-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[var(--wine-muted)] flex items-center justify-center">
            <Wine className="h-5 w-5 text-[var(--wine)]" />
          </div>
          <span className="text-body-lg font-semibold text-[var(--foreground)]">
            Palate
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main content - centered */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-body-sm text-[var(--foreground-muted)]">
          © {new Date().getFullYear()} Palate Collectif. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
