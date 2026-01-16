import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// POST - Submit form for review
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Parse review details from request body
    const body = await request.json();
    const { reviewNeededBy, isExpedited } = body;

    // Verify form exists and belongs to teacher
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

    // Only form owner can submit for review
    if (form.teacherId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the form owner can submit for review' },
        { status: 403 }
      );
    }

    // Form must be in DRAFT status and require review
    if (form.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft forms can be submitted for review' },
        { status: 400 }
      );
    }

    if (!form.requiresReview) {
      return NextResponse.json({ error: 'This form does not require review' }, { status: 400 });
    }

    // Update form with review status
    const updatedForm = await prisma.permissionForm.update({
      where: { id },
      data: {
        reviewStatus: 'PENDING_REVIEW',
        reviewNeededBy: reviewNeededBy ? new Date(reviewNeededBy) : null,
        isExpedited: isExpedited || false,
        reviewComments: null, // Clear any previous comments
        reviewedBy: null,
        reviewedAt: null,
      },
    });

    // Create audit log entry
    await prisma.formReviewLog.create({
      data: {
        formId: id,
        reviewerId: session.user.id,
        action: 'SUBMITTED',
        comments: isExpedited ? 'Submitted as expedited' : null,
      },
    });

    // TODO: Send email notification to reviewers at the school
    // This would notify all users with REVIEWER role at the school

    return NextResponse.json({
      success: true,
      message: 'Form submitted for review',
      form: {
        id: updatedForm.id,
        reviewStatus: updatedForm.reviewStatus,
        reviewNeededBy: updatedForm.reviewNeededBy,
        isExpedited: updatedForm.isExpedited,
      },
    });
  } catch (error) {
    logger.error('Error submitting form for review', error as Error);
    return NextResponse.json({ error: 'Failed to submit form for review' }, { status: 500 });
  }
}
