import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { generatePermissionPdf } from '@/lib/pdf/generate-permission-pdf';
import { logger } from '@/lib/logger';
import { getSignLinkByToken } from '@/lib/tokens/sign-link';
import { assertCanManageForm, AuthzError } from '@/lib/auth/school-access';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET - Download PDF for a signed submission
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const token = request.nextUrl.searchParams.get('token');
    const { id } = await context.params;

    const submission = await prisma.formSubmission.findUnique({
      where: { id },
      include: {
        form: {
          include: {
            teacher: { select: { name: true } },
            school: { select: { name: true } },
          },
        },
        parent: { select: { name: true, email: true } },
        student: { select: { name: true, grade: true } },
        responses: {
          include: {
            field: { select: { label: true } },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    let authorized = false;
    let actorId: string | undefined;

    if (token) {
      const link = await getSignLinkByToken(token);
      if (link && link.parentId === submission.parentId && link.formId === submission.formId) {
        authorized = true;
        actorId = link.parentId;
      }
    }

    if (!authorized && session?.user?.id) {
      if (session.user.id === submission.parentId) {
        authorized = true;
        actorId = session.user.id;
      } else {
        try {
          await assertCanManageForm(session.user, submission.form);
          authorized = true;
          actorId = session.user.id;
        } catch (error) {
          if (!(error instanceof AuthzError)) {
            throw error;
          }
        }
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: session?.user?.id ? 'Forbidden' : 'Unauthorized' },
        {
          status: session?.user?.id ? 403 : 401,
        }
      );
    }

    if (submission.status !== 'SIGNED' || !submission.signedAt) {
      return NextResponse.json({ error: 'Submission not yet signed' }, { status: 400 });
    }

    const pdfBytes = await generatePermissionPdf({
      formTitle: submission.form.title,
      formDescription: submission.form.description,
      eventDate: submission.form.eventDate,
      eventType: submission.form.eventType,
      deadline: submission.form.deadline,
      teacherName: submission.form.teacher.name,
      schoolName: submission.form.school?.name,
      studentName: submission.student.name,
      studentGrade: submission.student.grade,
      parentName: submission.parent.name,
      parentEmail: submission.parent.email,
      signatureDataUrl: submission.signatureData,
      signedAt: submission.signedAt,
      ipAddress: submission.ipAddress || undefined,
      fieldResponses: submission.responses.map((r) => ({
        label: r.field.label,
        response: r.response,
      })),
    });

    const sanitizedTitle = submission.form.title
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 30);
    const sanitizedStudent = submission.student.name.replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `permission-${sanitizedTitle}-${sanitizedStudent}.pdf`;

    logger.info('PDF generated', {
      submissionId: id,
      userId: actorId,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    logger.error('Failed to generate PDF', error as Error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
