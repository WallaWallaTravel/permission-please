'use client';

import { useState, useEffect } from 'react';
import { Mail, Plus, Clock, CheckCircle, XCircle, Copy, Send, Loader2 } from 'lucide-react';

interface School {
  id: string;
  name: string;
  subdomain: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
  school: School | null;
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    role: 'ADMIN' as 'TEACHER' | 'ADMIN',
    schoolId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [invitesRes, schoolsRes] = await Promise.all([
        fetch('/api/admin/invites'),
        fetch('/api/admin/schools'),
      ]);

      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        setInvites(invitesData.invites);
      }

      if (schoolsRes.ok) {
        const schoolsData = await schoolsRes.json();
        setSchools(schoolsData.schools);
      }
    } catch {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          role: formData.role,
          schoolId: formData.schoolId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create invite');
        return;
      }

      setSuccess(data.message);
      setShowCreateModal(false);
      setFormData({ email: '', role: 'ADMIN', schoolId: '' });
      fetchData();

      setTimeout(() => setSuccess(null), 5000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }

  function copyInviteLink(token: string, id: string) {
    const baseUrl = window.location.origin;
    const inviteUrl = `${baseUrl}/invite/${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function getInviteStatus(invite: Invite) {
    if (invite.usedAt) {
      return { status: 'used', label: 'Accepted', color: 'bg-green-100 text-green-800' };
    }
    if (new Date(invite.expiresAt) < new Date()) {
      return { status: 'expired', label: 'Expired', color: 'bg-red-100 text-red-800' };
    }
    return { status: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const pendingInvites = invites.filter((i) => !i.usedAt && new Date(i.expiresAt) >= new Date());
  const usedInvites = invites.filter((i) => i.usedAt);
  const expiredInvites = invites.filter((i) => !i.usedAt && new Date(i.expiresAt) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invites</h1>
          <p className="text-slate-600">Invite teachers and admins to join Permission Please</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Invite
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
          <CheckCircle className="h-5 w-5" />
          {success}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          <XCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingInvites.length}</p>
              <p className="text-sm text-slate-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{usedInvites.length}</p>
              <p className="text-sm text-slate-500">Accepted</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{expiredInvites.length}</p>
              <p className="text-sm text-slate-500">Expired</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invites Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">School</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Expires</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                  Created By
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Mail className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                    <p className="text-slate-500">No invites yet</p>
                    <p className="text-sm text-slate-400">
                      Create your first invite to get started
                    </p>
                  </td>
                </tr>
              ) : (
                invites.map((invite) => {
                  const status = getInviteStatus(invite);
                  return (
                    <tr key={invite.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{invite.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {invite.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {invite.school?.name || <span className="text-slate-400">No school</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {formatDate(invite.expiresAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{invite.creator.name}</td>
                      <td className="px-4 py-3 text-right">
                        {status.status === 'pending' && (
                          <button
                            onClick={() => copyInviteLink(invite.token, invite.id)}
                            className="inline-flex items-center gap-1 text-sm text-blue-600 transition-colors hover:text-blue-800"
                          >
                            {copiedId === invite.id ? (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                Copy Link
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invite Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="p-6">
              <h2 className="mb-4 text-xl font-bold text-slate-900">Create New Invite</h2>

              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholder="admin@school.edu"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        role: e.target.value as 'TEACHER' | 'ADMIN',
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="TEACHER">Teacher</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    {formData.role === 'ADMIN'
                      ? 'Admins can manage school settings and users'
                      : 'Teachers can create and manage permission forms'}
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    School (Optional)
                  </label>
                  <select
                    value={formData.schoolId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, schoolId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No specific school</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setError(null);
                      setFormData({ email: '', role: 'ADMIN', schoolId: '' });
                    }}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 transition-colors hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Invite
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
