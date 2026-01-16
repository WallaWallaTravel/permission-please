import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// GET - List forms pending review (for reviewers)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only reviewers can access this endpoint
    if (session.user.role !== 'REVIEWER') {
      return NextResponse.json(
        { error: 'Only reviewers can access this endpoint' },
        { status: 403 }
      );
    }

    // Get filter from query params
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status'); // 'pending', 'approved', 'revision', 'all'

    // Build status filter
    let reviewStatusFilter = {};
    if (statusFilter === 'pending') {
      reviewStatusFilter = { reviewStatus: 'PENDING_REVIEW' };
    } else if (statusFilter === 'approved') {
      reviewStatusFilter = { reviewStatus: 'APPROVED' };
    } else if (statusFilter === 'revision') {
      reviewStatusFilter = { reviewStatus: 'REVISION_NEEDED' };
    } else {
      // Default: show pending and revision needed
      reviewStatusFilter = {
        reviewStatus: { in: ['PENDING_REVIEW', 'REVISION_NEEDED'] },
      };
    }

    // Get forms requiring review at reviewer's school
    const forms = await prisma.permissionForm.findMany({
      where: {
        schoolId: session.user.schoolId,
        requiresReview: true,
        ...reviewStatusFilter,
      },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        reviewer: {
          select: { id: true, name: true },
        },
        _count: {
          select: { fields: true, documents: true },
        },
      },
      orderBy: [
        { isExpedited: 'desc' }, // Expedited first
        { reviewNeededBy: 'asc' }, // Soonest deadline first
        { createdAt: 'desc' }, // Then by creation date
      ],
    });

    // Calculate days remaining for each form
    const now = new Date();
    const formsWithMeta = forms.map((form) => {
      let daysRemaining: number | null = null;
      let isOverdue = false;

      if (form.reviewNeededBy) {
        const diff = form.reviewNeededBy.getTime() - now.getTime();
        daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
        isOverdue = daysRemaining < 0;
      }

      return {
        id: form.id,
        title: form.title,
        description: form.description,
        eventDate: form.eventDate,
        eventType: form.eventType,
        deadline: form.deadline,
        status: form.status,
        createdAt: form.createdAt,
        // Review specific fields
        reviewStatus: form.reviewStatus,
        reviewNeededBy: form.reviewNeededBy,
        isExpedited: form.isExpedited,
        reviewedAt: form.reviewedAt,
        reviewComments: form.reviewComments,
        // Calculated fields
        daysRemaining,
        isOverdue,
        // Related data
        teacher: form.teacher,
        reviewer: form.reviewer,
        fieldsCount: form._count.fields,
        documentsCount: form._count.documents,
      };
    });

    return NextResponse.json({
      forms: formsWithMeta,
      total: formsWithMeta.length,
      pending: formsWithMeta.filter((f) => f.reviewStatus === 'PENDING_REVIEW').length,
      expedited: formsWithMeta.filter((f) => f.isExpedited && f.reviewStatus === 'PENDING_REVIEW')
        .length,
    });
  } catch (error) {
    logger.error('Error fetching forms for review', error as Error);
    return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 });
  }
}
