import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserFormsPage({ params }: PageProps) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
    redirect('/admin/dashboard');
  }

  // Fetch the user and their forms
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      schoolId: true,
    },
  });

  if (!user) {
    notFound();
  }

  // School isolation: ADMIN can only view users from their school
  if (currentUser.role === 'ADMIN' && user.schoolId !== currentUser.schoolId) {
    redirect('/admin/users');
  }

  const forms = await prisma.permissionForm.findMany({
    where: { teacherId: id },
    include: {
      _count: {
        select: { submissions: true },
      },
      submissions: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    ACTIVE: 'bg-green-100 text-green-700',
    CLOSED: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/users"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Forms by {user.name}</h1>
        <p className="mt-1 text-gray-600">{user.email}</p>
      </div>

      {/* Forms Table */}
      {forms.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mb-4 text-5xl">📝</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">No forms created</h2>
          <p className="text-gray-500">This user hasn&apos;t created any permission forms yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Form
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Event Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Responses
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {forms.map((form) => {
                const signedCount = form.submissions.filter((s) => s.status === 'SIGNED').length;
                const totalCount = form._count.submissions;

                return (
                  <tr key={form.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <Link
                          href={`/teacher/forms/${form.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {form.title}
                        </Link>
                        <p className="line-clamp-1 text-sm text-gray-500">
                          {form.description || 'No description'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[form.status]}`}
                      >
                        {form.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(form.eventDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      {totalCount > 0 ? (
                        <span className="text-gray-900">
                          {signedCount}/{totalCount} signed
                        </span>
                      ) : (
                        <span className="text-gray-400">No responses</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {format(new Date(form.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/teacher/forms/${form.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                      >
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {forms.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-100 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{forms.length}</p>
            <p className="text-sm text-gray-600">Total Forms</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {forms.filter((f) => f.status === 'ACTIVE').length}
            </p>
            <p className="text-sm text-gray-600">Active</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">
              {forms.filter((f) => f.status === 'DRAFT').length}
            </p>
            <p className="text-sm text-gray-600">Drafts</p>
          </div>
        </div>
      )}
    </div>
  );
}
