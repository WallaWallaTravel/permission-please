import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrismaClient, resetPrismaMocks } from '../helpers/mock-prisma';
import { mockAdminSession, mockSuperAdminSession } from '../helpers/mock-session';

vi.mock('@/lib/db', () => ({
  prisma: mockPrismaClient,
}));

const mockGetCurrentUser = vi.fn();
vi.mock('@/lib/auth/utils', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}));

vi.mock('@/lib/rate-limit', () => ({
  applyRateLimit: () => null,
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('admin school isolation', () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue(mockAdminSession.user);
  });

  it('forbids an admin from fetching another school by id', async () => {
    const { GET } = await import('@/app/api/admin/schools/[id]/route');
    mockPrismaClient.school.findUnique.mockResolvedValue({
      id: 'school-other',
      name: 'Other School',
    });

    const response = await GET(
      new Request('http://localhost:6001/api/admin/schools/school-other') as never,
      {
        params: Promise.resolve({ id: 'school-other' }),
      }
    );

    expect(response.status).toBe(403);
  });

  it('allows an admin to fetch their own school', async () => {
    const { GET } = await import('@/app/api/admin/schools/[id]/route');
    mockPrismaClient.school.findUnique.mockResolvedValue({
      id: 'school-123',
      name: 'Own School',
    });

    const response = await GET(
      new Request('http://localhost:6001/api/admin/schools/school-123') as never,
      {
        params: Promise.resolve({ id: 'school-123' }),
      }
    );

    expect(response.status).toBe(200);
  });

  it('forbids an admin from managing a student in another school', async () => {
    const { GET } = await import('@/app/api/admin/students/[id]/route');
    mockPrismaClient.student.findUnique.mockResolvedValue({
      id: 'student-1',
      schoolId: 'school-other',
      name: 'Pat',
    });

    const response = await GET(
      new Request('http://localhost:6001/api/admin/students/student-1') as never,
      {
        params: Promise.resolve({ id: 'student-1' }),
      }
    );

    expect(response.status).toBe(403);
  });

  it('does not treat two null schoolIds as the same school', async () => {
    const { GET } = await import('@/app/api/admin/students/[id]/route');
    mockGetCurrentUser.mockResolvedValue({
      ...mockAdminSession.user,
      schoolId: null,
    });
    mockPrismaClient.student.findUnique.mockResolvedValue({
      id: 'student-legacy',
      schoolId: null,
      name: 'Legacy',
    });

    const response = await GET(
      new Request('http://localhost:6001/api/admin/students/student-legacy') as never,
      { params: Promise.resolve({ id: 'student-legacy' }) }
    );

    expect(response.status).toBe(403);
  });

  it('allows super admin to fetch any school', async () => {
    const { GET } = await import('@/app/api/admin/schools/[id]/route');
    mockGetCurrentUser.mockResolvedValue(mockSuperAdminSession.user);
    mockPrismaClient.school.findUnique.mockResolvedValue({
      id: 'school-other',
      name: 'Other School',
    });

    const response = await GET(
      new Request('http://localhost:6001/api/admin/schools/school-other') as never,
      {
        params: Promise.resolve({ id: 'school-other' }),
      }
    );

    expect(response.status).toBe(200);
  });
});
