import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

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

const mockAuditLog = vi.fn();
vi.mock('@/lib/audit', () => ({
  auditLog: (...args: unknown[]) => mockAuditLog(...args),
  getRequestContext: () => ({ ipAddress: '1.2.xxx.xxx', userAgent: 'test' }),
}));

const mockSendDeletionRequestNotice = vi.fn();
vi.mock('@/lib/email/resend', () => ({
  sendDeletionRequestNotice: (...args: unknown[]) => mockSendDeletionRequestNotice(...args),
}));

const validBody = {
  requesterEmail: 'parent@example.com',
  requesterName: 'Alex Parent',
  schoolName: 'Lincoln',
  subjectType: 'parent',
  details: 'Please delete my account and my child records.',
};

describe('POST /api/privacy/delete-request', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditLog.mockResolvedValue(undefined);
    mockSendDeletionRequestNotice.mockResolvedValue({ emailed: true });
  });

  it('records the request, emails privacy, and does not delete data', async () => {
    const { POST } = await import('@/app/api/privacy/delete-request/route');

    const request = new NextRequest('http://localhost:6001/api/privacy/delete-request', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toMatch(/does not delete data automatically/i);
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DATA_DELETION_REQUEST',
        userEmail: 'parent@example.com',
        metadata: expect.objectContaining({
          schoolName: 'Lincoln',
          subjectType: 'parent',
        }),
      })
    );
    expect(mockSendDeletionRequestNotice).toHaveBeenCalledWith(
      expect.objectContaining({
        requesterEmail: 'parent@example.com',
        details: validBody.details,
      })
    );
  });

  it('returns 400 for invalid input', async () => {
    const { POST } = await import('@/app/api/privacy/delete-request/route');

    const request = new NextRequest('http://localhost:6001/api/privacy/delete-request', {
      method: 'POST',
      body: JSON.stringify({ requesterEmail: 'not-an-email', details: 'short' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(mockAuditLog).not.toHaveBeenCalled();
    expect(mockSendDeletionRequestNotice).not.toHaveBeenCalled();
  });

  it('ignores honeypot submissions without logging or emailing', async () => {
    const { POST } = await import('@/app/api/privacy/delete-request/route');

    const request = new NextRequest('http://localhost:6001/api/privacy/delete-request', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, website: 'https://spam.test' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockAuditLog).not.toHaveBeenCalled();
    expect(mockSendDeletionRequestNotice).not.toHaveBeenCalled();
  });

  it('still succeeds if the notice email fails after the audit log', async () => {
    mockSendDeletionRequestNotice.mockRejectedValue(new Error('Resend down'));
    const { POST } = await import('@/app/api/privacy/delete-request/route');

    const request = new NextRequest('http://localhost:6001/api/privacy/delete-request', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockAuditLog).toHaveBeenCalled();
  });
});
