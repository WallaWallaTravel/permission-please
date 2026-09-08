import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSignLinkByToken } from '@/lib/tokens/sign-link';
import { sendSignatureConfirmation } from '@/lib/email/resend';
import { auditLog, getRequestContext } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/rate-limit';

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const rateLimited = applyRateLimit(request, 'signLink');
  if (rateLimited) return rateLimited;

  try {
    const { token } = await context.params;
    const link = await getSignLinkByToken(token);

    if (!link) {
      return NextResponse.json(
        { error: 'This signing link is invalid or has expired' },
        { status: 404 }
      );
    }

    if (link.form.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This form is no longer accepting signatures' },
        { status: 400 }
      );
    }

    const submissions = await prisma.formSubmission.findMany({
      where: {
        formId: link.formId,
        parentId: link.parentId,
      },
      include: {
        student: { select: { id: true, name: true, grade: true } },
      },
    });

    if (submissions.length === 0) {
      return NextResponse.json(
        { error: 'No permission slips found for this link' },
        { status: 400 }
      );
    }

    const students = submissions.map((sub) => ({
      id: sub.student.id,
      name: sub.student.name,
      grade: sub.student.grade,
      hasSigned: sub.status === 'SIGNED',
    }));

    const { ipAddress, userAgent } = getRequestContext(request);
    auditLog({
      action: 'FORM_VIEW',
      userId: link.parentId,
      userEmail: link.parent.email,
      userRole: 'PARENT',
      resourceType: 'PermissionForm',
      resourceId: link.formId,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      id: link.form.id,
      title: link.form.title,
      description: link.form.description,
      eventDate: link.form.eventDate,
      eventType: link.form.eventType,
      deadline: link.form.deadline,
      teacher: link.form.teacher,
      fields: link.form.fields,
      documents: link.form.documents,
      students,
    });
  } catch (error) {
    logger.error('Error loading sign link', error as Error);
    return NextResponse.json({ error: 'Failed to load form' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const rateLimited = applyRateLimit(request, 'formSubmit');
  if (rateLimited) return rateLimited;

  try {
    const { token } = await context.params;
    const link = await getSignLinkByToken(token);

    if (!link) {
      return NextResponse.json(
        { error: 'This signing link is invalid or has expired' },
        { status: 404 }
      );
    }

    if (link.form.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This form is no longer accepting signatures' },
        { status: 400 }
      );
    }

    if (new Date(link.form.deadline) < new Date()) {
      return NextResponse.json({ error: 'Form deadline has passed' }, { status: 400 });
    }

    const body = await request.json();
    const { signatureData, studentId, fieldResponses } = body;

    if (!signatureData) {
      return NextResponse.json({ error: 'Signature is required' }, { status: 400 });
    }

    if (!studentId) {
      return NextResponse.json({ error: 'Student selection is required' }, { status: 400 });
    }

    const pending = await prisma.formSubmission.findUnique({
      where: {
        formId_parentId_studentId: {
          formId: link.formId,
          parentId: link.parentId,
          studentId,
        },
      },
      include: { student: true },
    });

    if (!pending) {
      return NextResponse.json(
        { error: 'This form was not sent for that student' },
        { status: 403 }
      );
    }

    const { ipAddress, userAgent } = getRequestContext(request);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.formSubmission.findUnique({
        where: {
          formId_parentId_studentId: {
            formId: link.formId,
            parentId: link.parentId,
            studentId,
          },
        },
      });

      if (existing?.status === 'SIGNED') {
        return { alreadySigned: true as const, studentName: pending.student.name };
      }

      const submission = await tx.formSubmission.update({
        where: { id: pending.id },
        data: {
          signatureData,
          status: 'SIGNED',
          signedAt: new Date(),
          ipAddress,
        },
      });

      if (fieldResponses && Object.keys(fieldResponses).length > 0) {
        await tx.fieldResponse.deleteMany({
          where: { submissionId: submission.id },
        });
        await tx.fieldResponse.createMany({
          data: Object.entries(fieldResponses).map(([fieldId, response]) => ({
            submissionId: submission.id,
            fieldId,
            response: String(response),
          })),
        });
      }

      return { alreadySigned: false as const, submission };
    });

    if (result.alreadySigned) {
      return NextResponse.json(
        { error: `You have already signed this form for ${result.studentName}` },
        { status: 400 }
      );
    }

    const submission = result.submission!;

    auditLog({
      action: 'SIGNATURE_SUBMIT',
      userId: link.parentId,
      userEmail: link.parent.email,
      userRole: 'PARENT',
      resourceType: 'FormSubmission',
      resourceId: submission.id,
      metadata: {
        formId: link.formId,
        formTitle: link.form.title,
        studentId,
        studentName: pending.student.name,
        via: 'sign_link',
      },
      ipAddress,
      userAgent,
    });

    if (link.parent.email && process.env.RESEND_API_KEY) {
      const pdfUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:6001'}/api/submissions/${submission.id}/pdf?token=${token}`;
      sendSignatureConfirmation({
        parentEmail: link.parent.email,
        parentName: link.parent.name || 'Parent',
        studentName: pending.student.name,
        formTitle: link.form.title,
        eventDate: link.form.eventDate,
        signedAt: new Date(),
        pdfUrl,
        schoolName: link.form.school?.name,
      }).catch((err) => {
        logger.error('Failed to send confirmation email', err);
      });
    }

    return NextResponse.json({
      success: true,
      message: `Signature submitted successfully for ${pending.student.name}`,
    });
  } catch (error) {
    logger.error('Error submitting signature via sign link', error as Error);
    return NextResponse.json({ error: 'Failed to submit signature' }, { status: 500 });
  }
}
