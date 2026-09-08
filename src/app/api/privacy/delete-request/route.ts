import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/rate-limit';
import { auditLog, getRequestContext } from '@/lib/audit';
import { sendDeletionRequestNotice } from '@/lib/email/resend';
import { logger } from '@/lib/logger';

const deleteRequestSchema = z.object({
  requesterEmail: z.string().email().max(200),
  requesterName: z.string().trim().max(200).optional(),
  schoolName: z.string().trim().max(200).optional(),
  subjectType: z.enum(['parent', 'student', 'school', 'other']),
  details: z.string().trim().min(10).max(2000),
  website: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, 'privacyRequest');
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const parsed = deleteRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Honeypot: pretend success so bots do not retry
    if (parsed.data.website) {
      return NextResponse.json({
        success: true,
        message: 'Request received. We will follow up by email.',
      });
    }

    const { requesterEmail, requesterName, schoolName, subjectType, details } = parsed.data;
    const context = getRequestContext(request);

    await auditLog({
      action: 'DATA_DELETION_REQUEST',
      userEmail: requesterEmail,
      resourceType: 'Privacy',
      metadata: {
        requesterName: requesterName || null,
        schoolName: schoolName || null,
        subjectType,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    try {
      await sendDeletionRequestNotice({
        requesterEmail,
        requesterName,
        schoolName,
        subjectType,
        details,
      });
    } catch (error) {
      logger.error('Deletion request email failed after audit', error as Error);
    }

    return NextResponse.json({
      success: true,
      message:
        'Request received. We will follow up by email. This form does not delete data automatically.',
    });
  } catch (error) {
    logger.error('Deletion request failed', error as Error);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}
