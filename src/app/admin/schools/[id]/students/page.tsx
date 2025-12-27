'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Plus, GraduationCap, Users } from 'lucide-react';
import { SchoolTabs } from '@/components/admin/SchoolTabs';

interface Parent {
  parent: {
    id: string;
    name: string;
    email: string;
  };
  relationship: string;
}

interface Student {
  id: string;
  name: string;
  grade: string;
  createdAt: string;
  parents: Parent[];
  _count: {
    formSubmissions: number;
  };
}

interface School {
  id: string;
  name: string;
}

export default function SchoolStudentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [school, setSchool] = useState<School | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [schoolRes, studentsRes] = await Promise.all([
          fetch(`/api/admin/schools/${id}`),
          fetch(`/api/admin/students?schoolId=${id}`),
        ]);

        if (!schoolRes.ok) throw new Error('Failed to fetch school');

        const schoolData = await schoolRes.json();
        setSchool(schoolData.school);

        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData.students || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500">School not found</p>
        <Link href="/admin/schools" className="mt-2 inline-block text-blue-600 hover:underline">
          Back to Schools
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/schools"
        className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Schools
      </Link>

      <SchoolTabs schoolId={id} schoolName={school.name} />

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Students</h2>
            <p className="text-sm text-gray-500">Students enrolled at this school</p>
          </div>
          <Link
            href={`/admin/import?schoolId=${id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Import Students
          </Link>
        </div>

        {error && <div className="border-b border-red-100 bg-red-50 p-4 text-red-700">{error}</div>}

        {students.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <GraduationCap className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">No students yet</h3>
            <p className="mb-4 text-gray-500">Import students via CSV or add them manually.</p>
            <Link
              href={`/admin/import?schoolId=${id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Import Students
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Parents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Submissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Added
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 font-medium text-green-600">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                        {student.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {student.parents.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{student.parents.length}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No parents linked</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{student._count.formSubmissions}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
