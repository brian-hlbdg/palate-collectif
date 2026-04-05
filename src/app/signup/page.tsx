'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AccountConversion } from '@/components/AccountConversion'
import { WineLoader } from '@/components/ui'
import { ArrowLeft } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [tempUserId, setTempUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const tempId = localStorage.getItem('palate-temp-user')
    setTempUserId(tempId)
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <WineLoader />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
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
            tempUserId={tempUserId ?? 'new'}
            onConversionComplete={() => {
              router.push('/dashboard')
            }}
            onSkip={() => router.back()}
          />
        </motion.div>
      </main>
    </div>
  )
}
