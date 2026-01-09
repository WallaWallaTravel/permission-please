'use client';

import { useRouter } from 'next/navigation';

interface Student {
  id: string;
  name: string;
}

interface StudentFilterSelectProps {
  students: Student[];
  currentStudent: string;
  currentStatus: string;
  basePath: string;
}

export function StudentFilterSelect({
  students,
  currentStudent,
  currentStatus,
  basePath,
}: StudentFilterSelectProps) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStudent = e.target.value;
    const params = new URLSearchParams();
    if (currentStatus !== 'ALL') params.set('status', currentStatus);
    if (newStudent !== 'ALL') params.set('student', newStudent);
    const queryString = params.toString();
    router.push(`${basePath}${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Student:</span>
      <select
        value={currentStudent}
        onChange={handleChange}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="ALL">All Students</option>
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.name}
          </option>
        ))}
      </select>
    </div>
  );
}
