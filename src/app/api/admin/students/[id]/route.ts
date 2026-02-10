import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/utils';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

// GET /api/admin/students/[id] - Get a single student
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        school: {
          select: { id: true, name: true },
        },
        parents: {
          include: {
            parent: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // School isolation for ADMIN
    if (user.role === 'ADMIN' && student.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ student });
  } catch (error) {
    logger.error('Error fetching student', error as Error);
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 });
  }
}

// PATCH /api/admin/students/[id] - Update a student
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

    const existingStudent = await prisma.student.findUnique({
      where: { id },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // School isolation for ADMIN
    if (user.role === 'ADMIN' && existingStudent.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, grade, schoolId } = body;

    // Only SUPER_ADMIN can change school assignment
    const updateData: { name?: string; grade?: string; schoolId?: string | null } = {};

    if (name !== undefined) updateData.name = name;
    if (grade !== undefined) updateData.grade = grade;
    if (schoolId !== undefined && user.role === 'SUPER_ADMIN') {
      updateData.schoolId = schoolId;
    }

    const student = await prisma.student.update({
      where: { id },
      data: updateData,
      include: {
        school: {
          select: { id: true, name: true },
        },
        parents: {
          include: {
            parent: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_STUDENT',
        entity: 'Student',
        entityId: id,
        metadata: updateData,
      },
    });

    return NextResponse.json({ student });
  } catch (error) {
    logger.error('Error updating student', error as Error);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}

// DELETE /api/admin/students/[id] - Delete a student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const existingStudent = await prisma.student.findUnique({
      where: { id },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // School isolation for ADMIN
    if (user.role === 'ADMIN' && existingStudent.schoolId !== user.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the student (cascades to submissions and parent links)
    await prisma.student.delete({
      where: { id },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_STUDENT',
        entity: 'Student',
        entityId: id,
        metadata: { studentName: existingStudent.name },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting student', error as Error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
