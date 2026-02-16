'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  Save,
  Trash2,
  FileText,
  PenLine,
  GraduationCap,
  X,
  UserPlus,
} from 'lucide-react';

interface School {
  id: string;
  name: string;
}

interface LinkedStudent {
  student: {
    id: string;
    name: string;
    grade: string;
    school: { id: string; name: string } | null;
  };
  relationship: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId: string | null;
  school: School | null;
  createdAt: string;
  updatedAt: string;
  parentStudents: LinkedStudent[];
  _count: {
    forms: number;
    formSubmissions: number;
    parentStudents: number;
  };
}

const ROLES = [
  { value: 'PARENT', label: 'Parent', color: 'bg-amber-100 text-amber-700' },
  { value: 'TEACHER', label: 'Teacher', color: 'bg-green-100 text-green-700' },
  { value: 'REVIEWER', label: 'Reviewer', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'ADMIN', label: 'Admin', color: 'bg-blue-100 text-blue-700' },
  { value: 'SUPER_ADMIN', label: 'Super Admin', color: 'bg-purple-100 text-purple-700' },
];

export default function UserEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [schoolId, setSchoolId] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      const [userRes, schoolsRes] = await Promise.all([
        fetch(`/api/admin/users/${id}`),
        fetch('/api/admin/schools'),
      ]);

      if (!userRes.ok) {
        if (userRes.status === 404) {
          router.push('/admin/users');
          return;
        }
        throw new Error('Failed to fetch user');
      }

      const userData = await userRes.json();
      setUser(userData.user);
      setName(userData.user.name);
      setEmail(userData.user.email);
      setRole(userData.user.role);
      setSchoolId(userData.user.schoolId || '');

      if (schoolsRes.ok) {
        const schoolsData = await schoolsRes.json();
        setSchools(schoolsData.schools);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          role,
          schoolId: schoolId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      const data = await response.json();
      setUser((prev) => (prev ? { ...prev, ...data.user } : null));
      setSuccess('User updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `Are you sure you want to delete "${user?.name}"? This will permanently remove their account and all associated data.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      router.push('/admin/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setIsDeleting(false);
    }
  }

  async function handleUnlinkStudent(studentId: string) {
    if (!confirm('Remove this student from the parent?')) return;

    try {
      const response = await fetch(`/api/admin/students/${studentId}/parents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unlink student');
      }

      // Refresh user data
      fetchData();
      setSuccess('Student unlinked successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink student');
    }
  }

  const roleInfo = ROLES.find((r) => r.value === role);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500">User not found</p>
        <Link href="/admin/users" className="mt-2 inline-block text-blue-600 hover:underline">
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/users"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
          {roleInfo && (
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${roleInfo.color}`}>
              {roleInfo.label}
            </span>
          )}
        </div>
        <p className="mt-1 text-gray-600">{user.email}</p>
      </div>

      {/* Error/Success Messages */}
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

      {/* Edit Form */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">User Information</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">School</label>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No school assigned</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Role-specific sections */}
      {user.role === 'PARENT' && (
        <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Linked Students</h2>
            <Link
              href={`/admin/users/${id}/link-student`}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <UserPlus className="h-4 w-4" />
              Link Student
            </Link>
          </div>

          {user.parentStudents.length === 0 ? (
            <p className="text-gray-500">No students linked to this parent.</p>
          ) : (
            <div className="space-y-3">
              {user.parentStudents.map((ps) => (
                <div
                  key={ps.student.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-gray-400" />
                    <div>
                      <Link
                        href={`/admin/students/${ps.student.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {ps.student.name}
                      </Link>
                      <p className="text-sm text-gray-500">
                        Grade {ps.student.grade} • {ps.relationship}
                        {ps.student.school && ` • ${ps.student.school.name}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnlinkStudent(ps.student.id)}
                    className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Unlink student"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Signatures link */}
          <div className="mt-4 border-t border-gray-100 pt-4">
            <Link
              href={`/admin/users/${id}/signatures`}
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <PenLine className="h-4 w-4" />
              View {user._count.formSubmissions} Signature{user._count.formSubmissions !== 1 && 's'}
            </Link>
          </div>
        </div>
      )}

      {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
        <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Forms</h2>
          <p className="mb-4 text-gray-600">
            This user has created {user._count.forms} permission form
            {user._count.forms !== 1 && 's'}.
          </p>
          <Link
            href={`/admin/users/${id}/forms`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
          >
            <FileText className="h-4 w-4" />
            View Forms
          </Link>
        </div>
      )}

      {/* Danger Zone */}
      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="mb-2 text-lg font-semibold text-red-800">Danger Zone</h2>
        <p className="mb-4 text-sm text-red-700">
          Deleting a user will permanently remove their account, forms, submissions, and all
          associated data. This cannot be undone.
        </p>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Delete User
        </button>
      </div>

      {/* Meta Info */}
      <div className="mt-6 text-sm text-gray-500">
        <p>Joined on {new Date(user.createdAt).toLocaleDateString()}</p>
        <p>Last updated: {new Date(user.updatedAt).toLocaleDateString()}</p>
        <p>User ID: {user.id}</p>
      </div>
    </div>
  );
}
