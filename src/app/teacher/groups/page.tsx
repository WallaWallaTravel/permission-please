'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Group {
  id: string;
  name: string;
  memberCount: number;
  createdAt: string;
  members: Array<{
    id: string;
    name: string;
    grade: string;
  }>;
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/groups');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to load groups');
      }
      const data = await res.json();
      setGroups(data.groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setIsCreating(true);
    setError('');

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create group');
      }

      const data = await res.json();
      setGroups([...groups, { ...data.group, memberCount: 0, members: [] }]);
      setNewGroupName('');
      setShowCreateForm(false);
      // Navigate to the new group to add members
      router.push(`/teacher/groups/${data.group.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${groupName}"? This will not delete the students, only the group.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete group');
      setGroups(groups.filter((g) => g.id !== groupId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete group');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50">
        <div className="flex animate-pulse flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-gray-600">Loading groups...</p>
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
              href="/teacher/dashboard"
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
          <h1 className="font-bold text-gray-900">Permission Please 📝</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Group
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Student Groups</h2>
          <p className="mt-1 text-gray-600">
            Organize students into groups for easy form distribution
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Create Group Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-xl font-bold text-gray-900">Create New Group</h3>
              <form onSubmit={handleCreateGroup}>
                <div className="mb-4">
                  <label
                    htmlFor="groupName"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Group Name
                  </label>
                  <input
                    type="text"
                    id="groupName"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g., Room 102, Soccer Team, Band"
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewGroupName('');
                    }}
                    className="rounded-lg border-2 border-gray-200 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !newGroupName.trim()}
                    className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-lg">
            <div className="mb-4 text-5xl">👥</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">No Groups Yet</h3>
            <p className="mb-6 text-gray-600">
              Create groups to organize students and easily distribute forms to specific groups.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition hover:bg-emerald-700"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Your First Group
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className="overflow-hidden rounded-2xl bg-white shadow-lg transition hover:shadow-xl"
              >
                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                      <p className="text-sm text-gray-500">
                        {group.memberCount} {group.memberCount === 1 ? 'student' : 'students'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteGroup(group.id, group.name)}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                      title="Delete group"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Preview of first few members */}
                  {group.members.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {group.members.slice(0, 3).map((member) => (
                          <span
                            key={member.id}
                            className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                          >
                            {member.name}
                          </span>
                        ))}
                        {group.members.length > 3 && (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                            +{group.members.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/teacher/groups/${group.id}`}
                    className="block w-full rounded-lg bg-emerald-50 py-2 text-center text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                  >
                    Manage Members
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
