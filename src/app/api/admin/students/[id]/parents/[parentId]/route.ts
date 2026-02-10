import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// DELETE /api/admin/students/[id]/parents/[parentId] - Unlink a parent from a student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; parentId: string }> }
) {
  const { id: studentId, parentId } = await params;
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check student exists and school isolation
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (user.role === 'ADMIN' && student.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if the link exists
    const link = await prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId,
          studentId,
        },
      },
      include: {
        parent: { select: { name: true, email: true } },
      },
    });

    if (!link) {
      return NextResponse.json({ error: 'Parent-student link not found' }, { status: 404 });
    }

    // Delete the link
    await prisma.parentStudent.delete({
      where: {
        parentId_studentId: {
          parentId,
          studentId,
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UNLINK_PARENT_STUDENT',
        entity: 'ParentStudent',
        metadata: {
          studentId,
          studentName: student.name,
          parentId,
          parentName: link.parent.name,
          parentEmail: link.parent.email,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error unlinking parent', error as Error);
    return NextResponse.json({ error: 'Failed to unlink parent' }, { status: 500 });
  }
}
