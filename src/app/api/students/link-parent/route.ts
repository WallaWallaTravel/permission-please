import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { applyRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const linkParentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  parentId: z.string().min(1, 'Parent ID is required'),
  relationship: z.enum(['parent', 'mother', 'father', 'guardian', 'grandparent']).default('parent'),
});

// POST /api/students/link-parent - Link a parent to a student
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only teachers and admins can link parents to students
    if (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = linkParentSchema.parse(body);

    // Verify the student exists
    const student = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Verify the parent exists and is a parent role
    const parent = await prisma.user.findUnique({
      where: { id: validatedData.parentId },
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    if (parent.role !== 'PARENT') {
      return NextResponse.json({ error: 'User is not a parent' }, { status: 400 });
    }

    // Check if link already exists
    const existingLink = await prisma.parentStudent.findUnique({
      where: {
        parentId_studentId: {
          parentId: validatedData.parentId,
          studentId: validatedData.studentId,
        },
      },
    });

    if (existingLink) {
      // Update relationship type if it changed
      if (existingLink.relationship !== validatedData.relationship) {
        const updatedLink = await prisma.parentStudent.update({
          where: {
            parentId_studentId: {
              parentId: validatedData.parentId,
              studentId: validatedData.studentId,
            },
          },
          data: {
            relationship: validatedData.relationship,
          },
        });

        return NextResponse.json({
          message: 'Parent-student relationship updated',
          link: updatedLink,
        });
      }

      return NextResponse.json(
        { error: 'This parent is already linked to this student' },
        { status: 400 }
      );
    }

    // Create the parent-student link
    const link = await prisma.parentStudent.create({
      data: {
        parentId: validatedData.parentId,
        studentId: validatedData.studentId,
        relationship: validatedData.relationship,
      },
    });

    logger.info('Parent linked to student', {
      parentId: validatedData.parentId,
      studentId: validatedData.studentId,
      relationship: validatedData.relationship,
      linkedBy: session.user.id,
    });

    return NextResponse.json({
      message: 'Parent linked to student successfully',
      link,
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as unknown as { issues: unknown[] };
      return NextResponse.json(
        { error: 'Validation error', details: zodError.issues },
        { status: 400 }
      );
    }

    logger.error('Error linking parent to student', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
