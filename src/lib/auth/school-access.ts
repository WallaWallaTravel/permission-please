import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export type SessionUser = {
  id: string;
  role: string;
  schoolId?: string | null;
};

export class AuthzError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = 'AuthzError';
    this.status = status;
  }
}

export function authzResponse(error: unknown): NextResponse | null {
  if (error instanceof AuthzError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return null;
}

export function isSuperAdmin(user: SessionUser): boolean {
  return user.role === 'SUPER_ADMIN';
}

export function requireStaffSchool(user: SessionUser): string {
  if (isSuperAdmin(user)) {
    throw new AuthzError('Super admin must use an explicit school filter', 400);
  }
  if (!user.schoolId) {
    throw new AuthzError('User must be assigned to a school');
  }
  return user.schoolId;
}

/** Prisma where-clause for staff list queries. Super admin is unscoped. */
export function schoolWhere(user: SessionUser): { schoolId?: string } {
  if (isSuperAdmin(user)) {
    return {};
  }
  return { schoolId: requireStaffSchool(user) };
}

/**
 * Staff may touch a record only in their school.
 * Legacy rows with null schoolId are visible only to the owning teacher.
 */
export function assertSameSchool(
  user: SessionUser,
  recordSchoolId: string | null | undefined,
  ownerId?: string
): void {
  if (isSuperAdmin(user)) {
    return;
  }
  if (recordSchoolId && user.schoolId && recordSchoolId === user.schoolId) {
    return;
  }
  if (!recordSchoolId && ownerId && ownerId === user.id) {
    return;
  }
  throw new AuthzError('Forbidden');
}

export async function assertCanManageForm(
  user: SessionUser,
  form: { id: string; teacherId: string; schoolId: string | null }
): Promise<void> {
  if (user.role === 'PARENT') {
    throw new AuthzError('Forbidden');
  }

  assertSameSchool(user, form.schoolId, form.teacherId);

  if (isSuperAdmin(user) || user.role === 'ADMIN' || user.role === 'REVIEWER') {
    return;
  }

  if (user.role === 'TEACHER') {
    if (form.teacherId === user.id) {
      return;
    }
    const share = await prisma.formShare.findUnique({
      where: {
        formId_userId: {
          formId: form.id,
          userId: user.id,
        },
      },
    });
    if (share) {
      return;
    }
  }

  throw new AuthzError('Forbidden');
}

export async function assertCanEditForm(
  user: SessionUser,
  form: { id: string; teacherId: string; schoolId: string | null }
): Promise<void> {
  if (user.role === 'PARENT' || user.role === 'REVIEWER') {
    throw new AuthzError('Forbidden');
  }

  assertSameSchool(user, form.schoolId, form.teacherId);

  if (isSuperAdmin(user) || user.role === 'ADMIN') {
    return;
  }

  if (user.role === 'TEACHER') {
    if (form.teacherId === user.id) {
      return;
    }
    const share = await prisma.formShare.findUnique({
      where: {
        formId_userId: {
          formId: form.id,
          userId: user.id,
        },
      },
    });
    if (share?.canEdit) {
      return;
    }
  }

  throw new AuthzError('Forbidden');
}

export function assertCanManageStudent(
  user: SessionUser,
  student: { schoolId: string | null }
): void {
  if (user.role === 'PARENT' || user.role === 'REVIEWER') {
    throw new AuthzError('Forbidden');
  }
  assertSameSchool(user, student.schoolId);
}
