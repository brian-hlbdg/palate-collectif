'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui'
import {
  Wine,
  Star,
  Users,
  BarChart3,
  Sparkles,
  ArrowRight,
  ChevronRight,
  MapPin,
  QrCode,
  Trophy,
  ShoppingBag,
  Check,
  Navigation,
  Building2,
  Zap,
  TrendingUp,
  Download,
  Clock,
} from 'lucide-react'

// ─── Fade-in wrapper ───────────────────────────────────────────────────────────
function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--wine-muted)] border border-[var(--border-accent)] text-[var(--wine)] text-sm font-medium tracking-wide">
      {children}
    </span>
  )
}

// ─── Phone mockup ──────────────────────────────────────────────────────────────
function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[260px]">
      {/* Glow */}
      <div className="absolute inset-0 rounded-[2.5rem] bg-[var(--wine)] opacity-10 blur-2xl scale-90" />
      {/* Frame */}
      <div className="relative bg-[var(--surface)] border-2 border-[var(--border-secondary)] rounded-[2.5rem] overflow-hidden shadow-[var(--shadow-elevation-3)]">
        {/* Notch */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-20 h-1.5 rounded-full bg-[var(--border-secondary)]" />
        </div>
        {/* Screen content */}
        <div className="bg-[var(--background)] mx-1 mb-1 rounded-[2rem] overflow-hidden min-h-[480px]">
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Wine card mock ────────────────────────────────────────────────────────────
function MockWineCard({
  name,
  producer,
  type,
  rated,
  rating,
}: {
  name: string
  producer: string
  type: string
  rated?: boolean
  rating?: number
}) {
  const emojis: Record<string, string> = {
    red: '🍷', white: '🥂', rosé: '🌸', sparkling: '🍾',
  }
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border mx-3 mb-2',
        rated
          ? 'border-[var(--wine)]/30 bg-[var(--surface)]'
          : 'border-[var(--border)] bg-[var(--surface)]',
      )}
    >
      <div className="w-10 h-10 rounded-lg bg-[var(--wine-muted)] flex items-center justify-center text-xl flex-shrink-0">
        {emojis[type] || '🍷'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[var(--foreground)] truncate">{name}</p>
        <p className="text-[10px] text-[var(--foreground-muted)] truncate">{producer}</p>
      </div>
      {rated && rating ? (
        <div className="flex items-center gap-1 flex-shrink-0">
          <Star className="h-3 w-3 fill-[var(--wine)] text-[var(--wine)]" />
          <span className="text-xs font-medium text-[var(--foreground)]">{rating}</span>
          <Check className="h-3.5 w-3.5 text-[var(--wine)]" />
        </div>
      ) : (
        <ChevronRight className="h-4 w-4 text-[var(--foreground-muted)] flex-shrink-0" />
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--wine-muted)] flex items-center justify-center">
              <Wine className="h-4.5 w-4.5 text-[var(--wine)]" />
            </div>
            <span className="text-base font-semibold text-[var(--foreground)]">
              Palate<span className="text-[var(--wine)]">.</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {['Features', 'How it works', 'For Hosts', 'Changelog'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/admin"
              className="hidden sm:block px-4 py-2 rounded-xl text-sm font-medium text-[var(--foreground-secondary)] border border-[var(--border)] hover:border-[var(--border-secondary)] hover:text-[var(--foreground)] transition-all"
            >
              Host an Event
            </Link>
            <Link
              href="/join"
              className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--wine)] text-white hover:bg-[var(--wine-hover)] transition-colors"
            >
              Join Event
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background orbs */}
        <motion.div
          className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--wine-muted) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--gold-muted) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--wine-muted)] border border-[var(--border-accent)] mb-8"
            >
              <Sparkles className="h-3.5 w-3.5 text-[var(--gold)]" />
              <span className="text-sm font-medium text-[var(--wine)]">
                Wine tasting, reimagined
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="text-5xl sm:text-6xl font-bold text-[var(--foreground)] leading-[1.1] tracking-tight mb-6"
            >
              Every glass tells{' '}
              <span className="text-gradient-wine">a story.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="text-lg text-[var(--foreground-secondary)] leading-relaxed mb-10 max-w-lg"
            >
              Palate turns any wine tasting — from intimate dinners to crawls across the city — into a rich, shared experience. Rate wines, connect with fellow tasters, and discover your palate.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Link
                href="/join"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--wine)] text-white font-medium text-base hover:bg-[var(--wine-hover)] transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                Join an Event
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--surface)] text-[var(--foreground)] font-medium text-base border border-[var(--border)] hover:border-[var(--border-secondary)] transition-all"
              >
                Host an Event
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.55, delay: 0.5 }}
              className="mt-12 flex gap-8"
            >
              {[
                { value: 'No app', label: 'download needed' },
                { value: 'Free', label: 'to join events' },
                { value: 'Real-time', label: 'results & rankings' },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div className="text-lg font-bold text-[var(--foreground)]">{value}</div>
                  <div className="text-sm text-[var(--foreground-muted)]">{label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:flex justify-center"
          >
            <PhoneMockup>
              {/* Mini event header */}
              <div className="bg-[var(--surface)] border-b border-[var(--border)] px-3 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-1.5 py-0.5 bg-[var(--wine-muted)] text-[var(--wine)] text-[9px] font-mono rounded">
                    PALATE24
                  </span>
                  <Users className="h-3.5 w-3.5 text-[var(--foreground-muted)]" />
                </div>
                <p className="text-xs font-bold text-[var(--foreground)]">Harvest Tasting 2024</p>
                <div className="mt-1.5 h-1 bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--wine)] rounded-full" style={{ width: '60%' }} />
                </div>
                <p className="text-[9px] text-[var(--foreground-muted)] mt-0.5">3 of 5 rated</p>
              </div>

              {/* Wine list */}
              <div className="pt-3">
                <MockWineCard name="Château Margaux 2019" producer="Margaux, Bordeaux" type="red" rated rating={5} />
                <MockWineCard name="Cloudy Bay Sauvignon" producer="Marlborough, NZ" type="white" rated rating={4} />
                <MockWineCard name="Whispering Angel Rosé" producer="Provence, France" type="rosé" rated rating={4} />
                <MockWineCard name="Moët & Chandon Brut" producer="Champagne, France" type="sparkling" />
                <MockWineCard name="Barolo Classico" producer="Piedmont, Italy" type="red" />
              </div>
            </PhoneMockup>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronRight className="h-5 w-5 text-[var(--foreground-muted)] rotate-90" />
        </motion.div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-[var(--background-secondary)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-16">
            <SectionLabel>How it works</SectionLabel>
            <h2 className="mt-4 text-4xl font-bold text-[var(--foreground)] tracking-tight">
              Up and tasting in under a minute
            </h2>
            <p className="mt-3 text-lg text-[var(--foreground-secondary)] max-w-xl mx-auto">
              No accounts, no downloads. Just a code and your curiosity.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[33%] right-[33%] h-px bg-gradient-to-r from-[var(--wine-muted)] via-[var(--wine)] to-[var(--wine-muted)]" />

            {[
              {
                step: '01',
                icon: QrCode,
                title: 'Enter your code',
                desc: 'Scan a QR code or type in the 6-character event code from your host.',
              },
              {
                step: '02',
                icon: Star,
                title: 'Rate as you go',
                desc: 'Rate each wine 1–5 stars, add tasting notes, and mark the ones you\'d buy.',
              },
              {
                step: '03',
                icon: Trophy,
                title: 'See the results',
                desc: 'When the event ends, see the crowd rankings and compare notes with friends.',
              },
            ].map(({ step, icon: Icon, title, desc }, i) => (
              <FadeIn key={step} delay={i * 0.1}>
                <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--border-accent)] transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-[var(--wine-muted)] flex items-center justify-center">
                        <Icon className="h-6 w-6 text-[var(--wine)]" />
                      </div>
                      <span className="absolute -top-2 -right-2 text-[10px] font-bold text-[var(--wine)] bg-[var(--background)] px-1 rounded">
                        {step}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--foreground)] mb-1">{title}</h3>
                      <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-28">

          {/* ── 1. Taste & Rate ─────────────────────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <SectionLabel><Star className="h-3.5 w-3.5" /> Rate & Discover</SectionLabel>
              <h2 className="mt-4 text-4xl font-bold text-[var(--foreground)] tracking-tight leading-tight">
                Your palate, documented.
              </h2>
              <p className="mt-4 text-lg text-[var(--foreground-secondary)] leading-relaxed">
                Rate every wine on a 5-star scale, write tasting notes while they're fresh, and flag the ones you'd actually buy. Your full session is always there to revisit.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Intuitive star rating — tap once, you\'re done',
                  'Personal tasting notes with each pour',
                  'Would-buy flag so you never lose a discovery',
                  'Full session history sorted by rating or order',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[var(--foreground-secondary)]">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-[var(--wine-muted)] flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-[var(--wine)]" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </FadeIn>

            <FadeIn delay={0.15} className="flex justify-center">
              <PhoneMockup>
                {/* Wine detail mock */}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <ChevronRight className="h-4 w-4 text-[var(--foreground-muted)] rotate-180" />
                    <span className="text-xs text-[var(--foreground-muted)]">Back</span>
                  </div>

                  <div className="bg-[var(--wine-muted)] rounded-2xl p-4 mb-3 text-center">
                    <span className="text-4xl">🍷</span>
                    <p className="mt-2 text-sm font-bold text-[var(--foreground)]">Barolo Classico 2018</p>
                    <p className="text-xs text-[var(--foreground-secondary)]">Marchesi di Barolo · Piedmont</p>
                  </div>

                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-3 mb-3">
                    <p className="text-xs font-medium text-[var(--foreground)] mb-2 text-center">How would you rate this?</p>
                    <div className="flex justify-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn('h-6 w-6', s <= 4 ? 'fill-[var(--gold)] text-[var(--gold)]' : 'text-[var(--border-secondary)]')}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-2.5 mb-2">
                    <p className="text-[10px] text-[var(--foreground-muted)] mb-1">Notes</p>
                    <p className="text-[10px] text-[var(--foreground)]">Dark cherry, leather, long finish…</p>
                  </div>

                  <button className="w-full py-2 rounded-xl bg-[var(--gold-muted)] border border-[var(--gold)]/30 flex items-center justify-center gap-2">
                    <ShoppingBag className="h-3.5 w-3.5 text-[var(--gold)]" />
                    <span className="text-xs font-medium text-[var(--gold)]">Would buy</span>
                  </button>
                </div>
              </PhoneMockup>
            </FadeIn>
          </div>

          {/* ── 2. Buddy System ─────────────────────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn delay={0.15} className="order-2 lg:order-1 flex justify-center">
              <PhoneMockup>
                <div className="p-3">
                  {/* Buddy panel */}
                  <div className="text-center py-3 border-b border-[var(--border)] mb-3">
                    <p className="text-sm font-bold text-[var(--foreground)]">Tasting Buddies</p>
                  </div>

                  <div className="bg-[var(--wine-muted)] border border-[var(--border-accent)] rounded-2xl p-3 mb-3 text-center">
                    <p className="text-[9px] text-[var(--wine)] mb-1 font-medium">YOUR CODE</p>
                    <p className="text-3xl font-bold tracking-[0.3em] text-[var(--wine)] font-mono">KRTM</p>
                    <p className="text-[9px] text-[var(--foreground-muted)] mt-1">Share this with friends to connect</p>
                  </div>

                  <div className="space-y-2 mb-3">
                    {[
                      { name: 'Sophie L.', match: 87, wines: 5 },
                      { name: 'Marcus T.', match: 74, wines: 4 },
                    ].map(({ name, match, wines }) => (
                      <div key={name} className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-2.5">
                        <div className="w-8 h-8 rounded-full bg-[var(--wine-muted)] flex items-center justify-center text-xs font-bold text-[var(--wine)]">
                          {name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--foreground)]">{name}</p>
                          <p className="text-[9px] text-[var(--foreground-muted)]">{wines} wines rated</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[var(--wine)]">{match}%</p>
                          <p className="text-[9px] text-[var(--foreground-muted)]">match</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PhoneMockup>
            </FadeIn>

            <FadeIn className="order-1 lg:order-2">
              <SectionLabel><Users className="h-3.5 w-3.5" /> Buddy System</SectionLabel>
              <h2 className="mt-4 text-4xl font-bold text-[var(--foreground)] tracking-tight leading-tight">
                Taste together, compare after.
              </h2>
              <p className="mt-4 text-lg text-[var(--foreground-secondary)] leading-relaxed">
                Share a 4-letter code to connect with anyone at the event. Once the results drop, see your taste match percentage and find out where you agree — and where you beautifully disagree.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Instant connection with a 4-letter buddy code',
                  'Taste match percentage shows how aligned you are',
                  'See wine-by-wine comparisons after the event',
                  'Works across both regular events and booth mode',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[var(--foreground-secondary)]">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-[var(--wine-muted)] flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-[var(--wine)]" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </FadeIn>
          </div>

          {/* ── 3. Wine Crawl ───────────────────────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <SectionLabel><Navigation className="h-3.5 w-3.5" /> Wine Crawl Mode</SectionLabel>
              <h2 className="mt-4 text-4xl font-bold text-[var(--foreground)] tracking-tight leading-tight">
                Take the tasting to the streets.
              </h2>
              <p className="mt-4 text-lg text-[var(--foreground-secondary)] leading-relaxed">
                Crawl mode organizes wines by location — each stop on the crawl becomes its own section. Tasters navigate between venues, and every pour is tracked no matter where it's poured.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Wines grouped by venue or location',
                  'Tasters can join at any stop',
                  'Full progress tracked across all stops',
                  'Host sees a unified view of the whole crawl',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[var(--foreground-secondary)]">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-[var(--wine-muted)] flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-[var(--wine)]" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </FadeIn>

            <FadeIn delay={0.15} className="flex justify-center">
              <PhoneMockup>
                <div className="p-3">
                  <div className="flex items-center gap-1.5 mb-3 text-[var(--wine)]">
                    <Navigation className="h-3.5 w-3.5" />
                    <span className="text-xs font-semibold">Wine Crawl · 3 stops</span>
                  </div>

                  {[
                    { location: 'Bar Margaux', count: 2, done: 2 },
                    { location: 'Vino & Co.', count: 2, done: 1 },
                    { location: 'The Cellar', count: 2, done: 0 },
                  ].map(({ location, count, done }) => (
                    <div key={location} className="mb-3">
                      <div className="flex items-center gap-2 px-1 mb-1.5">
                        <MapPin className="h-3 w-3 text-[var(--wine)]" />
                        <span className="text-[10px] font-semibold text-[var(--foreground)]">{location}</span>
                        <span className="text-[9px] text-[var(--foreground-muted)] ml-auto">{done}/{count}</span>
                      </div>
                      {Array.from({ length: count }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'flex items-center gap-2 rounded-lg p-2 mb-1 border',
                            i < done
                              ? 'border-[var(--wine)]/30 bg-[var(--surface)]'
                              : 'border-[var(--border)] bg-[var(--surface)]',
                          )}
                        >
                          <span className="text-sm">{i === 0 ? '🍷' : '🥂'}</span>
                          <span className="text-[10px] text-[var(--foreground)] flex-1">Wine {i + 1}</span>
                          {i < done && <Check className="h-3 w-3 text-[var(--wine)]" />}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </PhoneMockup>
            </FadeIn>
          </div>

          {/* ── 4. Booth Mode ───────────────────────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn delay={0.15} className="order-2 lg:order-1 flex justify-center">
              <PhoneMockup>
                <div className="bg-[var(--surface)] border-b border-[var(--border)] px-3 py-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-[var(--wine-muted)] text-[var(--wine)] text-[9px] font-mono rounded">WINERY24</span>
                    <span className="px-1.5 py-0.5 bg-[var(--gold-muted)] text-[var(--gold)] text-[9px] rounded flex items-center gap-0.5">
                      <Building2 className="h-2.5 w-2.5" /> Booth
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[var(--foreground)] mt-1.5">Spring Release Tasting</p>
                </div>

                <div className="px-3 space-y-2">
                  <p className="text-[10px] font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-2">6 Wines to Taste</p>
                  {[
                    { n: 'Estate Chardonnay', t: 'white', rated: true, r: 4 },
                    { n: 'Pinot Noir Reserve', t: 'red', rated: true, r: 5 },
                    { n: 'Rosé de Provence', t: 'rosé', rated: false },
                    { n: 'Late Harvest Riesling', t: 'white', rated: false },
                  ].map(({ n, t, rated, r }) => (
                    <MockWineCard key={n} name={n} producer="" type={t} rated={rated} rating={r} />
                  ))}
                </div>
              </PhoneMockup>
            </FadeIn>

            <FadeIn className="order-1 lg:order-2">
              <SectionLabel><Building2 className="h-3.5 w-3.5" /> Booth Mode</SectionLabel>
              <h2 className="mt-4 text-4xl font-bold text-[var(--foreground)] tracking-tight leading-tight">
                Set it up, step away.
              </h2>
              <p className="mt-4 text-lg text-[var(--foreground-secondary)] leading-relaxed">
                Booth mode is built for trade shows, winery visits, and self-serve tasting stations. Walk up, enter your name, and start rating. No staff needed. No app to download.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Walk-up friendly — no pre-registration',
                  'Branded with your winery logo and welcome message',
                  'QR code at the entrance handles everything',
                  'Full rating data collected for the host',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[var(--foreground-secondary)]">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-[var(--wine-muted)] flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-[var(--wine)]" />
                    </div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── For Hosts ─────────────────────────────────────────────────────── */}
      <section id="for-hosts" className="py-24 bg-[var(--background-secondary)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-16">
            <SectionLabel><BarChart3 className="h-3.5 w-3.5" /> For Hosts</SectionLabel>
            <h2 className="mt-4 text-4xl font-bold text-[var(--foreground)] tracking-tight">
              Your guests have spoken. Here's the data.
            </h2>
            <p className="mt-3 text-lg text-[var(--foreground-secondary)] max-w-xl mx-auto">
              Everything you need to understand your audience, curate better events, and export clean reports.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Zap,
                title: 'Live event management',
                desc: 'Add or reorder wines mid-event. Close the event when you\'re ready to reveal results.',
              },
              {
                icon: TrendingUp,
                title: 'Real-time analytics',
                desc: 'See ratings roll in as guests taste. Crowd favorites and divisive wines emerge instantly.',
              },
              {
                icon: BarChart3,
                title: 'Rating distribution',
                desc: 'Per-wine histograms show how guests spread their scores — not just the average.',
              },
              {
                icon: Users,
                title: 'Taster engagement',
                desc: 'Track how many guests rated each wine and overall completion rates.',
              },
              {
                icon: Download,
                title: 'Export reports',
                desc: 'Download a clean CSV of all ratings and notes. Ready for your newsletter or buyer deck.',
              },
              {
                icon: QrCode,
                title: 'Instant QR codes',
                desc: 'Generate a printable QR code for your event in one click. No tech setup needed.',
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <FadeIn key={title} delay={i * 0.07}>
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--border-accent)] transition-colors group h-full">
                  <div className="w-10 h-10 rounded-xl bg-[var(--wine-muted)] flex items-center justify-center mb-3 group-hover:bg-[var(--wine)] transition-colors">
                    <Icon className="h-5 w-5 text-[var(--wine)] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-semibold text-[var(--foreground)] mb-1.5">{title}</h3>
                  <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.3} className="mt-10 text-center">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--wine)] text-white font-medium hover:bg-[var(--wine-hover)] transition-all hover:-translate-y-0.5"
            >
              Start hosting
              <ArrowRight className="h-4 w-4" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── Changelog ─────────────────────────────────────────────────────── */}
      <section id="changelog" className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <FadeIn className="text-center mb-16">
            <SectionLabel><Clock className="h-3.5 w-3.5" /> Changelog</SectionLabel>
            <h2 className="mt-4 text-4xl font-bold text-[var(--foreground)] tracking-tight">
              Built in the open, shipping fast.
            </h2>
            <p className="mt-3 text-lg text-[var(--foreground-secondary)]">
              From a simple rating app to a full tasting platform.
            </p>
          </FadeIn>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gradient-to-b from-[var(--wine)] via-[var(--border)] to-transparent" />

            <div className="space-y-10">
              {[
                {
                  version: 'Coming soon',
                  label: 'upcoming',
                  date: '2026',
                  items: [
                    'AI-powered wine recommendations based on your ratings',
                    'Permanent wine collection across events',
                    'Sommelier-curated tasting notes',
                  ],
                },
                {
                  version: 'v2.1',
                  label: 'latest',
                  date: 'Nov 2025',
                  items: [
                    'Booth mode for self-serve tasting stations',
                    'Buddy system with taste match percentage',
                    'Admin analytics dashboard with export',
                    'Dark mode with full theme support',
                  ],
                },
                {
                  version: 'v2.0',
                  label: 'major',
                  date: 'Aug 2025',
                  items: [
                    'Wine Crawl mode — multi-location events',
                    'QR code entry for events',
                    'Would-buy tracking on each wine',
                    'Real-time event results reveal',
                  ],
                },
                {
                  version: 'v1.0',
                  label: 'origin',
                  date: 'Jan 2025',
                  items: [
                    'First wine rating experience',
                    'Basic event creation and management',
                    'Personal tasting notes per wine',
                  ],
                },
              ].map(({ version, label, date, items }, i) => {
                const labelColors: Record<string, string> = {
                  upcoming: 'bg-[var(--gold-muted)] text-[var(--gold)] border-[var(--gold)]/30',
                  latest: 'bg-[var(--wine-muted)] text-[var(--wine)] border-[var(--border-accent)]',
                  major: 'bg-[var(--surface)] text-[var(--foreground-secondary)] border-[var(--border)]',
                  origin: 'bg-[var(--surface)] text-[var(--foreground-muted)] border-[var(--border)]',
                }
                return (
                  <FadeIn key={version} delay={i * 0.1}>
                    <div className="flex gap-6">
                      {/* Dot */}
                      <div className={cn(
                        'w-9 h-9 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10',
                        label === 'upcoming'
                          ? 'bg-[var(--gold-muted)] border-[var(--gold)]/40'
                          : label === 'latest'
                          ? 'bg-[var(--wine-muted)] border-[var(--wine)]/40'
                          : 'bg-[var(--surface)] border-[var(--border)]',
                      )}>
                        {label === 'upcoming'
                          ? <Sparkles className="h-4 w-4 text-[var(--gold)]" />
                          : <Check className="h-4 w-4 text-[var(--wine)]" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-lg font-bold text-[var(--foreground)]">{version}</span>
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', labelColors[label])}>
                            {label}
                          </span>
                          <span className="text-sm text-[var(--foreground-muted)] ml-auto">{date}</span>
                        </div>
                        <ul className="space-y-2">
                          {items.map((item) => (
                            <li key={item} className="flex items-start gap-2.5 text-[var(--foreground-secondary)]">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--wine-muted)] flex-shrink-0" />
                              <span className="text-sm">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </FadeIn>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[var(--background-secondary)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--wine)] to-[var(--wine-hover)] p-10 sm:p-16 text-center">
              {/* Decorative circles */}
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/[0.03]" />

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
                  <Wine className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
                  Ready to pour?
                </h2>
                <p className="text-lg text-white/75 max-w-md mx-auto mb-8">
                  Join an event happening right now, or set up your own. No download, no credit card.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/join"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[var(--gold)] text-[#1a0a00] font-semibold text-base hover:bg-[var(--gold-hover)] transition-all hover:-translate-y-0.5"
                  >
                    Join an Event
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/admin"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 text-white font-medium text-base border border-white/20 hover:bg-white/20 transition-all"
                  >
                    Host an Event
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="py-10 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--wine-muted)] flex items-center justify-center">
              <Wine className="h-3.5 w-3.5 text-[var(--wine)]" />
            </div>
            <span className="text-sm font-semibold text-[var(--foreground)]">
              Palate<span className="text-[var(--wine)]">.</span>
            </span>
            <span className="text-sm text-[var(--foreground-muted)]">© 2025 Palate Collectif</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
              Terms
            </Link>
            <Link href="/admin" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
              Host Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
