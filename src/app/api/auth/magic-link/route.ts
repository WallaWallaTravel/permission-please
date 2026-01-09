import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendMagicLinkEmail } from '@/lib/email/resend';
import { generateMagicLinkToken, canSendMagicLink } from '@/lib/tokens/magic-link';
import { applyRateLimit } from '@/lib/rate-limit';
import { auditLog, getRequestContext } from '@/lib/audit';
import { logger } from '@/lib/logger';

// POST - Request a magic link
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, 'magicLink');
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get request context for audit
    const { ipAddress, userAgent } = getRequestContext(request);

    // Check if user exists and is a PARENT
    const canSend = await canSendMagicLink(normalizedEmail);

    // Always return success to prevent email enumeration
    // But only actually send if user exists and is a parent
    if (canSend) {
      // Get user info for email
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { name: true },
      });

      // Generate magic link token
      const token = await generateMagicLinkToken(normalizedEmail);

      // Build magic link URL
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:6001';
      const magicLinkUrl = `${baseUrl}/api/auth/magic-link/verify?token=${token}`;

      // Send email (only if Resend is configured)
      if (process.env.RESEND_API_KEY) {
        await sendMagicLinkEmail({
          email: normalizedEmail,
          name: user?.name || 'Parent',
          magicLinkUrl,
        });
      }

      // Audit log magic link request
      auditLog({
        action: 'MAGIC_LINK_REQUEST',
        userEmail: normalizedEmail,
        userRole: 'PARENT',
        resourceType: 'MagicLinkToken',
        metadata: { sent: true },
        ipAddress,
        userAgent,
      });

      logger.info('Magic link sent', { email: normalizedEmail });
    } else {
      // Still audit even when not sent (security monitoring)
      auditLog({
        action: 'MAGIC_LINK_REQUEST',
        userEmail: normalizedEmail,
        resourceType: 'MagicLinkToken',
        metadata: { sent: false, reason: 'not_parent_or_not_found' },
        ipAddress,
        userAgent,
      });

      logger.info('Magic link not sent - user not found or not a parent', {
        email: normalizedEmail,
      });
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a login link shortly.',
    });
  } catch (error) {
    logger.error('Error processing magic link request', error as Error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
