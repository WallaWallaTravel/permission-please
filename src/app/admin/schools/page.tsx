export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Plus, Building2 } from 'lucide-react';

export default async function SchoolsPage() {
  const schools = await prisma.school.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          users: true,
          students: true,
          forms: true,
        },
      },
    },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schools</h1>
          <p className="mt-1 text-gray-600">Manage schools and their subdomains</p>
        </div>
        <Link
          href="/admin/schools/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Add School
        </Link>
      </div>

      {schools.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">
          <Building2 className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900">No schools yet</h2>
          <p className="mx-auto mb-6 max-w-md text-gray-500">
            Get started by adding your first school. Each school gets its own subdomain where
            teachers and parents can access their forms.
          </p>
          <Link
            href="/admin/schools/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            Add Your First School
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  School
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Subdomain
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Users
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Students
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Forms
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schools.map((school) => (
                <tr key={school.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/schools/${school.id}`}
                      className="group flex items-center gap-3"
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg font-semibold text-white"
                        style={{ backgroundColor: school.primaryColor || '#1e3a5f' }}
                      >
                        {school.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 transition-colors group-hover:text-blue-600">
                          {school.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Created {new Date(school.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-600">{school.subdomain}.permissionplease.app</span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600">{school._count.users}</td>
                  <td className="px-6 py-4 text-center text-gray-600">{school._count.students}</td>
                  <td className="px-6 py-4 text-center text-gray-600">{school._count.forms}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        school.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {school.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/schools/${school.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
