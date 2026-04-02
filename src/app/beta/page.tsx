'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button } from '@/components/ui'
import { ThemeToggle } from '@/components/ui'
import {
  Wine,
  ArrowRight,
  LayoutDashboard,
  QrCode,
  Navigation,
  Sparkles,
  Star,
  Users,
  Copy,
  Check,
  ChevronRight,
  Building2,
  Trophy,
} from 'lucide-react'

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 rounded text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-body-xs font-medium bg-[var(--wine-muted)] text-[var(--wine)] mb-4">
      {children}
    </span>
  )
}

function CredentialRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
      <span className="text-body-sm text-[var(--foreground-secondary)]">{label}</span>
      <div className="flex items-center">
        <span className="text-body-sm font-mono text-[var(--foreground)]">{value}</span>
        <CopyButton value={value} />
      </div>
    </div>
  )
}

export default function BetaPage() {
  const router = useRouter()
  const [accepted, setAccepted] = useState(false)

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[var(--surface)]/90 backdrop-blur border-b border-[var(--border)] px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--wine-muted)] flex items-center justify-center">
              <Wine className="h-4 w-4 text-[var(--wine)]" />
            </div>
            <span className="text-body-md font-semibold text-[var(--foreground)]">Palate Collectif</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--wine)] text-white ml-1">BETA</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <AnimatePresence mode="wait">
        {!accepted ? (
          /* ── Gate Screen ───────────────────────────────────────────── */
          <motion.div
            key="gate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="min-h-[calc(100vh-57px)] flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="w-24 h-24 rounded-3xl bg-[var(--wine-muted)] flex items-center justify-center mx-auto mb-6"
              >
                <Wine className="h-12 w-12 text-[var(--wine)]" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-display-md font-bold text-[var(--foreground)] mb-3">
                  You've been invited to test Palate Collectif
                </h1>
                <p className="text-body-md text-[var(--foreground-secondary)] mb-8">
                  Palate Collectif is a wine tasting app that lets guests rate wines, connect with tasting buddies, and compare results at live events. Are you here to test it?
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col gap-3"
              >
                <Button
                  size="lg"
                  fullWidth
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                  onClick={() => setAccepted(true)}
                >
                  Yes, show me around
                </Button>
                <Button
                  size="lg"
                  fullWidth
                  variant="secondary"
                  onClick={() => router.push('/')}
                >
                  No, take me to the site
                </Button>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          /* ── Intro Page ────────────────────────────────────────────── */
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl mx-auto px-4 py-10 space-y-12"
          >
            {/* Welcome */}
            <section className="text-center">
              <h2 className="text-display-md font-bold text-[var(--foreground)] mb-3">
                Welcome, tester!
              </h2>
              <p className="text-body-lg text-[var(--foreground-secondary)] max-w-xl mx-auto">
                Below is a guide to the three main experiences in the app. Use the login credentials and links to explore each one. Your feedback is genuinely appreciated.
              </p>
            </section>

            {/* ── Admin Dashboard ───────────────────────────────────── */}
            <section>
              <SectionBadge><LayoutDashboard className="h-3 w-3 mr-1" />Admin</SectionBadge>
              <h3 className="text-display-sm font-bold text-[var(--foreground)] mb-2">Admin Dashboard</h3>
              <p className="text-body-md text-[var(--foreground-secondary)] mb-5">
                The admin side is where event organizers create and manage events, add wines, set up booth mode, and generate QR codes for guests.
              </p>

              <Card variant="outlined" padding="lg" className="mb-4">
                <p className="text-label-md text-[var(--foreground)] mb-3">Login credentials</p>
                <CredentialRow label="Email" value="demo.admin@palatecollectif.com" />
                <CredentialRow label="Password" value="DemoAdmin2025!" />
              </Card>

              <Card variant="outlined" padding="md" className="mb-5">
                <p className="text-body-sm text-[var(--foreground-secondary)] mb-3">
                  <strong className="text-[var(--foreground)]">Things to try:</strong>
                </p>
                <ul className="space-y-2 text-body-sm text-[var(--foreground-secondary)]">
                  <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-[var(--wine)] mt-0.5 flex-shrink-0" />View the three demo events on the dashboard</li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-[var(--wine)] mt-0.5 flex-shrink-0" />Click into an event to see wines, stops, and the QR code</li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-[var(--wine)] mt-0.5 flex-shrink-0" />Try editing an event or adding a new one</li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-[var(--wine)] mt-0.5 flex-shrink-0" />Add or remove wines from an event</li>
                </ul>
              </Card>

              <Link href="/admin/login">
                <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Go to Admin Login
                </Button>
              </Link>
            </section>

            <div className="border-t border-[var(--border)]" />

            {/* ── Booth Mode ────────────────────────────────────────── */}
            <section>
              <SectionBadge><QrCode className="h-3 w-3 mr-1" />Booth Mode</SectionBadge>
              <h3 className="text-display-sm font-bold text-[var(--foreground)] mb-2">Booth Mode — Chateau Lumiere Showcase</h3>
              <p className="text-body-md text-[var(--foreground-secondary)] mb-5">
                Booth mode is designed for walk-up guests at a physical booth. No event code needed — guests simply enter their email to start tasting. This is ideal for festivals and vendor tables.
              </p>

              <Card variant="outlined" padding="lg" className="mb-4">
                <p className="text-label-md text-[var(--foreground)] mb-3">Access</p>
                <CredentialRow label="Direct URL" value="/booth/BOOTH01" />
                <CredentialRow label="5 wines from" value="Chateau Lumiere, France" />
              </Card>

              <Card variant="outlined" padding="md" className="mb-5">
                <p className="text-body-sm text-[var(--foreground-secondary)] mb-3">
                  <strong className="text-[var(--foreground)]">Things to try:</strong>
                </p>
                <ul className="space-y-2 text-body-sm text-[var(--foreground-secondary)]">
                  <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-[var(--wine)] mt-0.5 flex-shrink-0" />Enter any email to join — no sign-up required</li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-[var(--wine)] mt-0.5 flex-shrink-0" />Rate a wine and check that the progress bar updates</li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-[var(--wine)] mt-0.5 flex-shrink-0" />Expand "Show wine details" to see tasting notes and composition</li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-[var(--wine)] mt-0.5 flex-shrink-0" />Connect with a tasting buddy using the Buddies panel</li>
                </ul>
              </Card>

              <Link href="/booth/BOOTH01">
                <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Open Booth
                </Button>
              </Link>
            </section>

            <div className="border-t border-[var(--border)]" />

            {/* ── Wine Crawl ────────────────────────────────────────── */}
            <section>
              <SectionBadge><Navigation className="h-3 w-3 mr-1" />Wine Crawl</SectionBadge>
              <h3 className="text-display-sm font-bold text-[var(--foreground)] mb-2">Wine Crawl — Old Town Wine Crawl</h3>
              <p className="text-body-md text-[var(--foreground-secondary)] mb-5">
                The wine crawl experience is for events where guests move between multiple stops or venues. Wines are grouped by location and guests join with an event code.
              </p>

              <Card variant="outlined" padding="lg" className="mb-4">
                <p className="text-label-md text-[var(--foreground)] mb-3">Access</p>
                <CredentialRow label="Join at" value="/join" />
                <CredentialRow label="Event code" value="CRAWL01" />
                <CredentialRow label="3 stops" value="The Barrel Room · Vine & Dine Bistro · The Cellar Door" />
              </Card>

              <Card variant="outlined" padding="md" className="mb-5">
                <p className="text-body-sm text-[var(--foreground-secondary)] mb-3">
                  <strong className="text-[var(--foreground)]">Things to try:</strong>
                </p>
                <ul className="space-y-2 text-body-sm text-[var(--foreground-secondary)]">
                  <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-[var(--wine)] mt-0.5 flex-shrink-0" />Join with code CRAWL01 and enter your name</li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-[var(--wine)] mt-0.5 flex-shrink-0" />Browse wines grouped by stop location</li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-[var(--wine)] mt-0.5 flex-shrink-0" />Search by wine type, region, or country (e.g. "red", "France")</li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-[var(--wine)] mt-0.5 flex-shrink-0" />Rate wines and see the checkmark and counter update</li>
                </ul>
              </Card>

              <Link href="/join">
                <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Join Wine Crawl
                </Button>
              </Link>
            </section>

            <div className="border-t border-[var(--border)]" />

            {/* ── Wine Festival ─────────────────────────────────────── */}
            <section>
              <SectionBadge><Sparkles className="h-3 w-3 mr-1" />Festival</SectionBadge>
              <h3 className="text-display-sm font-bold text-[var(--foreground)] mb-2">Wine Festival — Grand Harvest Festival</h3>
              <p className="text-body-md text-[var(--foreground-secondary)] mb-5">
                The festival experience is for larger events with wines from multiple vendors or regions. Guests join with a code and can explore, filter, and rate a wider selection.
              </p>

              <Card variant="outlined" padding="lg" className="mb-4">
                <p className="text-label-md text-[var(--foreground)] mb-3">Access</p>
                <CredentialRow label="Join at" value="/join" />
                <CredentialRow label="Event code" value="FEST01" />
                <CredentialRow label="8 wines from" value="Italy · France · Spain · New Zealand · Australia · Portugal" />
              </Card>

              <Card variant="outlined" padding="md" className="mb-5">
                <p className="text-body-sm text-[var(--foreground-secondary)] mb-3">
                  <strong className="text-[var(--foreground)]">Things to try:</strong>
                </p>
                <ul className="space-y-2 text-body-sm text-[var(--foreground-secondary)]">
                  <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-[var(--wine)] mt-0.5 flex-shrink-0" />Join with code FEST01 and enter your name</li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-[var(--wine)] mt-0.5 flex-shrink-0" />Use the filter buttons to view only red, white, or sparkling wines</li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-[var(--wine)] mt-0.5 flex-shrink-0" />Open the Barolo or Champagne and explore the full wine details</li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 text-[var(--wine)] mt-0.5 flex-shrink-0" />Rate all 8 wines and see the full progress bar complete</li>
                </ul>
              </Card>

              <Link href="/join">
                <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Join Festival
                </Button>
              </Link>
            </section>

            <div className="border-t border-[var(--border)]" />

            {/* ── Shared Features ───────────────────────────────────── */}
            <section>
              <h3 className="text-display-sm font-bold text-[var(--foreground)] mb-6">Features in every event</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card variant="outlined" padding="md">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--wine-muted)] flex items-center justify-center flex-shrink-0">
                      <Star className="h-5 w-5 text-[var(--wine)]" />
                    </div>
                    <div>
                      <p className="text-body-md font-semibold text-[var(--foreground)] mb-1">Wine Ratings</p>
                      <p className="text-body-sm text-[var(--foreground-secondary)]">Rate each wine 1–5 stars, add notes, and mark wines you'd buy</p>
                    </div>
                  </div>
                </Card>

                <Card variant="outlined" padding="md">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--wine-muted)] flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-[var(--wine)]" />
                    </div>
                    <div>
                      <p className="text-body-md font-semibold text-[var(--foreground)] mb-1">Tasting Buddies</p>
                      <p className="text-body-sm text-[var(--foreground-secondary)]">Share a 4-letter code to connect with friends and compare taste profiles</p>
                    </div>
                  </div>
                </Card>

                <Card variant="outlined" padding="md">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--wine-muted)] flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-[var(--wine)]" />
                    </div>
                    <div>
                      <p className="text-body-md font-semibold text-[var(--foreground)] mb-1">Wine Details</p>
                      <p className="text-body-sm text-[var(--foreground-secondary)]">Tasting notes, grape varieties, food pairings, and technical specs</p>
                    </div>
                  </div>
                </Card>

                <Card variant="outlined" padding="md">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--wine-muted)] flex items-center justify-center flex-shrink-0">
                      <Trophy className="h-5 w-5 text-[var(--wine)]" />
                    </div>
                    <div>
                      <p className="text-body-md font-semibold text-[var(--foreground)] mb-1">Results</p>
                      <p className="text-body-sm text-[var(--foreground-secondary)]">After the event closes, see top-rated wines and buddy taste comparisons</p>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            {/* ── Footer note ───────────────────────────────────────── */}
            <section className="pb-10">
              <Card variant="outlined" padding="lg" className="text-center">
                <Wine className="h-8 w-8 text-[var(--wine)] mx-auto mb-3" />
                <p className="text-body-md font-semibold text-[var(--foreground)] mb-2">
                  Thank you for testing!
                </p>
                <p className="text-body-sm text-[var(--foreground-secondary)]">
                  Notice anything broken, confusing, or worth improving? Reply to the message you received with your thoughts — every bit of feedback helps.
                </p>
              </Card>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
