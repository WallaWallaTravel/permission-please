'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Group {
  id: string;
  name: string;
  memberCount: number;
}

interface DistributeModalProps {
  formId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DistributeModal({ formId, isOpen, onClose, onSuccess }: DistributeModalProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [distributionMode, setDistributionMode] = useState<'all' | 'groups'>('all');
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    actionUrl?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadGroups();
      setResult(null);
    }
  }, [isOpen]);

  const loadGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch {
      // Groups feature may not be available
    } finally {
      setLoadingGroups(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }
    setSelectedGroups(newSelected);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setResult(null);

    try {
      const body: { groupIds?: string[] } = {};
      if (distributionMode === 'groups' && selectedGroups.size > 0) {
        body.groupIds = Array.from(selectedGroups);
      }

      const res = await fetch(`/api/forms/${formId}/distribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({
          success: false,
          message: data.error || 'Failed to distribute',
          actionUrl: data.actionUrl,
        });
        return;
      }

      setResult({ success: true, message: data.message });

      // Close after delay and refresh
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to distribute',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPreviewText = () => {
    if (distributionMode === 'all') {
      return 'Will send to all students with linked parents';
    }
    if (selectedGroups.size === 0) {
      return 'Select at least one group';
    }
    const totalStudents = groups
      .filter((g) => selectedGroups.has(g.id))
      .reduce((sum, g) => sum + g.memberCount, 0);
    const groupCount = selectedGroups.size;
    // Note: If a student is in multiple selected groups, they'll only receive one form
    const duplicateNote =
      groupCount > 1 ? ' (students in multiple groups will only receive one form)' : '';
    return `Will send to up to ${totalStudents} student${totalStudents !== 1 ? 's' : ''} in ${groupCount} group${groupCount !== 1 ? 's' : ''}${duplicateNote}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Send Form to Parents</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
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

        {/* Body */}
        <div className="p-6">
          <p className="mb-4 text-gray-600">Who should receive this form?</p>

          {/* Distribution Mode Selection */}
          <div className="space-y-3">
            {/* All Students Option */}
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition ${
                distributionMode === 'all'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="mode"
                checked={distributionMode === 'all'}
                onChange={() => setDistributionMode('all')}
                className="h-4 w-4 text-blue-600"
              />
              <div>
                <p className="font-medium text-gray-900">All Students</p>
                <p className="text-sm text-gray-600">Send to all students with linked parents</p>
              </div>
            </label>

            {/* Select Groups Option */}
            {!loadingGroups && groups.length > 0 && (
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition ${
                  distributionMode === 'groups'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  checked={distributionMode === 'groups'}
                  onChange={() => setDistributionMode('groups')}
                  className="mt-1 h-4 w-4 text-blue-600"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Select Groups</p>
                  <p className="mb-3 text-sm text-gray-600">
                    Choose specific groups to receive this form
                  </p>

                  {/* Group Checkboxes */}
                  {distributionMode === 'groups' && (
                    <div className="space-y-2">
                      {groups.map((group) => (
                        <label
                          key={group.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                            selectedGroups.has(group.id)
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedGroups.has(group.id)}
                            onChange={() => toggleGroup(group.id)}
                            className="h-4 w-4 rounded text-blue-600"
                          />
                          <span className="flex-1 font-medium text-gray-900">{group.name}</span>
                          <span className="text-sm text-gray-500">
                            {group.memberCount} student{group.memberCount !== 1 ? 's' : ''}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </label>
            )}

            {/* No Groups Message */}
            {!loadingGroups && groups.length === 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-600">
                  No groups created yet.{' '}
                  <Link href="/teacher/groups" className="text-blue-600 hover:underline">
                    Create groups
                  </Link>{' '}
                  to send to specific students.
                </p>
              </div>
            )}

            {loadingGroups && (
              <div className="flex items-center justify-center p-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="mt-4 rounded-lg bg-gray-100 p-3">
            <p className="text-sm text-gray-700">{getPreviewText()}</p>
          </div>

          {/* Result Message */}
          {result && (
            <div
              className={`mt-4 rounded-lg p-4 ${
                result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              <p>{result.message}</p>
              {result.actionUrl && (
                <Link
                  href={result.actionUrl}
                  className="mt-2 inline-flex items-center gap-1 font-medium underline"
                >
                  Go to Students page
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (distributionMode === 'groups' && selectedGroups.size === 0)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Send to Parents
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
