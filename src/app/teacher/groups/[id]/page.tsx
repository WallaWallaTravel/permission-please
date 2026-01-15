'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Student {
  id: string;
  name: string;
  grade: string;
}

interface Group {
  id: string;
  name: string;
  memberCount: number;
  members: Student[];
}

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // Load group and all students in parallel
      const [groupRes, studentsRes] = await Promise.all([
        fetch(`/api/groups/${id}`),
        fetch('/api/students'),
      ]);

      if (!groupRes.ok) {
        if (groupRes.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to load group');
      }

      const groupData = await groupRes.json();
      const studentsData = await studentsRes.json();

      setGroup(groupData.group);
      setAllStudents(studentsData.students || []);

      // Initialize selected students from current group members
      const memberIds = new Set<string>(groupData.group.members.map((m: Student) => m.id));
      setSelectedStudents(memberIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/groups/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: Array.from(selectedStudents) }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update members');
      }

      const data = await res.json();
      setGroup(data.group);
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGroupName = async () => {
    if (!newGroupName.trim() || newGroupName === group?.name) {
      setEditingName(false);
      return;
    }

    setSavingName(true);
    setError('');

    try {
      const res = await fetch(`/api/groups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update group name');
      }

      const data = await res.json();
      setGroup((prev) => (prev ? { ...prev, name: data.group.name } : null));
      setEditingName(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save group name');
    } finally {
      setSavingName(false);
    }
  };

  const startEditingName = () => {
    setNewGroupName(group?.name || '');
    setEditingName(true);
  };

  const handleRemoveStudent = async (studentId: string) => {
    const student = allStudents.find((s) => s.id === studentId);
    if (!confirm(`Remove ${student?.name || 'this student'} from the group?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/groups/${id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove student');
      }

      // Update local state
      const newSelected = new Set(selectedStudents);
      newSelected.delete(studentId);
      setSelectedStudents(newSelected);

      if (group) {
        setGroup({
          ...group,
          memberCount: newSelected.size,
          members: group.members.filter((m) => m.id !== studentId),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove student');
    }
  };

  // Filter students by search query
  const filteredStudents = allStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.grade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate into members and non-members for display
  const currentMembers = filteredStudents.filter((s) => selectedStudents.has(s.id));
  const availableStudents = filteredStudents.filter((s) => !selectedStudents.has(s.id));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50">
        <div className="flex animate-pulse flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-gray-600">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mb-4 text-5xl">😕</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Group Not Found</h1>
          <p className="mb-6 text-gray-600">{error || 'This group may have been deleted.'}</p>
          <Link href="/teacher/groups" className="text-emerald-600 hover:underline">
            Return to Groups
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/teacher/groups"
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
              All Groups
            </Link>
          </div>
          <h1 className="font-bold text-gray-900">Permission Please 📝</h1>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'Saved'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Group Header */}
        <div className="mb-8">
          {editingName ? (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveGroupName();
                  if (e.key === 'Escape') setEditingName(false);
                }}
                className="rounded-lg border-2 border-emerald-500 px-4 py-2 text-2xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Group name"
              />
              <button
                onClick={handleSaveGroupName}
                disabled={savingName}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {savingName ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditingName(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-gray-900">{group.name}</h2>
              <button
                onClick={startEditingName}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-emerald-600"
                title="Edit group name"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            </div>
          )}
          <p className="mt-1 text-gray-600">
            {selectedStudents.size} {selectedStudents.size === 1 ? 'student' : 'students'} in this
            group
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <svg
              className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search students by name or grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pr-4 pl-12 text-gray-900 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Current Members */}
          <div className="rounded-2xl bg-white shadow-lg">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="font-semibold text-gray-900">
                Group Members ({currentMembers.length})
              </h3>
              <p className="text-sm text-gray-500">Click to remove from group</p>
            </div>
            <div className="max-h-[500px] overflow-y-auto p-4">
              {currentMembers.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  <p>No students in this group yet.</p>
                  <p className="text-sm">Select students from the right panel to add them.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentMembers.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between rounded-lg bg-emerald-50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.grade}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveStudent(student.id)}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-red-100 hover:text-red-500"
                        title="Remove from group"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Available Students */}
          <div className="rounded-2xl bg-white shadow-lg">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="font-semibold text-gray-900">
                Available Students ({availableStudents.length})
              </h3>
              <p className="text-sm text-gray-500">Click to add to group</p>
            </div>
            <div className="max-h-[500px] overflow-y-auto p-4">
              {availableStudents.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  {searchQuery ? (
                    <p>No matching students found.</p>
                  ) : (
                    <>
                      <p>All students are in this group!</p>
                      <Link
                        href="/teacher/students"
                        className="text-sm text-emerald-600 hover:underline"
                      >
                        Add more students to your school
                      </Link>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {availableStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className="flex w-full items-center gap-3 rounded-lg bg-gray-50 p-3 text-left transition hover:bg-emerald-50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 text-gray-600">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.grade}</p>
                      </div>
                      <svg
                        className="ml-auto h-5 w-5 text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Unsaved Changes Warning */}
        {hasChanges && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-xl bg-amber-100 px-6 py-3 shadow-lg">
            <p className="text-amber-800">
              You have unsaved changes.{' '}
              <button onClick={handleSave} className="font-medium underline">
                Save now
              </button>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
