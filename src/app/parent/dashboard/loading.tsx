/**
 * Parent Dashboard Loading State
 */
export default function ParentDashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation Skeleton */}
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white">
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
        <div className="mb-8">
          <div className="mb-2 h-9 w-64 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-200" />
                <div>
                  <div className="mb-2 h-4 w-28 animate-pulse rounded bg-gray-200" />
                  <div className="h-7 w-8 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Required Section Skeleton */}
        <div className="mb-8">
          <div className="mb-4 h-6 w-36 animate-pulse rounded bg-gray-200" />
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl border-2 border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-5 w-16 animate-pulse rounded bg-gray-200" />
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                    </div>
                    <div className="mb-2 h-6 w-56 animate-pulse rounded bg-gray-200" />
                    <div className="mb-2 h-4 w-32 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                  </div>
                  <div className="text-right">
                    <div className="mb-1 h-4 w-20 animate-pulse rounded bg-gray-200" />
                    <div className="mb-2 h-5 w-16 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
                <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
                  <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Signed Skeleton */}
        <div>
          <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200" />
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white shadow-sm">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200" />
                  <div>
                    <div className="mb-1 h-5 w-40 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                  </div>
                </div>
                <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
