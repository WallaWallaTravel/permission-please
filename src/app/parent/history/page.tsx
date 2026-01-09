import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import Link from 'next/link';
import { SignOutButton } from '@/components/shared/SignOutButton';
import { StudentFilterSelect } from '@/components/parent/StudentFilterSelect';

interface PageProps {
  searchParams: Promise<{ status?: string; student?: string }>;
}

export default async function ParentHistoryPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  const { status, student } = await searchParams;

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'PARENT') {
    redirect('/login');
  }

  // Get parent's students for filter dropdown
  const parentStudents = await prisma.parentStudent.findMany({
    where: { parentId: user.id },
    include: { student: true },
  });

  // Build filter conditions
  const statusFilter =
    status === 'SIGNED'
      ? { status: 'SIGNED' as const }
      : status === 'DECLINED'
        ? { status: 'DECLINED' as const }
        : status === 'PENDING'
          ? { status: 'PENDING' as const }
          : {}; // No status filter for "ALL"

  const studentFilter = student ? { studentId: student } : {};

  // Get all submissions for this parent with filters
  const submissions = await prisma.formSubmission.findMany({
    where: {
      parentId: user.id,
      ...statusFilter,
      ...studentFilter,
    },
    include: {
      form: {
        include: {
          teacher: { select: { name: true } },
        },
      },
      student: true,
    },
    orderBy: { signedAt: 'desc' },
  });

  // Count by status for stats
  const statusCounts = await prisma.formSubmission.groupBy({
    by: ['status'],
    where: { parentId: user.id },
    _count: true,
  });

  const counts = {
    ALL: submissions.length,
    SIGNED: statusCounts.find((s) => s.status === 'SIGNED')?._count || 0,
    DECLINED: statusCounts.find((s) => s.status === 'DECLINED')?._count || 0,
    PENDING: statusCounts.find((s) => s.status === 'PENDING')?._count || 0,
  };

  const currentStatus = status || 'ALL';
  const currentStudent = student || 'ALL';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-gray-900">Permission Please</h1>
              <div className="hidden gap-6 sm:flex">
                <Link href="/parent/dashboard" className="text-gray-500 hover:text-gray-700">
                  Dashboard
                </Link>
                <Link
                  href="/parent/history"
                  className="-mb-4 border-b-2 border-blue-600 pb-4 font-medium text-blue-600"
                >
                  History
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.name}</span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Form History</h2>
          <p className="mt-1 text-gray-600">View all your past and pending permission forms</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{counts.SIGNED + counts.DECLINED + counts.PENDING}</p>
            <p className="text-sm text-gray-600">Total Forms</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{counts.SIGNED}</p>
            <p className="text-sm text-gray-600">Signed</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{counts.DECLINED}</p>
            <p className="text-sm text-gray-600">Declined</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{counts.PENDING}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto">
            {(['ALL', 'SIGNED', 'DECLINED', 'PENDING'] as const).map((filterStatus) => (
              <Link
                key={filterStatus}
                href={`/parent/history${filterStatus === 'ALL' && currentStudent === 'ALL' ? '' : `?${filterStatus !== 'ALL' ? `status=${filterStatus}` : ''}${filterStatus !== 'ALL' && currentStudent !== 'ALL' ? '&' : ''}${currentStudent !== 'ALL' ? `student=${currentStudent}` : ''}`}`}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
                  currentStatus === filterStatus
                    ? filterStatus === 'SIGNED'
                      ? 'bg-green-100 text-green-700'
                      : filterStatus === 'DECLINED'
                        ? 'bg-red-100 text-red-700'
                        : filterStatus === 'PENDING'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {filterStatus === 'ALL' ? 'All' : filterStatus.charAt(0) + filterStatus.slice(1).toLowerCase()}
              </Link>
            ))}
          </div>

          {/* Student Filter */}
          {parentStudents.length > 1 && (
            <StudentFilterSelect
              students={parentStudents.map(({ student: s }) => ({ id: s.id, name: s.name }))}
              currentStudent={currentStudent}
              currentStatus={currentStatus}
              basePath="/parent/history"
            />
          )}
        </div>

        {/* Forms List */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {submissions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4 text-5xl">
                {currentStatus === 'SIGNED' ? '✅' : currentStatus === 'DECLINED' ? '❌' : currentStatus === 'PENDING' ? '⏳' : '📋'}
              </div>
              <h4 className="mb-2 text-xl font-semibold text-gray-900">
                {currentStatus === 'ALL'
                  ? 'No Forms Yet'
                  : `No ${currentStatus.charAt(0) + currentStatus.slice(1).toLowerCase()} Forms`}
              </h4>
              <p className="text-gray-600">
                {currentStatus === 'ALL'
                  ? "You haven't received any permission forms yet"
                  : `You don't have any ${currentStatus.toLowerCase()} forms`}
              </p>
              {currentStatus === 'PENDING' && (
                <Link
                  href="/parent/dashboard"
                  className="mt-4 inline-block text-blue-600 hover:text-blue-700"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {submissions.map((submission) => {
                const isSigned = submission.status === 'SIGNED';
                const isDeclined = submission.status === 'DECLINED';
                const isPending = submission.status === 'PENDING';

                return (
                  <div key={submission.id} className="p-6 transition-colors hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              isSigned
                                ? 'bg-green-100 text-green-700'
                                : isDeclined
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {submission.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {submission.form.eventType.replace('_', ' ')}
                          </span>
                        </div>

                        <h4 className="font-semibold text-gray-900">{submission.form.title}</h4>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            {submission.student.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                            From {submission.form.teacher.name}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                          <span className="text-gray-600">
                            Event: {format(new Date(submission.form.eventDate), 'MMM d, yyyy')}
                          </span>
                          {(isSigned || isDeclined) && submission.signedAt && (
                            <span className={isSigned ? 'text-green-600' : 'text-red-600'}>
                              {isSigned ? 'Signed' : 'Declined'}:{' '}
                              {format(new Date(submission.signedAt), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-2">
                        {isPending && (
                          <Link
                            href={`/parent/sign/${submission.form.id}`}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                          >
                            Sign Now
                          </Link>
                        )}
                        {isSigned && (
                          <div className="flex items-center gap-2">
                            <a
                              href={`/api/submissions/${submission.id}/pdf`}
                              download
                              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                              title="Download PDF"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              PDF
                            </a>
                            <div className="flex items-center gap-1 text-green-600">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span className="text-sm font-medium">Signed</span>
                            </div>
                          </div>
                        )}
                        {isDeclined && (
                          <div className="flex items-center gap-1 text-red-600">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            <span className="text-sm font-medium">Declined</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Back to Dashboard */}
        <div className="mt-6 text-center">
          <Link href="/parent/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
