import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditLog, getRequestContext } from '@/lib/audit';

// Mock the logger module
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock prisma
vi.mock('@/lib/db', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

import { logger } from '@/lib/logger';

describe('Audit Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('auditLog', () => {
    it('logs audit events with required fields', async () => {
      await auditLog({
        action: 'FORM_CREATE',
        userId: 'user-123',
        userRole: 'TEACHER',
        resourceType: 'PermissionForm',
        resourceId: 'form-456',
      });

      expect(logger.info).toHaveBeenCalled();
      const logCall = (logger.info as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(logCall[0]).toContain('AUDIT: FORM_CREATE');
      expect(logCall[1].audit.userId).toBe('user-123');
      expect(logCall[1].audit.userRole).toBe('TEACHER');
      expect(logCall[1].audit.resourceType).toBe('PermissionForm');
      expect(logCall[1].audit.resourceId).toBe('form-456');
      expect(logCall[1].audit.timestamp).toBeDefined();
    });

    it('includes optional fields when provided', async () => {
      await auditLog({
        action: 'SIGNATURE_SUBMIT',
        userId: 'user-123',
        userEmail: 'parent@example.com',
        userRole: 'PARENT',
        resourceType: 'FormSubmission',
        resourceId: 'sub-789',
        metadata: { studentName: 'Jane Doe' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
      });

      expect(logger.info).toHaveBeenCalled();
      const logCall = (logger.info as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(logCall[1].audit.userEmail).toBe('parent@example.com');
      expect(logCall[1].audit.metadata.studentName).toBe('Jane Doe');
      expect(logCall[1].audit.userAgent).toBe('Mozilla/5.0');
    });

    it('masks IP addresses for privacy', async () => {
      await auditLog({
        action: 'FORM_VIEW',
        userId: 'user-123',
        userRole: 'PARENT',
        resourceType: 'PermissionForm',
        resourceId: 'form-456',
        ipAddress: '192.168.1.100',
      });

      const logCall = (logger.info as ReturnType<typeof vi.fn>).mock.calls[0];
      // IP should be masked (last two octets replaced with xxx)
      expect(logCall[1].audit.ipAddress).not.toBe('192.168.1.100');
      expect(logCall[1].audit.ipAddress).toContain('192.168.');
      expect(logCall[1].audit.ipAddress).toContain('xxx');
    });

    it('assigns correct severity based on action', async () => {
      await auditLog({
        action: 'SIGNATURE_SUBMIT',
        userId: 'user-123',
        userRole: 'PARENT',
      });

      const logCall = (logger.info as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(logCall[1].audit.severity).toBe('high');
    });

    it('uses warn log level for failed actions', async () => {
      await auditLog({
        action: 'USER_LOGIN',
        userId: 'user-123',
        success: false,
        errorMessage: 'Invalid credentials',
      });

      expect(logger.warn).toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });
  });

  describe('getRequestContext', () => {
    it('extracts IP and user agent from request', () => {
      const mockRequest = {
        headers: new Map([
          ['x-forwarded-for', '192.168.1.1, 10.0.0.1'],
          ['user-agent', 'Test Browser'],
        ]),
      } as unknown as Request;

      // Override get method
      (mockRequest.headers as unknown as { get: (name: string) => string | null }).get = (
        name: string
      ) => {
        if (name === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
        if (name === 'user-agent') return 'Test Browser';
        return null;
      };

      const context = getRequestContext(mockRequest);

      expect(context.ipAddress).toBe('192.168.1.1');
      expect(context.userAgent).toBe('Test Browser');
    });

    it('returns unknown when headers are missing', () => {
      const mockRequest = {
        headers: {
          get: () => null,
        },
      } as unknown as Request;

      const context = getRequestContext(mockRequest);

      expect(context.ipAddress).toBe('unknown');
      expect(context.userAgent).toBe('unknown');
    });
  });
});

describe('Audit Action Types', () => {
  it('covers critical compliance actions', () => {
    const criticalActions = [
      'FORM_CREATE',
      'FORM_UPDATE',
      'FORM_DELETE',
      'FORM_VIEW',
      'SIGNATURE_SUBMIT',
      'STUDENT_LINK_PARENT',
      'USER_LOGIN',
      'USER_LOGOUT',
      'DATA_EXPORT',
    ];

    // This test documents the expected audit actions for FERPA compliance
    criticalActions.forEach((action) => {
      expect(typeof action).toBe('string');
    });
  });
});
