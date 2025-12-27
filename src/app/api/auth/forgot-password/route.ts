import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import crypto from 'crypto';
import { withRateLimit } from '@/lib/rate-limit';
import { sendPasswordResetEmail } from '@/lib/email/resend';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

async function forgotPasswordHandler(request: Request) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    });

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Return success even if user doesn't exist (prevent enumeration)
      return successResponse;
    }

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: email.toLowerCase() },
    });

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Create reset token
    await prisma.passwordResetToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        expiresAt,
      },
    });

    // Send email (async, don't block response)
    if (process.env.RESEND_API_KEY) {
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password/${token}`;
      sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetUrl,
      }).catch((err) => {
        console.error('Failed to send password reset email:', err);
      });
    }

    return successResponse;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// Apply strict rate limiting: 5 requests per minute
export const POST = withRateLimit(forgotPasswordHandler, { max: 5, windowMs: 60000 });
