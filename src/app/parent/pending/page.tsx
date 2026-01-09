import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export const metadata = {
  title: 'Pending Forms | Permission Please',
  description: 'View and sign pending permission forms',
};

export default async function ParentPendingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session.user.role !== 'PARENT') {
    redirect('/');
  }

  // Get all pending submissions for this parent
  const pendingSubmissions = await prisma.formSubmission.findMany({
    where: {
      parentId: session.user.id,
      status: 'PENDING',
      form: {
        status: 'ACTIVE',
        deadline: { gt: new Date() },
      },
    },
    include: {
      form: {
        include: {
          teacher: { select: { name: true } },
          school: { select: { name: true } },
        },
      },
      student: { select: { name: true, grade: true } },
    },
    orderBy: {
      form: { deadline: 'asc' },
    },
  });

  // If only one pending form, redirect directly to it
  if (pendingSubmissions.length === 1) {
    redirect(`/parent/sign/${pendingSubmissions[0].formId}`);
  }

  // If no pending forms, redirect to dashboard
  if (pendingSubmissions.length === 0) {
    redirect('/parent/dashboard');
  }

  // Calculate current time once for all deadline calculations
  // eslint-disable-next-line react-hooks/purity -- Server component runs once, Date.now() is safe here
  const now = Date.now();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📝</span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Pending Forms</h1>
                <p className="text-sm text-slate-600">Hi, {session.user.name}</p>
              </div>
            </div>
            <Link
              href="/parent/dashboard"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">
            <strong>You have {pendingSubmissions.length} form{pendingSubmissions.length > 1 ? 's' : ''} awaiting your signature.</strong>{' '}
            Please review and sign before the deadlines.
          </p>
        </div>

        <div className="space-y-4">
          {pendingSubmissions.map((submission) => {
            const daysUntilDeadline = Math.ceil(
              (new Date(submission.form.deadline).getTime() - now) / (1000 * 60 * 60 * 24)
            );
            const isUrgent = daysUntilDeadline <= 2;

            return (
              <div
                key={submission.id}
                className={`rounded-xl border bg-white p-6 shadow-sm ${
                  isUrgent ? 'border-red-200' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900">
                        {submission.form.title}
                      </h2>
                      {isUrgent && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      <strong>Student:</strong> {submission.student.name}{' '}
                      {submission.student.grade && `(${submission.student.grade})`}
                    </p>
                    <p className="text-sm text-slate-600">
                      <strong>Teacher:</strong> {submission.form.teacher.name}
                      {submission.form.school?.name && (
                        <span className="text-slate-500"> • {submission.form.school.name}</span>
                      )}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>
                        <strong>Event:</strong>{' '}
                        {new Date(submission.form.eventDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className={isUrgent ? 'font-medium text-red-600' : ''}>
                        <strong>Due:</strong>{' '}
                        {new Date(submission.form.deadline).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                        {isUrgent && ` (${daysUntilDeadline} day${daysUntilDeadline === 1 ? '' : 's'} left)`}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/parent/sign/${submission.formId}`}
                    className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                  >
                    Review & Sign
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <h3 className="mb-2 font-medium text-slate-900">Need Help?</h3>
          <p className="text-sm text-slate-600">
            If you have questions about any of these forms, please contact the teacher directly.
            For technical issues, reach out to your school administrator.
          </p>
        </div>
      </main>
    </div>
  );
}
