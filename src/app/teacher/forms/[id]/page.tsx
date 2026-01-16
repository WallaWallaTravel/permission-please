'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { DistributeButton } from '@/components/forms/DistributeButton';
import { ShareFormButton } from '@/components/forms/ShareFormButton';

interface FormData {
  form: {
    id: string;
    title: string;
    description: string;
    eventDate: string;
    eventType: string;
    deadline: string;
    status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
    createdAt: string;
    teacherId: string;
    teacher: {
      id: string;
      name: string;
      email: string;
    };
    // Review workflow fields
    requiresReview: boolean;
    reviewStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REVISION_NEEDED' | null;
    reviewNeededBy: string | null;
    isExpedited: boolean;
    reviewedAt: string | null;
    reviewComments: string | null;
    reviewer: { id: string; name: string } | null;
    fields: Array<{
      id: string;
      fieldType: string;
      label: string;
      required: boolean;
      order: number;
    }>;
    documents: Array<{
      id: string;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      mimeType: string;
      description: string | null;
      source: string;
      requiresAck: boolean;
    }>;
    submissions: Array<{
      id: string;
      status: 'PENDING' | 'SIGNED' | 'DECLINED';
      signedAt: string | null;
      parent: {
        id: string;
        name: string;
        email: string;
      };
      student: {
        id: string;
        name: string;
        grade: string;
      };
    }>;
  };
}

