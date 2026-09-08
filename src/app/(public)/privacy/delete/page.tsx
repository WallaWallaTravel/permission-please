import Link from 'next/link';
import { DeletionRequestForm } from '@/components/privacy/DeletionRequestForm';

export const metadata = {
  title: 'Request data deletion | Permission Please',
  description:
    'Ask Permission Please to review and delete parent, student, or school records. This form does not delete data automatically.',
};

export default function PrivacyDeletePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link
            href="/privacy"
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
            Back to Privacy Policy
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-slate-200 bg-white p-8 md:p-12">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Request data deletion</h1>
          <p className="mb-6 text-slate-600">
            Use this form to ask us to delete records. A person reviews every request. We do not
            wipe data from this form automatically, and some records may stay if the school or the
            law requires them.
          </p>
          <p className="mb-8 text-sm text-slate-500">
            You can also email{' '}
            <a href="mailto:privacy@permissionplease.app" className="font-medium text-blue-600">
              privacy@permissionplease.app
            </a>
            .
          </p>

          <DeletionRequestForm />
        </div>
      </main>
    </div>
  );
}
