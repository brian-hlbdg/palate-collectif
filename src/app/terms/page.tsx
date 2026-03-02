import React from 'react'
import Link from 'next/link'
import { Wine } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service | Palate Collectif',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)]">
        <div className="container-app py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Wine className="h-6 w-6 text-[var(--wine)]" />
            <span className="text-body-lg font-semibold text-[var(--foreground)]">
              Palate<span className="text-[var(--wine)]">.</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container-app py-12 max-w-3xl">
        <h1 className="text-heading-xl font-bold text-[var(--foreground)] mb-2">Terms of Service</h1>
        <p className="text-body-sm text-[var(--foreground-muted)] mb-10">Last updated: March 1, 2025</p>

        <div className="space-y-8 text-[var(--foreground-secondary)]">
          <section>
            <h2 className="text-heading-sm font-semibold text-[var(--foreground)] mb-3">1. Acceptance of Terms</h2>
            <p className="text-body-md leading-relaxed">
              By accessing or using Palate Collectif ("the Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-semibold text-[var(--foreground)] mb-3">2. Use of the Service</h2>
            <p className="text-body-md leading-relaxed mb-3">
              Palate Collectif provides a platform for wine tasting events, ratings, and community engagement. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body-md">
              <li>Use the Service only for lawful purposes</li>
              <li>Provide accurate information when creating an account</li>
              <li>Keep your account credentials secure</li>
              <li>Not share access to your account with others</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-sm font-semibold text-[var(--foreground)] mb-3">3. Account Registration</h2>
            <p className="text-body-md leading-relaxed">
              To access certain features you must register for an account. You are responsible for maintaining the
              confidentiality of your account information and for all activities that occur under your account.
              You must be of legal drinking age in your jurisdiction to use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-semibold text-[var(--foreground)] mb-3">4. User Content</h2>
            <p className="text-body-md leading-relaxed">
              You retain ownership of any content you submit to the Service, including wine ratings, tasting notes,
              and profile information. By submitting content, you grant Palate Collectif a non-exclusive, royalty-free
              license to use, display, and distribute that content in connection with the Service.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-semibold text-[var(--foreground)] mb-3">5. Prohibited Conduct</h2>
            <p className="text-body-md leading-relaxed mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-body-md">
              <li>Submit false, misleading, or fraudulent information</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use the Service to distribute spam or unsolicited communications</li>
              <li>Interfere with or disrupt the integrity of the Service</li>
              <li>Reverse engineer or attempt to extract source code from the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-sm font-semibold text-[var(--foreground)] mb-3">6. Intellectual Property</h2>
            <p className="text-body-md leading-relaxed">
              The Service and its original content, features, and functionality are owned by Palate Collectif and are
              protected by applicable intellectual property laws. You may not copy, modify, or distribute any part of
              the Service without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-semibold text-[var(--foreground)] mb-3">7. Disclaimer of Warranties</h2>
            <p className="text-body-md leading-relaxed">
              The Service is provided "as is" and "as available" without warranties of any kind, either express or
              implied. Palate Collectif does not warrant that the Service will be uninterrupted, error-free, or free
              of viruses or other harmful components.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-semibold text-[var(--foreground)] mb-3">8. Limitation of Liability</h2>
            <p className="text-body-md leading-relaxed">
              To the maximum extent permitted by law, Palate Collectif shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages arising from your use of or inability to use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-semibold text-[var(--foreground)] mb-3">9. Changes to Terms</h2>
            <p className="text-body-md leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of material changes via
              email or a prominent notice on the Service. Your continued use of the Service after changes constitutes
              acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-semibold text-[var(--foreground)] mb-3">10. Contact</h2>
            <p className="text-body-md leading-relaxed">
              If you have questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:hello@palatecollectif.com" className="text-[var(--wine)] hover:underline">
                hello@palatecollectif.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-[var(--border)] mt-12">
        <div className="container-app flex items-center justify-between">
          <span className="text-body-sm text-[var(--foreground-muted)]">© 2025 Palate Collectif</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-body-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-body-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
