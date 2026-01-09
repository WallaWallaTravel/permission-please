import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendReminder } from '@/lib/email/resend';
import { logger } from '@/lib/logger';

// Vercel Cron Job - runs every 2 hours to support hourly reminders
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 */2 * * *" }] }

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max for cron jobs

// Verify the request is from Vercel Cron
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');

  // In production, verify Vercel's CRON_SECRET
  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`;
  }

  // In development, allow without auth
  return process.env.NODE_ENV === 'development';
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

// Convert interval to hours for consistent comparison
function intervalToHours(interval: ReminderInterval): number {
  if (interval.unit === 'hours') {
    return interval.value;
  }
  return interval.value * 24;
}

// Check if a reminder should be sent based on time remaining and schedule
// Uses a tolerance window to account for cron timing variations
function shouldSendReminder(
  hoursRemaining: number,
  schedule: ReminderInterval[],
  toleranceHours: number = 2 // 2-hour window since cron runs every 2 hours
): ReminderInterval | null {
  for (const interval of schedule) {
    const targetHours = intervalToHours(interval);
    // Check if we're within the tolerance window of this reminder time
    if (hoursRemaining <= targetHours && hoursRemaining > targetHours - toleranceHours) {
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
      sent: 0
    });
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:6001';
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
        school: { select: { name: true } },
      },
    });

    if (activeForms.length === 0) {
      logger.info('No forms with upcoming deadlines');
      return NextResponse.json({
        success: true,
        message: 'No forms requiring reminders',
        sent: 0
      });
    }

    let totalSent = 0;
    let totalErrors = 0;
    const results: Array<{ formId: string; sent: number; errors: number; interval?: string }> = [];

    for (const form of activeForms) {
      // Parse the form's custom reminder schedule
      const schedule = parseReminderSchedule(form.reminderSchedule);

      // Calculate hours remaining until deadline
      const deadlineDate = new Date(form.deadline);
      const hoursRemaining = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Check if we should send a reminder based on the schedule
      const matchedInterval = shouldSendReminder(hoursRemaining, schedule);

      if (!matchedInterval) {
        continue;
      }

      // Get all pending submissions for this form
      const pendingSubmissions = await prisma.formSubmission.findMany({
        where: {
          formId: form.id,
          status: 'PENDING',
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

      const signUrl = `${baseUrl}/parent/sign/${form.id}`;
      let formSent = 0;
      let formErrors = 0;

      // Calculate display values for the reminder
      const daysRemaining = matchedInterval.unit === 'days'
        ? matchedInterval.value
        : undefined;
      const hoursRemainingDisplay = matchedInterval.unit === 'hours'
        ? matchedInterval.value
        : undefined;

      // Send reminders in batches to avoid rate limits
      const batchSize = 5;
      for (let i = 0; i < pendingSubmissions.length; i += batchSize) {
        const batch = pendingSubmissions.slice(i, i + batchSize);

        await Promise.allSettled(
          batch.map(async (submission) => {
            try {
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
                daysRemaining,
                hoursRemaining: hoursRemainingDisplay,
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
