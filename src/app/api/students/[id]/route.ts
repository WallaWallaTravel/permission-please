import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const updateStudentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  grade: z.string().min(1, 'Grade is required').max(20, 'Grade too long').optional(),
});

// GET - Get a single student with details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only teachers, admins can view student details
    const allowedRoles = ['TEACHER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        parents: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        groups: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: { formSubmissions: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (error) {
    logger.error('Error fetching student', error as Error);
    return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 });
  }
}

// PATCH - Update a student's name or grade
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only teachers, admins can edit students
    const allowedRoles = ['TEACHER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateStudentSchema.parse(body);

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Update student
    const student = await prisma.student.update({
      where: { id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.grade && { grade: validatedData.grade }),
      },
      include: {
        parents: {
          include: {
            parent: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    logger.info('Student updated', {
      studentId: id,
      updatedBy: session.user.id,
      changes: validatedData,
    });

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully',
      student,
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as unknown as { issues: unknown[] };
      return NextResponse.json(
        { error: 'Validation error', details: zodError.issues },
        { status: 400 }
      );
    }

    logger.error('Error updating student', error as Error);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}

// DELETE - Remove a student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only teachers, admins, and super admins can delete students
    const allowedRoles = ['TEACHER', 'ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        _count: {
          select: { formSubmissions: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Warn if student has form submissions (but still allow delete)
    const hasSubmissions = student._count.formSubmissions > 0;

    // Delete student (cascades to ParentStudent links and FormSubmissions via schema)
    await prisma.student.delete({
      where: { id },
    });

    logger.info('Student deleted', {
      studentId: id,
      studentName: student.name,
      deletedBy: session.user.id,
      hadSubmissions: hasSubmissions,
    });

    return NextResponse.json({
      success: true,
      message: hasSubmissions
        ? `Student "${student.name}" deleted along with ${student._count.formSubmissions} form submission(s)`
        : `Student "${student.name}" deleted successfully`,
    });
  } catch (error) {
    logger.error('Error deleting student', error as Error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
