/**
 * Audit Logging System for Permission Please
 *
 * FERPA/COPPA Compliance Requirement:
 * Schools must maintain records of who accessed student data and when.
 * This system logs all significant actions for compliance and security.
 */

import { prisma } from './db';
import { logger } from './logger';

export type AuditAction =
  // Authentication
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_SIGNUP'
  | 'GOOGLE_LOGIN'
  | 'MAGIC_LINK_REQUEST'
  | 'MAGIC_LINK_VERIFY'
  | 'MAGIC_LINK_VERIFY_FAILED'
  // Forms
  | 'FORM_CREATE'
  | 'FORM_UPDATE'
  | 'FORM_DELETE'
  | 'FORM_VIEW'
  | 'FORM_DISTRIBUTE'
  // Signatures
  | 'SIGNATURE_SUBMIT'
  | 'SIGNATURE_VIEW'
  // Students
  | 'STUDENT_CREATE'
  | 'STUDENT_UPDATE'
  | 'STUDENT_DELETE'
  | 'STUDENT_LINK_PARENT'
  // Data Export
  | 'DATA_EXPORT'
  | 'REPORT_GENERATE';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

interface AuditLogParams {
  action: AuditAction;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  severity?: AuditSeverity;
  success?: boolean;
  errorMessage?: string;
}

// Severity mapping for actions
const actionSeverity: Record<AuditAction, AuditSeverity> = {
  USER_LOGIN: 'low',
  USER_LOGOUT: 'low',
  USER_SIGNUP: 'medium',
  GOOGLE_LOGIN: 'low',
  MAGIC_LINK_REQUEST: 'medium',
  MAGIC_LINK_VERIFY: 'medium',
  MAGIC_LINK_VERIFY_FAILED: 'medium',
  FORM_CREATE: 'low',
  FORM_UPDATE: 'medium',
  FORM_DELETE: 'high',
  FORM_VIEW: 'low',
  FORM_DISTRIBUTE: 'medium',
  SIGNATURE_SUBMIT: 'high',
  SIGNATURE_VIEW: 'low',
  STUDENT_CREATE: 'medium',
  STUDENT_UPDATE: 'medium',
  STUDENT_DELETE: 'high',
  STUDENT_LINK_PARENT: 'high',
  DATA_EXPORT: 'critical',
  REPORT_GENERATE: 'medium',
};

/**
 * Log an audit event
 *
 * For schools/FERPA compliance, all significant actions involving
 * student data must be logged with:
 * - Who performed the action
 * - What action was taken
 * - When it occurred
 * - What data was affected
 */
export async function auditLog(params: AuditLogParams): Promise<void> {
  const {
    action,
    userId,
    userEmail,
    userRole,
    resourceType,
    resourceId,
    metadata = {},
    ipAddress,
    userAgent,
    severity = actionSeverity[params.action] || 'low',
    success = true,
    errorMessage,
  } = params;

  const auditEntry = {
    timestamp: new Date().toISOString(),
    action,
    userId,
    userEmail,
    userRole,
    resourceType,
    resourceId,
    metadata,
    ipAddress: ipAddress ? maskIpAddress(ipAddress) : undefined,
    userAgent: userAgent ? truncateUserAgent(userAgent) : undefined,
    severity,
    success,
    errorMessage,
  };

  // Log to console/log aggregation
  const logLevel = success ? 'info' : 'warn';
  logger[logLevel](`AUDIT: ${action}`, {
    audit: auditEntry,
  });

  // Persist audit log to database
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity: resourceType || 'System',
        entityId: resourceId || null,
        metadata: {
          ...metadata,
          userEmail,
          userRole,
          severity,
          success,
          errorMessage,
          userAgent: userAgent ? truncateUserAgent(userAgent) : undefined,
        },
        ipAddress: ipAddress ? maskIpAddress(ipAddress) : null,
      },
    });
  } catch (error) {
    // Audit logging should never fail silently in compliance scenarios
    logger.error('Failed to persist audit log', error as Error, { auditEntry });
  }
}

/**
 * Mask IP address for privacy (keep first octets for geo-location)
 */
function maskIpAddress(ip: string): string {
  if (ip.includes('.')) {
    // IPv4: Keep first two octets
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  } else if (ip.includes(':')) {
    // IPv6: Keep first two groups
    const parts = ip.split(':');
    return `${parts[0]}:${parts[1]}:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx`;
  }
  return 'unknown';
}

/**
 * Truncate user agent to reasonable length
 */
function truncateUserAgent(ua: string): string {
  return ua.length > 200 ? ua.substring(0, 200) + '...' : ua;
}

/**
 * Helper to extract request context for audit logging
 */
export function getRequestContext(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return { ipAddress, userAgent };
}

/**
 * Create audit logger for a specific user session
 */
export function createSessionAuditLogger(
  userId: string,
  userEmail: string,
  userRole: string,
  ipAddress?: string,
  userAgent?: string
) {
  return {
    log: (
      action: AuditAction,
      resourceType?: string,
      resourceId?: string,
      metadata?: Record<string, unknown>,
      success?: boolean,
      errorMessage?: string
    ) =>
      auditLog({
        action,
        userId,
        userEmail,
        userRole,
        resourceType,
        resourceId,
        metadata,
        ipAddress,
        userAgent,
        success,
        errorMessage,
      }),
  };
}
