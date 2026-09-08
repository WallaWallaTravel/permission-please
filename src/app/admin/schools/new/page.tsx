'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

function defaultLicenseDate(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 365);
  return date.toISOString().slice(0, 10);
}

export default function StandUpSchoolPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    primaryColor: '#1e3a5f',
    licensedThrough: defaultLicenseDate(),
    adminEmail: '',
  });

  const handleNameChange = (name: string) => {
    const subdomain = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    setFormData((prev) => ({
      ...prev,
      name,
      subdomain: prev.subdomain || subdomain,
    }));
  };

  const previewInitial = useMemo(
    () => formData.name.charAt(0).toUpperCase() || 'S',
    [formData.name]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/schools/standup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to stand up school');
      }

      setEmailSent(Boolean(data.emailSent));
      setInviteUrl(data.inviteUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (inviteUrl) {
    return (
      <div className="max-w-2xl">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">School is ready</h1>
          <p className="mb-6 text-gray-600">
            {formData.name} is licensed through {formData.licensedThrough}. Invoice them separately
            — this app only tracks the date.
          </p>
          {emailSent ? (
            <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
              Invite email sent to {formData.adminEmail}.
            </p>
          ) : (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              The school was created but the invite email did not send. Share this link with the
              first admin:
            </p>
          )}
          <label className="mb-1 block text-sm font-medium text-gray-700">Admin invite link</label>
          <input
            readOnly
            value={inviteUrl}
            className="mb-6 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm"
          />
          <div className="flex gap-3">
            <Link
              href="/admin/schools"
              className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700"
              style={{ minHeight: '44px' }}
            >
              Back to schools
            </Link>
            <button
              type="button"
              onClick={() => {
                setInviteUrl(null);
                setFormData({
                  name: '',
                  subdomain: '',
                  primaryColor: '#1e3a5f',
                  licensedThrough: defaultLicenseDate(),
                  adminEmail: '',
                });
              }}
              className="rounded-lg border border-gray-200 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
            >
              Stand up another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/schools"
        className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Schools
      </Link>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Stand up a school</h1>
        <p className="mb-6 text-gray-600">
          Creates the school, sets the annual license, and emails the first admin. You invoice
          outside this app.
        </p>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              School name
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Lincoln Elementary"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="subdomain" className="mb-1 block text-sm font-medium text-gray-700">
              Subdomain
            </label>
            <div className="flex items-center">
              <input
                type="text"
                id="subdomain"
                required
                value={formData.subdomain}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  }))
                }
                placeholder="lincoln-elementary"
                className="flex-1 rounded-l-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
              <span className="rounded-r-lg border border-l-0 border-gray-300 bg-gray-100 px-4 py-2 text-gray-500">
                .permissionplease.app
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="licensedThrough"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Licensed through
            </label>
            <input
              type="date"
              id="licensedThrough"
              required
              value={formData.licensedThrough}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, licensedThrough: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">Defaults to one year from today.</p>
          </div>

          <div>
            <label htmlFor="adminEmail" className="mb-1 block text-sm font-medium text-gray-700">
              First admin email
            </label>
            <input
              type="email"
              id="adminEmail"
              required
              value={formData.adminEmail}
              onChange={(e) => setFormData((prev) => ({ ...prev, adminEmail: e.target.value }))}
              placeholder="principal@school.org"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="primaryColor" className="mb-1 block text-sm font-medium text-gray-700">
              Brand color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="primaryColor"
                value={formData.primaryColor}
                onChange={(e) => setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))}
                className="h-10 w-12 cursor-pointer rounded-lg border border-gray-300"
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="mb-3 text-sm font-medium text-gray-700">Preview</h3>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold text-white"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  {previewInitial}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{formData.name || 'School name'}</p>
                  <p className="text-sm text-gray-500">
                    {formData.subdomain || 'subdomain'}.permissionplease.app
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ minHeight: '44px' }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Standing up...
                </>
              ) : (
                'Create school and invite admin'
              )}
            </button>
            <Link href="/admin/schools" className="px-4 py-2 text-gray-600 hover:text-gray-900">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
