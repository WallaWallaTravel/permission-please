import Link from 'next/link';
import { PrintDpaButton } from './PrintDpaButton';

export const metadata = {
  title: 'Data Processing Agreement | Permission Please',
  description:
    'Template data processing agreement for schools using Permission Please as a processor of student and parent records.',
};

export default function DataProcessingAgreementPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
        @page { margin: 0.75in; }
      `}</style>

      <header className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
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
          <PrintDpaButton />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="no-print rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            This is a <strong>template</strong> for a school that wants a data processing agreement
            on file. It is not legal advice and it is not a signed contract until both parties
            execute it. We will sign a completed copy with a school that asks.
          </p>
        </div>

        <article className="mt-6 rounded-xl border border-slate-200 bg-white p-8 md:p-12">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Data Processing Agreement</h1>
          <p className="mb-8 text-slate-500">Template version: September 2026</p>

          <div className="space-y-8 text-slate-600">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">1. Parties</h2>
              <p>
                This Data Processing Agreement (&quot;DPA&quot;) is between the school or
                organization named below (&quot;School&quot; or &quot;Controller&quot;) and
                Permission Please (&quot;Processor&quot;), operated at permissionplease.app.
              </p>
              <p className="mt-3">
                The School is the controller of student, parent, and staff personal data it uploads
                or causes to be processed. Permission Please processes that data only to provide the
                digital permission-slip service.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">
                2. Subject matter and duration
              </h2>
              <p>
                Processing is limited to creating, distributing, signing, storing, and exporting
                permission slips and related audit records for the School. Processing lasts for the
                term of the School&apos;s use of the Service and until deletion is completed under
                Section 7.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">
                3. Categories of data and people
              </h2>
              <p className="mb-3">Personal data typically includes:</p>
              <ul className="list-inside list-disc space-y-1">
                <li>Staff names, emails, roles, and school affiliation</li>
                <li>Student names and grade levels</li>
                <li>Parent or guardian names and emails</li>
                <li>Form content, field responses, electronic signatures, and timestamps</li>
                <li>Masked IP addresses on signatures and audit logs</li>
                <li>Documents the School attaches to a form</li>
              </ul>
              <p className="mt-3">
                Data subjects are school staff, students, and parents or guardians. The School
                decides what records to import. Permission Please does not require Social Security
                numbers, medical records, or payment card data for the core service.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">
                4. Processor obligations
              </h2>
              <ul className="list-inside list-disc space-y-1">
                <li>Process personal data only on documented instructions from the School</li>
                <li>Do not sell student or parent data or use it for advertising</li>
                <li>Limit staff access to people who operate or support the Service</li>
                <li>Keep data encrypted in transit (HTTPS/TLS)</li>
                <li>
                  Notify the School without undue delay if we become aware of a personal data breach
                </li>
                <li>Assist the School with reasonable access, correction, and deletion requests</li>
                <li>
                  Delete or return School data when the School asks, except where law requires
                  retention
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">5. School obligations</h2>
              <ul className="list-inside list-disc space-y-1">
                <li>Import only the student and parent data needed to run permission slips</li>
                <li>Have a lawful basis for providing that data to Permission Please</li>
                <li>
                  Decide retention for the School&apos;s records and request deletion when
                  appropriate
                </li>
                <li>
                  Keep staff accounts invite-only and promptly ask us to disable departed users
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">6. Subprocessors</h2>
              <p className="mb-3">
                The School authorizes Permission Please to use the following subprocessors to
                operate the Service:
              </p>
              <ul className="list-inside list-disc space-y-1">
                <li>Vercel — application hosting</li>
                <li>Supabase — PostgreSQL database and file storage</li>
                <li>Resend — transactional email</li>
                <li>Google — sign-in, when the School uses Google accounts</li>
                <li>Sentry — error monitoring, when configured</li>
              </ul>
              <p className="mt-3">
                We will notify the School of a material subprocessor change and give a reasonable
                chance to object before that change applies to the School&apos;s data. We do not
                claim that every subprocessor relationship is already under a signed DPA of its own.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">
                7. Retention and deletion
              </h2>
              <p>
                Permission records stay until the School asks us to delete them or the School
                account is closed. We do not currently run an automatic anonymization job. Deletion
                requests go to{' '}
                <Link
                  href="/privacy/delete"
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  /privacy/delete
                </Link>{' '}
                or privacy@permissionplease.app. We will confirm when School data has been removed
                from production systems, except backups that expire on their normal cycle and
                records we must keep by law.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">
                8. What this agreement is not
              </h2>
              <p>
                This DPA does not certify FERPA, COPPA, SOC 2, or any other compliance badge. The
                School remains responsible for its own student-privacy obligations. Permission
                Please does not market to children and does not claim to collect verifiable parental
                consent for the platform itself — parents sign slips the School sent.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">9. Contact</h2>
              <p>
                Privacy and deletion requests:{' '}
                <Link
                  href="/privacy/delete"
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  /privacy/delete
                </Link>{' '}
                or privacy@permissionplease.app
                <br />
                Related documents:{' '}
                <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-700">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-700">
                  Terms of Service
                </Link>
                .
              </p>
            </section>

            <section className="border-t border-slate-200 pt-8">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">10. Signatures</h2>
              <p className="mb-6 text-sm">
                By signing, each party agrees to this DPA for the School&apos;s use of Permission
                Please.
              </p>
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <p className="mb-4 font-semibold text-slate-900">School (Controller)</p>
                  <p className="mb-6">School name: ________________________________</p>
                  <p className="mb-6">Authorized name: _____________________________</p>
                  <p className="mb-6">Title: ______________________________________</p>
                  <p className="mb-6">Signature: __________________________________</p>
                  <p>Date: ______________________________________</p>
                </div>
                <div>
                  <p className="mb-4 font-semibold text-slate-900">Permission Please (Processor)</p>
                  <p className="mb-6">Authorized name: _____________________________</p>
                  <p className="mb-6">Title: ______________________________________</p>
                  <p className="mb-6">Signature: __________________________________</p>
                  <p>Date: ______________________________________</p>
                </div>
              </div>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
