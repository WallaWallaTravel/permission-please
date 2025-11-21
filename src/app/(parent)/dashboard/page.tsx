import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import Link from 'next/link';
import { SignOutButton } from '@/components/shared/SignOutButton';

export default async function ParentDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'PARENT') {
    redirect('/login');
  }

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
                  href="/parent/dashboard"
                  className="inline-flex items-center border-b-2 border-blue-500 px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  Dashboard
                </Link>
                <Link
                  href="/parent/history"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  History
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
              Welcome, {user.name}! 👋
            </h1>
          </div>
        </header>

        <main>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Stats */}
            <div className="mt-8">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {/* Stat 1 */}
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                  <dt className="truncate text-sm font-medium text-gray-500">Pending Signatures</dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">0</dd>
                </div>

                {/* Stat 2 */}
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                  <dt className="truncate text-sm font-medium text-gray-500">Signed Forms</dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">0</dd>
                </div>

                {/* Stat 3 */}
                <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                  <dt className="truncate text-sm font-medium text-gray-500">My Students</dt>
                  <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">0</dd>
                </div>
              </div>
            </div>

            {/* Pending Forms */}
            <div className="mt-8">
              <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                  <h2 className="text-lg font-medium text-gray-900">Pending Permission Forms</h2>
                  <p className="mt-2 text-sm text-gray-700">Forms that need your signature</p>
                </div>
              </div>
              <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
                <div className="px-4 py-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">All caught up!</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You have no pending permission forms to sign.
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
              <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
                <div className="px-4 py-12 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No activity yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Your signed forms will appear here.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
