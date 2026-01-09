'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button, Card } from '@/components/ui'
import { Modal } from '@/components/ui'
import { useToast } from '@/components/ui'
import {
  Camera,
  X,
  ScanLine,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

interface QRScannerProps {
  onScan: (code: string) => void
  isOpen: boolean
  onClose: () => void
}

export function QRScanner({ onScan, isOpen, onClose }: QRScannerProps) {
  const { addToast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)

  const [hasCamera, setHasCamera] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scannedCode, setScannedCode] = useState<string | null>(null)

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen])

  const startCamera = async () => {
    setError(null)
    setScannedCode(null)

    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false)
        setError('Camera not supported on this device')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsScanning(true)
        scanQRCode()
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      setHasCamera(false)
      
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera access and try again.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError('Failed to access camera. Please try again.')
      }
    }
  }

  const stopCamera = () => {
    setIsScanning(false)
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current || !isOpen) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanQRCode)
      return
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data for scanning
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // Use BarcodeDetector API if available (Chrome, Edge)
    if ('BarcodeDetector' in window) {
      try {
        // @ts-ignore - BarcodeDetector is not in TypeScript types yet
        const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] })
        const barcodes = await barcodeDetector.detect(canvas)

        if (barcodes.length > 0) {
          const code = extractEventCode(barcodes[0].rawValue)
          if (code) {
            handleSuccessfulScan(code)
            return
          }
        }
      } catch (err) {
        // BarcodeDetector failed, continue scanning
      }
    }

    // Continue scanning
    if (isOpen && !scannedCode) {
      animationRef.current = requestAnimationFrame(scanQRCode)
    }
  }

  const extractEventCode = (url: string): string | null => {
    // Try to extract event code from URL patterns:
    // /booth/CODE
    // /join?code=CODE
    // /event/CODE
    // Or just the code itself

    const boothMatch = url.match(/\/booth\/([A-Z0-9]+)/i)
    if (boothMatch) return boothMatch[1].toUpperCase()

    const joinMatch = url.match(/[?&]code=([A-Z0-9]+)/i)
    if (joinMatch) return joinMatch[1].toUpperCase()

    const eventMatch = url.match(/\/event\/([A-Z0-9]+)/i)
    if (eventMatch) return eventMatch[1].toUpperCase()

    // Check if it's just a code (4-8 alphanumeric characters)
    const codeOnly = url.match(/^[A-Z0-9]{4,8}$/i)
    if (codeOnly) return url.toUpperCase()

    return null
  }

  const handleSuccessfulScan = (code: string) => {
    setScannedCode(code)
    setIsScanning(false)
    stopCamera()

    // Vibrate on mobile if supported
    if (navigator.vibrate) {
      navigator.vibrate(100)
    }

    // Small delay to show success state
    setTimeout(() => {
      onScan(code)
      onClose()
    }, 500)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scan QR Code"
      size="md"
    >
      <div className="space-y-4">
        {/* Scanner area */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-black">
          {/* Video feed */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />
          
          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanning overlay */}
          {isScanning && !scannedCode && (
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Scan frame */}
              <div className="relative w-64 h-64">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                
                {/* Scanning line animation */}
                <motion.div
                  className="absolute left-0 right-0 h-0.5 bg-[var(--wine)]"
                  animate={{
                    top: ['0%', '100%', '0%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              </div>

              {/* Semi-transparent overlay outside scan area */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-black/50" style={{
                  clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, calc(50% - 128px) calc(50% - 128px), calc(50% - 128px) calc(50% + 128px), calc(50% + 128px) calc(50% + 128px), calc(50% + 128px) calc(50% - 128px), calc(50% - 128px) calc(50% - 128px))'
                }} />
              </div>
            </div>
          )}

          {/* Success state */}
          {scannedCode && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-10 w-10 text-white" />
                </div>
                <p className="text-body-lg font-semibold text-white">
                  Code Found!
                </p>
                <p className="text-display-sm font-mono font-bold text-white mt-2">
                  {scannedCode}
                </p>
              </motion.div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--background)]">
              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-10 w-10 text-error" />
                </div>
                <p className="text-body-md text-[var(--foreground-secondary)]">
                  {error}
                </p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={startCamera}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        {isScanning && !scannedCode && (
          <p className="text-body-sm text-[var(--foreground-secondary)] text-center">
            Point your camera at a Palate event QR code
          </p>
        )}

        {/* Manual entry option */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="text-body-sm text-[var(--wine)] hover:underline"
          >
            Enter code manually instead
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default QRScanner
