'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Parent {
  id: string;
  name: string;
  email: string;
}

interface ParentStudent {
  parent: Parent;
  relationship: string;
}

interface Group {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  grade: string;
  parents: ParentStudent[];
  groups: { group: Group }[];
}

interface EditStudentModalProps {
  student: Student;
  allParents: Parent[];
}

export function EditStudentModal({ student, allParents }: EditStudentModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(student.name);
  const [grade, setGrade] = useState(student.grade);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Link parent state
  const [showLinkParent, setShowLinkParent] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [relationship, setRelationship] = useState('parent');
  // New guardian state
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newGuardianName, setNewGuardianName] = useState('');
  const [newGuardianEmail, setNewGuardianEmail] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, grade }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update student');
      }

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkParent = async () => {
    // Validate based on mode
    if (isCreatingNew) {
      if (!newGuardianName.trim() || !newGuardianEmail.trim()) {
        setError('Please enter both name and email for the new guardian');
        return;
      }
    } else {
      if (!selectedParentId) {
        setError('Please select a parent');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const body = isCreatingNew
        ? {
            studentId: student.id,
            parentName: newGuardianName.trim(),
            parentEmail: newGuardianEmail.trim(),
            relationship,
          }
        : {
            studentId: student.id,
            parentId: selectedParentId,
            relationship,
          };

      const res = await fetch('/api/students/link-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to link parent');
      }

      setShowLinkParent(false);
      setSelectedParentId('');
      setNewGuardianName('');
      setNewGuardianEmail('');
      setIsCreatingNew(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Filter out already linked parents
  const linkedParentIds = student.parents.map((p) => p.parent.id);
  const availableParents = allParents.filter((p) => !linkedParentIds.includes(p.id));

  return (
    <>
      {/* Edit Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-blue-600"
        title="Edit student"
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

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Student</h3>
            </div>

            <div className="space-y-4 p-6">
              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Grade</label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 3rd, 5th, K"
                />
              </div>

              {/* Current Parents */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Linked Parents ({student.parents.length})
                </label>
                {student.parents.length === 0 ? (
                  <p className="text-sm text-amber-600">No parents linked yet</p>
                ) : (
                  <div className="space-y-2">
                    {student.parents.map(({ parent, relationship }) => (
                      <div
                        key={parent.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{parent.name}</p>
                          <p className="text-xs text-gray-500">
                            {parent.email} • {relationship}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Link New Parent */}
              {!showLinkParent ? (
                <button
                  type="button"
                  onClick={() => setShowLinkParent(true)}
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add parent/guardian
                </button>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="space-y-3">
                    {/* Toggle between existing and new */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCreatingNew(false)}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          !isCreatingNew
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Link Existing
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreatingNew(true)}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          isCreatingNew
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Create New
                      </button>
                    </div>

                    {isCreatingNew ? (
                      <>
                        {/* New guardian form */}
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Guardian Name
                          </label>
                          <input
                            type="text"
                            value={newGuardianName}
                            onChange={(e) => setNewGuardianName(e.target.value)}
                            placeholder="e.g., Sarah Johnson"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Guardian Email
                          </label>
                          <input
                            type="email"
                            value={newGuardianEmail}
                            onChange={(e) => setNewGuardianEmail(e.target.value)}
                            placeholder="e.g., sarah@email.com"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            They&apos;ll use this email to sign in and sign forms
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Existing parent dropdown */}
                        {availableParents.length > 0 ? (
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              Select Parent
                            </label>
                            <select
                              value={selectedParentId}
                              onChange={(e) => setSelectedParentId(e.target.value)}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                            >
                              <option value="">Choose parent...</option>
                              {availableParents.map((parent) => (
                                <option key={parent.id} value={parent.id}>
                                  {parent.name} ({parent.email})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No existing parents available. Use &quot;Create New&quot; to add a
                            guardian.
                          </p>
                        )}
                      </>
                    )}

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Relationship
                      </label>
                      <select
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                      >
                        <option value="parent">Parent</option>
                        <option value="mother">Mother</option>
                        <option value="father">Father</option>
                        <option value="guardian">Guardian</option>
                        <option value="grandparent">Grandparent</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowLinkParent(false);
                          setIsCreatingNew(false);
                          setNewGuardianName('');
                          setNewGuardianEmail('');
                          setSelectedParentId('');
                        }}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleLinkParent}
                        disabled={
                          loading ||
                          (isCreatingNew
                            ? !newGuardianName.trim() || !newGuardianEmail.trim()
                            : !selectedParentId)
                        }
                        className="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                      >
                        {loading ? 'Adding...' : isCreatingNew ? 'Create & Link' : 'Link'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Groups (read-only info) */}
              {student.groups.length > 0 && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Groups</label>
                  <div className="flex flex-wrap gap-2">
                    {student.groups.map(({ group }) => (
                      <span
                        key={group.id}
                        className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-700"
                      >
                        {group.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
