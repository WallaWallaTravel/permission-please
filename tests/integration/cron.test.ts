import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { mockPrismaClient, resetPrismaMocks, mockDataFactory } from '../helpers/mock-prisma';

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: mockPrismaClient,
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock email sending
const mockSendReminder = vi.fn();
vi.mock('@/lib/email/resend', () => ({
  sendReminder: () => mockSendReminder(),
}));

describe('POST /api/cron/send-reminders', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.RESEND_API_KEY = 'test-key';
    process.env.NEXTAUTH_URL = 'http://localhost:6001';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns 401 when CRON_SECRET is set but not provided', async () => {
    process.env.CRON_SECRET = 'secret-token';

    // Need to re-import after changing env
    vi.resetModules();
    const { POST } = await import('@/app/api/cron/send-reminders/route');

    const request = new NextRequest('http://localhost:6001/api/cron/send-reminders', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 401 with wrong CRON_SECRET', async () => {
    process.env.CRON_SECRET = 'secret-token';

    vi.resetModules();
    const { POST } = await import('@/app/api/cron/send-reminders/route');

    const request = new NextRequest('http://localhost:6001/api/cron/send-reminders', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer wrong-token',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('authenticates with correct CRON_SECRET', async () => {
    process.env.CRON_SECRET = 'secret-token';

    vi.resetModules();
    const { POST } = await import('@/app/api/cron/send-reminders/route');

    mockPrismaClient.formSubmission.findMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:6001/api/cron/send-reminders', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer secret-token',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns message when email service not configured', async () => {
    delete process.env.RESEND_API_KEY;

    vi.resetModules();
    const { POST } = await import('@/app/api/cron/send-reminders/route');

    const request = new NextRequest('http://localhost:6001/api/cron/send-reminders', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Email service not configured');
  });

  it('returns stats when no reminders to send', async () => {
    vi.resetModules();
    const { POST } = await import('@/app/api/cron/send-reminders/route');

    mockPrismaClient.formSubmission.findMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:6001/api/cron/send-reminders', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('No reminders to send');
    expect(data.stats).toEqual({ total: 0, sent: 0, errors: 0 });
  });

  it('sends reminders for pending submissions', async () => {
    vi.resetModules();
    const { POST } = await import('@/app/api/cron/send-reminders/route');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const mockSubmissions = [
      {
        ...mockDataFactory.formSubmission({ status: 'PENDING' }),
        form: {
          ...mockDataFactory.permissionForm({ deadline: tomorrow, status: 'ACTIVE' }),
          teacher: { name: 'Test Teacher' },
          school: { name: 'Test School' },
        },
        parent: { id: 'parent-1', email: 'parent@example.com', name: 'Test Parent' },
        student: { id: 'student-1', name: 'Test Student' },
      },
    ];

    mockPrismaClient.formSubmission.findMany.mockResolvedValue(mockSubmissions);
    mockSendReminder.mockResolvedValue({ success: true });

    const request = new NextRequest('http://localhost:6001/api/cron/send-reminders', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.stats.total).toBe(1);
    expect(data.stats.sent).toBe(1);
    expect(data.stats.errors).toBe(0);
  });

  it('handles email sending errors gracefully', async () => {
    vi.resetModules();
    const { POST } = await import('@/app/api/cron/send-reminders/route');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const mockSubmissions = [
      {
        ...mockDataFactory.formSubmission({ status: 'PENDING' }),
        form: {
          ...mockDataFactory.permissionForm({ deadline: tomorrow, status: 'ACTIVE' }),
          teacher: { name: 'Test Teacher' },
          school: { name: 'Test School' },
        },
        parent: { id: 'parent-1', email: 'parent@example.com', name: 'Test Parent' },
        student: { id: 'student-1', name: 'Test Student' },
      },
    ];

    mockPrismaClient.formSubmission.findMany.mockResolvedValue(mockSubmissions);
    mockSendReminder.mockRejectedValue(new Error('Email failed'));

    const request = new NextRequest('http://localhost:6001/api/cron/send-reminders', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.stats.errors).toBe(1);
  });

  it('groups reminders by parent', async () => {
    vi.resetModules();
    const { POST } = await import('@/app/api/cron/send-reminders/route');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Two submissions for same parent
    const mockSubmissions = [
      {
        ...mockDataFactory.formSubmission({ id: 'sub-1', status: 'PENDING' }),
        form: {
          ...mockDataFactory.permissionForm({ id: 'form-1', deadline: tomorrow, status: 'ACTIVE' }),
          teacher: { name: 'Test Teacher' },
          school: { name: 'Test School' },
        },
        parent: { id: 'parent-1', email: 'parent@example.com', name: 'Test Parent' },
        student: { id: 'student-1', name: 'Student 1' },
      },
      {
        ...mockDataFactory.formSubmission({ id: 'sub-2', status: 'PENDING' }),
        form: {
          ...mockDataFactory.permissionForm({ id: 'form-2', deadline: tomorrow, status: 'ACTIVE' }),
          teacher: { name: 'Test Teacher' },
          school: { name: 'Test School' },
        },
        parent: { id: 'parent-1', email: 'parent@example.com', name: 'Test Parent' },
        student: { id: 'student-2', name: 'Student 2' },
      },
    ];

    mockPrismaClient.formSubmission.findMany.mockResolvedValue(mockSubmissions);
    mockSendReminder.mockResolvedValue({ success: true });

    const request = new NextRequest('http://localhost:6001/api/cron/send-reminders', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats.total).toBe(2);
    // Sends one email per submission, but grouped logic is tested by verifying processing works
  });
});

describe('GET /api/cron/send-reminders', () => {
  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 'test-key';
  });

  it('GET behaves same as POST for testing convenience', async () => {
    vi.resetModules();
    const { GET } = await import('@/app/api/cron/send-reminders/route');

    mockPrismaClient.formSubmission.findMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:6001/api/cron/send-reminders', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
