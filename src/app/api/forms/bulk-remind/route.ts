import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { sendReminder } from '@/lib/email/resend';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { upsertSignLink, signLinkUrl } from '@/lib/tokens/sign-link';
import { schoolCanSend } from '@/lib/auth/license';

// POST /api/forms/bulk-remind - Send reminders for multiple forms
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { formIds } = body;

    if (!Array.isArray(formIds) || formIds.length === 0) {
      return NextResponse.json({ error: 'formIds must be a non-empty array' }, { status: 400 });
    }

    if (formIds.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 forms per batch' }, { status: 400 });
    }

    // Fetch forms that belong to this teacher (or shared with edit access)
    const forms = await prisma.permissionForm.findMany({
      where: {
        id: { in: formIds },
        status: 'ACTIVE',
        ...(user.role === 'ADMIN' && user.schoolId
          ? { schoolId: user.schoolId }
          : {
              OR: [
                { teacherId: user.id },
                { shares: { some: { userId: user.id, canEdit: true } } },
              ],
            }),
      },
      include: {
        teacher: { select: { name: true } },
        school: { select: { isActive: true, licensedThrough: true } },
        submissions: {
          where: { status: 'PENDING' },
          include: {
            parent: { select: { email: true, name: true } },
            student: { select: { name: true } },
          },
        },
      },
    });

    let totalSent = 0;
    let totalErrors = 0;

    for (const form of forms) {
      if (!schoolCanSend(form.school).ok) {
        continue;
      }

      const deadline = new Date(form.deadline);
      const now = new Date();
      const hoursRemaining = Math.max(
        0,
        Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60))
      );
      const daysRemaining = Math.ceil(hoursRemaining / 24);

      // Send in batches of 5 with 200ms delay (matching cron pattern)
      for (let i = 0; i < form.submissions.length; i += 5) {
        const batch = form.submissions.slice(i, i + 5);

        const results = await Promise.allSettled(
          batch.map(async (submission) => {
            const token = await upsertSignLink(form.id, submission.parentId, deadline);
            return sendReminder({
              parentEmail: submission.parent.email,
              parentName: submission.parent.name || 'Parent',
              studentName: submission.student.name,
              formTitle: form.title,
              eventDate: new Date(form.eventDate),
              deadline,
              signUrl: signLinkUrl(token),
              teacherName: form.teacher.name || 'Teacher',
              daysRemaining,
              hoursRemaining,
            });
          })
        );

        for (const result of results) {
          if (result.status === 'fulfilled') {
            totalSent++;
          } else {
            totalErrors++;
            logger.error('Bulk remind email failed', result.reason);
          }
        }

        // Rate limiting delay between batches
        if (i + 5 < form.submissions.length) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalSent,
      totalErrors,
      formsProcessed: forms.length,
    });
  } catch (error) {
    logger.error('Error in bulk remind', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
