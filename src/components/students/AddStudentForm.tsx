'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AddStudentForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, grade }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add student');
      }

      setSuccess(true);
      setName('');
      setGrade('');
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
        <label className="mb-1 block text-sm font-medium text-gray-700">Student Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g., Alex Johnson"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 transition outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Grade</label>
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-2 transition outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Select grade...</option>
          <option value="K">Kindergarten</option>
          <option value="1">1st Grade</option>
          <option value="2">2nd Grade</option>
          <option value="3">3rd Grade</option>
          <option value="4">4th Grade</option>
          <option value="5">5th Grade</option>
          <option value="6">6th Grade</option>
          <option value="7">7th Grade</option>
          <option value="8">8th Grade</option>
          <option value="9">9th Grade</option>
          <option value="10">10th Grade</option>
          <option value="11">11th Grade</option>
          <option value="12">12th Grade</option>
        </select>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {success && (
        <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
          ✓ Student added successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-purple-600 py-2 font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Student'}
      </button>
    </form>
  );
}

