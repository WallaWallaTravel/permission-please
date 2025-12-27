import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | Permission Please',
  description: 'Terms of service for Permission Please digital permission slip platform',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 transition hover:text-slate-900"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-slate-200 bg-white p-8 md:p-12">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Terms of Service</h1>
          <p className="mb-8 text-slate-500">Last updated: December 2024</p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">1. Acceptance of Terms</h2>
              <p className="text-slate-600">
                By accessing or using Permission Please (&quot;the Service&quot;), you agree to be
                bound by these Terms of Service. If you are using the Service on behalf of a school
                or organization, you represent that you have the authority to bind that entity to
                these terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                2. Description of Service
              </h2>
              <p className="text-slate-600">
                Permission Please provides a digital platform for schools to create, distribute, and
                collect electronic permission slips and consent forms. The Service includes form
                creation tools, electronic signature capture, email notifications, and
                administrative dashboards.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">3. User Accounts</h2>
              <ul className="list-inside list-disc space-y-2 text-slate-600">
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the confidentiality of your password</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>You may not share your account credentials with others</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">4. Acceptable Use</h2>
              <p className="mb-4 text-slate-600">You agree NOT to:</p>
              <ul className="list-inside list-disc space-y-1 text-slate-600">
                <li>Use the Service for any unlawful purpose</li>
                <li>Upload malicious content or attempt to compromise the system</li>
                <li>Collect data from other users without authorization</li>
                <li>Impersonate another person or entity</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use the Service to send spam or unsolicited communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                5. Electronic Signatures
              </h2>
              <p className="mb-4 text-slate-600">
                By using the electronic signature feature, you acknowledge and agree that:
              </p>
              <ul className="list-inside list-disc space-y-1 text-slate-600">
                <li>Electronic signatures created through our Service are legally binding</li>
                <li>You consent to conducting transactions electronically</li>
                <li>The electronic signature represents your intent to sign</li>
                <li>You have reviewed the document before signing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                6. School Responsibilities
              </h2>
              <p className="mb-4 text-slate-600">Schools using the Service agree to:</p>
              <ul className="list-inside list-disc space-y-1 text-slate-600">
                <li>Ensure appropriate consent is obtained before uploading student/parent data</li>
                <li>Use the Service only for legitimate educational purposes</li>
                <li>Maintain accurate records and update information as needed</li>
                <li>Comply with all applicable laws regarding student data privacy</li>
                <li>Train staff on proper use of the platform</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">7. Data Ownership</h2>
              <p className="text-slate-600">
                You retain ownership of all data you submit to the Service. We do not claim
                ownership of your permission forms, student information, or signature data. We only
                use your data to provide and improve the Service as described in our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">8. Service Availability</h2>
              <p className="text-slate-600">
                We strive to maintain high availability but do not guarantee uninterrupted access.
                We may temporarily suspend the Service for maintenance, updates, or circumstances
                beyond our control. We will provide reasonable notice when possible.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">9. Fees and Payment</h2>
              <p className="mb-4 text-slate-600">
                Subscription fees are billed annually unless otherwise agreed. All fees are
                non-refundable except as required by law. We reserve the right to modify pricing
                with 30 days notice before your renewal date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">10. Termination</h2>
              <p className="mb-4 text-slate-600">
                Either party may terminate this agreement with 30 days written notice. Upon
                termination:
              </p>
              <ul className="list-inside list-disc space-y-1 text-slate-600">
                <li>You may request an export of your data within 30 days</li>
                <li>We will delete your data according to our retention policy</li>
                <li>Any outstanding fees remain due</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                11. Limitation of Liability
              </h2>
              <p className="text-slate-600">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, PERMISSION PLEASE SHALL NOT BE LIABLE FOR
                ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM
                YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE FEES PAID BY YOU
                IN THE TWELVE MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">12. Indemnification</h2>
              <p className="text-slate-600">
                You agree to indemnify and hold harmless Permission Please from any claims, damages,
                or expenses arising from your use of the Service, your violation of these terms, or
                your violation of any third-party rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">13. Changes to Terms</h2>
              <p className="text-slate-600">
                We may modify these Terms at any time. Material changes will be communicated via
                email at least 30 days before taking effect. Continued use of the Service after
                changes constitutes acceptance of the modified terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">14. Governing Law</h2>
              <p className="text-slate-600">
                These Terms shall be governed by the laws of the State of Delaware, without regard
                to conflict of law principles. Any disputes shall be resolved in the courts of
                Delaware.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">15. Contact</h2>
              <p className="text-slate-600">
                Questions about these Terms should be directed to: legal@permissionplease.app
              </p>
            </section>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-700">
            View Privacy Policy →
          </Link>
        </div>
      </main>
    </div>
  );
}
