'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Student {
  id: string;
  name: string;
  grade: string;
}

interface Parent {
  id: string;
  name: string;
  email: string;
}

interface LinkParentFormProps {
  students: Student[];
  parents: Parent[];
}

export function LinkParentForm({ students, parents }: LinkParentFormProps) {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [parentId, setParentId] = useState('');
  const [relationship, setRelationship] = useState('parent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/students/link-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, parentId, relationship }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to link parent');
      }

      setSuccess(true);
      setStudentId('');
      setParentId('');
      router.refresh();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Select Student</label>
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2 transition outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Choose student...</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name} (Grade {student.grade})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Select Parent</label>
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2 transition outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Choose parent...</option>
          {parents.map((parent) => (
            <option key={parent.id} value={parent.id}>
              {parent.name} ({parent.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Relationship</label>
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 transition outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
        >
          <option value="parent">Parent</option>
          <option value="mother">Mother</option>
          <option value="father">Father</option>
          <option value="guardian">Guardian</option>
          <option value="grandparent">Grandparent</option>
        </select>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {success && (
        <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
          ✓ Parent linked successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-purple-600 py-2 font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Linking...' : 'Link Parent'}
      </button>
    </form>
  );
}
