import { describe, it, expect } from 'vitest';
import {
  AuthzError,
  assertSameSchool,
  assertCanManageStudent,
  schoolWhere,
  isSuperAdmin,
} from '@/lib/auth/school-access';

describe('school access', () => {
  const teacher = { id: 't1', role: 'TEACHER', schoolId: 'school-a' };
  const admin = { id: 'a1', role: 'ADMIN', schoolId: 'school-a' };
  const otherAdmin = { id: 'a2', role: 'ADMIN', schoolId: 'school-b' };
  const superAdmin = { id: 's1', role: 'SUPER_ADMIN', schoolId: null };

  it('treats super admin as unscoped', () => {
    expect(isSuperAdmin(superAdmin)).toBe(true);
    expect(schoolWhere(superAdmin)).toEqual({});
  });

  it('scopes staff to their school', () => {
    expect(schoolWhere(teacher)).toEqual({ schoolId: 'school-a' });
  });

  it('allows same-school access', () => {
    expect(() => assertSameSchool(admin, 'school-a')).not.toThrow();
  });

  it('blocks cross-school admin access', () => {
    expect(() => assertSameSchool(otherAdmin, 'school-a')).toThrow(AuthzError);
  });

  it('allows a teacher to access a legacy form they own with no schoolId', () => {
    expect(() => assertSameSchool(teacher, null, 't1')).not.toThrow();
  });

  it('blocks a teacher from a legacy form they do not own', () => {
    expect(() => assertSameSchool(teacher, null, 'someone-else')).toThrow(AuthzError);
  });

  it('does not treat two null schoolIds as the same school', () => {
    const reviewer = { id: 'r1', role: 'REVIEWER', schoolId: null };
    expect(() => assertSameSchool(reviewer, null, 'teacher-1')).toThrow(AuthzError);
  });

  it('blocks an admin with a null schoolId from a student with a null schoolId', () => {
    const adminNoSchool = { id: 'a3', role: 'ADMIN', schoolId: null };
    expect(() => assertCanManageStudent(adminNoSchool, { schoolId: null })).toThrow(AuthzError);
  });
});
