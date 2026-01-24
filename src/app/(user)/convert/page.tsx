'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui'
import { WineLoader } from '@/components/ui'
import { AccountConversion } from '@/components/AccountConversion'
import { ArrowLeft } from 'lucide-react'

export default function ConvertAccountPage() {
  const router = useRouter()
  const [tempUserId, setTempUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is a temp user
    const tempId = localStorage.getItem('palate-temp-user')
    const permanentId = localStorage.getItem('palate-user')

    if (permanentId) {
      // Already has permanent account
      router.push('/dashboard')
      return
    }

    if (!tempId) {
      // No temp account either
      router.push('/join')
      return
    }

    setTempUserId(tempId)
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <WineLoader />
      </div>
    )
  }

  if (!tempUserId) return null

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-body-lg font-semibold text-[var(--foreground)]">
            Create Account
          </h1>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AccountConversion
            tempUserId={tempUserId}
            onConversionComplete={(newId) => {
              // Redirect to dashboard after successful conversion
              router.push('/dashboard')
            }}
            onSkip={() => router.back()}
          />
        </motion.div>
      </main>
    </div>
  )
}
