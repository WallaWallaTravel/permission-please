import { describe, it, expect, vi } from 'vitest';
import { ParentIdentityError, resolveOrCreateParent } from '@/lib/auth/parent-identity';

function fakeDb(existing: { email: string; role: string; id: string } | null) {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue(existing),
      create: vi
        .fn()
        .mockImplementation(({ data }) => Promise.resolve({ id: 'new-parent', ...data })),
    },
  } as unknown as Parameters<typeof resolveOrCreateParent>[0];
}

describe('resolveOrCreateParent', () => {
  it('creates a parent when the email is unused', async () => {
    const db = fakeDb(null);
    const result = await resolveOrCreateParent(db, {
      email: 'Parent@Example.com',
      name: 'Pat Parent',
      schoolId: 'school-a',
    });

    expect(result.created).toBe(true);
    expect(result.parent.role).toBe('PARENT');
    expect(db.user.create).toHaveBeenCalledWith({
      data: {
        email: 'parent@example.com',
        name: 'Pat Parent',
        role: 'PARENT',
        schoolId: 'school-a',
      },
    });
  });

  it('reuses an existing parent account across schools', async () => {
    const db = fakeDb({
      id: 'parent-1',
      email: 'parent@example.com',
      role: 'PARENT',
    });
    const result = await resolveOrCreateParent(db, {
      email: 'parent@example.com',
      name: 'Pat',
      schoolId: 'school-b',
    });

    expect(result.created).toBe(false);
    expect(result.parent.id).toBe('parent-1');
    expect(db.user.create).not.toHaveBeenCalled();
  });

  it('refuses to attach a staff account as a parent', async () => {
    const db = fakeDb({
      id: 'teacher-1',
      email: 'teacher@school.edu',
      role: 'TEACHER',
    });

    await expect(
      resolveOrCreateParent(db, {
        email: 'teacher@school.edu',
        name: 'Not A Parent',
        schoolId: 'school-a',
      })
    ).rejects.toBeInstanceOf(ParentIdentityError);

    expect(db.user.create).not.toHaveBeenCalled();
  });
});
