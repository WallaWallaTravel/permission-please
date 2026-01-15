'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AddStudentForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
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
        body: JSON.stringify({
          name,
          grade,
          parentName,
          parentEmail,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add student');
      }

      setSuccess(true);
      setName('');
      setGrade('');
      setParentName('');
      setParentEmail('');
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
      {/* Student Info Section */}
      <div className="mb-2">
        <p className="text-sm font-medium text-gray-700">Student Information</p>
      </div>

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

      {/* Parent Info Section */}
      <div className="mt-6 border-t border-gray-200 pt-4">
        <p className="mb-2 text-sm font-medium text-gray-700">Parent/Guardian Information</p>
        <p className="mb-3 text-xs text-gray-500">
          Required so they can receive and sign permission forms
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Parent Name</label>
        <input
          type="text"
          value={parentName}
          onChange={(e) => setParentName(e.target.value)}
          required
          placeholder="e.g., Sarah Johnson"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 transition outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Parent Email</label>
        <input
          type="email"
          value={parentEmail}
          onChange={(e) => setParentEmail(e.target.value)}
          required
          placeholder="e.g., sarah.johnson@email.com"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 transition outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          They&apos;ll use this email to sign in and sign forms
        </p>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

      {success && (
        <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
          Student and parent added successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-purple-600 py-2 font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Student & Parent'}
      </button>
    </form>
  );
}
