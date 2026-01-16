'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

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
  };
}

interface ReviewLog {
  id: string;
  action: string;
  comments: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    email: string;
  };
}

export default function ReviewerFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [data, setData] = useState<FormData | null>(null);
  const [reviewLogs, setReviewLogs] = useState<ReviewLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review action states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [actionComments, setActionComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

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

    loadForm();
    loadReviewLogs();
  }, [session, status, router, id]);

  async function loadForm() {
    setLoading(true);
    try {
      const res = await fetch(`/api/forms/${id}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (res.status === 403) {
          router.push('/reviewer/dashboard');
          return;
        }
        throw new Error('Failed to load form');
      }
      const formData = await res.json();
      setData(formData);
      // Initialize edit fields
      setEditTitle(formData.form.title);
      setEditDescription(formData.form.description);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load form');
    } finally {
      setLoading(false);
    }
  }

  async function loadReviewLogs() {
    try {
      const res = await fetch(`/api/forms/${id}/review-log`);
      if (res.ok) {
        const data = await res.json();
        setReviewLogs(data.logs || []);
      }
    } catch {
      // Non-critical, don't show error
    }
  }

  async function handleApprove() {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/forms/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: actionComments || undefined }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to approve form');
      }

      // Reload data
      await loadForm();
      await loadReviewLogs();
      setShowApproveModal(false);
      setActionComments('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestRevision() {
    if (!actionComments.trim()) {
      setError('Please provide comments explaining what changes are needed');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/forms/${id}/request-revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: actionComments }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to request revision');
      }

      // Reload data
      await loadForm();
      await loadReviewLogs();
      setShowRevisionModal(false);
      setActionComments('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request revision');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveEdits() {
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/forms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save changes');
      }

      // Log the edit action
      await fetch(`/api/forms/${id}/review-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EDITED' }),
      }).catch(() => {}); // Non-critical

      // Reload data
      await loadForm();
      await loadReviewLogs();
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditTitle(data?.form.title || '');
    setEditDescription(data?.form.description || '');
    setIsEditing(false);
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex animate-pulse flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mb-4 text-5xl">Error</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Form Not Found</h1>
          <p className="mb-6 text-gray-600">{error}</p>
          <Link href="/reviewer/dashboard" className="text-blue-600 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { form } = data;
  const eventDate = new Date(form.eventDate);
  const deadline = new Date(form.deadline);
  const canTakeAction = form.reviewStatus === 'PENDING_REVIEW';

  const reviewStatusColors = {
    PENDING_REVIEW: 'bg-blue-100 text-blue-800',
    APPROVED: 'bg-green-100 text-green-800',
    REVISION_NEEDED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/reviewer/dashboard"
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
          <h1 className="font-bold text-gray-900">Form Review</h1>
          <div className="flex items-center gap-3">
            {canTakeAction && (
              <>
                <button
                  onClick={() => setShowRevisionModal(true)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Request Revision
                </button>
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                >
                  Approve Form
                </button>
              </>
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Form Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Form Header Card */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {form.isExpedited && (
                        <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-medium text-white">
                          EXPEDITED
                        </span>
                      )}
                      {form.reviewStatus && (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${reviewStatusColors[form.reviewStatus]}`}
                        >
                          {form.reviewStatus.replace('_', ' ')}
                        </span>
                      )}
                      <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                        {form.eventType.replace('_', ' ')}
                      </span>
                    </div>

                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-lg border-2 border-white/30 bg-white/10 px-3 py-2 text-2xl font-bold text-white placeholder-white/50 focus:border-white focus:outline-none"
                        placeholder="Form Title"
                      />
                    ) : (
                      <h2 className="text-2xl font-bold">{form.title}</h2>
                    )}

                    <p className="mt-2 text-blue-100">
                      By {form.teacher.name} ({form.teacher.email})
                    </p>
                  </div>
                  {canTakeAction && !isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="rounded-lg bg-white/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/30"
                    >
                      Edit Form
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {/* Dates */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="mb-1 text-sm text-gray-500">Event Date</p>
                    <p className="font-semibold text-gray-900">
                      {eventDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="mb-1 text-sm text-gray-500">Signature Deadline</p>
                    <p className="font-semibold text-gray-900">
                      {deadline.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Review Needed By */}
                {form.reviewNeededBy && (
                  <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <p className="text-sm font-medium text-orange-800">
                      Review needed by:{' '}
                      {new Date(form.reviewNeededBy).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {/* Description */}
                <div className="mb-6">
                  <h3 className="mb-2 font-semibold text-gray-900">Description</h3>
                  {isEditing ? (
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={6}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      placeholder="Form description..."
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-gray-700">{form.description}</p>
                  )}
                </div>

                {/* Edit Actions */}
                {isEditing && (
                  <div className="mb-6 flex items-center gap-3">
                    <button
                      onClick={handleSaveEdits}
                      disabled={saving}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-300"
                    >
                      Cancel
                    </button>
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
                          <span className="text-gray-400">-</span>
                          <span className="capitalize">{field.fieldType}</span>
                          {field.required && (
                            <>
                              <span className="text-gray-400">-</span>
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
                  <div>
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
                              {(doc.fileSize / 1024).toFixed(1)} KB -{' '}
                              {doc.source === 'external'
                                ? 'External Venue'
                                : doc.source === 'school'
                                  ? 'School Document'
                                  : 'District Policy'}
                              {doc.requiresAck && ' - Requires acknowledgment'}
                            </p>
                          </div>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Review Log */}
          <div className="space-y-6">
            {/* Quick Actions */}
            {canTakeAction && (
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h3 className="mb-4 font-semibold text-gray-900">Review Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 font-medium text-white transition hover:bg-green-700"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Approve Form
                  </button>
                  <button
                    onClick={() => setShowRevisionModal(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-700"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    Request Revision
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    disabled={isEditing}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-300 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit Form Content
                  </button>
                </div>
              </div>
            )}

            {/* Already Reviewed Message */}
            {!canTakeAction && form.reviewStatus && (
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <div className="text-center">
                  {form.reviewStatus === 'APPROVED' && (
                    <>
                      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <svg
                          className="h-6 w-6 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-900">Form Approved</h3>
                      {form.reviewer && (
                        <p className="mt-1 text-sm text-gray-600">
                          By {form.reviewer.name}
                          {form.reviewedAt && (
                            <> on {new Date(form.reviewedAt).toLocaleDateString()}</>
                          )}
                        </p>
                      )}
                    </>
                  )}
                  {form.reviewStatus === 'REVISION_NEEDED' && (
                    <>
                      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
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
                            d="M12 9v2m0 4h.01"
                          />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-gray-900">Revision Requested</h3>
                      <p className="mt-2 text-sm text-gray-600">
                        Waiting for teacher to address feedback
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Review Log */}
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <h3 className="mb-4 font-semibold text-gray-900">Review History</h3>
              {reviewLogs.length === 0 ? (
                <p className="text-sm text-gray-500">No review actions yet</p>
              ) : (
                <div className="space-y-4">
                  {reviewLogs.map((log) => (
                    <div key={log.id} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            log.action === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : log.action === 'REVISION_NEEDED'
                                ? 'bg-red-100 text-red-800'
                                : log.action === 'SUBMITTED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {log.action.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{log.reviewer.name}</p>
                      {log.comments && (
                        <p className="mt-1 text-sm text-gray-500 italic">
                          &quot;{log.comments}&quot;
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Approve Form</h3>
            <p className="mb-4 text-gray-600">
              Approving this form will allow the teacher to distribute it to parents.
            </p>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Comments (optional)
              </label>
              <textarea
                value={actionComments}
                onChange={(e) => setActionComments(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                placeholder="Any notes for the teacher..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setActionComments('');
                }}
                className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Approving...' : 'Approve Form'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Request Revision</h3>
            <p className="mb-4 text-gray-600">
              Please explain what changes are needed. The teacher will see these comments.
            </p>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Comments <span className="text-red-500">*</span>
              </label>
              <textarea
                value={actionComments}
                onChange={(e) => setActionComments(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none"
                placeholder="What changes are needed..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRevisionModal(false);
                  setActionComments('');
                  setError('');
                }}
                className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestRevision}
                disabled={submitting || !actionComments.trim()}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Request Revision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
