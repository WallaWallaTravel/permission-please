'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Search, UserPlus, GraduationCap } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  grade: string;
  school: { id: string; name: string } | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId: string | null;
}

const RELATIONSHIPS = [
  'Parent/Guardian',
  'Mother',
  'Father',
  'Stepmother',
  'Stepfather',
  'Grandmother',
  'Grandfather',
  'Aunt',
  'Uncle',
  'Guardian',
  'Other',
];

export default function LinkStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = use(params);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [linkedStudentIds, setLinkedStudentIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Selected student and relationship
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [relationship, setRelationship] = useState('Parent/Guardian');

  useEffect(() => {
    fetchData();
  }, [userId]);

  async function fetchData() {
    try {
      const [userRes, studentsRes] = await Promise.all([
        fetch(`/api/admin/users/${userId}`),
        fetch('/api/admin/students'),
      ]);

      if (!userRes.ok) {
        router.push('/admin/users');
        return;
      }

      const userData = await userRes.json();

      if (userData.user.role !== 'PARENT') {
        router.push(`/admin/users/${userId}`);
        return;
      }

      setUser(userData.user);

      // Get IDs of already linked students
      const linkedIds = new Set<string>(
        userData.user.parentStudents?.map((ps: { student: { id: string } }) => ps.student.id) || []
      );
      setLinkedStudentIds(linkedIds);

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData.students);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLink() {
    if (!selectedStudentId) return;

    setIsLinking(true);
    setError(null);

    try {
      const response = await fetch('/api/students/link-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          parentId: userId,
          relationship,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to link student');
      }

      router.push(`/admin/users/${userId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link student');
      setIsLinking(false);
    }
  }

  // Filter students - exclude already linked ones
  const availableStudents = students.filter(
    (student) =>
      !linkedStudentIds.has(student.id) &&
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500">User not found</p>
        <Link href="/admin/users" className="mt-2 inline-block text-blue-600 hover:underline">
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/admin/users/${userId}`}
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {user.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Link Student to {user.name}</h1>
        <p className="mt-1 text-gray-600">Select a student to link to this parent.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Student List */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="font-medium text-gray-900">Available Students</h2>
          <p className="text-sm text-gray-500">{availableStudents.length} students available</p>
        </div>

        {availableStudents.length === 0 ? (
          <div className="p-8 text-center">
            <GraduationCap className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="text-gray-500">
              {searchTerm ? 'No students match your search' : 'No students available to link'}
            </p>
          </div>
        ) : (
          <div className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
            {availableStudents.map((student) => (
              <button
                key={student.id}
                onClick={() => setSelectedStudentId(student.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                  selectedStudentId === student.id ? 'bg-blue-50' : ''
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    selectedStudentId === student.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-green-100 text-green-600'
                  }`}
                >
                  {selectedStudentId === student.id ? '✓' : student.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-500">
                    Grade {student.grade}
                    {student.school && ` • ${student.school.name}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Relationship Selection */}
      {selectedStudentId && (
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-gray-700">Relationship</label>
          <select
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          >
            {RELATIONSHIPS.map((rel) => (
              <option key={rel} value={rel}>
                {rel}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Link
          href={`/admin/users/${userId}`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          onClick={handleLink}
          disabled={!selectedStudentId || isLinking}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLinking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          Link Student
        </button>
      </div>
    </div>
  );
}
