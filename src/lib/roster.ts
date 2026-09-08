export type RosterSubmission = {
  id: string;
  status: 'PENDING' | 'SIGNED' | 'DECLINED';
  signedAt: string | Date | null;
  lastRemindedAt?: string | Date | null;
  parent: { id: string; name: string; email: string };
  student: { id: string; name: string; grade: string };
};

export type TripStatus = 'cleared' | 'missing' | 'declined';

export type RosterFilter = 'all' | TripStatus;

export type RosterParent = {
  name: string;
  email: string;
  submissionId: string;
  lastRemindedAt: string | null;
};

export type RosterRow = {
  studentId: string;
  studentName: string;
  grade: string;
  tripStatus: TripStatus;
  signedBy: {
    name: string;
    email: string;
    signedAt: string | null;
    submissionId: string;
  } | null;
  pendingParents: RosterParent[];
  declinedParents: RosterParent[];
};

export type RosterCounts = {
  total: number;
  cleared: number;
  missing: number;
  declined: number;
};

function toIso(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

const STATUS_ORDER: Record<TripStatus, number> = {
  missing: 0,
  declined: 1,
  cleared: 2,
};

/**
 * Collapse parent submissions into one row per student.
 * A student is cleared when any guardian has signed.
 */
export function buildTripRoster(submissions: RosterSubmission[]): RosterRow[] {
  const byStudent = new Map<string, RosterSubmission[]>();

  for (const submission of submissions) {
    const existing = byStudent.get(submission.student.id) ?? [];
    existing.push(submission);
    byStudent.set(submission.student.id, existing);
  }

  const rows: RosterRow[] = [];

  for (const [, studentSubs] of byStudent) {
    const student = studentSubs[0].student;
    const signed = studentSubs
      .filter((s) => s.status === 'SIGNED')
      .sort((a, b) => {
        const aTime = a.signedAt ? new Date(a.signedAt).getTime() : 0;
        const bTime = b.signedAt ? new Date(b.signedAt).getTime() : 0;
        return aTime - bTime;
      });
    const pending = studentSubs.filter((s) => s.status === 'PENDING');
    const declined = studentSubs.filter((s) => s.status === 'DECLINED');

    let tripStatus: TripStatus;
    if (signed.length > 0) {
      tripStatus = 'cleared';
    } else if (pending.length > 0) {
      tripStatus = 'missing';
    } else {
      tripStatus = 'declined';
    }

    const firstSigned = signed[0];

    rows.push({
      studentId: student.id,
      studentName: student.name,
      grade: student.grade,
      tripStatus,
      signedBy: firstSigned
        ? {
            name: firstSigned.parent.name,
            email: firstSigned.parent.email,
            signedAt: toIso(firstSigned.signedAt),
            submissionId: firstSigned.id,
          }
        : null,
      pendingParents: pending.map((s) => ({
        name: s.parent.name,
        email: s.parent.email,
        submissionId: s.id,
        lastRemindedAt: toIso(s.lastRemindedAt),
      })),
      declinedParents: declined.map((s) => ({
        name: s.parent.name,
        email: s.parent.email,
        submissionId: s.id,
        lastRemindedAt: toIso(s.lastRemindedAt),
      })),
    });
  }

  rows.sort((a, b) => {
    const byStatus = STATUS_ORDER[a.tripStatus] - STATUS_ORDER[b.tripStatus];
    if (byStatus !== 0) return byStatus;
    return a.studentName.localeCompare(b.studentName, undefined, { sensitivity: 'base' });
  });

  return rows;
}

export function rosterCounts(rows: RosterRow[]): RosterCounts {
  return {
    total: rows.length,
    cleared: rows.filter((row) => row.tripStatus === 'cleared').length,
    missing: rows.filter((row) => row.tripStatus === 'missing').length,
    declined: rows.filter((row) => row.tripStatus === 'declined').length,
  };
}

export function filterRoster(rows: RosterRow[], filter: RosterFilter): RosterRow[] {
  if (filter === 'all') return rows;
  return rows.filter((row) => row.tripStatus === filter);
}

export function parseRosterFilter(value: string | null | undefined): RosterFilter {
  if (value === 'cleared' || value === 'missing' || value === 'declined') {
    return value;
  }
  return 'all';
}

export function tripStatusLabel(status: TripStatus): string {
  if (status === 'cleared') return 'Cleared';
  if (status === 'missing') return 'Awaiting';
  return 'Declined';
}

function escapeCsvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function rosterToCsv(rows: RosterRow[]): string {
  const headers = [
    'Student Name',
    'Grade',
    'Status',
    'Signed By',
    'Signed Email',
    'Signed At',
    'Awaiting Parents',
  ];

  const dataRows = rows.map((row) => [
    row.studentName,
    row.grade,
    tripStatusLabel(row.tripStatus),
    row.signedBy?.name ?? '',
    row.signedBy?.email ?? '',
    row.signedBy?.signedAt
      ? new Date(row.signedBy.signedAt).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '',
    row.pendingParents.map((parent) => parent.email).join('; '),
  ]);

  return [headers, ...dataRows]
    .map((row) => row.map((cell) => escapeCsvCell(String(cell ?? ''))).join(','))
    .join('\n');
}
