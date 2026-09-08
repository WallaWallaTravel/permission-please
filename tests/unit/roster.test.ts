import { describe, it, expect } from 'vitest';
import {
  buildTripRoster,
  filterRoster,
  parseRosterFilter,
  rosterCounts,
  rosterToCsv,
  type RosterSubmission,
} from '@/lib/roster';

function submission(
  overrides: Partial<RosterSubmission> & Pick<RosterSubmission, 'id'>
): RosterSubmission {
  return {
    status: 'PENDING',
    signedAt: null,
    lastRemindedAt: null,
    parent: { id: 'parent-1', name: 'Alex Parent', email: 'alex@example.com' },
    student: { id: 'student-1', name: 'Ada Chen', grade: '4' },
    ...overrides,
  };
}

describe('buildTripRoster', () => {
  it('collapses two parents into one student row', () => {
    const rows = buildTripRoster([
      submission({
        id: 'sub-1',
        status: 'SIGNED',
        signedAt: '2026-09-01T16:00:00.000Z',
        parent: { id: 'p1', name: 'Priya Chen', email: 'priya@example.com' },
      }),
      submission({
        id: 'sub-2',
        status: 'PENDING',
        parent: { id: 'p2', name: 'Wei Chen', email: 'wei@example.com' },
      }),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].tripStatus).toBe('cleared');
    expect(rows[0].signedBy?.name).toBe('Priya Chen');
    expect(rows[0].pendingParents).toHaveLength(1);
    expect(rows[0].pendingParents[0].email).toBe('wei@example.com');
  });

  it('treats a student as missing until someone signs', () => {
    const rows = buildTripRoster([
      submission({ id: 'sub-1' }),
      submission({
        id: 'sub-2',
        status: 'DECLINED',
        parent: { id: 'p2', name: 'Other', email: 'other@example.com' },
      }),
    ]);

    expect(rows[0].tripStatus).toBe('missing');
  });

  it('marks declined only when no signature and nothing pending', () => {
    const rows = buildTripRoster([
      submission({
        id: 'sub-1',
        status: 'DECLINED',
      }),
    ]);

    expect(rows[0].tripStatus).toBe('declined');
  });

  it('uses the earliest signature as the authorizing parent', () => {
    const rows = buildTripRoster([
      submission({
        id: 'later',
        status: 'SIGNED',
        signedAt: '2026-09-02T12:00:00.000Z',
        parent: { id: 'p2', name: 'Later', email: 'later@example.com' },
      }),
      submission({
        id: 'earlier',
        status: 'SIGNED',
        signedAt: '2026-09-01T12:00:00.000Z',
        parent: { id: 'p1', name: 'Earlier', email: 'earlier@example.com' },
      }),
    ]);

    expect(rows[0].signedBy?.name).toBe('Earlier');
  });

  it('sorts awaiting students first, then declined, then cleared by name', () => {
    const rows = buildTripRoster([
      submission({
        id: 'c',
        status: 'SIGNED',
        signedAt: '2026-09-01T12:00:00.000Z',
        student: { id: 's-c', name: 'Zed', grade: '3' },
      }),
      submission({
        id: 'a',
        student: { id: 's-a', name: 'Mia', grade: '3' },
      }),
      submission({
        id: 'b',
        status: 'DECLINED',
        student: { id: 's-b', name: 'Noah', grade: '3' },
      }),
    ]);

    expect(rows.map((row) => row.studentName)).toEqual(['Mia', 'Noah', 'Zed']);
  });
});

describe('roster helpers', () => {
  const rows = buildTripRoster([
    submission({
      id: '1',
      status: 'SIGNED',
      signedAt: '2026-09-01T16:00:00.000Z',
      student: { id: 's1', name: 'Ada Chen', grade: '4' },
    }),
    submission({
      id: '2',
      student: { id: 's2', name: 'Ben Ortiz', grade: '4' },
      parent: { id: 'p2', name: 'Sam Ortiz', email: 'sam@example.com' },
    }),
  ]);

  it('counts students, not parent submissions', () => {
    expect(rosterCounts(rows)).toEqual({
      total: 2,
      cleared: 1,
      missing: 1,
      declined: 0,
    });
  });

  it('filters by trip status', () => {
    expect(filterRoster(rows, 'cleared')).toHaveLength(1);
    expect(filterRoster(rows, 'missing')[0].studentName).toBe('Ben Ortiz');
    expect(filterRoster(rows, 'all')).toHaveLength(2);
  });

  it('parses unknown query values as all', () => {
    expect(parseRosterFilter('cleared')).toBe('cleared');
    expect(parseRosterFilter('nope')).toBe('all');
    expect(parseRosterFilter(null)).toBe('all');
  });

  it('exports one CSV row per student and escapes commas', () => {
    const csv = rosterToCsv([
      {
        studentId: 's1',
        studentName: 'Chen, Ada',
        grade: '4',
        tripStatus: 'cleared',
        signedBy: {
          name: 'Priya Chen',
          email: 'priya@example.com',
          signedAt: '2026-09-01T16:00:00.000Z',
          submissionId: 'sub-1',
        },
        pendingParents: [],
        declinedParents: [],
      },
    ]);

    expect(csv.startsWith('Student Name,Grade,Status,')).toBe(true);
    expect(csv).toContain('"Chen, Ada"');
    expect(csv).toContain('Cleared');
    expect(csv.split('\n')).toHaveLength(2);
  });
});
