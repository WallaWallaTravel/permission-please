'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface ReviewForm {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  eventType: string;
  deadline: string;
  status: string;
  createdAt: string;
  reviewStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REVISION_NEEDED' | null;
  reviewNeededBy: string | null;
  isExpedited: boolean;
  reviewedAt: string | null;
  reviewComments: string | null;
  daysRemaining: number | null;
  isOverdue: boolean;
  teacher: {
    id: string;
    name: string;
    email: string;
  };
  reviewer: { id: string; name: string } | null;
  fieldsCount: number;
  documentsCount: number;
}

interface ReviewFormsResponse {
  forms: ReviewForm[];
  total: number;
  pending: number;
  expedited: number;
}

export default function ReviewerDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [data, setData] = useState<ReviewFormsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'revision' | 'all'>(
    'pending'
  );

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/login');
      return;
    }

    if (session.user.role !== 'REVIEWER') {
      router.push('/');
      return;
    }

    loadForms();
  }, [session, status, router, statusFilter]);

  async function loadForms() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviewer/forms?status=${statusFilter}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (res.status === 403) {
          router.push('/');
          return;
        }
        throw new Error('Failed to load forms');
      }
      const responseData = await res.json();
      setData(responseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load forms');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex animate-pulse flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-gray-600">Loading forms...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mb-4 text-5xl">😕</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Error Loading Forms</h1>
          <p className="mb-6 text-gray-600">{error}</p>
          <button onClick={() => loadForms()} className="text-blue-600 hover:underline">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Reviewer Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session?.user?.name}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Pending Review</p>
            <p className="text-3xl font-bold text-blue-600">{data?.pending || 0}</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Expedited</p>
            <p className="text-3xl font-bold text-orange-600">{data?.expedited || 0}</p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total Forms</p>
            <p className="text-3xl font-bold text-gray-900">{data?.total || 0}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              statusFilter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              statusFilter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatusFilter('revision')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              statusFilter === 'revision'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Revision Needed
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              statusFilter === 'all'
                ? 'bg-gray-700 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
          </button>
        </div>

        {/* Forms List */}
        <div className="space-y-4">
          {data?.forms.length === 0 ? (
            <div className="rounded-xl bg-white p-12 text-center shadow-sm">
              <div className="mb-4 text-5xl">✅</div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900">No Forms to Review</h2>
              <p className="text-gray-600">
                All caught up! There are no forms pending your review.
              </p>
            </div>
          ) : (
            data?.forms.map((form) => (
              <div
                key={form.id}
                className={`overflow-hidden rounded-xl bg-white shadow-sm ${
                  form.isExpedited ? 'border-2 border-orange-400' : ''
                }`}
              >
                <div className="flex items-center justify-between p-6">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      {form.isExpedited && (
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
                          EXPEDITED
                        </span>
                      )}
                      {form.isOverdue && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                          OVERDUE
                        </span>
                      )}
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          form.reviewStatus === 'PENDING_REVIEW'
                            ? 'bg-blue-100 text-blue-800'
                            : form.reviewStatus === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : form.reviewStatus === 'REVISION_NEEDED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {form.reviewStatus?.replace('_', ' ') || 'UNKNOWN'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{form.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      By {form.teacher.name} • Event:{' '}
                      {new Date(form.eventDate).toLocaleDateString()}
                    </p>
                    {form.reviewNeededBy && (
                      <p className="mt-1 text-sm text-gray-500">
                        Review needed by: {new Date(form.reviewNeededBy).toLocaleDateString()}
                        {form.daysRemaining !== null && (
                          <span
                            className={`ml-2 ${form.daysRemaining < 0 ? 'text-red-600' : form.daysRemaining <= 2 ? 'text-orange-600' : 'text-gray-600'}`}
                          >
                            (
                            {form.daysRemaining < 0
                              ? `${Math.abs(form.daysRemaining)} days overdue`
                              : `${form.daysRemaining} days remaining`}
                            )
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <Link
                      href={`/reviewer/forms/${form.id}`}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      Review Form
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
