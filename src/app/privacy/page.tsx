import React from 'react'
import Link from 'next/link'
import { Wine } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | Palate Collectif',
}

export default function PrivacyPage() {
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
        <h1 className="text-heading-xl font-bold text-[var(--foreground)] mb-2">Privacy Policy</h1>
        <p className="text-body-sm text-[var(--foreground-muted)] mb-10">Last updated: March 1, 2025</p>

        <div className="space-y-8 text-[var(--foreground-secondary)]">
          <section>
            <h2 className="text-heading-sm font-semibold text-[var(--foreground)] mb-3">1. Information We Collect</h2>
            <p className="text-body-md leading-relaxed mb-3">
              We collect information you provide directly to us and information generated through your use of the Service:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body-md">
              <li><strong>Account information:</strong> name, email address, and password</li>
              <li><strong>Profile information:</strong> wine preferences and tasting history</li>
              <li><strong>Event data:</strong> wines rated, scores, and tasting notes</li>
              <li><strong>Usage data:</strong> pages visited, features used, and interaction patterns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-sm font-semibold text-[var(--foreground)] mb-3">2. How We Use Your Information</h2>
            <p className="text-body-md leading-relaxed mb-3">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 text-body-md">
              <li>Provide, maintain, and improve the Service</li>
              <li>Personalize your experience and wine recommendations</li>
              <li>Send transactional emails (account confirmations, event invites)</li>
              <li>Respond to your comments, questions, and support requests</li>
              <li>Monitor and analyze usage trends to improve the Service</li>
              <li>Detect and prevent fraudulent or abusive activity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-sm font-semibold text-[var(--foreground)] mb-3">3. Information Sharing</h2>
            <p className="text-body-md leading-relaxed mb-3">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body-md">
              <li><strong>Event organizers:</strong> your tasting results within events you participate in</li>
              <li><strong>Service providers:</strong> third-party vendors who assist in operating the Service (e.g., hosting, email delivery)</li>
              <li><strong>Legal requirements:</strong> when required by law or to protect our rights</li>
              <li><strong>Business transfers:</strong> in connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-sm font-semibold text-[var(--foreground)] mb-3">4. Data Storage and Security</h2>
            <p className="text-body-md leading-relaxed">
              Your data is stored securely using industry-standard encryption. We use Supabase for database hosting,
              which implements robust security measures. However, no method of transmission over the internet is 100%
              secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-semibold text-[var(--foreground)] mb-3">5. Cookies and Tracking</h2>
            <p className="text-body-md leading-relaxed">
              We use cookies and similar tracking technologies to maintain your session and remember your preferences.
              You can control cookies through your browser settings. Disabling cookies may affect certain features of
              the Service.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-semibold text-[var(--foreground)] mb-3">6. Your Rights</h2>
            <p className="text-body-md leading-relaxed mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-body-md">
              <li><strong>Access:</strong> request a copy of the personal data we hold about you</li>
              <li><strong>Correction:</strong> update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> request deletion of your account and associated data</li>
              <li><strong>Portability:</strong> receive your data in a structured, machine-readable format</li>
              <li><strong>Opt-out:</strong> unsubscribe from marketing communications at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-heading-sm font-semibold text-[var(--foreground)] mb-3">7. Data Retention</h2>
            <p className="text-body-md leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide the
              Service. If you delete your account, we will delete or anonymize your data within 30 days, except where
              retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-semibold text-[var(--foreground)] mb-3">8. Children's Privacy</h2>
            <p className="text-body-md leading-relaxed">
              The Service is not directed to individuals under the legal drinking age in their jurisdiction, and we do
              not knowingly collect personal information from minors. If we become aware that a minor has provided us
              with personal information, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-semibold text-[var(--foreground)] mb-3">9. Changes to This Policy</h2>
            <p className="text-body-md leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by email
              or by displaying a notice on the Service. Your continued use of the Service after changes take effect
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-heading-sm font-semibold text-[var(--foreground)] mb-3">10. Contact Us</h2>
            <p className="text-body-md leading-relaxed">
              If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at{' '}
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
