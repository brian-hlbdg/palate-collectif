'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, Button, Input } from '@/components/ui'
import { useToast } from '@/components/ui'
import { QRCodeSVG } from 'qrcode.react'
import {
  Users,
  QrCode,
  Copy,
  Check,
  Camera,
  UserPlus,
  X,
  Sparkles,
  Calendar,
} from 'lucide-react'
import {
  getOrCreateBuddyCode,
  connectWithBuddy,
  getEventBuddies,
  type EventBuddy,
} from '@/lib/buddies'

interface BuddyConnectProps {
  userId: string
  eventId: string
  eventName: string
  eventDate?: string
  onConnect?: (buddyName: string) => void
}

export function BuddyConnect({
  userId,
  eventId,
  eventName,
  eventDate,
  onConnect
}: BuddyConnectProps) {
  const { addToast } = useToast()
  const [buddyCode, setBuddyCode] = useState<string>('')
  const [isLoadingCode, setIsLoadingCode] = useState(true)
  const [copied, setCopied] = useState(false)
  
  const [showEnterCode, setShowEnterCode] = useState(false)
  const [enterCodeValue, setEnterCodeValue] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  
  const [buddies, setBuddies] = useState<EventBuddy[]>([])
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [connectedBuddyName, setConnectedBuddyName] = useState('')

  useEffect(() => {
    loadBuddyCode()
    loadBuddies()
  }, [userId, eventId])

  const loadBuddyCode = async () => {
    setIsLoadingCode(true)
    const { code, error } = await getOrCreateBuddyCode(userId, eventId)
    if (error) {
      addToast({ type: 'error', message: error })
    } else {
      setBuddyCode(code)
    }
    setIsLoadingCode(false)
  }

  const loadBuddies = async () => {
    const eventBuddies = await getEventBuddies(userId, eventId)
    setBuddies(eventBuddies)
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(buddyCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      addToast({ type: 'success', message: 'Code copied!' })
    } catch {
      addToast({ type: 'error', message: 'Failed to copy' })
    }
  }

  const handleConnect = async () => {
    if (!enterCodeValue.trim()) {
      addToast({ type: 'error', message: 'Please enter a code' })
      return
    }

    setIsConnecting(true)
    const result = await connectWithBuddy(userId, enterCodeValue.trim(), eventId)
    setIsConnecting(false)

    if (result.success) {
      setConnectedBuddyName(result.buddyName || 'your buddy')
      setShowSuccessModal(true)
      setShowEnterCode(false)
      setEnterCodeValue('')
      loadBuddies()
      onConnect?.(result.buddyName || '')
    } else {
      addToast({ type: 'error', message: result.message })
    }
  }

  const formattedDate = eventDate 
    ? new Date(eventDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    : null

  return (
    <>
      <Card variant="outlined" padding="lg" className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[var(--wine-muted)] flex items-center justify-center">
            <Users className="h-6 w-6 text-[var(--wine)]" />
          </div>
          <div>
            <h3 className="text-body-lg font-semibold text-[var(--foreground)]">
              Tasting Buddies
            </h3>
            <p className="text-body-sm text-[var(--foreground-muted)]">
              Connect with friends to compare results
            </p>
          </div>
        </div>

        {/* Current Buddies */}
        {buddies.length > 0 && (
          <div className="space-y-2">
            <p className="text-body-xs text-[var(--foreground-muted)] uppercase tracking-wide">
              Your buddies at this event
            </p>
            <div className="flex flex-wrap gap-2">
              {buddies.map((buddy) => (
                <div
                  key={buddy.buddy_id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--wine-muted)] text-[var(--wine)]"
                >
                  <div className="w-6 h-6 rounded-full bg-[var(--wine)] text-white flex items-center justify-center text-body-xs font-medium">
                    {buddy.buddy_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span className="text-body-sm font-medium">{buddy.buddy_name}</span>
                  <span className="text-body-xs opacity-70">
                    {buddy.wines_rated} wines
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Your Code */}
        <div className="space-y-3">
          <p className="text-body-xs text-[var(--foreground-muted)] uppercase tracking-wide">
            Your tasting code
          </p>
          
          <div className="flex items-center justify-center gap-6">
            {/* QR Code */}
            <div className="p-3 bg-white rounded-xl shadow-sm">
              {isLoadingCode ? (
                <div className="w-24 h-24 flex items-center justify-center">
                  <div className="animate-spin w-6 h-6 border-2 border-[var(--wine)] border-t-transparent rounded-full" />
                </div>
              ) : (
                <QRCodeSVG
                  value={`buddy:${buddyCode}`}
                  size={96}
                  fgColor="var(--wine)"
                  level="M"
                />
              )}
            </div>

            {/* Code Display */}
            <div className="text-center">
              <p className="text-display-md font-mono font-bold text-[var(--foreground)] tracking-widest">
                {isLoadingCode ? '----' : buddyCode}
              </p>
              <button
                onClick={handleCopyCode}
                disabled={isLoadingCode}
                className="mt-2 flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-lg text-body-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy code
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-body-xs text-[var(--foreground-muted)] text-center">
            Share this code with friends to connect
          </p>
        </div>

        {/* Enter Friend's Code */}
        <div className="border-t border-[var(--border)] pt-4">
          {!showEnterCode ? (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowEnterCode(true)}
              leftIcon={<UserPlus className="h-4 w-4" />}
            >
              Enter Friend's Code
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3"
            >
              <div className="flex gap-2">
                <Input
                  value={enterCodeValue}
                  onChange={(e) => setEnterCodeValue(e.target.value.toUpperCase())}
                  placeholder="ABCD"
                  maxLength={4}
                  className="flex-1 text-center font-mono text-lg tracking-widest uppercase"
                />
                <Button
                  onClick={handleConnect}
                  isLoading={isConnecting}
                  disabled={enterCodeValue.length < 4}
                >
                  Connect
                </Button>
              </div>
              <button
                onClick={() => {
                  setShowEnterCode(false)
                  setEnterCodeValue('')
                }}
                className="text-body-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--surface)] rounded-2xl p-6 max-w-sm w-full text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              
              <h3 className="text-display-sm font-bold text-[var(--foreground)] mb-2">
                You're now tasting buddies!
              </h3>
              
              <p className="text-body-md text-[var(--foreground-secondary)] mb-4">
                Connected with <span className="font-semibold">{connectedBuddyName}</span>
              </p>

              <Card variant="wine" padding="md" className="mb-6 text-left">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-[var(--wine)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-body-sm text-[var(--foreground)]">
                      Your ratings stay private until the event ends.
                    </p>
                    {formattedDate && (
                      <p className="text-body-sm text-[var(--foreground-secondary)] mt-1 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Come back after {formattedDate} to see how your tastes compared!
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              <Button
                fullWidth
                onClick={() => setShowSuccessModal(false)}
              >
                Continue Tasting
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default BuddyConnect
