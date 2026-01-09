import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encode } from 'next-auth/jwt';
import { verifyMagicLinkToken, markMagicLinkTokenUsed } from '@/lib/tokens/magic-link';
import { applyRateLimit } from '@/lib/rate-limit';
import { auditLog, getRequestContext } from '@/lib/audit';
import { logger } from '@/lib/logger';

// GET - Verify magic link and create session
export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return redirectWithError('Missing token');
    }

    // Get request context for audit
    const { ipAddress, userAgent } = getRequestContext(request);

    // Verify token
    const user = await verifyMagicLinkToken(token);

    if (!user) {
      auditLog({
        action: 'MAGIC_LINK_VERIFY_FAILED',
        resourceType: 'MagicLinkToken',
        metadata: { token: token.substring(0, 8) + '...' },
        ipAddress,
        userAgent,
      });

      return redirectWithError('Invalid or expired link');
    }

    // Mark token as used (single-use enforcement)
    await markMagicLinkTokenUsed(token);

    // Create NextAuth JWT session
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      logger.error('NEXTAUTH_SECRET not configured');
      return redirectWithError('Server configuration error');
    }

    // Create JWT token compatible with NextAuth
    const jwtToken = await encode({
      token: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
      },
      secret,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Set the session cookie
    const cookieStore = await cookies();
    const isSecure = process.env.NODE_ENV === 'production';
    const cookieName = isSecure
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';

    cookieStore.set(cookieName, jwtToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Audit log successful verification
    auditLog({
      action: 'MAGIC_LINK_VERIFY',
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      resourceType: 'User',
      resourceId: user.id,
      ipAddress,
      userAgent,
    });

    logger.info('Magic link verified successfully', {
      userId: user.id,
      email: user.email,
    });

    // Redirect to parent pending page
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:6001';
    return NextResponse.redirect(`${baseUrl}/parent/pending`);
  } catch (error) {
    logger.error('Error verifying magic link', error as Error);
    return redirectWithError('An error occurred');
  }
}

function redirectWithError(message: string): NextResponse {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:6001';
  const errorUrl = `${baseUrl}/login?error=${encodeURIComponent(message)}&type=magic-link`;
  return NextResponse.redirect(errorUrl);
}
