'use client'

import React, { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button, Card } from '@/components/ui'
import { Modal } from '@/components/ui'
import {
  QrCode,
  Download,
  Copy,
  Check,
  Smartphone,
  Monitor,
} from 'lucide-react'

interface QRCodeGeneratorProps {
  eventCode: string
  eventName: string
  isBoothMode?: boolean
}

export function QRCodeGenerator({ eventCode, eventName, isBoothMode }: QRCodeGeneratorProps) {
  const [showModal, setShowModal] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const eventUrl = isBoothMode 
    ? `${baseUrl}/booth/${eventCode}`
    : `${baseUrl}/join?code=${eventCode}`

  const sizes = {
    small: 200,
    medium: 300,
    large: 400,
  }

  // Generate QR code when modal opens or size changes
  useEffect(() => {
    if (showModal) {
      generateQR()
    }
  }, [showModal, size, eventUrl])

  const generateQR = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(eventUrl, {
        width: sizes[size],
        margin: 2,
        color: {
          dark: '#1a1a1a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
      setQrDataUrl(dataUrl)
    } catch (err) {
      console.error('Error generating QR code:', err)
    }
  }

  const handleDownload = () => {
    if (!qrDataUrl) return

    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `${eventName.replace(/\s+/g, '-').toLowerCase()}-qr-${size}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(eventUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setShowModal(true)}
        leftIcon={<QrCode className="h-4 w-4" />}
      >
        QR Code
      </Button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Event QR Code"
        size="md"
      >
        <div className="space-y-6">
          {/* Event info */}
          <div className="text-center">
            <p className="text-body-lg font-semibold text-[var(--foreground)]">
              {eventName}
            </p>
            <p className="text-body-sm text-[var(--foreground-muted)] font-mono">
              {eventCode}
            </p>
          </div>

          {/* QR Code display */}
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-2xl shadow-lg">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${eventName}`}
                  className="mx-auto"
                  style={{ width: sizes[size], height: sizes[size] }}
                />
              ) : (
                <div
                  className="flex items-center justify-center bg-gray-100 rounded-xl"
                  style={{ width: sizes[size], height: sizes[size] }}
                >
                  <QrCode className="h-12 w-12 text-gray-400 animate-pulse" />
                </div>
              )}
            </div>
          </div>

          {/* Size selector */}
          <div className="flex justify-center gap-2">
            {(['small', 'medium', 'large'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={cn(
                  'px-4 py-2 rounded-xl text-body-sm font-medium',
                  'transition-colors duration-200',
                  size === s
                    ? 'bg-[var(--wine)] text-white'
                    : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground-secondary)]'
                )}
              >
                {s === 'small' && <Smartphone className="h-4 w-4 inline mr-1" />}
                {s === 'medium' && <Monitor className="h-4 w-4 inline mr-1" />}
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* URL display */}
          <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]">
            <p className="text-body-xs text-[var(--foreground-muted)] mb-1">
              Event URL
            </p>
            <p className="text-body-sm font-mono text-[var(--foreground)] break-all">
              {eventUrl}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={handleCopyUrl}
              leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            >
              {copied ? 'Copied!' : 'Copy URL'}
            </Button>
            <Button
              fullWidth
              onClick={handleDownload}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Download
            </Button>
          </div>

          {/* Tips */}
          <div className="p-4 rounded-xl bg-[var(--wine-muted)] border border-[var(--wine)]/20">
            <p className="text-body-sm text-[var(--foreground)]">
              <strong>Tips:</strong>
            </p>
            <ul className="text-body-sm text-[var(--foreground-secondary)] mt-2 space-y-1">
              <li>• Print and display at your event for easy scanning</li>
              <li>• Use "Large" size for posters and signage</li>
              <li>• Use "Small" size for table cards</li>
            </ul>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default QRCodeGenerator
