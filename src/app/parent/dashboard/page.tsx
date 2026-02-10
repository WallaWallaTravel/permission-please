import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { SignOutButton } from '@/components/shared/SignOutButton';
import { MobileNav } from '@/components/shared/MobileNav';

interface PageProps {
  searchParams: Promise<{ preview_school?: string }>;
}

export default async function ParentDashboardPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  const { preview_school } = await searchParams;

  if (!user) {
    redirect('/login');
  }

  // Allow SUPER_ADMIN to preview any school
  const isPreviewMode = preview_school && user.role === 'SUPER_ADMIN';
  let previewSchool = null;

  if (isPreviewMode) {
    previewSchool = await prisma.school.findUnique({
      where: { id: preview_school },
    });
  }

  if (!isPreviewMode && user.role !== 'PARENT') {
    redirect('/login');
  }

  // Compute current time for deadline calculations
  // Server Component - Date.now() is safe here as it runs once on server, not on re-renders
  // eslint-disable-next-line react-hooks/purity
  const currentTime = Date.now();

  // Get parent's students (or school's students in preview mode)
  const parentStudents = isPreviewMode
    ? await prisma.student
        .findMany({
          where: { schoolId: preview_school },
          take: 10,
        })
        .then((students) => students.map((student) => ({ student })))
    : await prisma.parentStudent.findMany({
        where: { parentId: user.id },
        include: { student: true },
      });

  // Get pending forms for this parent (or school in preview mode)
  const pendingSubmissions = await prisma.formSubmission.findMany({
    where: isPreviewMode
      ? { form: { schoolId: preview_school }, status: 'PENDING' }
      : { parentId: user.id, status: 'PENDING' },
    include: {
      form: {
        include: {
          teacher: { select: { name: true } },
        },
      },
      student: true,
    },
    orderBy: { form: { deadline: 'asc' } },
  });

  // Get signed forms
  const signedSubmissions = await prisma.formSubmission.findMany({
    where: isPreviewMode
      ? { form: { schoolId: preview_school }, status: 'SIGNED' }
      : { parentId: user.id, status: 'SIGNED' },
    include: {
      form: true,
      student: true,
    },
    orderBy: { signedAt: 'desc' },
    take: 5,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Preview Banner */}
      {isPreviewMode && previewSchool && (
        <div className="bg-green-600 px-4 py-2 text-center text-sm text-white">
          <span className="font-medium">Preview Mode:</span> Viewing parent dashboard for{' '}
          <span className="font-semibold">{previewSchool.name}</span>
          {' · '}
          <Link href={`/admin/schools/${preview_school}`} className="underline hover:no-underline">
            Exit Preview
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-gray-900">Permission Please 📝</h1>
              <div className="hidden gap-6 sm:flex">
                <Link
                  href="/parent/dashboard"
                  className="-mb-4 border-b-2 border-blue-600 pb-4 font-medium text-blue-600"
                >
                  Dashboard
                </Link>
                <Link href="/parent/history" className="text-gray-500 hover:text-gray-700">
                  History
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-gray-600 sm:inline">{user.name}</span>
              <SignOutButton />
              <MobileNav
                links={[
                  { href: '/parent/dashboard', label: 'Dashboard' },
                  { href: '/parent/history', label: 'History' },
                ]}
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome, {user.name}! 👋</h2>
          <p className="mt-1 text-gray-600">Manage permission forms for your children</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-amber-100 p-3 text-amber-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Signatures</p>
                <p className="text-2xl font-bold text-gray-900">{pendingSubmissions.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-green-100 p-3 text-green-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Signed Forms</p>
                <p className="text-2xl font-bold text-gray-900">{signedSubmissions.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">My Students</p>
                <p className="text-2xl font-bold text-gray-900">{parentStudents.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Forms - Priority Section */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            {pendingSubmissions.length > 0 ? '⚠️ Action Required' : '✅ All Caught Up!'}
          </h3>

          {pendingSubmissions.length === 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
              <div className="mb-4 text-5xl">🎉</div>
              <h4 className="mb-2 text-xl font-semibold text-gray-900">No Pending Forms</h4>
              <p className="text-gray-600">
                You&apos;re all caught up! No permission forms need your signature right now.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSubmissions.map((submission) => {
                const deadline = new Date(submission.form.deadline);
                const daysLeft = Math.ceil(
                  (deadline.getTime() - currentTime) / (1000 * 60 * 60 * 24)
                );
                const isUrgent = daysLeft <= 2;
                const isOverdue = daysLeft < 0;

                return (
                  <div
                    key={submission.id}
                    className={`overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-all hover:shadow-md ${
                      isOverdue
                        ? 'border-red-300 bg-red-50'
                        : isUrgent
                          ? 'border-amber-300'
                          : 'border-gray-100'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            {isOverdue ? (
                              <span className="rounded bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                                OVERDUE
                              </span>
                            ) : isUrgent ? (
                              <span className="rounded bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
                                DUE SOON
                              </span>
                            ) : null}
                            <span className="text-sm text-gray-500">
                              {submission.form.eventType.replace('_', ' ')}
                            </span>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {submission.form.title}
                          </h4>
                          <p className="mt-1 text-gray-600">For: {submission.student.name}</p>
                          <p className="mt-2 text-sm text-gray-500">
                            From: {submission.form.teacher.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Event Date</p>
                          <p className="font-medium text-gray-900">
                            {new Date(submission.form.eventDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          <p
                            className={`mt-2 text-sm ${isOverdue ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-gray-500'}`}
                          >
                            {isOverdue
                              ? `${Math.abs(daysLeft)} days overdue`
                              : daysLeft === 0
                                ? 'Due today'
                                : daysLeft === 1
                                  ? 'Due tomorrow'
                                  : `${daysLeft} days left`}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
                        <Link
                          href={`/parent/sign/${submission.form.id}`}
                          className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
                        >
                          Review & Sign →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {signedSubmissions.length > 0 && (
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Recently Signed</h3>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white shadow-sm">
              {signedSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-green-100 p-2 text-green-600">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{submission.form.title}</p>
                      <p className="text-sm text-gray-500">
                        {submission.student.name} • Signed{' '}
                        {submission.signedAt
                          ? new Date(submission.signedAt).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-green-600">✓ Signed</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Students */}
        {parentStudents.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">My Students</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {parentStudents.map(({ student }) => (
                <div
                  key={student.id}
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-500">Grade {student.grade}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
