/**
 * Teacher Dashboard Loading State
 */
export default function TeacherDashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Navigation Skeleton */}
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Header Skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="mb-2 h-9 w-72 animate-pulse rounded bg-gray-200" />
            <div className="h-5 w-56 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="h-12 w-32 animate-pulse rounded-xl bg-gradient-to-r from-gray-200 to-gray-300" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-2 h-4 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="h-12 w-12 animate-pulse rounded-xl bg-gray-200" />
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 animate-pulse rounded-xl bg-gray-200" />
                <div>
                  <div className="mb-1 h-5 w-32 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Forms List Skeleton */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
                      <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
                    </div>
                    <div className="mb-3 h-4 w-full animate-pulse rounded bg-gray-200" />
                    <div className="flex items-center gap-4">
                      <div className="h-2 max-w-xs flex-1 animate-pulse rounded-full bg-gray-200" />
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    <div className="h-10 w-28 animate-pulse rounded-lg bg-gray-200" />
                    <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
