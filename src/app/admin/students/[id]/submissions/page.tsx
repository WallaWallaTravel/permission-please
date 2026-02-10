import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentSubmissionsPage({ params }: PageProps) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
    redirect('/admin/dashboard');
  }

  // Fetch the student
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      school: {
        select: { id: true, name: true },
      },
      parents: {
        include: {
          parent: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!student) {
    notFound();
  }

  // School isolation for ADMIN
  if (currentUser.role === 'ADMIN' && student.schoolId !== currentUser.schoolId) {
    redirect('/admin/students');
  }

  const submissions = await prisma.formSubmission.findMany({
    where: { studentId: id },
    include: {
      form: {
        select: {
          id: true,
          title: true,
          eventDate: true,
          status: true,
          teacher: {
            select: { name: true, email: true },
          },
        },
      },
      parent: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { form: { eventDate: 'desc' } },
  });

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    SIGNED: 'bg-green-100 text-green-700',
    DECLINED: 'bg-red-100 text-red-700',
  };

  const signedCount = submissions.filter((s) => s.status === 'SIGNED').length;
  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length;
  const declinedCount = submissions.filter((s) => s.status === 'DECLINED').length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/students"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Students
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Forms for {student.name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-gray-600">
          <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
            Grade {student.grade}
          </span>
          {student.school && (
            <Link
              href={`/admin/schools/${student.school.id}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {student.school.name}
            </Link>
          )}
          {student.parents.length > 0 && (
            <span className="text-sm">
              Parents:{' '}
              {student.parents.map((p, i) => (
                <span key={p.parent.id}>
                  {i > 0 && ', '}
                  <Link
                    href={`/admin/users/${p.parent.id}/signatures`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {p.parent.name}
                  </Link>
                </span>
              ))}
            </span>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-100 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
          <p className="text-sm text-gray-600">Total Forms</p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{signedCount}</p>
          <p className="text-sm text-gray-600">Signed</p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          <p className="text-sm text-gray-600">Pending</p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{declinedCount}</p>
          <p className="text-sm text-gray-600">Declined</p>
        </div>
      </div>

      {/* Submissions Table */}
      {submissions.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mb-4 text-5xl">📝</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">No forms</h2>
          <p className="text-gray-500">
            This student hasn&apos;t received any permission forms yet.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Form
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Parent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Signed At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Teacher
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.map((submission) => (
                <tr key={submission.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <Link
                        href={`/teacher/forms/${submission.form.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {submission.form.title}
                      </Link>
                      <p className="text-sm text-gray-500">
                        Event: {format(new Date(submission.form.eventDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <Link
                        href={`/admin/users/${submission.parent.id}/signatures`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {submission.parent.name}
                      </Link>
                      <p className="text-sm text-gray-500">{submission.parent.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[submission.status]}`}
                    >
                      {submission.status === 'SIGNED' && '✓ '}
                      {submission.status === 'DECLINED' && '✗ '}
                      {submission.status === 'PENDING' && '⏳ '}
                      {submission.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {submission.signedAt
                      ? format(new Date(submission.signedAt), 'MMM d, yyyy h:mm a')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {submission.form.teacher.name}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/teacher/forms/${submission.form.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View Form
                      </Link>
                      {submission.status === 'SIGNED' && (
                        <a
                          href={`/api/submissions/${submission.id}/pdf`}
                          download
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
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
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          PDF
                        </a>
                      )}
                    </div>
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
