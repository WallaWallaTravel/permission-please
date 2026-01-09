import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendReminder } from '@/lib/email/resend';
import { logger } from '@/lib/logger';

// Secret key to protect the cron endpoint
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * POST /api/cron/send-reminders
 *
 * Sends reminder emails to parents with pending permission forms.
 * Should be triggered by a cron job (e.g., Vercel Cron, external scheduler).
 *
 * Sends reminders for:
 * - Forms due in 2 days (first reminder)
 * - Forms due in 1 day (urgent reminder)
 * - Forms due today (final reminder)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret if configured
    if (CRON_SECRET) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Only run if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: false,
        message: 'Email service not configured',
      });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const twoDaysFromNow = new Date(today);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Find pending submissions with deadlines in the next 2 days
    const pendingSubmissions = await prisma.formSubmission.findMany({
      where: {
        status: 'PENDING',
        form: {
          status: 'ACTIVE',
          deadline: {
            gte: today,
            lt: threeDaysFromNow,
          },
        },
      },
      include: {
        form: {
          include: {
            teacher: { select: { name: true } },
            school: { select: { name: true } },
          },
        },
        parent: {
          select: { id: true, email: true, name: true },
        },
        student: {
          select: { id: true, name: true },
        },
      },
    });

    if (pendingSubmissions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No reminders to send',
        stats: { total: 0, sent: 0, errors: 0 },
      });
    }

    // Group by parent to avoid sending multiple emails
    const parentReminders = new Map<
      string,
      {
        parent: { id: string; email: string; name: string };
        submissions: Array<{
          studentName: string;
          formTitle: string;
          eventDate: Date;
          deadline: Date;
          teacherName: string;
          schoolName?: string;
          daysRemaining: number;
          signUrl: string;
        }>;
      }
    >();

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:6001';

    for (const submission of pendingSubmissions) {
      const deadline = new Date(submission.form.deadline);
      const daysRemaining = Math.ceil(
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const existing = parentReminders.get(submission.parent.id);
      const submissionData = {
        studentName: submission.student.name,
        formTitle: submission.form.title,
        eventDate: submission.form.eventDate,
        deadline: submission.form.deadline,
        teacherName: submission.form.teacher.name,
        schoolName: submission.form.school?.name,
        daysRemaining,
        signUrl: `${baseUrl}/parent/sign/${submission.form.id}`,
      };

      if (existing) {
        existing.submissions.push(submissionData);
      } else {
        parentReminders.set(submission.parent.id, {
          parent: submission.parent,
          submissions: [submissionData],
        });
      }
    }

    // Send reminder emails
    let sent = 0;
    let errors = 0;

    for (const [, data] of parentReminders) {
      // Send one email per form (for now, to keep it simple)
      for (const sub of data.submissions) {
        try {
          await sendReminder({
            parentEmail: data.parent.email,
            parentName: data.parent.name,
            studentName: sub.studentName,
            formTitle: sub.formTitle,
            eventDate: sub.eventDate,
            deadline: sub.deadline,
            signUrl: sub.signUrl,
            teacherName: sub.teacherName,
            schoolName: sub.schoolName,
            daysRemaining: sub.daysRemaining,
          });
          sent++;

          logger.info('Reminder email sent', {
            parentEmail: data.parent.email,
            formTitle: sub.formTitle,
            daysRemaining: sub.daysRemaining,
          });
        } catch (err) {
          errors++;
          logger.error('Failed to send reminder email', err as Error, {
            parentEmail: data.parent.email,
            formTitle: sub.formTitle,
          });
        }
      }

      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    logger.info('Reminder cron job completed', {
      total: pendingSubmissions.length,
      sent,
      errors,
    });

    return NextResponse.json({
      success: true,
      message: `Sent ${sent} reminder(s)`,
      stats: {
        total: pendingSubmissions.length,
        sent,
        errors,
      },
    });
  } catch (error) {
    logger.error('Reminder cron job failed', error as Error);
    return NextResponse.json(
      { error: 'Failed to send reminders' },
      { status: 500 }
    );
  }
}

// Also support GET for easy testing (protected by same secret)
export async function GET(request: NextRequest) {
  return POST(request);
}
