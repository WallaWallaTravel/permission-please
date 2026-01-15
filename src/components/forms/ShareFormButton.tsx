'use client';

import { useState, useEffect, useCallback } from 'react';

interface Share {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  canEdit: boolean;
  createdAt: string;
}

interface ShareFormButtonProps {
  formId: string;
  isOwner: boolean;
}

export function ShareFormButton({ formId, isOwner }: ShareFormButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shares, setShares] = useState<Share[]>([]);
  const [email, setEmail] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadShares = useCallback(async () => {
    try {
      const res = await fetch(`/api/forms/${formId}/share`);
      if (res.ok) {
        const data = await res.json();
        setShares(data.shares || []);
      }
    } catch (err) {
      console.error('Failed to load shares:', err);
    }
  }, [formId]);

  useEffect(() => {
    if (isOpen) {
      loadShares();
    }
  }, [isOpen, loadShares]);

  async function handleShare(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/forms/${formId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), canEdit }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to share form');
      }

      setSuccess(data.message);
      setEmail('');
      setCanEdit(false);
      loadShares();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveShare(shareId: string) {
    if (!confirm("Remove this person's access to the form?")) return;

    try {
      const res = await fetch(`/api/forms/${formId}/share?shareId=${shareId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove share');
      }

      loadShares();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove');
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        Share
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Share Form</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {isOwner ? (
                <>
                  {/* Share Form */}
                  <form onSubmit={handleShare} className="mb-6">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Share with teacher or staff
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="colleague@school.edu"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                      <button
                        type="submit"
                        disabled={loading || !email.trim()}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {loading ? '...' : 'Share'}
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="canEdit"
                        checked={canEdit}
                        onChange={(e) => setCanEdit(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="canEdit" className="text-sm text-gray-600">
                        Allow editing
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      They must have an account in the system first
                    </p>
                  </form>

                  {error && (
                    <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
                      {success}
                    </div>
                  )}
                </>
              ) : (
                <p className="mb-4 text-sm text-gray-600">
                  This form has been shared with you. Only the owner can manage sharing.
                </p>
              )}

              {/* Shared With List */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-700">
                  Shared with {shares.length} {shares.length === 1 ? 'person' : 'people'}
                </h3>
                {shares.length === 0 ? (
                  <p className="text-sm text-gray-500">Not shared with anyone yet</p>
                ) : (
                  <div className="space-y-2">
                    {shares.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{share.user.name}</p>
                          <p className="text-xs text-gray-500">
                            {share.user.email}
                            {share.canEdit && ' • Can edit'}
                          </p>
                        </div>
                        {isOwner && (
                          <button
                            onClick={() => handleRemoveShare(share.id)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-600"
                            title="Remove access"
                          >
                            <svg
                              className="h-4 w-4"
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
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
