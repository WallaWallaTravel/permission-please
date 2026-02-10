'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DistributeButton } from '@/components/forms/DistributeButton';

interface SerializedForm {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  eventType: string;
  deadline: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  teacherId: string;
  teacher: { id: string; name: string | null };
  _count: { submissions: number; fields: number };
  submissions: Array<{ status: 'PENDING' | 'SIGNED' | 'DECLINED' }>;
  shares: Array<{ canEdit: boolean }>;
}

interface BulkActionsFormListProps {
  forms: SerializedForm[];
  userId: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function BulkActionsFormList({ forms, userId }: BulkActionsFormListProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const activeForms = forms.filter((f) => f.status === 'ACTIVE');
  const allActiveSelected =
    activeForms.length > 0 && activeForms.every((f) => selectedIds.has(f.id));

  const toggleForm = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allActiveSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeForms.map((f) => f.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkRemind = async () => {
    const activeSelected = Array.from(selectedIds).filter((id) =>
      forms.find((f) => f.id === id && f.status === 'ACTIVE')
    );
    if (activeSelected.length === 0) return;

    setBulkLoading('remind');
    setFeedback(null);
    try {
      const res = await fetch('/api/forms/bulk-remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formIds: activeSelected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reminders');
      setFeedback({
        type: 'success',
        message: `Sent ${data.totalSent} reminder${data.totalSent !== 1 ? 's' : ''} across ${data.formsProcessed} form${data.formsProcessed !== 1 ? 's' : ''}${data.totalErrors > 0 ? ` (${data.totalErrors} failed)` : ''}`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to send reminders',
      });
    } finally {
      setBulkLoading(null);
    }
  };

  const handleBulkClose = async () => {
    const activeSelected = Array.from(selectedIds).filter((id) =>
      forms.find((f) => f.id === id && f.status === 'ACTIVE')
    );
    if (activeSelected.length === 0) return;

    if (
      !confirm(
        `Close ${activeSelected.length} form${activeSelected.length !== 1 ? 's' : ''}? Parents will no longer be able to sign.`
      )
    ) {
      return;
    }

    setBulkLoading('close');
    setFeedback(null);
    try {
      const res = await fetch('/api/forms/bulk-close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formIds: activeSelected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to close forms');
      setFeedback({
        type: 'success',
        message: `Closed ${data.closedCount} form${data.closedCount !== 1 ? 's' : ''} successfully`,
      });
      clearSelection();
      // Refresh server data to reflect status changes
      router.refresh();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to close forms',
      });
    } finally {
      setBulkLoading(null);
    }
  };

  return (
    <>
      {/* Feedback toast */}
      {feedback && (
        <div
          className={`mb-4 rounded-lg border p-4 ${
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{feedback.message}</p>
            <button onClick={() => setFeedback(null)} className="ml-4 text-sm underline">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {/* Select all header */}
        {activeForms.length > 0 && (
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-6 py-3">
            <input
              type="checkbox"
              checked={allActiveSelected}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
              aria-label="Select all active forms"
            />
            <span className="text-sm text-gray-600">
              Select all active forms ({activeForms.length})
            </span>
          </div>
        )}

        {forms.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-4 text-5xl">📝</div>
            <h4 className="mb-2 text-xl font-semibold text-gray-900">No Forms</h4>
            <p className="mb-6 text-gray-600">No forms match your current filter</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {forms.map((form) => {
              const signedCount = form.submissions.filter((s) => s.status === 'SIGNED').length;
              const declinedCount = form.submissions.filter((s) => s.status === 'DECLINED').length;
              const pendingCount = form.submissions.filter((s) => s.status === 'PENDING').length;
              const totalCount = form.submissions.length;
              const isOverdue = new Date(form.deadline) < new Date() && form.status === 'ACTIVE';
              const isOwner = form.teacher.id === userId;
              const canEdit = isOwner || form.shares[0]?.canEdit;
              const isSelected = selectedIds.has(form.id);

              return (
                <div
                  key={form.id}
                  className={`p-6 transition-colors hover:bg-gray-50 ${isSelected ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    {form.status === 'ACTIVE' && (
                      <div className="flex pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleForm(form.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                          aria-label={`Select ${form.title}`}
                        />
                      </div>
                    )}
                    {form.status !== 'ACTIVE' && <div className="w-4" />}

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Link
                          href={`/teacher/forms/${form.id}`}
                          className="font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {form.title}
                        </Link>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            form.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : form.status === 'DRAFT'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {form.status}
                        </span>
                        {isOverdue && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Overdue
                          </span>
                        )}
                        {!isOwner && (
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                            Shared by {form.teacher.name}
                          </span>
                        )}
                      </div>

                      <p className="mb-3 line-clamp-1 text-sm text-gray-600">
                        {form.description || 'No description'}
                      </p>

                      {/* Stats Row */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-600">
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
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Event: {formatDate(form.eventDate)}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
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
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Due: {formatDate(form.deadline)}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
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
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          {form._count.fields} field{form._count.fields !== 1 && 's'}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {totalCount > 0 && (
                        <div className="mt-4">
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="text-gray-600">Response Progress</span>
                            <div className="flex items-center gap-3">
                              <span className="text-green-600">{signedCount} signed</span>
                              {declinedCount > 0 && (
                                <span className="text-red-600">{declinedCount} declined</span>
                              )}
                              <span className="text-amber-600">{pendingCount} pending</span>
                            </div>
                          </div>
                          <div className="flex h-2 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="bg-green-500 transition-all"
                              style={{ width: `${(signedCount / totalCount) * 100}%` }}
                            />
                            <div
                              className="bg-red-400 transition-all"
                              style={{ width: `${(declinedCount / totalCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      {(form.status === 'DRAFT' || form.status === 'ACTIVE') && (
                        <DistributeButton formId={form.id} />
                      )}
                      <Link
                        href={`/teacher/forms/${form.id}`}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        View
                      </Link>
                      {form.status === 'DRAFT' && canEdit && (
                        <Link
                          href={`/teacher/forms/${form.id}/edit`}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          Edit
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed right-0 bottom-0 left-0 z-20 border-t border-gray-200 bg-white px-4 py-4 shadow-lg sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-700">
              {selectedIds.size} form{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleBulkRemind}
                disabled={bulkLoading !== null}
                className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
                style={{ minHeight: '44px' }}
              >
                {bulkLoading === 'remind' ? 'Sending...' : 'Send Reminders'}
              </button>
              <button
                onClick={handleBulkClose}
                disabled={bulkLoading !== null}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                style={{ minHeight: '44px' }}
              >
                {bulkLoading === 'close' ? 'Closing...' : 'Close Forms'}
              </button>
              <button
                onClick={clearSelection}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                style={{ minHeight: '44px' }}
              >
                Deselect All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
