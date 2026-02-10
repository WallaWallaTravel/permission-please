import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// POST /api/forms/bulk-close - Close multiple forms at once
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { formIds } = body;

    if (!Array.isArray(formIds) || formIds.length === 0) {
      return NextResponse.json({ error: 'formIds must be a non-empty array' }, { status: 400 });
    }

    if (formIds.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 forms per batch' }, { status: 400 });
    }

    // Only close ACTIVE forms owned by the requesting teacher (or shared with edit) or admin
    const whereClause = {
      id: { in: formIds },
      status: 'ACTIVE' as const,
      ...(user.role === 'ADMIN'
        ? {}
        : {
            OR: [{ teacherId: user.id }, { shares: { some: { userId: user.id, canEdit: true } } }],
          }),
    };

    // Get forms to close (for audit logging)
    const formsToClose = await prisma.permissionForm.findMany({
      where: whereClause,
      select: { id: true, title: true },
    });

    if (formsToClose.length === 0) {
      return NextResponse.json({
        success: true,
        closedCount: 0,
        message: 'No active forms found to close',
      });
    }

    // Close forms and create audit logs in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.permissionForm.updateMany({
        where: whereClause,
        data: { status: 'CLOSED' },
      });

      // Create audit log entries for each closed form
      await tx.auditLog.createMany({
        data: formsToClose.map((form) => ({
          userId: user.id,
          action: 'FORM_CLOSED',
          entity: 'PermissionForm',
          entityId: form.id,
          metadata: {
            formTitle: form.title,
            previousStatus: 'ACTIVE',
            newStatus: 'CLOSED',
            bulkOperation: true,
          },
        })),
      });

      return updateResult;
    });

    return NextResponse.json({
      success: true,
      closedCount: result.count,
    });
  } catch (error) {
    logger.error('Error in bulk close', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
