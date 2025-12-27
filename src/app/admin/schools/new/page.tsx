'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function NewSchoolPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    primaryColor: '#1e3a5f',
  });

  // Auto-generate subdomain from name
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create school');
      }

      router.push('/admin/schools');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Add New School</h1>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              School Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Lincoln Elementary School"
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
            <p className="mt-1 text-sm text-gray-500">
              Only lowercase letters, numbers, and hyphens allowed
            </p>
          </div>

          <div>
            <label htmlFor="primaryColor" className="mb-1 block text-sm font-medium text-gray-700">
              Brand Color
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
                placeholder="#1e3a5f"
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="mb-3 text-sm font-medium text-gray-700">Preview</h3>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold text-white"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  {formData.name.charAt(0) || 'S'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{formData.name || 'School Name'}</p>
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
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create School'
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
