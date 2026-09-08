import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { mockPrismaClient, resetPrismaMocks } from '../helpers/mock-prisma';

vi.mock('@/lib/db', () => ({
  prisma: mockPrismaClient,
}));

vi.mock('@/lib/rate-limit', () => ({
  applyRateLimit: () => null,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/audit', () => ({
  auditLog: vi.fn(),
  getRequestContext: () => ({ ipAddress: '1.2.3.xxx', userAgent: 'test' }),
}));

vi.mock('@/lib/email/resend', () => ({
  sendSignatureConfirmation: vi.fn().mockResolvedValue(undefined),
}));

const validToken = 'a'.repeat(32);

function signLink(overrides: Record<string, unknown> = {}) {
  return {
    id: 'link-1',
    token: validToken,
    formId: 'form-1',
    parentId: 'parent-1',
    expiresAt: new Date(Date.now() + 86400000),
    form: {
      id: 'form-1',
      title: 'Zoo Trip',
      description: 'See the animals',
      eventDate: new Date('2026-09-15'),
      eventType: 'FIELD_TRIP',
      deadline: new Date(Date.now() + 86400000),
      status: 'ACTIVE',
      teacher: { name: 'Ms. Lee', email: 'teacher@school.edu' },
      school: { name: 'Test School' },
      fields: [],
      documents: [],
    },
    parent: {
      id: 'parent-1',
      email: 'parent@example.com',
      name: 'Alex Parent',
      role: 'PARENT',
    },
    ...overrides,
  };
}

describe('GET /api/s/[token]', () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
  });

  it('returns 404 for an unknown or expired token', async () => {
    const { GET } = await import('@/app/api/s/[token]/route');
    mockPrismaClient.formSignLink.findUnique.mockResolvedValue(null);

    const request = new NextRequest(`http://localhost:6001/api/s/${validToken}`);
    const response = await GET(request, { params: Promise.resolve({ token: validToken }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toMatch(/invalid or has expired/i);
  });

  it('returns the form and students for a valid parent token', async () => {
    const { GET } = await import('@/app/api/s/[token]/route');
    mockPrismaClient.formSignLink.findUnique.mockResolvedValue(signLink());
    mockPrismaClient.formSubmission.findMany.mockResolvedValue([
      {
        status: 'PENDING',
        student: { id: 'student-1', name: 'Ada Chen', grade: '4' },
      },
    ]);

    const request = new NextRequest(`http://localhost:6001/api/s/${validToken}`);
    const response = await GET(request, { params: Promise.resolve({ token: validToken }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe('Zoo Trip');
    expect(data.students).toHaveLength(1);
    expect(data.students[0].hasSigned).toBe(false);
  });
});

describe('POST /api/s/[token]', () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
  });

  it('rejects signing a student that was not distributed to this parent', async () => {
    const { POST } = await import('@/app/api/s/[token]/route');
    mockPrismaClient.formSignLink.findUnique.mockResolvedValue(signLink());
    mockPrismaClient.formSubmission.findUnique.mockResolvedValue(null);

    const request = new NextRequest(`http://localhost:6001/api/s/${validToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signatureData: 'data:image/png;base64,abc',
        studentId: 'someone-else',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ token: validToken }) });
    expect(response.status).toBe(403);
  });

  it('signs an existing pending row', async () => {
    const { POST } = await import('@/app/api/s/[token]/route');
    mockPrismaClient.formSignLink.findUnique.mockResolvedValue(signLink());
    const pending = {
      id: 'sub-1',
      status: 'PENDING',
      student: { id: 'student-1', name: 'Ada Chen' },
    };
    mockPrismaClient.formSubmission.findUnique.mockResolvedValue(pending);
    mockPrismaClient.formSubmission.update.mockResolvedValue({
      ...pending,
      status: 'SIGNED',
    });
    mockPrismaClient.$transaction.mockImplementation(
      async (fn: (tx: typeof mockPrismaClient) => unknown) => fn(mockPrismaClient)
    );

    const request = new NextRequest(`http://localhost:6001/api/s/${validToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signatureData: 'data:image/png;base64,abc',
        studentId: 'student-1',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ token: validToken }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockPrismaClient.formSubmission.update).toHaveBeenCalled();
  });
});
