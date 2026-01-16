import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// POST - Approve form (reviewer only)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only reviewers can approve forms
    if (session.user.role !== 'REVIEWER') {
      return NextResponse.json({ error: 'Only reviewers can approve forms' }, { status: 403 });
    }

    const { id } = await params;

    // Parse optional comments from request body
    let comments: string | null = null;
    try {
      const body = await request.json();
      comments = body.comments || null;
    } catch {
      // No body or invalid JSON - that's fine
    }

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
    if (form.reviewStatus !== 'PENDING_REVIEW' && form.reviewStatus !== 'REVISION_NEEDED') {
      return NextResponse.json({ error: 'This form is not pending review' }, { status: 400 });
    }

    // Update form as approved
    const updatedForm = await prisma.permissionForm.update({
      where: { id },
      data: {
        reviewStatus: 'APPROVED',
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
        action: 'APPROVED',
        comments: comments,
      },
    });

    // TODO: Send email notification to the teacher that form was approved

    return NextResponse.json({
      success: true,
      message: 'Form approved successfully',
      form: {
        id: updatedForm.id,
        reviewStatus: updatedForm.reviewStatus,
        reviewedAt: updatedForm.reviewedAt,
      },
    });
  } catch (error) {
    logger.error('Error approving form', error as Error);
    return NextResponse.json({ error: 'Failed to approve form' }, { status: 500 });
  }
}
