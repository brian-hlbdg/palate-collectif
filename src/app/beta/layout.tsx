import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Beta Testing | Palate',
  description:
    'You\'ve been invited to test Palate — a wine tasting app for live events. Rate wines, explore tasting notes, and connect with tasting buddies.',
  openGraph: {
    title: 'Try Palate — Beta Testing',
    description:
      'You\'ve been invited to test Palate — a wine tasting app for live events. Rate wines, explore tasting notes, and connect with tasting buddies.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Palate — Beta Testing',
      },
    ],
  },
}

export default function BetaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
