'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { ThemeToggle } from '@/components/ui'
import {
  Wine,
  Star,
  Users,
  BarChart3,
  Sparkles,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="container-app py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Wine className="h-7 w-7 text-[var(--wine)]" />
            <span className="text-body-lg font-semibold text-[var(--foreground)]">
              Palate<span className="text-[var(--wine)]">.</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
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
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient orbs */}
          <motion.div
            className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, var(--wine-muted) 0%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, var(--gold-muted) 0%, transparent 70%)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />
        </div>

        <div className="container-app relative z-10 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--wine-muted)] border border-[var(--border-accent)] mb-8"
          >
            <Sparkles className="h-4 w-4 text-[var(--gold)]" />
            <span className="text-body-sm font-medium text-[var(--wine)]">
              Elevate your wine experience
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-display-xl font-bold text-[var(--foreground)] mb-6"
          >
            Taste. Rate.{' '}
            <span className="text-gradient-wine">Discover.</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-body-xl text-[var(--foreground-secondary)] max-w-lg mx-auto mb-10"
          >
            Transform wine tasting events into memorable, data-rich experiences.
            Build your palate, one glass at a time.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/join">
              <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                Join an Event
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="secondary" size="lg">
                Host an Event
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 flex items-center justify-center gap-8 sm:gap-16"
          >
            <StatItem value="10K+" label="Wines Rated" />
            <StatItem value="500+" label="Events" />
            <StatItem value="5K+" label="Tasters" />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronRight className="h-6 w-6 text-[var(--foreground-muted)] rotate-90" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[var(--background-secondary)]">
        <div className="container-app">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-display-md font-bold text-[var(--foreground)] mb-4">
              Everything you need
            </h2>
            <p className="text-body-lg text-[var(--foreground-secondary)]">
              Powerful features for tasters and hosts alike
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Star}
              title="Rate & Review"
              description="Rate wines with our intuitive 5-star system. Add personal notes and descriptors to remember your favorites."
              delay={0}
            />
            <FeatureCard
              icon={Users}
              title="Social Tasting"
              description="Join events with friends, see crowd favorites, and discover new wines based on collective preferences."
              delay={0.1}
            />
            <FeatureCard
              icon={BarChart3}
              title="Rich Analytics"
              description="For hosts: understand your guests' preferences with detailed analytics and exportable insights."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container-app">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={cn(
              'relative overflow-hidden',
              'p-8 sm:p-12 rounded-3xl',
              'bg-gradient-to-br from-[var(--wine)] to-[var(--wine-hover)]',
              'text-center'
            )}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <Wine className="h-12 w-12 text-white/80 mx-auto mb-6" />
              <h2 className="text-display-md font-bold text-white mb-4">
                Ready to pour?
              </h2>
              <p className="text-body-lg text-white/80 max-w-md mx-auto mb-8">
                Join thousands of wine enthusiasts who are elevating their tasting experience.
              </p>
              <Link href="/join">
                <Button
                  variant="gold"
                  size="lg"
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                >
                  Get Started Free
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[var(--border)]">
        <div className="container-app flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wine className="h-5 w-5 text-[var(--wine)]" />
            <span className="text-body-sm text-[var(--foreground-secondary)]">
              © 2024 Palate Collectif
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-body-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-body-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Stat item component
function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-display-sm font-bold text-[var(--foreground)]">
        {value}
      </div>
      <div className="text-body-sm text-[var(--foreground-muted)]">{label}</div>
    </div>
  )
}

// Feature card component
function FeatureCard({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: typeof Star
  title: string
  description: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        'group p-6 rounded-2xl',
        'bg-[var(--surface)]',
        'border border-[var(--border)]',
        'hover:border-[var(--border-accent)]',
        'hover:shadow-[var(--shadow-elevation-2)]',
        'transition-all duration-300'
      )}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-xl mb-4',
          'bg-[var(--wine-muted)]',
          'flex items-center justify-center',
          'group-hover:bg-[var(--wine)]',
          'transition-colors duration-300'
        )}
      >
        <Icon
          className={cn(
            'h-6 w-6 text-[var(--wine)]',
            'group-hover:text-white',
            'transition-colors duration-300'
          )}
        />
      </div>
      <h3 className="text-body-lg font-semibold text-[var(--foreground)] mb-2">
        {title}
      </h3>
      <p className="text-body-md text-[var(--foreground-secondary)]">
        {description}
      </p>
    </motion.div>
  )
}
