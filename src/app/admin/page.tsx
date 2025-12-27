export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import Link from 'next/link';
import { Building2, Users, FileText, GraduationCap, ArrowRight } from 'lucide-react';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  // Get counts for dashboard
  const [schoolCount, userCount, studentCount, formCount] = await Promise.all([
    prisma.school.count(),
    prisma.user.count(),
    prisma.student.count(),
    prisma.permissionForm.count(),
  ]);

  // Get recent schools
  const recentSchools = await prisma.school.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { users: true, students: true },
      },
    },
  });

  const stats = [
    {
      name: 'Schools',
      value: schoolCount,
      icon: Building2,
      href: '/admin/schools',
      color: 'bg-blue-500',
    },
    {
      name: 'Users',
      value: userCount,
      icon: Users,
      href: '/admin/users',
      color: 'bg-green-500',
    },
    {
      name: 'Students',
      value: studentCount,
      icon: GraduationCap,
      href: '#',
      color: 'bg-purple-500',
    },
    {
      name: 'Forms',
      value: formCount,
      icon: FileText,
      href: '#',
      color: 'bg-amber-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-gray-600">
          Welcome back, {session?.user?.name}. Here&apos;s an overview of your platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className={`${stat.color} rounded-lg p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Schools */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Schools</h2>
          <Link
            href="/admin/schools"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentSchools.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <p className="mb-4 text-gray-500">No schools yet</p>
            <Link
              href="/admin/schools/new"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Add Your First School
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentSchools.map((school) => (
              <Link
                key={school.id}
                href={`/admin/schools/${school.id}`}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg font-semibold text-white"
                    style={{ backgroundColor: school.primaryColor || '#1e3a5f' }}
                  >
                    {school.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{school.name}</p>
                    <p className="text-sm text-gray-500">{school.subdomain}.permissionplease.app</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span>{school._count.users} users</span>
                  <span>{school._count.students} students</span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      school.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {school.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
