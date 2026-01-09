import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { generatePermissionPdf } from '@/lib/pdf/generate-permission-pdf';
import { logger } from '@/lib/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET - Download PDF for a signed submission
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Get the submission with all related data
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

    // Authorization: Only the parent, teacher, or admin can download
    const isParent = submission.parentId === session.user.id;
    const isTeacher = submission.form.teacherId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';

    if (!isParent && !isTeacher && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Can only download signed submissions
    if (submission.status !== 'SIGNED' || !submission.signedAt) {
      return NextResponse.json({ error: 'Submission not yet signed' }, { status: 400 });
    }

    // Generate PDF
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

    // Generate filename
    const sanitizedTitle = submission.form.title
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 30);
    const sanitizedStudent = submission.student.name.replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `permission-${sanitizedTitle}-${sanitizedStudent}.pdf`;

    logger.info('PDF generated', {
      submissionId: id,
      userId: session.user.id,
    });

    // Return PDF with appropriate headers
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
