import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { mockPrismaClient, resetPrismaMocks } from '../helpers/mock-prisma';

vi.mock('@/lib/db', () => ({
  prisma: mockPrismaClient,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

const mockSendReminder = vi.fn();
vi.mock('@/lib/email/resend', () => ({
  sendReminder: (...args: unknown[]) => mockSendReminder(...args),
}));

function deadlineInUtcDays(days: number): Date {
  const deadline = new Date();
  deadline.setUTCDate(deadline.getUTCDate() + days);
  deadline.setUTCHours(16, 0, 0, 0);
  return deadline;
}

function pendingSubmission(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-1',
    status: 'PENDING',
    lastRemindedAt: null,
    parent: { id: 'parent-1', email: 'parent@example.com', name: 'Test Parent' },
    student: { name: 'Test Student' },
    ...overrides,
  };
}

function reminderForm(overrides: Record<string, unknown> = {}) {
  return {
    id: 'form-1',
    title: 'Zoo Trip',
    deadline: deadlineInUtcDays(1),
    eventDate: deadlineInUtcDays(7),
    reminderSchedule: [{ value: 1, unit: 'days' }],
    teacher: { name: 'Test Teacher' },
    school: { name: 'Test School', isActive: true, licensedThrough: null },
    ...overrides,
  };
}

describe('GET /api/cron/reminders', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.RESEND_API_KEY = 'test-key';
    process.env.NEXTAUTH_URL = 'http://localhost:6001';
    delete process.env.CRON_SECRET;
    mockPrismaClient.formSignLink.findUnique.mockResolvedValue(null);
    mockPrismaClient.formSignLink.upsert.mockResolvedValue({ token: 'sign-token' });
    mockPrismaClient.formSubmission.update.mockResolvedValue({});
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns 401 when CRON_SECRET is set but not provided', async () => {
    process.env.CRON_SECRET = 'secret-token';
    vi.resetModules();
    const { GET } = await import('@/app/api/cron/reminders/route');

    const request = new NextRequest('http://localhost:6001/api/cron/reminders', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 401 with wrong CRON_SECRET', async () => {
    process.env.CRON_SECRET = 'secret-token';
    vi.resetModules();
    const { GET } = await import('@/app/api/cron/reminders/route');

    const request = new NextRequest('http://localhost:6001/api/cron/reminders', {
      method: 'GET',
      headers: { Authorization: 'Bearer wrong-token' },
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('authenticates with correct CRON_SECRET', async () => {
    process.env.CRON_SECRET = 'secret-token';
    vi.resetModules();
    const { GET } = await import('@/app/api/cron/reminders/route');

    mockPrismaClient.permissionForm.findMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:6001/api/cron/reminders', {
      method: 'GET',
      headers: { Authorization: 'Bearer secret-token' },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('skips when email service is not configured', async () => {
    delete process.env.RESEND_API_KEY;
    vi.resetModules();
    const { GET } = await import('@/app/api/cron/reminders/route');

    const request = new NextRequest('http://localhost:6001/api/cron/reminders', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Skipped - email service not configured');
    expect(data.sent).toBe(0);
  });

  it('returns when no forms need reminders', async () => {
    vi.resetModules();
    const { GET } = await import('@/app/api/cron/reminders/route');

    mockPrismaClient.permissionForm.findMany.mockResolvedValue([]);

    const request = new NextRequest('http://localhost:6001/api/cron/reminders', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('No forms requiring reminders');
    expect(data.sent).toBe(0);
  });

  it('sends reminders for pending submissions on a matching day', async () => {
    vi.resetModules();
    const { GET } = await import('@/app/api/cron/reminders/route');

    mockPrismaClient.permissionForm.findMany.mockResolvedValue([reminderForm()]);
    mockPrismaClient.formSubmission.findMany.mockResolvedValue([pendingSubmission()]);
    mockSendReminder.mockResolvedValue({ success: true });

    const request = new NextRequest('http://localhost:6001/api/cron/reminders', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.sent).toBe(1);
    expect(data.errors).toBe(0);
    expect(mockSendReminder).toHaveBeenCalledTimes(1);
  });

  it('handles email sending errors without failing the cron', async () => {
    vi.resetModules();
    const { GET } = await import('@/app/api/cron/reminders/route');

    mockPrismaClient.permissionForm.findMany.mockResolvedValue([reminderForm()]);
    mockPrismaClient.formSubmission.findMany.mockResolvedValue([pendingSubmission()]);
    mockSendReminder.mockRejectedValue(new Error('Email failed'));

    const request = new NextRequest('http://localhost:6001/api/cron/reminders', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.errors).toBe(1);
    expect(data.sent).toBe(0);
  });

  it('skips inactive or expired schools', async () => {
    vi.resetModules();
    const { GET } = await import('@/app/api/cron/reminders/route');

    mockPrismaClient.permissionForm.findMany.mockResolvedValue([
      reminderForm({
        id: 'expired-form',
        school: {
          name: 'Expired School',
          isActive: true,
          licensedThrough: new Date('2020-01-01'),
        },
      }),
      reminderForm({
        id: 'inactive-form',
        school: { name: 'Inactive School', isActive: false, licensedThrough: null },
      }),
    ]);

    const request = new NextRequest('http://localhost:6001/api/cron/reminders', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sent).toBe(0);
    expect(mockPrismaClient.formSubmission.findMany).not.toHaveBeenCalled();
    expect(mockSendReminder).not.toHaveBeenCalled();
  });
});

describe('POST /api/cron/send-reminders', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    resetPrismaMocks();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.RESEND_API_KEY = 'test-key';
    delete process.env.CRON_SECRET;
    mockPrismaClient.permissionForm.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('aliases to the live reminders handler', async () => {
    vi.resetModules();
    const { POST } = await import('@/app/api/cron/send-reminders/route');

    const request = new NextRequest('http://localhost:6001/api/cron/send-reminders', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('No forms requiring reminders');
  });
});
