import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { SignOutButton } from '@/components/shared/SignOutButton';
import { AddStudentForm } from '@/components/students/AddStudentForm';
import { LinkParentForm } from '@/components/students/LinkParentForm';

export default async function StudentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
    redirect('/login');
  }

  // Get students filtered by school (multi-tenancy isolation)
  const schoolFilter = user.schoolId ? { schoolId: user.schoolId } : {};

  const students = await prisma.student.findMany({
    where: schoolFilter,
    include: {
      parents: {
        include: {
          parent: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      _count: {
        select: { formSubmissions: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Get parents filtered by school for linking
  const parents = await prisma.user.findMany({
    where: {
      role: 'PARENT',
      ...(user.schoolId ? { schoolId: user.schoolId } : {}),
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-xl font-bold text-transparent">
                Permission Please 📝
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
                  className="rounded-lg px-4 py-2 text-gray-600 transition hover:bg-gray-50"
                >
                  Forms
                </Link>
                <Link
                  href="/teacher/students"
                  className="rounded-lg bg-purple-50 px-4 py-2 font-medium text-purple-600"
                >
                  Students
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
            <h2 className="text-3xl font-bold text-gray-900">Student Management 👩‍🎓</h2>
            <p className="mt-1 text-gray-600">Add students and link them to their parents</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Students List */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h3 className="font-semibold text-gray-900">All Students ({students.length})</h3>
              </div>

              {students.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mb-4 text-5xl">👩‍🎓</div>
                  <h4 className="mb-2 text-xl font-semibold text-gray-900">No Students Yet</h4>
                  <p className="text-gray-600">
                    Add your first student using the form on the right
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {students.map((student) => (
                    <div key={student.id} className="p-6 transition-colors hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-lg font-bold text-purple-600">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{student.name}</h4>
                            <p className="text-sm text-gray-500">Grade {student.grade}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {student.parents.length === 0 ? (
                                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">
                                  ⚠️ No parent linked
                                </span>
                              ) : (
                                student.parents.map(({ parent }) => (
                                  <span
                                    key={parent.id}
                                    className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700"
                                  >
                                    👤 {parent.name}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {student._count.formSubmissions} form
                            {student._count.formSubmissions !== 1 && 's'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Add Student & Link Parent Forms */}
          <div className="space-y-6">
            {/* Add Student Form */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">➕ Add New Student</h3>
              <AddStudentForm />
            </div>

            {/* Link Parent Form */}
            {students.length > 0 && parents.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 font-semibold text-gray-900">🔗 Link Parent to Student</h3>
                <LinkParentForm students={students} parents={parents} />
              </div>
            )}

            {/* Info Card */}
            <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
              <h3 className="mb-2 font-semibold text-purple-900">💡 How it works</h3>
              <ul className="space-y-2 text-sm text-purple-800">
                <li>1. Add students to your class</li>
                <li>2. Parents sign up for their own accounts</li>
                <li>3. Link parents to their children</li>
                <li>4. When you send a form, parents get notified!</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

