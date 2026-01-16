import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const requestRevisionSchema = z.object({
  comments: z.string().min(1, 'Please provide feedback about what needs to be changed'),
});

// POST - Request revision on form (reviewer only)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only reviewers can request revisions
    if (session.user.role !== 'REVIEWER') {
      return NextResponse.json({ error: 'Only reviewers can request revisions' }, { status: 403 });
    }

    const { id } = await params;

    // Parse and validate comments from request body
    const body = await request.json();
    const validation = requestRevisionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { comments } = validation.data;

    // Verify form exists and is pending review
    const form = await prisma.permissionForm.findUnique({
      where: { id },
      include: {
        teacher: { select: { name: true, email: true, schoolId: true } },
        school: { select: { name: true } },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Reviewer must be at the same school
    if (form.schoolId !== session.user.schoolId) {
      return NextResponse.json(
        { error: 'You can only review forms from your school' },
        { status: 403 }
      );
    }

    // Form must be pending review
    if (form.reviewStatus !== 'PENDING_REVIEW') {
      return NextResponse.json({ error: 'This form is not pending review' }, { status: 400 });
    }

    // Update form as needing revision
    const updatedForm = await prisma.permissionForm.update({
      where: { id },
      data: {
        reviewStatus: 'REVISION_NEEDED',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewComments: comments,
      },
    });

    // Create audit log entry
    await prisma.formReviewLog.create({
      data: {
        formId: id,
        reviewerId: session.user.id,
        action: 'REVISION_NEEDED',
        comments: comments,
      },
    });

    // TODO: Send email notification to the teacher about required changes

    return NextResponse.json({
      success: true,
      message: 'Revision requested',
      form: {
        id: updatedForm.id,
        reviewStatus: updatedForm.reviewStatus,
        reviewComments: updatedForm.reviewComments,
      },
    });
  } catch (error) {
    logger.error('Error requesting revision', error as Error);
    return NextResponse.json({ error: 'Failed to request revision' }, { status: 500 });
  }
}
