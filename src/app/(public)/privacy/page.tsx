import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Permission Please',
  description: 'Privacy policy for Permission Please digital permission slip platform',
};

export default function PrivacyPolicyPage() {
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
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="mb-8 text-slate-500">Last updated: December 2024</p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">1. Introduction</h2>
              <p className="mb-4 text-slate-600">
                Permission Please (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed
                to protecting the privacy of students, parents, teachers, and school administrators
                who use our digital permission slip platform. This Privacy Policy explains how we
                collect, use, disclose, and safeguard your information.
              </p>
              <p className="text-slate-600">
                We understand the sensitive nature of student data and have designed our platform
                with privacy and security as core principles.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                2. Information We Collect
              </h2>

              <h3 className="mb-2 text-lg font-medium text-slate-800">
                2.1 Information Provided by Schools
              </h3>
              <ul className="mb-4 list-inside list-disc space-y-1 text-slate-600">
                <li>School name and contact information</li>
                <li>Teacher names and email addresses</li>
                <li>Student names and grade levels</li>
                <li>Parent/guardian names and email addresses</li>
              </ul>

              <h3 className="mb-2 text-lg font-medium text-slate-800">
                2.2 Information Collected During Use
              </h3>
              <ul className="mb-4 list-inside list-disc space-y-1 text-slate-600">
                <li>Electronic signatures (stored securely)</li>
                <li>Form responses and consent records</li>
                <li>IP addresses (partially masked for privacy)</li>
                <li>Timestamps of actions for audit purposes</li>
              </ul>

              <h3 className="mb-2 text-lg font-medium text-slate-800">2.3 Technical Information</h3>
              <ul className="list-inside list-disc space-y-1 text-slate-600">
                <li>Browser type and device information</li>
                <li>Usage patterns and access logs</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                3. How We Use Information
              </h2>
              <p className="mb-4 text-slate-600">We use collected information solely for:</p>
              <ul className="list-inside list-disc space-y-1 text-slate-600">
                <li>Providing and operating the permission slip service</li>
                <li>Sending permission requests and confirmations to parents</li>
                <li>Enabling teachers to track form completion status</li>
                <li>Maintaining audit trails for compliance purposes</li>
                <li>Improving and securing our platform</li>
                <li>Communicating service updates and important notices</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">4. What We Do NOT Do</h2>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <ul className="space-y-2 text-green-800">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-green-600">✓</span>
                    We do NOT sell student or parent data to third parties
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-green-600">✓</span>
                    We do NOT use student data for advertising or marketing
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-green-600">✓</span>
                    We do NOT build profiles on students for non-educational purposes
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-green-600">✓</span>
                    We do NOT share data with third parties except as needed to operate the service
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">5. Data Security</h2>
              <p className="mb-4 text-slate-600">
                We implement industry-standard security measures including:
              </p>
              <ul className="list-inside list-disc space-y-1 text-slate-600">
                <li>Encryption of data in transit (HTTPS/TLS)</li>
                <li>Secure password hashing (bcrypt)</li>
                <li>Role-based access controls</li>
                <li>Regular security audits</li>
                <li>IP address masking in logs</li>
                <li>Rate limiting to prevent abuse</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">6. Data Retention</h2>
              <p className="mb-4 text-slate-600">
                We retain permission records and signatures for a period determined by your
                school&apos;s requirements, typically aligned with state record retention
                guidelines. Schools can request deletion of their data at any time.
              </p>
              <p className="text-slate-600">
                Audit logs are retained for compliance purposes and are automatically anonymized
                after the retention period.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">7. Third-Party Services</h2>
              <p className="mb-4 text-slate-600">We use the following third-party services:</p>
              <ul className="list-inside list-disc space-y-1 text-slate-600">
                <li>
                  <strong>Email Delivery:</strong> Resend (for sending permission requests and
                  notifications)
                </li>
                <li>
                  <strong>Hosting:</strong> Cloud infrastructure providers with SOC 2 compliance
                </li>
                <li>
                  <strong>Database:</strong> PostgreSQL with encryption at rest
                </li>
              </ul>
              <p className="mt-4 text-slate-600">
                All third-party providers are bound by data processing agreements that protect your
                information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">8. COPPA Compliance</h2>
              <p className="mb-4 text-slate-600">
                Permission Please is designed for use by schools and requires parental consent for
                any collection of information related to children under 13. We:
              </p>
              <ul className="list-inside list-disc space-y-1 text-slate-600">
                <li>Collect only information necessary for the service</li>
                <li>Obtain verifiable parental consent through the electronic signature process</li>
                <li>
                  Allow parents to review and request deletion of their child&apos;s information
                </li>
                <li>Do not condition participation on providing more information than necessary</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">9. Your Rights</h2>
              <p className="mb-4 text-slate-600">You have the right to:</p>
              <ul className="list-inside list-disc space-y-1 text-slate-600">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your data (subject to legal retention requirements)</li>
                <li>Receive a copy of your data in a portable format</li>
                <li>Withdraw consent for optional data processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">
                10. Changes to This Policy
              </h2>
              <p className="text-slate-600">
                We may update this Privacy Policy from time to time. We will notify schools of any
                material changes via email and update the &quot;Last updated&quot; date at the top
                of this page.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">11. Contact Us</h2>
              <p className="mb-4 text-slate-600">
                If you have questions about this Privacy Policy or our data practices, please
                contact us:
              </p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-slate-700">
                  <strong>Permission Please</strong>
                  <br />
                  Email: privacy@permissionplease.app
                  <br />
                  For data deletion requests: privacy@permissionplease.app
                </p>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-700">
            View Terms of Service →
          </Link>
        </div>
      </main>
    </div>
  );
}
