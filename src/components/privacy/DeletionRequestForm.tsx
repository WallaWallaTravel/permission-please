'use client';

import { useState, FormEvent } from 'react';

const SUBJECT_OPTIONS = [
  { value: 'parent', label: 'Parent / guardian' },
  { value: 'student', label: 'Student' },
  { value: 'school', label: 'Whole school' },
  { value: 'other', label: 'Other' },
] as const;

export function DeletionRequestForm() {
  const [requesterEmail, setRequesterEmail] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [subjectType, setSubjectType] =
    useState<(typeof SUBJECT_OPTIONS)[number]['value']>('parent');
  const [details, setDetails] = useState('');
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/privacy/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail,
          requesterName: requesterName || undefined,
          schoolName: schoolName || undefined,
          subjectType,
          details,
          website: website || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(
          typeof data.error === 'string' ? data.error : 'Could not submit the request. Try again.'
        );
        return;
      }

      setDone(true);
    } catch {
      setError('Could not submit the request. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
        <p className="font-medium">Request received.</p>
        <p className="mt-2 text-sm">
          We will follow up at the email you provided. This form does not delete records on its own
          — a person reviews the request first.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="requesterEmail" className="mb-1 block text-sm font-medium text-slate-800">
          Email
        </label>
        <input
          id="requesterEmail"
          type="email"
          required
          autoComplete="email"
          value={requesterEmail}
          onChange={(e) => setRequesterEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="requesterName" className="mb-1 block text-sm font-medium text-slate-800">
          Name <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <input
          id="requesterName"
          type="text"
          autoComplete="name"
          value={requesterName}
          onChange={(e) => setRequesterName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="schoolName" className="mb-1 block text-sm font-medium text-slate-800">
          School <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <input
          id="schoolName"
          type="text"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="subjectType" className="mb-1 block text-sm font-medium text-slate-800">
          Whose records
        </label>
        <select
          id="subjectType"
          value={subjectType}
          onChange={(e) =>
            setSubjectType(e.target.value as (typeof SUBJECT_OPTIONS)[number]['value'])
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        >
          {SUBJECT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="details" className="mb-1 block text-sm font-medium text-slate-800">
          What you want deleted
        </label>
        <textarea
          id="details"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        />
        <p className="mt-1 text-xs text-slate-500">10–2000 characters</p>
      </div>

      <div hidden aria-hidden="true">
        <label htmlFor="website">Company website</label>
        <input
          id="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {error && (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {submitting ? 'Sending…' : 'Submit request'}
      </button>
    </form>
  );
}
