'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Trash2, UserPlus, X } from 'lucide-react';

interface School {
  id: string;
  name: string;
}

interface Parent {
  parent: {
    id: string;
    name: string;
    email: string;
  };
  relationship: string;
}

interface Student {
  id: string;
  name: string;
  grade: string;
  schoolId: string | null;
  school: School | null;
  parents: Parent[];
  createdAt: string;
}

interface CurrentUser {
  role: string;
  schoolId: string | null;
}

const GRADES = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export default function StudentEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [schoolId, setSchoolId] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      const [studentRes, schoolsRes, userRes] = await Promise.all([
        fetch(`/api/admin/students/${id}`),
        fetch('/api/admin/schools'),
        fetch('/api/user/me'),
      ]);

      if (!studentRes.ok) {
        if (studentRes.status === 404) {
          router.push('/admin/students');
          return;
        }
        throw new Error('Failed to fetch student');
      }

      const studentData = await studentRes.json();
      setStudent(studentData.student);
      setName(studentData.student.name);
      setGrade(studentData.student.grade);
      setSchoolId(studentData.student.schoolId || '');

      if (schoolsRes.ok) {
        const schoolsData = await schoolsRes.json();
        setSchools(schoolsData.schools);
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setCurrentUser(userData.user);
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
      const response = await fetch(`/api/admin/students/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          grade,
          schoolId: schoolId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update student');
      }

      const data = await response.json();
      setStudent(data.student);
      setSuccess('Student updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `Are you sure you want to delete "${student?.name}"? This will also remove all their form submissions.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/students/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete student');
      }

      router.push('/admin/students');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setIsDeleting(false);
    }
  }

  async function handleUnlinkParent(parentId: string) {
    if (!confirm('Remove this parent from the student?')) return;

    try {
      const response = await fetch(`/api/admin/students/${id}/parents/${parentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unlink parent');
      }

      // Refresh student data
      fetchData();
      setSuccess('Parent unlinked successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlink parent');
    }
  }

  const canChangeSchool = currentUser?.role === 'SUPER_ADMIN';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500">Student not found</p>
        <Link href="/admin/students" className="mt-2 inline-block text-blue-600 hover:underline">
          Back to Students
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/students"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Students
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Student</h1>
        <p className="mt-1 text-gray-600">Update student information and school assignment</p>
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
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Student Information</h2>

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
            <label className="mb-1 block text-sm font-medium text-gray-700">Grade</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              School {!canChangeSchool && '(Super Admin only)'}
            </label>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              disabled={!canChangeSchool}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
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

      {/* Parents Section */}
      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Linked Parents</h2>
          <Link
            href={`/admin/students/${id}/link-parent`}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <UserPlus className="h-4 w-4" />
            Link Parent
          </Link>
        </div>

        {student.parents.length === 0 ? (
          <p className="text-gray-500">No parents linked to this student.</p>
        ) : (
          <div className="space-y-3">
            {student.parents.map((p) => (
              <div
                key={p.parent.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
              >
                <div>
                  <p className="font-medium text-gray-900">{p.parent.name}</p>
                  <p className="text-sm text-gray-500">
                    {p.parent.email} • {p.relationship}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/users/${p.parent.id}/signatures`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    View Signatures
                  </Link>
                  <button
                    onClick={() => handleUnlinkParent(p.parent.id)}
                    className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Unlink parent"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submissions Link */}
      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Form Submissions</h2>
        <p className="mb-4 text-gray-600">View all permission forms for this student.</p>
        <Link
          href={`/admin/students/${id}/submissions`}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
        >
          View Submissions
        </Link>
      </div>

      {/* Danger Zone */}
      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="mb-2 text-lg font-semibold text-red-800">Danger Zone</h2>
        <p className="mb-4 text-sm text-red-700">
          Deleting a student will permanently remove all their form submissions and parent linkages.
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
          Delete Student
        </button>
      </div>

      {/* Meta Info */}
      <div className="mt-6 text-sm text-gray-500">
        <p>Added on {new Date(student.createdAt).toLocaleDateString()}</p>
        <p>Student ID: {student.id}</p>
      </div>
    </div>
  );
}
