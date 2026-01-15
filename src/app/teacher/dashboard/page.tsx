import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import Link from 'next/link';
import { SignOutButton } from '@/components/shared/SignOutButton';
import { DistributeButton } from '@/components/forms/DistributeButton';

interface PageProps {
  searchParams: Promise<{ preview_school?: string }>;
}

export default async function TeacherDashboardPage({ searchParams }: PageProps) {
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

  if (!isPreviewMode && user.role !== 'TEACHER' && user.role !== 'ADMIN') {
    redirect('/login');
  }

  // In preview mode, show forms for the selected school
  // Otherwise, show forms for the current user
  const formsWhere = isPreviewMode ? { schoolId: preview_school } : { teacherId: user.id };

  // Fetch forms with submission counts
  const forms = await prisma.permissionForm.findMany({
    where: formsWhere,
    include: {
      _count: {
        select: { submissions: true },
      },
      submissions: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Calculate stats - use preview school filter if in preview mode
  const statsWhere = isPreviewMode ? { schoolId: preview_school } : { teacherId: user.id };

  const totalForms = await prisma.permissionForm.count({
    where: statsWhere,
  });

  const activeForms = forms.filter((f) => f.status === 'ACTIVE').length;

  const pendingSignatures = await prisma.formSubmission.count({
    where: {
      form: statsWhere,
      status: 'PENDING',
    },
  });

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const signedThisWeek = await prisma.formSubmission.count({
    where: {
      form: statsWhere,
      status: 'SIGNED',
      signedAt: {
        gte: oneWeekAgo,
      },
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Preview Banner */}
      {isPreviewMode && previewSchool && (
        <div className="bg-blue-600 px-4 py-2 text-center text-sm text-white">
          <span className="font-medium">Preview Mode:</span> Viewing teacher dashboard for{' '}
          <span className="font-semibold">{previewSchool.name}</span>
          {' · '}
          <Link href={`/admin/schools/${preview_school}`} className="underline hover:no-underline">
            Exit Preview
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-xl font-bold text-transparent">
                Permission Please 📝
              </h1>
              <div className="hidden gap-1 sm:flex">
                <Link
                  href="/teacher/dashboard"
                  className="rounded-lg bg-blue-50 px-4 py-2 font-medium text-blue-600"
                >
                  Dashboard
                </Link>
                <Link
                  href="/teacher/forms"
                  className="rounded-lg px-4 py-2 text-gray-600 transition hover:bg-gray-50"
                >
                  Forms
                </Link>
                <Link
                  href="/teacher/students"
                  className="rounded-lg px-4 py-2 text-gray-600 transition hover:bg-gray-50"
                >
                  Students
                </Link>
                <Link
                  href="/teacher/groups"
                  className="rounded-lg px-4 py-2 text-gray-600 transition hover:bg-gray-50"
                >
                  Groups
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
        {/* Welcome Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}! 👋</h2>
            <p className="mt-1 text-gray-600">
              Here&apos;s what&apos;s happening with your permission forms
            </p>
          </div>
          <Link
            href="/teacher/forms/create"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-700 hover:to-indigo-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Form
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Forms</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{totalForms}</p>
              </div>
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Forms</p>
                <p className="mt-1 text-3xl font-bold text-green-600">{activeForms}</p>
              </div>
              <div className="rounded-xl bg-green-100 p-3 text-green-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Signatures</p>
                <p className="mt-1 text-3xl font-bold text-amber-600">{pendingSignatures}</p>
              </div>
              <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Signed This Week</p>
                <p className="mt-1 text-3xl font-bold text-indigo-600">{signedThisWeek}</p>
              </div>
              <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Link
            href="/teacher/forms/create"
            className="group rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Create New Form</p>
                <p className="text-sm text-gray-500">Start a new permission slip</p>
              </div>
            </div>
          </Link>

          <Link
            href="/teacher/students"
            className="group rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-purple-100 p-3 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
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
                <p className="font-semibold text-gray-900">Manage Students</p>
                <p className="text-sm text-gray-500">Add or edit student info</p>
              </div>
            </div>
          </Link>

          <Link
            href="/teacher/forms"
            className="group rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">View Reports</p>
                <p className="text-sm text-gray-500">Check completion rates</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Forms */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="font-semibold text-gray-900">Recent Forms</h3>
            <Link
              href="/teacher/forms"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View All →
            </Link>
          </div>

          {forms.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4 text-5xl">📝</div>
              <h4 className="mb-2 text-xl font-semibold text-gray-900">No Forms Yet</h4>
              <p className="mb-6 text-gray-600">
                Get started by creating your first permission form
              </p>
              <Link
                href="/teacher/forms/create"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create First Form
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {forms.map((form) => {
                const signedCount = form.submissions.filter((s) => s.status === 'SIGNED').length;
                const totalCount = form.submissions.length;
                const progress = totalCount > 0 ? (signedCount / totalCount) * 100 : 0;

                return (
                  <div key={form.id} className="p-6 transition-colors hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <h4 className="font-semibold text-gray-900">{form.title}</h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              form.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-700'
                                : form.status === 'DRAFT'
                                  ? 'bg-gray-100 text-gray-600'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {form.status}
                          </span>
                        </div>
                        <p className="mb-3 line-clamp-1 text-sm text-gray-600">
                          {form.description}
                        </p>

                        {/* Progress Bar */}
                        <div className="flex items-center gap-4">
                          <div className="h-2 max-w-xs flex-1 rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-green-500 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">
                            {signedCount}/{totalCount} signed
                          </span>
                        </div>
                      </div>

                      <div className="ml-4 flex items-center gap-3">
                        <div className="text-right text-sm">
                          <p className="text-gray-500">Event</p>
                          <p className="font-medium text-gray-900">
                            {format(new Date(form.eventDate), 'MMM d')}
                          </p>
                        </div>

                        {form.status === 'DRAFT' || form.status === 'ACTIVE' ? (
                          <DistributeButton formId={form.id} />
                        ) : null}

                        <Link
                          href={`/teacher/forms/${form.id}`}
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
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
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
