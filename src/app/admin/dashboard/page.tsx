import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { SignOutButton } from '@/components/shared/SignOutButton';

interface Analytics {
  overview: {
    totalSchools: number;
    activeSchools: number;
    totalUsers: number;
    totalForms: number;
    totalSubmissions: number;
    signedSubmissions: number;
    responseRate: number;
    recentForms: number;
    recentSubmissions: number;
  };
  usersByRole: Record<string, number>;
  formsByStatus: Record<string, number>;
  submissionsByStatus: Record<string, number>;
}

async function getAnalytics(): Promise<Analytics> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalSchools,
    activeSchools,
    totalUsers,
    usersByRole,
    totalForms,
    formsByStatus,
    totalSubmissions,
    submissionsByStatus,
    recentForms,
    recentSubmissions,
  ] = await Promise.all([
    prisma.school.count(),
    prisma.school.count({ where: { isActive: true } }),
    prisma.user.count(),
    prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
    prisma.permissionForm.count(),
    prisma.permissionForm.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.formSubmission.count(),
    prisma.formSubmission.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.permissionForm.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.formSubmission.count({ where: { signedAt: { gte: sevenDaysAgo } } }),
  ]);

  const usersByRoleObj: Record<string, number> = {};
  usersByRole.forEach((item) => {
    usersByRoleObj[item.role] = item._count.id;
  });

  const formsByStatusObj: Record<string, number> = {};
  formsByStatus.forEach((item) => {
    formsByStatusObj[item.status] = item._count.id;
  });

  const submissionsByStatusObj: Record<string, number> = {};
  submissionsByStatus.forEach((item) => {
    submissionsByStatusObj[item.status] = item._count.id;
  });

  const signedSubmissions = submissionsByStatusObj['SIGNED'] || 0;
  const responseRate =
    totalSubmissions > 0 ? Math.round((signedSubmissions / totalSubmissions) * 100) : 0;

  return {
    overview: {
      totalSchools,
      activeSchools,
      totalUsers,
      totalForms,
      totalSubmissions,
      signedSubmissions,
      responseRate,
      recentForms,
      recentSubmissions,
    },
    usersByRole: usersByRoleObj,
    formsByStatus: formsByStatusObj,
    submissionsByStatus: submissionsByStatusObj,
  };
}

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    redirect('/teacher/dashboard');
  }

  const analytics = await getAnalytics();
  const { overview, usersByRole, formsByStatus, submissionsByStatus } = analytics;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-10 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-xl font-bold text-transparent">
                Admin Console
              </h1>
              <div className="hidden gap-1 sm:flex">
                <Link
                  href="/admin/dashboard"
                  className="rounded-lg bg-white/10 px-4 py-2 font-medium text-white"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/schools"
                  className="rounded-lg px-4 py-2 text-gray-300 transition hover:bg-white/5"
                >
                  Schools
                </Link>
                <Link
                  href="/admin/users"
                  className="rounded-lg px-4 py-2 text-gray-300 transition hover:bg-white/5"
                >
                  Users
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">{user.name}</span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">System Overview</h2>
          <p className="mt-1 text-gray-400">Monitor your Permission Please deployment</p>
        </div>

        {/* Primary Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Schools"
            value={overview.totalSchools}
            subtitle={`${overview.activeSchools} active`}
            color="blue"
          />
          <StatCard
            label="Total Users"
            value={overview.totalUsers}
            subtitle={`${usersByRole['TEACHER'] || 0} teachers, ${usersByRole['PARENT'] || 0} parents`}
            color="purple"
          />
          <StatCard
            label="Total Forms"
            value={overview.totalForms}
            subtitle={`${overview.recentForms} this week`}
            color="green"
          />
          <StatCard
            label="Response Rate"
            value={`${overview.responseRate}%`}
            subtitle={`${overview.signedSubmissions} of ${overview.totalSubmissions} signed`}
            color="amber"
          />
        </div>

        {/* Secondary Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Forms by Status */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="mb-4 font-semibold text-white">Forms by Status</h3>
            <div className="space-y-3">
              <StatusBar label="Draft" count={formsByStatus['DRAFT'] || 0} color="gray" />
              <StatusBar label="Active" count={formsByStatus['ACTIVE'] || 0} color="green" />
              <StatusBar label="Closed" count={formsByStatus['CLOSED'] || 0} color="red" />
            </div>
          </div>

          {/* Submissions by Status */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="mb-4 font-semibold text-white">Submissions by Status</h3>
            <div className="space-y-3">
              <StatusBar
                label="Pending"
                count={submissionsByStatus['PENDING'] || 0}
                color="amber"
              />
              <StatusBar label="Signed" count={submissionsByStatus['SIGNED'] || 0} color="green" />
              <StatusBar
                label="Declined"
                count={submissionsByStatus['DECLINED'] || 0}
                color="red"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Link
            href="/admin/schools"
            className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-indigo-500/50 hover:bg-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-indigo-500/20 p-3 text-indigo-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-white">Manage Schools</p>
                <p className="text-sm text-gray-400">Add, edit, or deactivate schools</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-purple-500/50 hover:bg-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-purple-500/20 p-3 text-purple-400">
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
                <p className="font-semibold text-white">Manage Users</p>
                <p className="text-sm text-gray-400">View and manage user accounts</p>
              </div>
            </div>
          </Link>

          <Link
            href="/api/health"
            target="_blank"
            className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-all hover:border-green-500/50 hover:bg-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-green-500/20 p-3 text-green-400">
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
                <p className="font-semibold text-white">System Health</p>
                <p className="text-sm text-gray-400">Check API and database status</p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  color,
}: {
  label: string;
  value: string | number;
  subtitle: string;
  color: 'blue' | 'purple' | 'green' | 'amber';
}) {
  const colors = {
    blue: 'from-blue-500/20 to-blue-600/20 text-blue-400',
    purple: 'from-purple-500/20 to-purple-600/20 text-purple-400',
    green: 'from-green-500/20 to-green-600/20 text-green-400',
    amber: 'from-amber-500/20 to-amber-600/20 text-amber-400',
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className={`inline-flex rounded-lg bg-gradient-to-r p-2 ${colors[color]}`}>
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-gray-400">{subtitle}</p>
    </div>
  );
}

function StatusBar({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: 'gray' | 'green' | 'red' | 'amber';
}) {
  const colors = {
    gray: 'bg-gray-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    amber: 'bg-amber-500',
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`h-3 w-3 rounded-full ${colors[color]}`} />
        <span className="text-gray-300">{label}</span>
      </div>
      <span className="font-semibold text-white">{count}</span>
    </div>
  );
}
