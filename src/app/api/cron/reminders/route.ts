import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendReminder } from '@/lib/email/resend';
import { logger } from '@/lib/logger';
import { upsertSignLink, signLinkUrl } from '@/lib/tokens/sign-link';
import { schoolCanSend } from '@/lib/auth/license';

// Vercel Cron Job - daily at 09:00 UTC (see vercel.json)
// Day-based reminders match calendar days so a daily cron cannot miss the window.

export const runtime = 'nodejs';
export const maxDuration = 60;

function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.CRON_SECRET) {
      return false;
    }
    return authHeader === `Bearer ${process.env.CRON_SECRET}`;
  }

  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`;
  }

  return true;
}

// Types for reminder schedule
interface ReminderInterval {
  value: number;
  unit: 'days' | 'hours';
}

// Default schedule if none set: 7 days, 3 days, 1 day before deadline
const DEFAULT_SCHEDULE: ReminderInterval[] = [
  { value: 7, unit: 'days' },
  { value: 3, unit: 'days' },
  { value: 1, unit: 'days' },
];

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function calendarDaysRemaining(deadline: Date, now: Date): number {
  const start = startOfUtcDay(now).getTime();
  const end = startOfUtcDay(deadline).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

function shouldSendReminder(
  daysRemaining: number,
  schedule: ReminderInterval[]
): ReminderInterval | null {
  for (const interval of schedule) {
    if (interval.unit === 'days' && daysRemaining === interval.value) {
      return interval;
    }
    if (interval.unit === 'hours' && daysRemaining === 0 && interval.value <= 24) {
      return interval;
    }
  }
  return null;
}

// Parse reminder schedule from JSON, with fallback to default
function parseReminderSchedule(scheduleJson: unknown): ReminderInterval[] {
  if (!scheduleJson) {
    return DEFAULT_SCHEDULE;
  }

  try {
    const schedule = Array.isArray(scheduleJson) ? scheduleJson : JSON.parse(String(scheduleJson));

    if (!Array.isArray(schedule)) {
      return DEFAULT_SCHEDULE;
    }

    return schedule.filter((item): item is ReminderInterval => {
      return (
        typeof item === 'object' &&
        item !== null &&
        typeof item.value === 'number' &&
        (item.unit === 'days' || item.unit === 'hours')
      );
    });
  } catch {
    return DEFAULT_SCHEDULE;
  }
}

export async function GET(request: NextRequest) {
  // Verify cron authorization
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if email service is configured
  if (!process.env.RESEND_API_KEY) {
    logger.warn('Reminder cron skipped: RESEND_API_KEY not configured');
    return NextResponse.json({
      success: true,
      message: 'Skipped - email service not configured',
      sent: 0,
    });
  }

  const now = new Date();

  try {
    // Find all active forms with reminders enabled and deadlines within the next 8 days
    // (8 days to cover 7-day reminder with buffer)
    const eightDaysFromNow = new Date(now);
    eightDaysFromNow.setDate(eightDaysFromNow.getDate() + 8);
    eightDaysFromNow.setHours(23, 59, 59, 999);

    const activeForms = await prisma.permissionForm.findMany({
      where: {
        status: 'ACTIVE',
        remindersEnabled: true,
        deadline: {
          gte: now,
          lte: eightDaysFromNow,
        },
      },
      select: {
        id: true,
        title: true,
        deadline: true,
        eventDate: true,
        reminderSchedule: true,
        teacher: { select: { name: true } },
        school: { select: { name: true, isActive: true, licensedThrough: true } },
      },
    });

    if (activeForms.length === 0) {
      logger.info('No forms with upcoming deadlines');
      return NextResponse.json({
        success: true,
        message: 'No forms requiring reminders',
        sent: 0,
      });
    }

    let totalSent = 0;
    let totalErrors = 0;
    const results: Array<{ formId: string; sent: number; errors: number; interval?: string }> = [];

    for (const form of activeForms) {
      if (!schoolCanSend(form.school).ok) {
        continue;
      }

      // Parse the form's custom reminder schedule
      const schedule = parseReminderSchedule(form.reminderSchedule);

      const deadlineDate = new Date(form.deadline);
      const daysRemaining = calendarDaysRemaining(deadlineDate, now);
      const matchedInterval = shouldSendReminder(daysRemaining, schedule);

      if (!matchedInterval) {
        continue;
      }

      const pendingSubmissions = await prisma.formSubmission.findMany({
        where: {
          formId: form.id,
          status: 'PENDING',
          OR: [{ lastRemindedAt: null }, { lastRemindedAt: { lt: startOfUtcDay(now) } }],
        },
        include: {
          parent: {
            select: { id: true, email: true, name: true },
          },
          student: {
            select: { name: true },
          },
        },
      });

      if (pendingSubmissions.length === 0) {
        continue;
      }

      const signUrlByParent = new Map<string, string>();
      let formSent = 0;
      let formErrors = 0;

      const daysRemainingDisplay =
        matchedInterval.unit === 'days' ? matchedInterval.value : daysRemaining;
      const hoursRemainingDisplay =
        matchedInterval.unit === 'hours' ? matchedInterval.value : undefined;

      // Send reminders in batches to avoid rate limits
      const batchSize = 5;
      for (let i = 0; i < pendingSubmissions.length; i += batchSize) {
        const batch = pendingSubmissions.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async (submission) => {
            try {
              let signUrl = signUrlByParent.get(submission.parent.id);
              if (!signUrl) {
                const token = await upsertSignLink(form.id, submission.parent.id, deadlineDate);
                signUrl = signLinkUrl(token);
                signUrlByParent.set(submission.parent.id, signUrl);
              }
              await sendReminder({
                parentEmail: submission.parent.email,
                parentName: submission.parent.name,
                studentName: submission.student.name,
                formTitle: form.title,
                eventDate: form.eventDate,
                deadline: deadlineDate,
                signUrl,
                teacherName: form.teacher.name,
                schoolName: form.school?.name,
                daysRemaining: daysRemainingDisplay,
                hoursRemaining: hoursRemainingDisplay,
              });
              await prisma.formSubmission.update({
                where: { id: submission.id },
                data: { lastRemindedAt: now },
              });
              formSent++;
            } catch (err) {
              logger.error(`Failed to send reminder to ${submission.parent.email}`, err as Error);
              formErrors++;
            }
          })
        );

        // Small delay between batches to avoid rate limits
        if (i + batchSize < pendingSubmissions.length) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      totalSent += formSent;
      totalErrors += formErrors;
      results.push({
        formId: form.id,
        sent: formSent,
        errors: formErrors,
        interval: `${matchedInterval.value} ${matchedInterval.unit}`,
      });

      const intervalText = `${matchedInterval.value} ${matchedInterval.unit}`;
      logger.info(`Sent ${formSent} reminders for form ${form.id} (${intervalText} remaining)`);
    }

    logger.info(`Reminder cron completed: ${totalSent} sent, ${totalErrors} errors`);

    return NextResponse.json({
      success: true,
      message: `Sent ${totalSent} reminder(s)`,
      sent: totalSent,
      errors: totalErrors,
      results,
    });
  } catch (error) {
    logger.error('Reminder cron failed', error as Error);
    return NextResponse.json(
      { error: 'Failed to process reminders', details: (error as Error).message },
      { status: 500 }
    );
  }
}
