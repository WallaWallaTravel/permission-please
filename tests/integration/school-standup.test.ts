import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockPrismaClient, resetPrismaMocks } from '../helpers/mock-prisma';
import { mockSuperAdminSession, mockAdminSession } from '../helpers/mock-session';

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

const mockSendInviteEmail = vi.fn();
vi.mock('@/lib/email/resend', () => ({
  sendInviteEmail: (...args: unknown[]) => mockSendInviteEmail(...args),
}));

describe('POST /api/admin/schools/standup', () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
    mockPrismaClient.$transaction.mockImplementation(
      async (fn: (tx: typeof mockPrismaClient) => unknown) => fn(mockPrismaClient)
    );
  });

  it('returns 403 for a school admin', async () => {
    const { POST } = await import('@/app/api/admin/schools/standup/route');
    mockGetCurrentUser.mockResolvedValue(mockAdminSession.user);

    const request = new Request('http://localhost:6001/api/admin/schools/standup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Lincoln',
        subdomain: 'lincoln',
        licensedThrough: '2027-09-07',
        adminEmail: 'principal@lincoln.edu',
      }),
    });

    const response = await POST(request as never);
    expect(response.status).toBe(403);
  });

  it('creates the school, license date, and admin invite', async () => {
    const { POST } = await import('@/app/api/admin/schools/standup/route');
    mockGetCurrentUser.mockResolvedValue(mockSuperAdminSession.user);
    mockPrismaClient.school.findUnique.mockResolvedValue(null);
    mockPrismaClient.user.findUnique.mockResolvedValue(null);
    mockPrismaClient.invite.findFirst.mockResolvedValue(null);
    mockPrismaClient.school.create.mockResolvedValue({
      id: 'school-new',
      name: 'Lincoln',
      subdomain: 'lincoln',
    });
    mockPrismaClient.invite.create.mockResolvedValue({
      id: 'invite-1',
      email: 'principal@lincoln.edu',
    });
    mockSendInviteEmail.mockResolvedValue(undefined);

    const request = new Request('http://localhost:6001/api/admin/schools/standup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Lincoln',
        subdomain: 'lincoln',
        licensedThrough: '2027-09-07',
        adminEmail: 'principal@lincoln.edu',
        primaryColor: '#1e3a5f',
      }),
    });

    const response = await POST(request as never);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.emailSent).toBe(true);
    expect(data.inviteUrl).toContain('/invite/');
    expect(mockPrismaClient.school.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Lincoln',
          subdomain: 'lincoln',
          licensedThrough: expect.any(Date),
        }),
      })
    );
    expect(mockPrismaClient.invite.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'principal@lincoln.edu',
          role: 'ADMIN',
          schoolId: 'school-new',
        }),
      })
    );
  });
});
