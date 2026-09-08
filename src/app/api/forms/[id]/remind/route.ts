import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { assertCanManageForm, authzResponse } from '@/lib/auth/school-access';
import { sendReminder } from '@/lib/email/resend';
import { upsertSignLink, signLinkUrl } from '@/lib/tokens/sign-link';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { assertSchoolCanSend } from '@/lib/auth/license';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const rateLimited = applyRateLimit(request, 'email');
  if (rateLimited) return rateLimited;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const submissionId = body.submissionId as string | undefined;

    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required' }, { status: 400 });
    }

    const form = await prisma.permissionForm.findUnique({
      where: { id },
      include: {
        teacher: { select: { name: true } },
        school: { select: { name: true, isActive: true, licensedThrough: true } },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    await assertCanManageForm(user, form);
    assertSchoolCanSend(form.school);

    if (form.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Form is not active' }, { status: 400 });
    }

    const submission = await prisma.formSubmission.findUnique({
      where: { id: submissionId },
      include: {
        parent: { select: { id: true, email: true, name: true } },
        student: { select: { name: true } },
      },
    });

    if (!submission || submission.formId !== id) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.status !== 'PENDING') {
      return NextResponse.json({ error: 'This slip is already signed' }, { status: 400 });
    }

    const token = await upsertSignLink(form.id, submission.parentId, form.deadline);
    const signUrl = signLinkUrl(token);

    const deadline = new Date(form.deadline);
    const hoursRemaining = Math.max(
      0,
      Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60))
    );
    const daysRemaining = Math.ceil(hoursRemaining / 24);

    await sendReminder({
      parentEmail: submission.parent.email,
      parentName: submission.parent.name || 'Parent',
      studentName: submission.student.name,
      formTitle: form.title,
      eventDate: form.eventDate,
      deadline,
      signUrl,
      teacherName: form.teacher.name || 'Teacher',
      schoolName: form.school?.name,
      daysRemaining,
      hoursRemaining,
    });

    await prisma.formSubmission.update({
      where: { id: submission.id },
      data: { lastRemindedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: `Reminder sent to ${submission.parent.email}`,
    });
  } catch (error) {
    const authz = authzResponse(error);
    if (authz) return authz;
    logger.error('Error sending reminder', error as Error);
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 });
  }
}
