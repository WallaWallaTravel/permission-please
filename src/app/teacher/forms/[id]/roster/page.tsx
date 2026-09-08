import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/utils';
import { prisma } from '@/lib/db';
import { assertCanManageForm } from '@/lib/auth/school-access';
import { buildTripRoster, filterRoster, parseRosterFilter, rosterCounts } from '@/lib/roster';
import { TripRosterClient } from './TripRosterClient';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function TripRosterPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { status } = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const form = await prisma.permissionForm.findUnique({
    where: { id },
    include: {
      teacher: {
        select: { name: true },
      },
      submissions: {
        include: {
          parent: {
            select: { id: true, name: true, email: true },
          },
          student: {
            select: { id: true, name: true, grade: true },
          },
        },
      },
    },
  });

  if (!form) {
    notFound();
  }

  try {
    await assertCanManageForm(user, form);
  } catch {
    redirect('/teacher/dashboard');
  }

  const filter = parseRosterFilter(status);
  const allRows = buildTripRoster(form.submissions);
  const rows = filterRoster(allRows, filter);
  const counts = rosterCounts(allRows);

  return (
    <TripRosterClient
      formId={form.id}
      formTitle={form.title}
      eventDate={form.eventDate.toISOString()}
      teacherName={form.teacher.name}
      formStatus={form.status}
      filter={filter}
      rows={rows}
      counts={counts}
    />
  );
}
