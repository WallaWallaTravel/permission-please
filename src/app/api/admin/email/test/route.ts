import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/utils';
import { Resend } from 'resend';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// POST /api/admin/email/test - Send a test email
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, 'email');
  if (rateLimited) return rateLimited;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'RESEND_API_KEY not configured',
          instructions: 'Add RESEND_API_KEY to your environment variables in Vercel',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const resend = new Resend(apiKey);
    const fromEmail = process.env.FROM_EMAIL || 'Permission Please <noreply@permissionplease.app>';

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject: 'Test Email from Permission Please',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px;">
            <div style="max-width: 500px; margin: 0 auto; background: #f8fafc; padding: 30px; border-radius: 12px;">
              <h1 style="color: #1e3a5f; margin: 0 0 20px 0;">✅ Email Test Successful!</h1>
              <p style="color: #333; line-height: 1.6;">
                This is a test email from <strong>Permission Please</strong>.
              </p>
              <p style="color: #333; line-height: 1.6;">
                If you received this, your email configuration is working correctly.
              </p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
              <p style="color: #64748b; font-size: 12px;">
                Sent at: ${new Date().toISOString()}
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      return NextResponse.json({ error: `Failed to send: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      emailId: data?.id,
    });
  } catch (error) {
    logger.error('Error sending test email', error as Error);
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
  }
}
