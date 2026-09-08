'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import type { RosterCounts, RosterFilter, RosterRow } from '@/lib/roster';
import { tripStatusLabel } from '@/lib/roster';

interface TripRosterClientProps {
  formId: string;
  formTitle: string;
  eventDate: string;
  teacherName: string;
  formStatus: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  filter: RosterFilter;
  rows: RosterRow[];
  counts: RosterCounts;
}

const FILTERS: { id: RosterFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'cleared', label: 'Cleared' },
  { id: 'missing', label: 'Awaiting' },
  { id: 'declined', label: 'Declined' },
];

export function TripRosterClient({
  formId,
  formTitle,
  eventDate,
  teacherName,
  formStatus,
  filter,
  rows,
  counts,
}: TripRosterClientProps) {
  const router = useRouter();
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [remindingAll, setRemindingAll] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const eventLabel = format(new Date(eventDate), 'EEEE, MMMM d, yyyy');
  const canRemind = formStatus === 'ACTIVE';
  const csvHref =
    filter === 'all'
      ? `/api/forms/${formId}/export-csv?view=roster`
      : `/api/forms/${formId}/export-csv?view=roster&status=${filter}`;

  async function remindSubmission(submissionId: string) {
    const res = await fetch(`/api/forms/${formId}/remind`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send reminder');
    }
    return data.message as string | undefined;
  }

  async function handleRemind(submissionId: string) {
    setError('');
    setNotice('');
    setRemindingId(submissionId);
    try {
      const message = await remindSubmission(submissionId);
      setNotice(message || 'Reminder sent');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reminder');
    } finally {
      setRemindingId(null);
    }
  }

  async function handleRemindAll() {
    if (
      !confirm(
        `Send a reminder to every awaiting parent on this form (${counts.missing} student${counts.missing === 1 ? '' : 's'})?`
      )
    ) {
      return;
    }

    setError('');
    setNotice('');
    setRemindingAll(true);
    try {
      const res = await fetch('/api/forms/bulk-remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formIds: [formId] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reminders');
      }
      setNotice(data.message || 'Reminders sent');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reminders');
    } finally {
      setRemindingAll(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: table-cell !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        @page {
          margin: 0.6in;
        }
        .print-only {
          display: none;
        }
      `}</style>

      <header className="no-print sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            href={`/teacher/forms/${formId}`}
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
            Back to form
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {canRemind && counts.missing > 0 && (
              <button
                type="button"
                onClick={handleRemindAll}
                disabled={remindingAll}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                style={{ minHeight: '44px' }}
              >
                {remindingAll ? 'Sending...' : 'Remind all awaiting'}
              </button>
            )}
            <a
              href={csvHref}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              style={{ minHeight: '44px' }}
            >
              {filter === 'cleared' ? 'Download bus list' : 'Download CSV'}
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              style={{ minHeight: '44px' }}
            >
              Print roster
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 print:max-w-none print:px-0 print:py-0">
        <div className="mb-6 border-b border-gray-200 pb-4">
          <p className="text-sm font-medium tracking-wide text-emerald-700 uppercase">
            Trip roster
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{formTitle}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {eventLabel} · {teacherName}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
            <p className="text-sm text-gray-500">Students</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{counts.cleared}</p>
            <p className="text-sm text-gray-500">Cleared to go</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{counts.missing}</p>
            <p className="text-sm text-gray-500">Awaiting signature</p>
          </div>
          <div className="rounded-lg bg-red-50 p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{counts.declined}</p>
            <p className="text-sm text-gray-500">Declined</p>
          </div>
        </div>

        <div
          className="no-print mb-4 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Roster filter"
        >
          {FILTERS.map((item) => {
            const href =
              item.id === 'all'
                ? `/teacher/forms/${formId}/roster`
                : `/teacher/forms/${formId}/roster?status=${item.id}`;
            const count =
              item.id === 'all'
                ? counts.total
                : item.id === 'cleared'
                  ? counts.cleared
                  : item.id === 'missing'
                    ? counts.missing
                    : counts.declined;
            const active = filter === item.id;
            return (
              <Link
                key={item.id}
                href={href}
                role="tab"
                aria-selected={active}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{ minHeight: '44px' }}
              >
                {item.label} ({count})
              </Link>
            );
          })}
        </div>

        {error && (
          <div className="no-print mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {notice && (
          <div className="no-print mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {notice}
          </div>
        )}

        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
            <p className="font-medium text-gray-900">
              {counts.total === 0 ? 'No students on this form yet' : 'No students in this view'}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {counts.total === 0
                ? 'Distribute the form first, then this roster will list who can get on the bus.'
                : 'Try another filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-xs tracking-wider text-gray-500 uppercase">
                <tr>
                  <th className="print-only px-3 py-3">Boarded</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Grade</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Parent</th>
                  <th className="no-print px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rows.map((row) => (
                  <tr key={row.studentId}>
                    <td className="print-only px-3 py-3 align-top">
                      <div className="h-5 w-5 border border-gray-400" />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.studentName}</td>
                    <td className="px-4 py-3 text-gray-600">{row.grade}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          row.tripStatus === 'cleared'
                            ? 'bg-emerald-100 text-emerald-800'
                            : row.tripStatus === 'declined'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tripStatusLabel(row.tripStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {row.tripStatus === 'cleared' && row.signedBy ? (
                        <div>
                          <p>Signed by {row.signedBy.name}</p>
                          <p className="text-gray-500">
                            {row.signedBy.signedAt
                              ? format(new Date(row.signedBy.signedAt), 'MMM d, h:mm a')
                              : row.signedBy.email}
                          </p>
                        </div>
                      ) : row.pendingParents.length > 0 ? (
                        <div>
                          {row.pendingParents.map((parent) => (
                            <p key={parent.submissionId}>{parent.email}</p>
                          ))}
                        </div>
                      ) : (
                        <div>
                          {row.declinedParents.map((parent) => (
                            <p key={parent.submissionId}>{parent.name}</p>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="no-print px-4 py-3">
                      {row.tripStatus === 'cleared' && row.signedBy ? (
                        <a
                          href={`/api/submissions/${row.signedBy.submissionId}/pdf`}
                          download
                          className="inline-flex rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          PDF
                        </a>
                      ) : row.tripStatus === 'missing' && canRemind ? (
                        <div className="flex flex-wrap gap-2">
                          {row.pendingParents.map((parent) => (
                            <button
                              key={parent.submissionId}
                              type="button"
                              onClick={() => handleRemind(parent.submissionId)}
                              disabled={remindingId === parent.submissionId}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                            >
                              {remindingId === parent.submissionId
                                ? 'Sending...'
                                : row.pendingParents.length > 1
                                  ? `Remind ${parent.name}`
                                  : 'Remind'}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-xs text-gray-500">
          Cleared means at least one parent or guardian has signed. Print the cleared list at the
          bus.
        </p>
      </main>
    </div>
  );
}
