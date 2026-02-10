import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { SignOutButton } from '@/components/shared/SignOutButton';
import { MobileNav } from '@/components/shared/MobileNav';
import { BulkActionsFormList } from '@/components/forms/BulkActionsFormList';

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

  const draftCount = statusCounts.find((s) => s.status === 'DRAFT')?._count || 0;
  const activeCount = statusCounts.find((s) => s.status === 'ACTIVE')?._count || 0;
  const closedCount = statusCounts.find((s) => s.status === 'CLOSED')?._count || 0;

  const counts = {
    ALL: draftCount + activeCount + closedCount,
    DRAFT: draftCount,
    ACTIVE: activeCount,
    CLOSED: closedCount,
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
              <span className="hidden text-sm text-gray-600 sm:inline">{user.name}</span>
              <SignOutButton />
              <MobileNav
                links={[
                  { href: '/teacher/dashboard', label: 'Dashboard' },
                  { href: '/teacher/forms', label: 'Forms' },
                  { href: '/teacher/students', label: 'Students' },
                  { href: '/teacher/groups', label: 'Groups' },
                ]}
              />
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

        {/* Forms List with Bulk Actions */}
        <BulkActionsFormList
          forms={forms.map((form) => ({
            ...form,
            description: form.description,
            eventDate: form.eventDate.toISOString(),
            deadline: form.deadline.toISOString(),
            teacher: { id: form.teacher.id, name: form.teacher.name },
          }))}
          userId={user.id}
        />

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