export default function FormDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [submittingForReview, setSubmittingForReview] = useState(false);

  useEffect(() => {
    async function loadForm() {
      try {
        const res = await fetch(`/api/forms/${id}`);
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to load form');
        }
        const formData = await res.json();
        setData(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load form');
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [id, router]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/forms/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete form');
      router.push('/teacher/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: 'ACTIVE' | 'CLOSED') => {
    // Confirmation dialogs
    if (newStatus === 'CLOSED') {
      if (
        !confirm(
          'Are you sure you want to close this form? Parents will no longer be able to sign it.'
        )
      ) {
        return;
      }
    }
    if (newStatus === 'ACTIVE' && data?.form.status === 'CLOSED') {
      if (!confirm('Reopen this form? Parents will be able to sign it again.')) {
        return;
      }
    }

    try {
      const res = await fetch(`/api/forms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      // Reload form data
      const formData = await res.json();
      setData({ form: formData.form });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleSubmitForReview = async () => {
    if (!data?.form.requiresReview) return;

    setSubmittingForReview(true);
    setError('');

    try {
      const res = await fetch(`/api/forms/${id}/submit-for-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewNeededBy: data.form.reviewNeededBy,
          isExpedited: data.form.isExpedited,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit for review');
      }

      // Reload form data
      const formRes = await fetch(`/api/forms/${id}`);
      const formData = await formRes.json();
      setData(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit for review');
    } finally {
      setSubmittingForReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50">
        <div className="flex animate-pulse flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mb-4 text-5xl">😕</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Form Not Found</h1>
          <p className="mb-6 text-gray-600">{error}</p>
          <Link href="/teacher/dashboard" className="text-emerald-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { form } = data;
  const isOwner = session?.user?.id === form.teacherId;
  const eventDate = new Date(form.eventDate);
  const deadline = new Date(form.deadline);
  const signedCount = form.submissions.filter((s) => s.status === 'SIGNED').length;
  const pendingCount = form.submissions.filter((s) => s.status === 'PENDING').length;
  const totalSubmissions = form.submissions.length;

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-emerald-100 text-emerald-800',
    CLOSED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/teacher/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Dashboard
            </Link>
          </div>
          <h1 className="font-bold text-gray-900">Permission Please 📝</h1>
          <div className="flex items-center gap-3">
            <ShareFormButton formId={form.id} isOwner={isOwner} />
            {form.status === 'DRAFT' && isOwner && (
              <button
                onClick={() => handleStatusChange('ACTIVE')}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                Activate Form
              </button>
            )}
            {form.status === 'ACTIVE' && (
              <>
                <DistributeButton formId={form.id} />
                {isOwner && (
                  <button
                    onClick={() => handleStatusChange('CLOSED')}
                    className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
                  >
                    Close Form
                  </button>
                )}
              </>
            )}
            {form.status === 'CLOSED' && isOwner && eventDate > new Date() && (
              <button
                onClick={() => handleStatusChange('ACTIVE')}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                Reopen Form
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Form Header Card */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-8 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  {isOwner ? (
                    <button
                      onClick={() => {
                        if (form.status === 'DRAFT') handleStatusChange('ACTIVE');
                        else if (form.status === 'ACTIVE') handleStatusChange('CLOSED');
                        else if (form.status === 'CLOSED' && eventDate > new Date())
                          handleStatusChange('ACTIVE');
                      }}
                      disabled={form.status === 'CLOSED' && eventDate <= new Date()}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition-opacity ${statusColors[form.status]} ${
                        form.status === 'CLOSED' && eventDate <= new Date()
                          ? 'cursor-not-allowed opacity-75'
                          : 'cursor-pointer hover:opacity-80'
                      }`}
                      title={
                        form.status === 'DRAFT'
                          ? 'Click to activate'
                          : form.status === 'ACTIVE'
                            ? 'Click to close'
                            : eventDate > new Date()
                              ? 'Click to reopen'
                              : 'Cannot reopen - event has passed'
                      }
                    >
                      {form.status}
                    </button>
                  ) : (
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[form.status]}`}
                    >
                      {form.status}
                    </span>
                  )}
                  <span className="text-sm text-emerald-100">
                    {form.eventType.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-3xl font-bold">{form.title}</h2>
                <p className="mt-2 text-emerald-100">
                  Created {new Date(form.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Stats Row */}
            <div className="mb-6 grid grid-cols-4 gap-4">
              <div className="group relative rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-3xl font-bold text-gray-900">{totalSubmissions}</p>
                <p className="text-sm text-gray-500">Total Sent</p>
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg group-hover:block">
                  Total number of students this form was sent to
                </div>
              </div>
              <div className="group relative rounded-lg bg-emerald-50 p-4 text-center">
                <p className="text-3xl font-bold text-emerald-600">{signedCount}</p>
                <p className="text-sm text-gray-500">Signed</p>
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg group-hover:block">
                  Parents who have signed the permission form
                </div>
              </div>
              <div className="group relative rounded-lg bg-amber-50 p-4 text-center">
                <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
                <p className="text-sm text-gray-500">Awaiting Signature</p>
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg group-hover:block">
                  Parents who received the form but haven&apos;t signed yet
                </div>
              </div>
              <div className="group relative rounded-lg bg-blue-50 p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {totalSubmissions > 0 ? Math.round((signedCount / totalSubmissions) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-500">Completion</p>
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg group-hover:block">
                  Percentage of forms that have been signed
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="mb-1 text-sm text-gray-500">📅 Event Date</p>
                <p className="font-semibold text-gray-900">
                  {eventDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="mb-1 text-sm text-gray-500">⏰ Signature Deadline</p>
                <p className="font-semibold text-gray-900">
                  {deadline.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="mb-2 font-semibold text-gray-900">Description</h3>
              <p className="whitespace-pre-wrap text-gray-700">{form.description}</p>
            </div>

            {/* Review Status (only show if form requires review) */}
            {form.requiresReview && (
              <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Review Status</h3>
                    <p className="text-sm text-gray-600">
                      This form requires approval before distribution
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {form.isExpedited && (
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800">
                        Expedited
                      </span>
                    )}
                    {!form.reviewStatus && (
                      <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700">
                        Not Submitted
                      </span>
                    )}
                    {form.reviewStatus === 'PENDING_REVIEW' && (
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                        Pending Review
                      </span>
                    )}
                    {form.reviewStatus === 'APPROVED' && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                        Approved
                      </span>
                    )}
                    {form.reviewStatus === 'REVISION_NEEDED' && (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                        Revision Needed
                      </span>
                    )}
                  </div>
                </div>

                {/* Reviewer comments (if revision needed) */}
                {form.reviewStatus === 'REVISION_NEEDED' && form.reviewComments && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex gap-3">
                      <svg
                        className="h-5 w-5 flex-shrink-0 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="font-medium text-red-800">Reviewer Feedback</p>
                        <p className="mt-1 text-sm text-red-700">{form.reviewComments}</p>
                        {form.reviewer && (
                          <p className="mt-2 text-xs text-red-600">
                            From: {form.reviewer.name} •{' '}
                            {form.reviewedAt && new Date(form.reviewedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Approval info */}
                {form.reviewStatus === 'APPROVED' && form.reviewer && (
                  <div className="mt-4 text-sm text-gray-600">
                    Approved by {form.reviewer.name} on{' '}
                    {form.reviewedAt && new Date(form.reviewedAt).toLocaleDateString()}
                  </div>
                )}

                {/* Submit for Review button (only for drafts that haven't been submitted) */}
                {form.status === 'DRAFT' && !form.reviewStatus && isOwner && (
                  <div className="mt-4">
                    <button
                      onClick={handleSubmitForReview}
                      disabled={submittingForReview}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submittingForReview ? 'Submitting...' : 'Submit for Review'}
                    </button>
                  </div>
                )}

                {/* Resubmit after revision */}
                {form.status === 'DRAFT' && form.reviewStatus === 'REVISION_NEEDED' && isOwner && (
                  <div className="mt-4">
                    <button
                      onClick={handleSubmitForReview}
                      disabled={submittingForReview}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submittingForReview ? 'Resubmitting...' : 'Resubmit for Review'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Custom Fields */}
            {form.fields.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-2 font-semibold text-gray-900">Custom Fields</h3>
                <div className="space-y-2">
                  {form.fields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600"
                    >
                      <span className="font-medium">{field.label}</span>
                      <span className="text-gray-400">•</span>
                      <span className="capitalize">{field.fieldType}</span>
                      {field.required && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-red-500">Required</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attached Documents */}
            {form.documents && form.documents.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-2 font-semibold text-gray-900">Attached Documents</h3>
                <div className="space-y-3">
                  {form.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="rounded-lg bg-red-100 p-2">
                        <svg
                          className="h-6 w-6 text-red-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{doc.fileName}</p>
                        {doc.description && (
                          <p className="text-sm text-gray-600">{doc.description}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {(doc.fileSize / 1024).toFixed(1)} KB •{' '}
                          {doc.source === 'external'
                            ? 'External Venue'
                            : doc.source === 'school'
                              ? 'School Document'
                              : 'District Policy'}
                          {doc.requiresAck && ' • Requires acknowledgment'}
                        </p>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submissions Table */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="font-semibold text-gray-900">Signature Status</h3>
          </div>

          {form.submissions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4 text-5xl">📨</div>
              <h4 className="mb-2 text-xl font-semibold text-gray-900">No Recipients Yet</h4>
              <p className="mb-4 text-gray-600">
                This form hasn&apos;t been sent to any parents yet.
              </p>
              {form.status === 'ACTIVE' && <DistributeButton formId={form.id} />}
              {form.status === 'DRAFT' && (
                <button
                  onClick={() => handleStatusChange('ACTIVE')}
                  className="rounded-lg bg-emerald-600 px-6 py-2 font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  Activate & Send
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Parent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Signed At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {form.submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">{submission.student.name}</p>
                          <p className="text-sm text-gray-500">Grade {submission.student.grade}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900">{submission.parent.name}</p>
                          <p className="text-sm text-gray-500">{submission.parent.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                            submission.status === 'SIGNED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : submission.status === 'DECLINED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                          title={
                            submission.status === 'SIGNED'
                              ? 'Parent has signed the permission form'
                              : submission.status === 'DECLINED'
                                ? 'Parent declined to sign'
                                : 'Waiting for parent to sign'
                          }
                        >
                          {submission.status === 'SIGNED' && '✓ Signed'}
                          {submission.status === 'DECLINED' && '✗ Declined'}
                          {submission.status === 'PENDING' && '⏳ Awaiting Signature'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                        {submission.signedAt ? new Date(submission.signedAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {submission.status === 'SIGNED' ? (
                          <a
                            href={`/api/submissions/${submission.id}/pdf`}
                            download
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                            title="Download PDF"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            PDF
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isOwner && (
              <Link
                href={`/teacher/forms/${form.id}/edit`}
                className="font-medium text-gray-600 hover:text-gray-900"
              >
                ✏️ Edit Form
              </Link>
            )}
            <Link
              href={`/teacher/forms/${form.id}/print`}
              className="font-medium text-gray-600 hover:text-gray-900"
            >
              🖨️ Print Form
            </Link>
          </div>
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : '🗑️ Delete Form'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
