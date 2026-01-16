import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/forms/[id]/review-log - Get review audit log for a form
export async function GET(request: NextRequest, context: RouteContext) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only reviewers, admins, and the form owner can view the review log
    if (user.role !== 'REVIEWER' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      // Check if user is the form owner
      const form = await prisma.permissionForm.findUnique({
        where: { id },
        select: { teacherId: true },
      });

      if (!form) {
        return NextResponse.json({ error: 'Form not found' }, { status: 404 });
      }

      if (form.teacherId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const logs = await prisma.formReviewLog.findMany({
      where: { formId: id },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    logger.error('Error fetching review log', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
