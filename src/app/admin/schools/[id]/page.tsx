'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Trash2, Eye, GraduationCap, Users } from 'lucide-react';
import { SchoolTabs } from '@/components/admin/SchoolTabs';

interface School {
  id: string;
  name: string;
  subdomain: string;
  logoUrl: string | null;
  primaryColor: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    students: number;
    forms: number;
  };
}

export default function EditSchoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    primaryColor: '#1e3a5f',
    isActive: true,
  });

  useEffect(() => {
    async function fetchSchool() {
      try {
        const response = await fetch(`/api/admin/schools/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch school');
        }
        const data = await response.json();
        setSchool(data.school);
        setFormData({
          name: data.school.name,
          subdomain: data.school.subdomain,
          primaryColor: data.school.primaryColor || '#1e3a5f',
          isActive: data.school.isActive,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSchool();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/schools/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update school');
      }

      setSchool(data.school);
      setSuccess('School settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/schools/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete school');
      }

      router.push('/admin/schools');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500">School not found</p>
        <Link href="/admin/schools" className="mt-2 inline-block text-blue-600 hover:underline">
          Back to Schools
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/schools"
        className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Schools
      </Link>

      <SchoolTabs schoolId={id} schoolName={school.name} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Settings Form */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-6 text-lg font-semibold text-gray-900">School Settings</h2>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
              {success}
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
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
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
                  className="flex-1 rounded-l-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <span className="rounded-r-lg border border-l-0 border-gray-300 bg-gray-100 px-4 py-2 text-sm text-gray-500">
                  .permissionplease.app
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="primaryColor"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Brand Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="primaryColor"
                  value={formData.primaryColor}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))
                  }
                  className="h-10 w-12 cursor-pointer rounded-lg border border-gray-300"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))
                  }
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                School is active
              </label>
            </div>

            <div className="flex items-center gap-4 border-t border-gray-100 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Stats</h3>
            <div className="space-y-3">
              <Link
                href={`/admin/schools/${id}/users`}
                className="-mx-2 flex items-center justify-between rounded px-2 py-1 hover:bg-gray-50"
              >
                <span className="text-gray-500">Users</span>
                <span className="font-medium text-blue-600">{school._count.users} →</span>
              </Link>
              <Link
                href={`/admin/schools/${id}/students`}
                className="-mx-2 flex items-center justify-between rounded px-2 py-1 hover:bg-gray-50"
              >
                <span className="text-gray-500">Students</span>
                <span className="font-medium text-blue-600">{school._count.students} →</span>
              </Link>
              <Link
                href={`/admin/schools/${id}/forms`}
                className="-mx-2 flex items-center justify-between rounded px-2 py-1 hover:bg-gray-50"
              >
                <span className="text-gray-500">Forms</span>
                <span className="font-medium text-blue-600">{school._count.forms} →</span>
              </Link>
            </div>
          </div>

          {/* Preview Section */}
          <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Preview Portal</h3>
            </div>
            <p className="mb-4 text-sm text-gray-500">See what teachers and parents see.</p>
            <div className="space-y-2">
              <Link
                href={`/teacher/dashboard?preview_school=${school.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-100"
              >
                <GraduationCap className="h-4 w-4" />
                Preview as Teacher
              </Link>
              <Link
                href={`/parent/dashboard?preview_school=${school.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 transition-colors hover:bg-green-100"
              >
                <Users className="h-4 w-4" />
                Preview as Parent
              </Link>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-red-600">Danger Zone</h3>
            {showDeleteConfirm ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Are you sure? This will delete all users, students, and forms for this school.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete School
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
