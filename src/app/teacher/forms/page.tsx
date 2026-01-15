import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import Link from 'next/link';
import { SignOutButton } from '@/components/shared/SignOutButton';
import { DistributeButton } from '@/components/forms/DistributeButton';

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function TeacherFormsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  const { status } = await searchParams;

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
    redirect('/login');
  }

  // Fetch all forms owned by this teacher OR shared with them
  const forms = await prisma.permissionForm.findMany({
    where: {
      OR: [{ teacherId: user.id }, { shares: { some: { userId: user.id } } }],
      ...(status && status !== 'ALL' ? { status: status as 'DRAFT' | 'ACTIVE' | 'CLOSED' } : {}),
    },
    include: {
      _count: {
        select: { submissions: true, fields: true },
      },
      submissions: {
        select: { status: true },
      },
      teacher: {
        select: { id: true, name: true },
      },
      shares: {
        where: { userId: user.id },
        select: { canEdit: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Count by status for filters (include shared forms)
  const statusCounts = await prisma.permissionForm.groupBy({
    by: ['status'],
    where: {
      OR: [{ teacherId: user.id }, { shares: { some: { userId: user.id } } }],
    },
    _count: true,
  });

  const counts = {
    ALL: forms.length,
    DRAFT: statusCounts.find((s) => s.status === 'DRAFT')?._count || 0,
    ACTIVE: statusCounts.find((s) => s.status === 'ACTIVE')?._count || 0,
    CLOSED: statusCounts.find((s) => s.status === 'CLOSED')?._count || 0,
  };

  const currentFilter = status || 'ALL';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-xl font-bold text-transparent">
                Permission Please
              </h1>
              <div className="hidden gap-1 sm:flex">
                <Link
                  href="/teacher/dashboard"
                  className="rounded-lg px-4 py-2 text-gray-600 transition hover:bg-gray-50"
                >
                  Dashboard
                </Link>
                <Link
                  href="/teacher/forms"
                  className="rounded-lg bg-emerald-50 px-4 py-2 font-medium text-emerald-600"
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
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Permission Forms</h2>
            <p className="mt-1 text-gray-600">Manage all your permission slips in one place</p>
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

        {/* Status Filter Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {(['ALL', 'DRAFT', 'ACTIVE', 'CLOSED'] as const).map((filterStatus) => (
            <Link
              key={filterStatus}
              href={`/teacher/forms${filterStatus === 'ALL' ? '' : `?status=${filterStatus}`}`}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition ${
                currentFilter === filterStatus
                  ? filterStatus === 'DRAFT'
                    ? 'bg-gray-100 text-gray-700'
                    : filterStatus === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : filterStatus === 'CLOSED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {filterStatus === 'ALL' && 'All Forms'}
              {filterStatus === 'DRAFT' && 'Drafts'}
              {filterStatus === 'ACTIVE' && 'Active'}
              {filterStatus === 'CLOSED' && 'Closed'}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  currentFilter === filterStatus ? 'bg-white/50' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {counts[filterStatus]}
              </span>
            </Link>
          ))}
        </div>

        {/* Forms List */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {forms.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4 text-5xl">
                {currentFilter === 'ALL'
                  ? '📝'
                  : currentFilter === 'DRAFT'
                    ? '📋'
                    : currentFilter === 'ACTIVE'
                      ? '✅'
                      : '🔒'}
              </div>
              <h4 className="mb-2 text-xl font-semibold text-gray-900">
                {currentFilter === 'ALL'
                  ? 'No Forms Yet'
                  : `No ${currentFilter.charAt(0) + currentFilter.slice(1).toLowerCase()} Forms`}
              </h4>
              <p className="mb-6 text-gray-600">
                {currentFilter === 'ALL'
                  ? 'Create your first permission form to get started'
                  : `You don't have any ${currentFilter.toLowerCase()} forms`}
              </p>
              {currentFilter === 'ALL' && (
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
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {forms.map((form) => {
                const signedCount = form.submissions.filter((s) => s.status === 'SIGNED').length;
                const declinedCount = form.submissions.filter(
                  (s) => s.status === 'DECLINED'
                ).length;
                const pendingCount = form.submissions.filter((s) => s.status === 'PENDING').length;
                const totalCount = form.submissions.length;
                const isOverdue = new Date(form.deadline) < new Date() && form.status === 'ACTIVE';
                const isOwner = form.teacher.id === user.id;
                const canEdit = isOwner || form.shares[0]?.canEdit;

                return (
                  <div key={form.id} className="p-6 transition-colors hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Link
                            href={`/teacher/forms/${form.id}`}
                            className="font-semibold text-gray-900 hover:text-blue-600"
                          >
                            {form.title}
                          </Link>
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
                          {isOverdue && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Overdue
                            </span>
                          )}
                          {!isOwner && (
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                              Shared by {form.teacher.name}
                            </span>
                          )}
                        </div>

                        <p className="mb-3 line-clamp-1 text-sm text-gray-600">
                          {form.description || 'No description'}
                        </p>

                        {/* Stats Row */}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-600">
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
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            Event: {format(new Date(form.eventDate), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
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
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Due: {format(new Date(form.deadline), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-600">
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
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            {form._count.fields} field{form._count.fields !== 1 && 's'}
                          </div>
                        </div>

                        {/* Progress Bar (only for forms with submissions) */}
                        {totalCount > 0 && (
                          <div className="mt-4">
                            <div className="mb-1 flex items-center justify-between text-sm">
                              <span className="text-gray-600">Response Progress</span>
                              <div className="flex items-center gap-3">
                                <span className="text-green-600">{signedCount} signed</span>
                                {declinedCount > 0 && (
                                  <span className="text-red-600">{declinedCount} declined</span>
                                )}
                                <span className="text-amber-600">{pendingCount} pending</span>
                              </div>
                            </div>
                            <div className="flex h-2 overflow-hidden rounded-full bg-gray-200">
                              <div
                                className="bg-green-500 transition-all"
                                style={{ width: `${(signedCount / totalCount) * 100}%` }}
                              />
                              <div
                                className="bg-red-400 transition-all"
                                style={{ width: `${(declinedCount / totalCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-2">
                        {(form.status === 'DRAFT' || form.status === 'ACTIVE') && (
                          <DistributeButton formId={form.id} />
                        )}
                        <Link
                          href={`/teacher/forms/${form.id}`}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          View
                        </Link>
                        {form.status === 'DRAFT' && canEdit && (
                          <Link
                            href={`/teacher/forms/${form.id}/edit`}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                          >
                            Edit
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {forms.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-gray-100 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{counts.ALL}</p>
              <p className="text-sm text-gray-600">Total Forms</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{counts.ACTIVE}</p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-gray-600">{counts.DRAFT}</p>
              <p className="text-sm text-gray-600">Drafts</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{counts.CLOSED}</p>
              <p className="text-sm text-gray-600">Closed</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
