import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import Link from 'next/link';
import { SignOutButton } from '@/components/shared/SignOutButton';

export default async function TeacherDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
    redirect('/login');
  }

  // Fetch forms and stats
  const [forms, stats] = await Promise.all([
    prisma.permissionForm.findMany({
      where: { teacherId: user.id },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.permissionForm.aggregate({
      where: { teacherId: user.id },
      _count: true,
    }),
  ]);

  const activeForms = forms.filter((f) => f.status === 'ACTIVE').length;

  const pendingSubmissions = await prisma.formSubmission.count({
    where: {
      form: {
        teacherId: user.id,
      },
      status: 'PENDING',
    },
  });

  const thisMonthForms = await prisma.permissionForm.count({
    where: {
      teacherId: user.id,
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-xl font-bold text-gray-900">Permission Please 📝</h1>
              </div>
              <div className="ml-6 flex space-x-8">
                <Link
                  href="/teacher/dashboard"
                  className="inline-flex items-center border-b-2 border-blue-500 px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  Dashboard
                </Link>
                <Link
                  href="/teacher/forms"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Forms
                </Link>
                <Link
                  href="/teacher/students"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Students
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center gap-x-4">
                <span className="text-sm text-gray-700">{user.name}</span>
                <SignOutButton />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="py-10">
        <header>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl leading-tight font-bold tracking-tight text-gray-900">
              Welcome back, {user.name}! 👋
            </h1>
          </div>
        </header>

        <main>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Stats */}
            <div className="mt-8">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                  <dt className="truncate text-sm font-medium text-gray-500">Total Forms</dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                    {stats._count}
                  </dd>
                </div>

                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                  <dt className="truncate text-sm font-medium text-gray-500">Active Forms</dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                    {activeForms}
                  </dd>
                </div>

                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                  <dt className="truncate text-sm font-medium text-gray-500">Pending Signatures</dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                    {pendingSubmissions}
                  </dd>
                </div>

                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                  <dt className="truncate text-sm font-medium text-gray-500">Created This Month</dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                    {thisMonthForms}
                  </dd>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <a
                  href="/teacher/forms/create"
                  className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400"
                >
                  <div className="flex-shrink-0">
                    <span className="text-3xl">📝</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">Create New Form</p>
                    <p className="truncate text-sm text-gray-500">Start a new permission form</p>
                  </div>
                </a>

                <a
                  href="/teacher/students"
                  className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400"
                >
                  <div className="flex-shrink-0">
                    <span className="text-3xl">👥</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">Manage Students</p>
                    <p className="truncate text-sm text-gray-500">
                      Add or edit student information
                    </p>
                  </div>
                </a>

                <a
                  href="/teacher/forms"
                  className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400"
                >
                  <div className="flex-shrink-0">
                    <span className="text-3xl">📊</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">View All Forms</p>
                    <p className="truncate text-sm text-gray-500">Check completion rates</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Recent Forms */}
            <div className="mt-8">
              <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                  <h2 className="text-lg font-medium text-gray-900">Recent Forms</h2>
                  <p className="mt-2 text-sm text-gray-700">
                    Your most recently created permission forms
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                  <a
                    href="/teacher/forms/create"
                    className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                  >
                    Create Form
                  </a>
                </div>
              </div>

              {forms.length === 0 ? (
                <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
                  <div className="px-4 py-12 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
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
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No forms yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating your first permission form.
                    </p>
                    <div className="mt-6">
                      <a
                        href="/teacher/forms/create"
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                      >
                        <svg
                          className="mr-1.5 -ml-0.5 h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                        </svg>
                        Create New Form
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
                  <ul className="divide-y divide-gray-200">
                    {forms.map((form) => (
                      <li key={form.id}>
                        <a href={`/teacher/forms/${form.id}`} className="block hover:bg-gray-50">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="truncate text-sm font-medium text-blue-600">
                                  {form.title}
                                </p>
                                <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                                  {form.description}
                                </p>
                              </div>
                              <div className="ml-4 flex flex-shrink-0 items-center gap-x-4">
                                <span
                                  className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${
                                    form.status === 'ACTIVE'
                                      ? 'bg-green-100 text-green-800'
                                      : form.status === 'DRAFT'
                                        ? 'bg-gray-100 text-gray-800'
                                        : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {form.status}
                                </span>
                                <div className="text-sm text-gray-500">
                                  {form._count.submissions} signatures
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex sm:gap-x-4">
                                <p className="flex items-center text-sm text-gray-500">
                                  📅 Event: {format(new Date(form.eventDate), 'MMM dd, yyyy')}
                                </p>
                                <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                  ⏰ Deadline: {format(new Date(form.deadline), 'MMM dd, yyyy')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                  {stats._count > 5 && (
                    <div className="bg-gray-50 px-4 py-3 text-center">
                      <a
                        href="/teacher/forms"
                        className="text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        View all {stats._count} forms →
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
