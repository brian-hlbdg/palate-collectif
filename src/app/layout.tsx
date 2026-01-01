import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import { ThemeProvider, AuthProvider } from '@/components/providers'
import { ToastProvider } from '@/components/ui'
import '@/styles/globals.css'

// Font configuration - Manrope for clean, modern sans-serif
const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: {
    default: 'Palate Collectif | Wine Tasting Experience',
    template: '%s | Palate Collectif',
  },
  description:
    'Transform wine tasting events into memorable, data-rich experiences. Rate wines, discover favorites, and build your palate.',
  keywords: [
    'wine tasting',
    'wine events',
    'wine rating',
    'sommelier',
    'wine crawl',
    'wine app',
  ],
  authors: [{ name: 'Palate Collectif' }],
  creator: 'Palate Collectif',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://palatecollectif.com',
    siteName: 'Palate Collectif',
    title: 'Palate Collectif | Wine Tasting Experience',
    description:
      'Transform wine tasting events into memorable, data-rich experiences.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Palate Collectif',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Palate Collectif | Wine Tasting Experience',
    description:
      'Transform wine tasting events into memorable, data-rich experiences.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF9' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0A0A0A" />
      </head>
      <body
        className={`${manrope.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider defaultTheme="system">
          <AuthProvider>
            <ToastProvider>
              <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
                {children}
              </div>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
