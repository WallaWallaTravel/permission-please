'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Loader2, Search, Users, FileText } from 'lucide-react';

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
  school: {
    id: string;
    name: string;
  } | null;
  parents: Parent[];
  _count: {
    formSubmissions: number;
  };
}

interface School {
  id: string;
  name: string;
}

const GRADE_ORDER = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export default function AdminStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchData() {
      try {
        const [studentsRes, schoolsRes] = await Promise.all([
          fetch('/api/admin/students'),
          fetch('/api/admin/schools'),
        ]);

        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData.students);
        }

        if (schoolsRes.ok) {
          const schoolsData = await schoolsRes.json();
          setSchools(schoolsData.schools);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Get unique grades from students
  const availableGrades = [...new Set(students.map((s) => s.grade))].sort(
    (a, b) => GRADE_ORDER.indexOf(a) - GRADE_ORDER.indexOf(b)
  );

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSchool = schoolFilter === 'all' || student.school?.id === schoolFilter;
    const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter;
    return matchesSearch && matchesSchool && matchesGrade;
  });

  // Group by school for summary
  const studentsBySchool = students.reduce(
    (acc, student) => {
      const schoolName = student.school?.name || 'No School';
      acc[schoolName] = (acc[schoolName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="mt-1 text-gray-600">View and manage all students across schools</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-100 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{students.length}</p>
          <p className="text-sm text-gray-600">Total Students</p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {students.filter((s) => s.parents.length > 0).length}
          </p>
          <p className="text-sm text-gray-600">With Parents Linked</p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {students.filter((s) => s.parents.length === 0).length}
          </p>
          <p className="text-sm text-gray-600">No Parents Linked</p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{Object.keys(studentsBySchool).length}</p>
          <p className="text-sm text-gray-600">Schools</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Schools</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Grades</option>
            {availableGrades.map((grade) => (
              <option key={grade} value={grade}>
                Grade {grade}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">
          <GraduationCap className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900">No students found</h2>
          <p className="text-gray-500">
            {searchTerm || schoolFilter !== 'all' || gradeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Students will appear here when added to schools'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  School
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Parents
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Submissions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Added
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 font-medium text-green-600">
                        {student.name.charAt(0)}
                      </div>
                      <button
                        onClick={() => router.push(`/admin/students/${student.id}`)}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {student.name}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      Grade {student.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {student.school ? (
                      <button
                        onClick={() => router.push(`/admin/schools/${student.school!.id}`)}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {student.school.name}
                      </button>
                    ) : (
                      <span className="text-gray-400">No school</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {student.parents.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {student.parents.map((p, i) => (
                          <div key={i} className="flex items-center gap-1 text-sm">
                            <Users className="h-3 w-3 text-gray-400" />
                            <button
                              onClick={() => router.push(`/admin/users/${p.parent.id}/signatures`)}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {p.parent.name}
                            </button>
                            <span className="text-gray-400">({p.relationship})</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-amber-600">No parents linked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {student._count.formSubmissions > 0 ? (
                      <button
                        onClick={() => router.push(`/admin/students/${student.id}/submissions`)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        {student._count.formSubmissions}
                      </button>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-500">
                    {new Date(student.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
